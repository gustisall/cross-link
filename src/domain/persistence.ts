import { z } from 'zod'
import { CASE_IDS, WIRES, assertCableStructure, buildWireMap, createCases } from './cable'
import { SCREENS, blankTesterDraft } from './session'
import type { Session, TesterDraft } from './session'
import { TOOLS } from '../content'

// Keep the original key so existing browser progress is discovered and migrated in place.
export const STORAGE_KEY = 'crosslink.session.v1'
const LEGACY_CASE_IDS = ['own', 'open', 'miswire'] as const
const text = z.string().max(20000)
const eightBools = z.array(z.boolean()).length(8)
const endSchema = z.object({
  pins: z.array(z.enum(WIRES).nullable()).length(8),
  intended: z.enum(['T568A', 'T568B']),
  stripped: z.boolean(),
  untwisted: z.boolean(),
  trimmed: z.boolean(),
  inserted: z.boolean(),
  reaches: eightBools,
  damaged: eightBools,
  jacket: z.boolean(),
  inspected: z.boolean(),
  crimped: z.boolean(),
})
const endIndexSchema = z.union([z.literal(0), z.literal(1)])
const diagnosisSchema = z.enum(['', 'open', 'miswire', 'straight', 'workmanship', 'correct'])
const repairDraftSchema = z.object({
  diagnosis: diagnosisSchema,
  evidence: text,
  action: text,
  explanation: text,
})
const testerDraftSchema = z.object({ main: endIndexSchema, prediction: text, manual: z.boolean() })

function sessionSchemaFor<const T extends readonly [string, ...string[]]>(caseIds: T) {
  const caseId = z.enum(caseIds)
  const cableSchema = z.object({
    id: caseId,
    revision: z.number().int().nonnegative(),
    replacements: z.number().int().nonnegative(),
    disconnected: z.boolean(),
    safeHands: z.boolean(),
    ends: z.tuple([endSchema, endSchema]),
  })
  return z.object({
    schemaVersion: z.literal(1),
    id: text,
    started: z.boolean(),
    updatedAt: text,
    screen: z.enum(SCREENS),
    group: text,
    members: z.array(text).min(2).max(3),
    board: z.object({ hypothesis: text, questions: text, plan: text }),
    evidence: z.array(z.enum(['power', 'ports', 'existing'])).max(3),
    toolAnswers: z.record(z.string(), text),
    toolAttempts: z
      .array(z.object({ tool: text, capability: text, correct: z.boolean() }))
      .max(10000),
    decisions: z
      .array(z.object({ choice: text, reason: text, evidence: z.array(text), at: text }))
      .max(1000),
    decisionDraft: z.object({ choice: text, reason: text, evidence: z.array(text) }),
    cables: z.record(caseId, cableSchema),
    activeCase: caseId,
    activeEnd: endIndexSchema,
    undo: cableSchema.nullable(),
    tests: z
      .array(
        z.object({
          id: text,
          caseId,
          revision: z.number().int().nonnegative(),
          main: endIndexSchema,
          snapshot: cableSchema,
          map: z.array(z.number().int().min(1).max(8).nullable()).length(8),
          prediction: text,
          observation: text,
          readingPin: z.number().int().min(1).max(8),
          readingAnswer: z.enum(['', 'open', '1', '2', '3', '4', '5', '6', '7', '8']),
          at: text,
        }),
      )
      .max(10000),
    repairs: z
      .array(
        z.object({
          caseId,
          diagnosis: diagnosisSchema,
          evidence: text,
          action: text,
          explanation: text,
          beforeTestId: text,
          afterTestId: text,
          at: text,
        }),
      )
      .max(10000),
    repairDrafts: z.record(caseId, repairDraftSchema),
    hints: z
      .array(z.object({ screen: text, level: z.number().int().min(1).max(3), at: text }))
      .max(10000),
    reflections: z.object({
      group: text,
      link: text,
      physical: text,
      individual: z.array(text).max(3),
    }),
    settings: z.object({ reducedMotion: z.boolean() }),
    visited: z.array(z.enum(SCREENS)).max(8),
  })
}
const legacySessionSchema = sessionSchemaFor(LEGACY_CASE_IDS)
const sessionSchema = sessionSchemaFor(CASE_IDS).extend({
  schemaVersion: z.literal(2),
  testerDrafts: z.record(z.enum(CASE_IDS), testerDraftSchema),
})

function migrateLegacySession(legacy: z.infer<typeof legacySessionSchema>): Session {
  const testerDrafts = Object.fromEntries(
    CASE_IDS.map((caseId) => {
      const latest = [...legacy.tests].reverse().find((test) => test.caseId === caseId)
      return [
        caseId,
        {
          ...blankTesterDraft(),
          manual: legacy.settings.reducedMotion,
          ...(latest ? { main: latest.main, prediction: latest.prediction } : {}),
        },
      ]
    }),
  ) as Record<(typeof CASE_IDS)[number], TesterDraft>
  return sessionSchema.parse({
    ...legacy,
    schemaVersion: 2,
    cables: { ...legacy.cables, straight: createCases().straight },
    repairDrafts: {
      ...legacy.repairDrafts,
      straight: { diagnosis: '', evidence: '', action: '', explanation: '' },
    },
    testerDrafts,
  })
}

export function parseSession(raw: string): Session {
  if (raw.length > 8_000_000) throw new Error('Berkas sesi terlalu besar (maksimum 8 MB).')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Berkas bukan JSON yang valid. Sesi aktif tetap aman.')
  }
  const checked = sessionSchema.safeParse(parsed)
  let session: Session
  if (checked.success) {
    session = checked.data
  } else {
    const legacy = legacySessionSchema.safeParse(parsed)
    if (!legacy.success)
      throw new Error(
        'Format sesi tidak valid atau versi belum didukung. Sesi aktif tidak diganti.',
      )
    session = migrateLegacySession(legacy.data)
  }
  for (const [id, capability] of Object.entries(session.toolAnswers)) {
    if (!TOOLS.find((tool) => tool.id === id)?.capabilities.includes(capability))
      throw new Error('Identifikasi perlengkapan pada sesi tidak valid.')
  }
  for (const [id, cable] of Object.entries(session.cables)) {
    assertCableStructure(cable)
    if (cable.id !== id) throw new Error('Identitas kabel pada sesi tidak konsisten.')
  }
  if (session.undo) assertCableStructure(session.undo)
  for (const test of session.tests) {
    assertCableStructure(test.snapshot)
    if (
      test.caseId !== test.snapshot.id ||
      test.revision !== test.snapshot.revision ||
      JSON.stringify(test.map) !== JSON.stringify(buildWireMap(test.snapshot, test.main))
    )
      throw new Error('Snapshot hasil pengujian tidak konsisten.')
  }
  return session
}
export function loadSession(): { session: Session | null; warning: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return { session: raw ? parseSession(raw) : null, warning: '' }
  } catch {
    return {
      session: null,
      warning:
        'Sesi tersimpan tidak dapat dibaca. Data lama belum ditimpa; mulai sesi baru atau impor cadangan.',
    }
  }
}
export function saveSession(session: Session): string {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return ''
  } catch {
    return 'Penyimpanan browser tidak tersedia. Permainan tetap berjalan; ekspor sesi sebelum menutup halaman.'
  }
}
export function exportSession(session: Session) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `crosslink-${session.id.slice(0, 8)}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
