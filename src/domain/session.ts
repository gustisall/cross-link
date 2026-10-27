import { CASE_IDS, buildWireMap, createCases, evaluateCable, operateEnd, placeWire } from './cable'
import type { Cable, CaseId, EndIndex, EndOperation, PinMap, Standard, Wire } from './cable'
import { createId } from './id'

export const SCREENS = [
  'welcome',
  'brief',
  'board',
  'investigation',
  'workshop',
  'testing',
  'report',
  'reflection',
] as const
export type Screen = (typeof SCREENS)[number]
export type Diagnosis = '' | 'open' | 'miswire' | 'straight' | 'workmanship' | 'correct'
export interface Decision {
  choice: string
  reason: string
  evidence: string[]
  at: string
}
export interface TestRun {
  id: string
  caseId: CaseId
  revision: number
  main: EndIndex
  snapshot: Cable
  map: PinMap
  prediction: string
  observation: string
  readingPin: number
  readingAnswer: string
  at: string
}
export interface Repair {
  caseId: CaseId
  diagnosis: Diagnosis
  evidence: string
  action: string
  explanation: string
  beforeTestId: string
  afterTestId: string
  at: string
}
export interface RepairDraft {
  diagnosis: Diagnosis
  evidence: string
  action: string
  explanation: string
}
export interface TesterDraft {
  main: EndIndex
  prediction: string
  manual: boolean
}
export function blankTesterDraft(): TesterDraft {
  return { main: 0, prediction: '', manual: false }
}
export interface Session {
  schemaVersion: 2
  id: string
  started: boolean
  updatedAt: string
  screen: Screen
  group: string
  members: string[]
  board: { hypothesis: string; questions: string; plan: string }
  evidence: string[]
  toolAnswers: Record<string, string>
  toolAttempts: { tool: string; capability: string; correct: boolean }[]
  decisions: Decision[]
  decisionDraft: { choice: string; reason: string; evidence: string[] }
  cables: Record<CaseId, Cable>
  activeCase: CaseId
  activeEnd: EndIndex
  undo: Cable | null
  tests: TestRun[]
  repairs: Repair[]
  repairDrafts: Record<CaseId, RepairDraft>
  testerDrafts: Record<CaseId, TesterDraft>
  hints: { screen: string; level: number; at: string }[]
  reflections: { group: string; link: string; physical: string; individual: string[] }
  settings: { reducedMotion: boolean }
  visited: Screen[]
}
const now = () => new Date().toISOString()
export function createSession(): Session {
  return {
    schemaVersion: 2,
    id: createId(),
    started: false,
    updatedAt: now(),
    screen: 'welcome',
    group: 'Tim Teknisi',
    members: ['Teknisi 01', 'Teknisi 02'],
    board: { hypothesis: '', questions: '', plan: '' },
    evidence: [],
    toolAnswers: {},
    toolAttempts: [],
    decisions: [],
    decisionDraft: { choice: '', reason: '', evidence: [] },
    cables: createCases(),
    activeCase: 'own',
    activeEnd: 0,
    undo: null,
    tests: [],
    repairs: [],
    repairDrafts: Object.fromEntries(
      CASE_IDS.map((id) => [id, { diagnosis: '', evidence: '', action: '', explanation: '' }]),
    ) as Record<CaseId, RepairDraft>,
    testerDrafts: Object.fromEntries(CASE_IDS.map((id) => [id, blankTesterDraft()])) as Record<
      CaseId,
      TesterDraft
    >,
    hints: [],
    reflections: { group: '', link: '', physical: '', individual: ['', '', ''] },
    settings: {
      reducedMotion:
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
    visited: ['welcome'],
  }
}
export type Action =
  | { type: 'load'; session: Session }
  | { type: 'start' }
  | { type: 'navigate'; screen: Screen }
  | { type: 'group'; group: string; members: string[] }
  | { type: 'board'; field: keyof Session['board']; value: string }
  | { type: 'evidence'; id: string }
  | { type: 'tool'; tool: string; capability: string; correct: boolean }
  | { type: 'decisionDraft'; draft: Session['decisionDraft'] }
  | { type: 'decision' }
  | { type: 'selectCase'; id: CaseId }
  | { type: 'selectEnd'; end: EndIndex }
  | { type: 'safety'; key: 'disconnected' | 'safeHands'; value: boolean }
  | { type: 'place'; wire: Wire; slot: number }
  | { type: 'clear'; slot: number }
  | { type: 'operation'; operation: EndOperation }
  | {
      type: 'endSetting'
      field: 'jacket' | 'reaches' | 'intended'
      value: boolean | Standard
      pin?: number
    }
  | { type: 'undo' }
  | { type: 'test'; caseId: CaseId; revision: number; main: EndIndex; prediction: string }
  | { type: 'observation'; id: string; value: string }
  | { type: 'reading'; id: string; value: string }
  | { type: 'repair'; repair: Omit<Repair, 'at'> }
  | { type: 'repairDraft'; draft: RepairDraft }
  | { type: 'testerDraft'; caseId: CaseId; draft: TesterDraft }
  | { type: 'hint'; level: number }
  | { type: 'reflection'; field: 'group' | 'link' | 'physical'; value: string }
  | { type: 'individual'; index: number; value: string }
  | { type: 'motion'; value: boolean }

export function latestTest(session: Session, id: CaseId, freshOnly = false) {
  return [...session.tests]
    .reverse()
    .find(
      (test) => test.caseId === id && (!freshOnly || test.revision === session.cables[id].revision),
    )
}
export function evidenceReady(session: Session) {
  return ['power', 'ports', 'existing'].every((id) => session.evidence.includes(id))
}
export function workshopUnlocked(session: Session) {
  return (
    evidenceReady(session) &&
    session.decisions.length > 0 &&
    Object.keys(session.toolAnswers).length >= 6
  )
}
export function boardReady(session: Session) {
  return Object.values(session.board).every((value) => value.trim().length > 0)
}
export function testPassed(session: Session, id: CaseId) {
  const test = latestTest(session, id, true)
  return (
    !!test &&
    evaluateCable(test.snapshot).pass &&
    test.observation.trim().length > 0 &&
    readingCorrect(test)
  )
}
export function readingCorrect(test: TestRun) {
  return (
    test.readingAnswer ===
    (test.map[test.readingPin - 1] === null ? 'open' : String(test.map[test.readingPin - 1]))
  )
}
export function repairPassed(session: Session, id: CaseId) {
  return (
    testPassed(session, id) &&
    session.repairs.some(
      (repair) =>
        repair.caseId === id &&
        repair.afterTestId === latestTest(session, id, true)?.id &&
        repair.explanation.trim() &&
        (id === 'own' ||
          (repair.diagnosis === id &&
            repair.action === 'reterminate' &&
            session.tests.find((t) => t.id === repair.beforeTestId)?.revision !==
              session.cables[id].revision)),
    )
  )
}
export function caseCompleted(session: Session, id: CaseId) {
  return id === 'own' ? testPassed(session, id) : repairPassed(session, id)
}
export function allCasesComplete(session: Session) {
  return CASE_IDS.every((id) => caseCompleted(session, id))
}
export function canNavigate(session: Session, screen: Screen): boolean {
  if (screen === 'welcome') return true
  if (!session.started) return false
  if (screen === 'investigation' && !boardReady(session)) return false
  if (
    screen === 'workshop' &&
    session.activeCase !== 'own' &&
    !latestTest(session, session.activeCase)
  )
    return false
  if (screen === 'workshop' || screen === 'testing') return workshopUnlocked(session)
  return true
}

export function sessionReducer(state: Session, action: Action): Session {
  if (action.type === 'load') return action.session
  let next = structuredClone(state)
  const id = next.activeCase,
    cable = next.cables[id],
    end = cable.ends[next.activeEnd]
  switch (action.type) {
    case 'start':
      next.started = true
      next.screen = 'brief'
      break
    case 'navigate':
      if (!canNavigate(state, action.screen)) return state
      next.screen = action.screen
      break
    case 'group':
      next.group = action.group
      next.members = action.members
      break
    case 'board':
      next.board[action.field] = action.value
      break
    case 'evidence':
      if (!next.evidence.includes(action.id)) next.evidence.push(action.id)
      break
    case 'tool':
      next.toolAttempts.push({
        tool: action.tool,
        capability: action.capability,
        correct: action.correct,
      })
      if (action.correct) next.toolAnswers[action.tool] = action.capability
      break
    case 'decisionDraft':
      next.decisionDraft = action.draft
      break
    case 'decision':
      if (
        !evidenceReady(state) ||
        !next.decisionDraft.choice ||
        !next.decisionDraft.reason.trim() ||
        next.decisionDraft.evidence.length < 2
      )
        return state
      next.decisions.push({ ...next.decisionDraft, at: now() })
      break
    case 'selectCase':
      next.activeCase = action.id
      next.activeEnd = 0
      next.undo = null
      break
    case 'selectEnd':
      next.activeEnd = action.end
      next.undo = null
      break
    case 'safety':
      if (cable.ends.some((e) => e.crimped)) return state
      cable[action.key] = action.value
      cable.revision++
      break
    case 'place': {
      const placed = placeWire(end, action.wire, action.slot)
      if (placed === end) return state
      next.undo = structuredClone(cable)
      cable.ends[next.activeEnd] = placed
      cable.revision++
      break
    }
    case 'clear':
      if (end.crimped || !end.untwisted) return state
      next.undo = structuredClone(cable)
      end.pins[action.slot] = null
      end.inserted = false
      end.inspected = false
      cable.revision++
      break
    case 'operation':
      next.cables[id] = operateEnd(cable, next.activeEnd, action.operation)
      next.undo = null
      break
    case 'endSetting':
      if (end.crimped) return state
      if (action.field === 'intended') end.intended = action.value as Standard
      if (action.field === 'jacket') end.jacket = action.value as boolean
      if (action.field === 'reaches' && action.pin !== undefined)
        end.reaches[action.pin] = action.value as boolean
      end.inspected = false
      cable.revision++
      break
    case 'undo':
      if (!next.undo || end.crimped || next.undo.id !== id) return state
      next.cables[id] = { ...next.undo, revision: cable.revision + 1 }
      next.undo = null
      break
    case 'test': {
      const tested = next.cables[action.caseId]
      if (
        tested.revision !== action.revision ||
        !tested.ends.every((e) => e.crimped) ||
        !action.prediction.trim()
      )
        return state
      next.tests.push({
        id: createId(),
        caseId: action.caseId,
        revision: action.revision,
        main: action.main,
        snapshot: structuredClone(tested),
        map: buildWireMap(tested, action.main),
        prediction: action.prediction,
        observation: '',
        readingPin: action.caseId === 'open' ? 2 : action.caseId === 'miswire' ? 4 : 1,
        readingAnswer: '',
        at: now(),
      })
      next.testerDrafts[action.caseId] = {
        ...next.testerDrafts[action.caseId],
        main: action.main,
        prediction: action.prediction,
      }
      break
    }
    case 'observation': {
      const run = next.tests.find((t) => t.id === action.id)
      if (run) run.observation = action.value
      break
    }
    case 'reading': {
      const run = next.tests.find((t) => t.id === action.id)
      if (run) run.readingAnswer = action.value
      break
    }
    case 'repair': {
      const repair = action.repair
      const before = next.tests.find((t) => t.id === repair.beforeTestId),
        after = next.tests.find((t) => t.id === repair.afterTestId)
      if (
        !before ||
        !after ||
        before.caseId !== repair.caseId ||
        after.caseId !== repair.caseId ||
        !repair.evidence.trim() ||
        !repair.explanation.trim()
      )
        return state
      next.repairs.push({ ...repair, at: now() })
      break
    }
    case 'repairDraft':
      next.repairDrafts[next.activeCase] = action.draft
      break
    case 'testerDraft':
      next.testerDrafts[action.caseId] = action.draft
      break
    case 'hint':
      next.hints.push({ screen: next.screen, level: action.level, at: now() })
      break
    case 'reflection':
      next.reflections[action.field] = action.value
      break
    case 'individual':
      next.reflections.individual[action.index] = action.value
      break
    case 'motion':
      next.settings.reducedMotion = action.value
      break
  }
  next.updatedAt = now()
  if (!next.visited.includes(next.screen)) next.visited.push(next.screen)
  return next
}
