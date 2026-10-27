import { describe, expect, it } from 'vitest'
import {
  WIRES,
  EXPECTED_MAP,
  assembledCable,
  assertCableStructure,
  blankEnd,
  buildWireMap,
  createCases,
  evaluateCable,
  evaluateDesign,
  operateEnd,
  placeWire,
} from '../domain/cable'

describe('Engine pengkabelan', () => {
  it.each([
    ['T568A', 'T568B'],
    ['T568B', 'T568A'],
  ] as const)('V01/02 menerima %s–%s', (a, b) => {
    const cable = assembledCable(a, b)
    expect(buildWireMap(cable)).toEqual(EXPECTED_MAP)
    expect(evaluateCable(cable).pass).toBe(true)
  })
  it.each(['T568A', 'T568B'] as const)(
    'V03 mengenali %s di kedua ujung sebagai straight',
    (standard) => {
      const result = evaluateCable(assembledCable(standard, standard))
      expect(result.map).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
      expect(result.pass).toBe(false)
      expect(result.link).toBe(false)
    },
  )
  it('V04 open pada pin 6 ujung 2 memutus sumber pin 2', () =>
    expect(buildWireMap(createCases().open)).toEqual([3, null, 1, 4, 5, 2, 7, 8]))
  it('V05 pertukaran 4/5 menggagalkan kabel tetapi membiarkan link 10/100', () => {
    const result = evaluateCable(createCases().miswire)
    expect(result.map).toEqual([3, 6, 1, 5, 4, 2, 7, 8])
    expect(result.link).toBe(true)
    expect(result.pass).toBe(false)
  })
  it('V06 map yang benar tidak menggantikan kesesuaian standar', () => {
    const cable = assembledCable()
    for (const end of cable.ends) {
      ;[end.pins[3], end.pins[6]] = [end.pins[6], end.pins[3]]
      ;[end.pins[4], end.pins[7]] = [end.pins[7], end.pins[4]]
    }
    expect(buildWireMap(cable)).toEqual(EXPECTED_MAP)
    expect(evaluateCable(cable).standardMatch).toBe(false)
    expect(evaluateCable(cable).pass).toBe(false)
  })
  it('V07 jaket longgar tidak mengubah pengukuran kontinuitas', () => {
    const cable = assembledCable()
    cable.ends[1].jacket = false
    const result = evaluateCable(cable)
    expect(result.continuity).toBe(true)
    expect(result.workmanship).toBe(false)
    expect(result.pass).toBe(false)
  })
  it('V08 slot kosong valid sebagai draft dan menghasilkan open', () => {
    const cable = assembledCable()
    cable.ends[0].pins[7] = null
    expect(() => assertCableStructure(cable)).not.toThrow()
    expect(buildWireMap(cable)[7]).toBeNull()
  })
  it('V09 menolak konduktor duplikat', () => {
    const cable = assembledCable()
    cable.ends[0].pins[1] = cable.ends[0].pins[0]
    expect(() => buildWireMap(cable)).toThrow('duplikat')
  })
  it('V10 membalik pemetaan sumber secara benar', () => {
    const cable = assembledCable()
    ;[cable.ends[1].pins[0], cable.ends[1].pins[3]] = [cable.ends[1].pins[3], cable.ends[1].pins[0]]
    const forward = buildWireMap(cable),
      reverse = buildWireMap(cable, 1)
    forward.forEach((remote, i) => expect(reverse[remote! - 1]).toBe(i + 1))
  })
  it('V12 deterministik dan tidak memutasi model', () => {
    const cable = createCases().open,
      snapshot = structuredClone(cable)
    expect(buildWireMap(cable)).toEqual(buildWireMap(cable))
    expect(cable).toEqual(snapshot)
  })
  it('pin tidak aktif yang open tidak otomatis mematikan model link', () => {
    const cable = assembledCable()
    cable.ends[1].reaches[7] = false
    expect(evaluateCable(cable).link).toBe(true)
    expect(evaluateCable(cable).pass).toBe(false)
  })
  it('crimp dan posisi kontak menentukan kontinuitas', () => {
    const cable = assembledCable()
    cable.ends[1].crimped = false
    expect(buildWireMap(cable)).toEqual(Array(8).fill(null))
  })
  it('pertukaran slot mempertahankan satu identitas konduktor', () => {
    const end = assembledCable().ends[0]
    end.crimped = false
    const moved = placeWire(end, 'whiteGreen', 1)
    expect(moved.pins[0]).toBe('green')
    expect(moved.pins[1]).toBe('whiteGreen')
    expect(new Set(moved.pins).size).toBe(8)
    expect(end.pins[0]).toBe('whiteGreen')
  })
  it('konduktor dari baki menggantikan penghuni slot tanpa duplikasi', () => {
    const end = blankEnd()
    end.untwisted = true
    end.pins[0] = 'green'
    const moved = placeWire(end, 'blue', 0)
    expect(moved.pins.filter(Boolean)).toEqual(['blue'])
  })
  it('sesudah crimp susunan terkunci; terminasi baru diperlukan', () => {
    const cable = assembledCable(),
      end = cable.ends[0]
    expect(placeWire(end, 'green', 3)).toBe(end)
    const repaired = operateEnd(cable, 0, 'replace')
    expect(repaired.replacements).toBe(1)
    expect(repaired.ends[0].crimped).toBe(false)
    expect(repaired.ends[0].pins).toEqual(Array(8).fill(null))
  })
  it('prosedur aman tidak dapat dilompati', () => {
    const cable = createCases().own
    expect(operateEnd(cable, 0, 'strip')).toBe(cable)
    cable.disconnected = true
    cable.safeHands = true
    expect(operateEnd(cable, 0, 'crimp')).toBe(cable)
    expect(operateEnd(cable, 0, 'strip').ends[0].stripped).toBe(true)
  })
  it('permutasi acak tetap dapat ditelusuri balik, tanpa jawaban hardcoded', () => {
    let seed = 1337
    for (let sample = 0; sample < 50; sample++) {
      const cable = assembledCable()
      for (const end of cable.ends)
        for (let i = 7; i > 0; i--) {
          seed = (seed * 16807) % 2147483647
          const j = seed % (i + 1)
          ;[end.pins[i], end.pins[j]] = [end.pins[j], end.pins[i]]
        }
      const map = buildWireMap(cable)
      map.forEach((remote, i) =>
        expect(cable.ends[1].pins[remote! - 1]).toBe(cable.ends[0].pins[i]),
      )
      expect(new Set(map).size).toBe(WIRES.length)
    }
  })
  it('tiket straight mempunyai delapan jalur lurus dan memerlukan perbaikan', () => {
    const cable = createCases().straight
    expect(cable.id).toBe('straight')
    expect(buildWireMap(cable)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(evaluateCable(cable).pass).toBe(false)
  })
  it.each([
    ['T568A', 'T568B'],
    ['T568B', 'T568A'],
  ] as const)('pemeriksaan rancangan %s–%s tidak memerlukan kontak atau crimp', (a, b) => {
    const cable = assembledCable(a, b)
    cable.disconnected = false
    cable.ends.forEach((end) => {
      end.crimped = false
      end.inserted = false
      end.reaches.fill(false)
    })
    expect(evaluateDesign(cable).pass).toBe(true)
    expect(evaluateDesign(cable).standardMatch).toBe(true)
    expect(evaluateCable(cable).continuity).toBe(false)
  })
  it('rancangan kosong, lurus, dan duplikat tidak diluluskan', () => {
    expect(evaluateDesign(createCases().own).pass).toBe(false)
    expect(evaluateDesign(assembledCable('T568A', 'T568A')).pass).toBe(false)
    const duplicate = assembledCable()
    duplicate.ends[0].pins[1] = duplicate.ends[0].pins[0]
    const result = evaluateDesign(duplicate)
    expect(result.pass).toBe(false)
    expect(result.findings.length).toBeGreaterThan(0)
  })
})
