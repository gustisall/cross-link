import { describe, expect, it, vi } from 'vitest'
import { assembledCable, buildWireMap, STANDARDS, WIRES } from '../domain/cable'
import {
  allCasesComplete,
  canNavigate,
  createSession,
  latestTest,
  sessionReducer,
  testPassed,
  workshopUnlocked,
} from '../domain/session'
import type { Action, Session } from '../domain/session'
import { loadSession, parseSession, saveSession, STORAGE_KEY } from '../domain/persistence'
import { TOOLS } from '../content'
const act = (state: Session, ...actions: Action[]) => actions.reduce(sessionReducer, state)

describe('Kemajuan dan sesi', () => {
  it('dugaan keliru dapat membuka workshop setelah bukti lengkap', () => {
    let state = createSession()
    state = act(
      state,
      ...['power', 'ports', 'existing'].map((id) => ({ type: 'evidence' as const, id })),
      ...['cable', 'connector', 'stripper', 'cutter', 'crimper', 'tester'].map((tool) => ({
        type: 'tool' as const,
        tool,
        capability: 'test',
        correct: true,
      })),
      {
        type: 'decisionDraft',
        draft: {
          choice: 'straight',
          reason: 'Dugaan untuk diuji',
          evidence: ['ports', 'existing'],
        },
      },
      { type: 'decision' },
    )
    expect(workshopUnlocked(state)).toBe(true)
    expect(state.decisions[0].choice).toBe('straight')
  })
  it('V11 pengujian lama tidak meluluskan revisi baru', () => {
    let state = createSession()
    state.cables.own = assembledCable()
    state = act(state, {
      type: 'test',
      caseId: 'own',
      revision: 0,
      main: 0,
      prediction: 'Persilangan',
    })
    state = act(
      state,
      { type: 'observation', id: state.tests[0].id, value: 'Pin 1 menuju 3' },
      { type: 'reading', id: state.tests[0].id, value: '3' },
    )
    expect(testPassed(state, 'own')).toBe(true)
    state = act(state, { type: 'operation', operation: 'replace' })
    expect(testPassed(state, 'own')).toBe(false)
    expect(latestTest(state, 'own', true)).toBeUndefined()
    expect(state.tests).toHaveLength(1)
  })
  it('tidak menyimpan hasil pemindaian dari revisi yang sudah berubah', () => {
    const state = createSession()
    state.cables.own = assembledCable()
    state.cables.own.revision = 3
    expect(
      act(state, { type: 'test', caseId: 'own', revision: 2, main: 0, prediction: 'Crossover' })
        .tests,
    ).toHaveLength(0)
  })
  it('undo tidak membuka konektor yang sudah di-crimp', () => {
    const state = createSession()
    state.cables.own = assembledCable()
    state.undo = assembledCable()
    expect(act(state, { type: 'undo' })).toBe(state)
  })
  it('kabel kasus terpisah dari kabel kelompok', () => {
    let state = createSession()
    const own = structuredClone(state.cables.own)
    state = act(
      state,
      { type: 'selectCase', id: 'open' },
      { type: 'selectEnd', end: 1 },
      { type: 'operation', operation: 'replace' },
    )
    expect(state.cables.own).toEqual(own)
    expect(state.cables.open.ends[1].crimped).toBe(false)
  })
  it('snapshot pengujian tidak berubah bersama kabel', () => {
    let state = createSession()
    state.cables.own = assembledCable()
    state = act(
      state,
      { type: 'test', caseId: 'own', revision: 0, main: 0, prediction: 'Persilangan' },
      { type: 'operation', operation: 'replace' },
    )
    expect(state.tests[0].snapshot.ends[0].pins).toEqual(STANDARDS.T568A)
  })
  it('ekspor/impor mempertahankan data dan pengujian', () => {
    let state = createSession()
    state.cables.own = assembledCable()
    state = act(
      state,
      { type: 'start' },
      { type: 'hint', level: 1 },
      { type: 'test', caseId: 'own', revision: 0, main: 0, prediction: 'Silang' },
    )
    expect(parseSession(JSON.stringify(state))).toEqual(state)
    expect(saveSession(state)).toBe('')
    expect(loadSession().session).toEqual(state)
  })
  it.each(['{"schemaVersion":2}', 'broken', '{}'])(
    'menolak impor tidak valid tanpa menghapus sesi %s',
    (raw) => {
      const state = createSession()
      saveSession(state)
      expect(() => parseSession(raw)).toThrow()
      expect(loadSession().session).toEqual(state)
    },
  )
  it('menolak duplikasi dan snapshot pengukuran tidak konsisten', () => {
    let state = createSession()
    state.cables.own = assembledCable()
    state = act(state, { type: 'test', caseId: 'own', revision: 0, main: 0, prediction: 'Silang' })
    state.tests[0].map[0] = 8
    expect(() => parseSession(JSON.stringify(state))).toThrow('tidak konsisten')
    state = createSession()
    state.cables.own.ends[0].pins[0] = 'blue'
    state.cables.own.ends[0].pins[1] = 'blue'
    expect(() => parseSession(JSON.stringify(state))).toThrow('duplikat')
  })
  it('data lokal rusak tidak otomatis ditimpa', () => {
    localStorage.setItem(STORAGE_KEY, 'old invalid data')
    expect(loadSession().warning).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('old invalid data')
  })
  it('kegagalan storage mengembalikan petunjuk ekspor', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(saveSession(createSession())).toContain('ekspor')
  })
  it('tiket harus memiliki pengukuran awal sebelum workshop dibuka', () => {
    const state = createSession()
    state.started = true
    state.activeCase = 'open'
    state.evidence = ['power', 'ports', 'existing']
    state.toolAnswers = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool.capabilities[0]]))
    state.decisions = [
      {
        choice: 'crossover',
        reason: 'Port MDI',
        evidence: ['ports', 'existing'],
        at: new Date().toISOString(),
      },
    ]
    expect(canNavigate(state, 'workshop')).toBe(false)
    const measured = act(state, {
      type: 'test',
      caseId: 'open',
      revision: 0,
      main: 0,
      prediction: 'Perlu menguji semua pin',
    })
    expect(canNavigate(measured, 'workshop')).toBe(true)
  })
  it('seluruh kasus memerlukan uji baru, pembacaan benar, dan perbaikan yang terdokumentasi', () => {
    let state = createSession()
    for (const id of ['open', 'miswire', 'straight'] as const) {
      state = act(
        state,
        { type: 'selectCase', id },
        {
          type: 'test',
          caseId: id,
          revision: 0,
          main: 0,
          prediction: 'Akan mengukur delapan jalur',
        },
      )
      const before = latestTest(state, id)!
      state.cables[id] = assembledCable('T568A', 'T568B', id)
      state.cables[id].revision = 1
      state.cables[id].replacements = 1
      state = act(state, {
        type: 'test',
        caseId: id,
        revision: 1,
        main: 0,
        prediction: 'Pemetaan setelah terminasi ulang',
      })
      const after = latestTest(state, id)!
      state = act(
        state,
        { type: 'observation', id: after.id, value: 'Pemetaan setelah perbaikan sesuai' },
        { type: 'reading', id: after.id, value: String(after.map[after.readingPin - 1]) },
        {
          type: 'repair',
          repair: {
            caseId: id,
            diagnosis: id,
            evidence: 'Bukti pengukuran awal dan inspeksi',
            action: 'reterminate',
            explanation: 'Konduktor diperbaiki pada terminasi baru',
            beforeTestId: before.id,
            afterTestId: after.id,
          },
        },
      )
    }
    expect(allCasesComplete(state)).toBe(false)
    state.cables.own = assembledCable()
    state = act(state, {
      type: 'test',
      caseId: 'own',
      revision: 0,
      main: 0,
      prediction: 'Crossover',
    })
    const own = latestTest(state, 'own')!
    state = act(
      state,
      { type: 'observation', id: own.id, value: 'Pin 1 menuju 3' },
      { type: 'reading', id: own.id, value: '1' },
    )
    expect(allCasesComplete(state)).toBe(false)
    state = act(state, { type: 'reading', id: own.id, value: '3' })
    expect(allCasesComplete(state)).toBe(true)
    expect(parseSession(JSON.stringify(state))).toEqual(state)
  })
  it.each(['place', 'swap', 'clear'] as const)(
    'undo normal sesudah %s memulihkan konduktor dan ujung lain',
    (operation) => {
      let state = createSession()
      state.cables.own = assembledCable()
      state.cables.own.ends.forEach((end) => {
        end.crimped = false
      })
      if (operation === 'place') state.cables.own.ends[0].pins[0] = null
      const before = structuredClone(state.cables.own)
      state = act(
        state,
        operation === 'clear'
          ? { type: 'clear', slot: 2 }
          : { type: 'place', wire: 'whiteGreen', slot: operation === 'place' ? 0 : 2 },
      )
      expect(state.cables.own.ends[0].pins).not.toEqual(before.ends[0].pins)
      state = act(state, { type: 'undo' })
      expect(state.cables.own.ends).toEqual(before.ends)
      expect(state.cables.own.revision).toBeGreaterThan(before.revision)
      expect(state.undo).toBeNull()
      const placed = state.cables.own.ends[0].pins.filter((wire) => wire !== null)
      const tray = WIRES.filter((wire) => !placed.includes(wire))
      expect(new Set(placed).size).toBe(placed.length)
      expect([...placed, ...tray].sort()).toEqual([...WIRES].sort())
    },
  )
  it('reset draft mengembalikan delapan konduktor tanpa mengubah ujung lain', () => {
    let state = createSession()
    state.cables.own = assembledCable()
    state.cables.own.ends[0].crimped = false
    state = act(state, { type: 'place', wire: 'blue', slot: 1 })
    const otherEnd = structuredClone(state.cables.own.ends[1])
    state = act(state, { type: 'operation', operation: 'replace' })
    const end = state.cables.own.ends[0]
    expect(end.pins).toEqual(Array(8).fill(null))
    expect(end.crimped).toBe(false)
    expect(end.inserted).toBe(false)
    expect(end.inspected).toBe(false)
    expect(WIRES.filter((wire) => !end.pins.includes(wire))).toHaveLength(8)
    expect(state.cables.own.ends[1]).toEqual(otherEnd)
    expect(state.undo).toBeNull()
  })
  it('migrasi v1 mempertahankan progres, snapshot, refleksi, dan arah MAIN', () => {
    let state = createSession()
    state.started = true
    state.screen = 'testing'
    state.activeCase = 'open'
    state.group = 'Tim Migrasi'
    state.reflections.group = 'Dugaan berubah setelah bukti kontinuitas.'
    state = act(state, {
      type: 'test',
      caseId: 'open',
      revision: 0,
      main: 1,
      prediction: 'Periksa dari ujung kedua.',
    })
    const raw = JSON.parse(JSON.stringify(state))
    raw.schemaVersion = 1
    delete raw.cables.straight
    delete raw.repairDrafts.straight
    delete raw.testerDrafts
    const migrated = parseSession(JSON.stringify(raw))
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.group).toBe('Tim Migrasi')
    expect(migrated.activeCase).toBe('open')
    expect(migrated.screen).toBe('testing')
    expect(migrated.tests).toEqual(state.tests)
    expect(migrated.reflections).toEqual(state.reflections)
    expect(migrated.cables.open).toEqual(state.cables.open)
    expect(buildWireMap(migrated.cables.straight)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(migrated.testerDrafts.open.main).toBe(1)
    expect(migrated.testerDrafts.open.prediction).toBe('Periksa dari ujung kedua.')
    expect(migrated.repairs).toEqual(state.repairs)
    expect(parseSession(JSON.stringify(migrated))).toEqual(migrated)
  })
  it('migrasi tidak meluluskan berkas v1 yang rusak', () => {
    const raw = JSON.parse(JSON.stringify(createSession()))
    raw.schemaVersion = 1
    delete raw.cables.straight
    delete raw.repairDrafts.straight
    delete raw.testerDrafts
    raw.cables.own.ends[0].pins[0] = 'blue'
    raw.cables.own.ends[0].pins[1] = 'blue'
    expect(() => parseSession(JSON.stringify(raw))).toThrow()
  })
  it('draft tester bertahan saat pindah layar dan round-trip sesi', () => {
    let state = createSession()
    const draft = {
      main: 1 as const,
      prediction: 'Bandingkan pin sumber dari ujung kedua.',
      manual: true,
    }
    state = act(
      state,
      { type: 'testerDraft', caseId: 'straight', draft },
      { type: 'start' },
      { type: 'navigate', screen: 'report' },
    )
    expect(state.testerDrafts.straight).toEqual(draft)
    expect(state.testerDrafts.open.main).toBe(0)
    expect(parseSession(JSON.stringify(state)).testerDrafts.straight).toEqual(draft)
  })
  it('sesi dan snapshot uji tetap memperoleh UUID pada HTTP LAN tanpa randomUUID', () => {
    const realCrypto = globalThis.crypto
    vi.stubGlobal('crypto', { getRandomValues: realCrypto.getRandomValues.bind(realCrypto) })
    try {
      let state = createSession()
      state.cables.own = assembledCable()
      state = act(state, {
        type: 'test',
        caseId: 'own',
        revision: 0,
        main: 0,
        prediction: 'Pengujian melalui perangkat mobile LAN.',
      })
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(state.id).toMatch(uuid)
      expect(state.tests[0].id).toMatch(uuid)
      expect(state.tests[0].id).not.toBe(state.id)
      expect(parseSession(JSON.stringify(state)).tests[0].id).toBe(state.tests[0].id)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
