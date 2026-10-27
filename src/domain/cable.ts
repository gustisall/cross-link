export const WIRES = [
  'whiteGreen',
  'green',
  'whiteOrange',
  'orange',
  'blue',
  'whiteBlue',
  'whiteBrown',
  'brown',
] as const
export type Wire = (typeof WIRES)[number]
export type EndIndex = 0 | 1
export type Standard = 'T568A' | 'T568B'
export const CASE_IDS = ['own', 'open', 'miswire', 'straight'] as const
export type CaseId = (typeof CASE_IDS)[number]
export type PinMap = (number | null)[]

export const STANDARDS: Record<Standard, Wire[]> = {
  T568A: [
    'whiteGreen',
    'green',
    'whiteOrange',
    'blue',
    'whiteBlue',
    'orange',
    'whiteBrown',
    'brown',
  ],
  T568B: [
    'whiteOrange',
    'orange',
    'whiteGreen',
    'blue',
    'whiteBlue',
    'green',
    'whiteBrown',
    'brown',
  ],
}
export const EXPECTED_MAP = [3, 6, 1, 4, 5, 2, 7, 8]
export const WIRE_INFO: Record<
  Wire,
  { name: string; short: string; color: string; stripe: boolean }
> = {
  whiteGreen: { name: 'Putih–hijau', short: 'PH', color: '#34966b', stripe: true },
  green: { name: 'Hijau', short: 'H', color: '#34966b', stripe: false },
  whiteOrange: { name: 'Putih–oranye', short: 'PO', color: '#e78c35', stripe: true },
  orange: { name: 'Oranye', short: 'O', color: '#e78c35', stripe: false },
  blue: { name: 'Biru', short: 'B', color: '#4d84c7', stripe: false },
  whiteBlue: { name: 'Putih–biru', short: 'PB', color: '#4d84c7', stripe: true },
  whiteBrown: { name: 'Putih–cokelat', short: 'PC', color: '#99704f', stripe: true },
  brown: { name: 'Cokelat', short: 'C', color: '#99704f', stripe: false },
}

export interface Termination {
  pins: (Wire | null)[]
  intended: Standard
  stripped: boolean
  untwisted: boolean
  trimmed: boolean
  inserted: boolean
  reaches: boolean[]
  damaged: boolean[]
  jacket: boolean
  inspected: boolean
  crimped: boolean
}
export interface Cable {
  id: CaseId
  revision: number
  replacements: number
  disconnected: boolean
  safeHands: boolean
  ends: [Termination, Termination]
}

export function blankEnd(): Termination {
  return {
    pins: Array(8).fill(null),
    intended: 'T568A',
    stripped: false,
    untwisted: false,
    trimmed: false,
    inserted: false,
    reaches: Array(8).fill(true),
    damaged: Array(8).fill(false),
    jacket: true,
    inspected: false,
    crimped: false,
  }
}
export function createCable(id: CaseId = 'own'): Cable {
  return {
    id,
    revision: 0,
    replacements: 0,
    disconnected: false,
    safeHands: false,
    ends: [blankEnd(), blankEnd()],
  }
}
export function assembledCable(
  a: Standard = 'T568A',
  b: Standard = 'T568B',
  id: CaseId = 'own',
): Cable {
  const cable = createCable(id)
  cable.disconnected = true
  cable.safeHands = true
  cable.ends = [a, b].map((standard) => ({
    ...blankEnd(),
    intended: standard,
    pins: [...STANDARDS[standard]],
    stripped: true,
    untwisted: true,
    trimmed: true,
    inserted: true,
    inspected: true,
    crimped: true,
  })) as Cable['ends']
  return cable
}
export function createCases(): Record<CaseId, Cable> {
  const open = assembledCable('T568A', 'T568B', 'open')
  open.ends[1].reaches[5] = false
  const miswire = assembledCable('T568A', 'T568B', 'miswire')
  ;[miswire.ends[1].pins[3], miswire.ends[1].pins[4]] = [
    miswire.ends[1].pins[4],
    miswire.ends[1].pins[3],
  ]
  const straight = assembledCable('T568B', 'T568B', 'straight')
  return { own: createCable(), open, miswire, straight }
}

export function assertCableStructure(cable: Cable): void {
  if (!Array.isArray(cable.ends) || cable.ends.length !== 2)
    throw new Error('Kabel harus memiliki dua ujung.')
  for (const end of cable.ends) {
    if (end.pins.length !== 8 || end.reaches.length !== 8 || end.damaged.length !== 8)
      throw new Error('Setiap ujung harus memiliki delapan posisi.')
    const placed = end.pins.filter((wire): wire is Wire => wire !== null)
    if (placed.some((wire) => !WIRES.includes(wire)) || new Set(placed).size !== placed.length)
      throw new Error('Konduktor tidak dikenal atau duplikat.')
  }
}
export function identifyStandard(end: Termination): Standard | null {
  return (
    (Object.keys(STANDARDS) as Standard[]).find((key) =>
      STANDARDS[key].every((wire, index) => end.pins[index] === wire),
    ) ?? null
  )
}

/** Checks the conductor layout before termination; electrical contacts are deliberately ignored. */
export function evaluateDesign(cable: Cable) {
  let validStructure = true
  const findings: string[] = []
  try {
    assertCableStructure(cable)
  } catch {
    validStructure = false
    findings.push('Rancangan harus memiliki delapan posisi dan konduktor unik pada setiap ujung.')
  }
  const standards: (Standard | null)[] = validStructure
    ? cable.ends.map(identifyStandard)
    : [null, null]
  const complete = validStructure && cable.ends.every((end) => end.pins.every(Boolean))
  const standardMatch = complete && standards.every(Boolean) && standards[0] !== standards[1]
  if (validStructure && !complete) {
    for (const [index, end] of cable.ends.entries()) {
      const missing = end.pins.filter((wire) => wire === null).length
      if (missing) findings.push(`Ujung ${index + 1} masih memiliki ${missing} posisi kosong.`)
    }
  }
  if (complete && standards.some((standard) => standard === null))
    findings.push(
      'Bandingkan urutan pada kedua ujung dengan referensi standar; ada susunan yang belum sesuai.',
    )
  else if (complete && !standardMatch)
    findings.push(
      'Kedua ujung memakai standar yang sama. Tinjau hubungan pengirim dan penerima pada kasus ini.',
    )
  if (standardMatch)
    findings.push(
      'Rancangan kedua ujung sesuai kebutuhan. Lanjutkan pemasangan dan pengujian kontak secara terpisah.',
    )
  return { complete, standards, standardMatch, pass: complete && standardMatch, findings }
}
function hasContact(end: Termination, pin: number) {
  return (
    end.crimped && end.inserted && end.reaches[pin] && !end.damaged[pin] && end.pins[pin] !== null
  )
}
export function buildWireMap(cable: Cable, main: EndIndex = 0): PinMap {
  assertCableStructure(cable)
  const source = cable.ends[main],
    target = cable.ends[main === 0 ? 1 : 0]
  return source.pins.map((wire, pin) => {
    if (!hasContact(source, pin) || wire === null) return null
    const remote = target.pins.indexOf(wire)
    return remote >= 0 && hasContact(target, remote) ? remote + 1 : null
  })
}
export function evaluateCable(cable: Cable) {
  const map = buildWireMap(cable)
  const standards = cable.ends.map(identifyStandard)
  const complete = cable.ends.every((end) => end.pins.every(Boolean))
  const continuity = map.every((pin) => pin !== null)
  const crossover = map.every((pin, i) => pin === EXPECTED_MAP[i])
  const standardMatch = standards.every(Boolean) && standards[0] !== standards[1]
  const workmanship =
    cable.disconnected &&
    cable.safeHands &&
    cable.ends.every(
      (end) =>
        end.stripped &&
        end.untwisted &&
        end.trimmed &&
        end.inserted &&
        end.inspected &&
        end.crimped &&
        end.jacket &&
        end.reaches.every(Boolean) &&
        !end.damaged.some(Boolean),
    )
  const link = [0, 1, 2, 5].every((i) => map[i] === EXPECTED_MAP[i])
  const findings: string[] = []
  if (!complete) findings.push('Ada posisi konduktor yang belum terisi.')
  if (!continuity) findings.push('Ada jalur yang belum memiliki kontinuitas.')
  if (!crossover) findings.push('Peta delapan pin belum sesuai kebutuhan crossover 10/100.')
  if (!standardMatch)
    findings.push('Susunan aktual belum merupakan kombinasi T568A–T568B atau sebaliknya.')
  if (!workmanship)
    findings.push('Periksa kembali persiapan, posisi jaket, kedalaman konduktor, dan terminasi.')
  return {
    map,
    standards,
    complete,
    continuity,
    crossover,
    standardMatch,
    workmanship,
    link,
    pass: complete && continuity && crossover && standardMatch && workmanship,
    findings,
  }
}

/** A placement is physical: a wire cannot appear twice in the same connector. */
export function placeWire(end: Termination, wire: Wire, slot: number): Termination {
  if (end.crimped || !end.untwisted || slot < 0 || slot > 7) return end
  const next = structuredClone(end),
    source = next.pins.indexOf(wire),
    old = next.pins[slot]
  if (source >= 0) next.pins[source] = old
  next.pins[slot] = wire
  next.inserted = false
  next.inspected = false
  return next
}
export type EndOperation = 'strip' | 'untwist' | 'trim' | 'insert' | 'inspect' | 'crimp' | 'replace'
export function operateEnd(cable: Cable, index: EndIndex, operation: EndOperation): Cable {
  const next = structuredClone(cable),
    end = next.ends[index]
  if (!cable.disconnected || !cable.safeHands) return cable
  if (operation === 'replace') {
    next.ends[index] = { ...blankEnd(), intended: end.intended }
    next.replacements++
    next.revision++
    return next
  }
  if (end.crimped) return cable
  const allowed =
    operation === 'strip' ||
    (operation === 'untwist' && end.stripped) ||
    (operation === 'trim' && end.untwisted) ||
    (operation === 'insert' && end.trimmed && end.pins.some(Boolean)) ||
    (operation === 'inspect' && end.inserted) ||
    (operation === 'crimp' && end.inserted && end.inspected)
  if (!allowed) return cable
  if (operation === 'strip') end.stripped = true
  if (operation === 'untwist') end.untwisted = true
  if (operation === 'trim') end.trimmed = true
  if (operation === 'insert') end.inserted = true
  if (operation === 'inspect') end.inspected = true
  if (operation === 'crimp') end.crimped = true
  next.revision++
  return next
}
