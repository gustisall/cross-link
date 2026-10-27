import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Eye,
  LockKeyhole,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Undo2,
  Wrench,
} from 'lucide-react'
import { CASES, TOOLS } from '../content'
import { evaluateDesign, WIRE_INFO } from '../domain/cable'
import type { EndIndex, EndOperation, Standard, Wire } from '../domain/cable'
import { ConnectorView, ConductorPalette } from '../components/Connector'
import { Button, Panel, Pill, ScreenTitle, useGame } from '../ui'

const OPERATIONS: {
  id: EndOperation
  label: string
  field: 'stripped' | 'untwisted' | 'trimmed' | 'inserted' | 'inspected' | 'crimped'
  capability?: string
}[] = [
  { id: 'strip', label: 'Kupas jaket', field: 'stripped', capability: 'strip' },
  { id: 'untwist', label: 'Buka pasangan', field: 'untwisted' },
  { id: 'trim', label: 'Ratakan & potong', field: 'trimmed', capability: 'cut' },
  { id: 'insert', label: 'Masukkan konduktor', field: 'inserted' },
  { id: 'inspect', label: 'Periksa pemasangan', field: 'inspected' },
  { id: 'crimp', label: 'Crimp konektor', field: 'crimped', capability: 'crimp' },
]
export function Workshop({ openReference }: { openReference: () => void }) {
  const { state, dispatch, notify } = useGame()
  const cable = state.cables[state.activeCase],
    end = cable.ends[state.activeEnd],
    currentCase = CASES.find((c) => c.id === state.activeCase)!
  const [selected, setSelected] = useState<Wire | null>(null),
    [toolId, setToolId] = useState(''),
    [showInspection, setShowInspection] = useState(false),
    [checkedRevision, setCheckedRevision] = useState<number | null>(null)
  const tool = TOOLS.find((t) => t.id === toolId)
  const design = checkedRevision === cable.revision ? evaluateDesign(cable) : null
  function place(wire: Wire, slot: number) {
    dispatch({ type: 'place', wire, slot })
    setSelected(null)
  }
  function operate(operation: (typeof OPERATIONS)[number]) {
    if (!cable.disconnected || !cable.safeHands) {
      notify('Lepaskan kabel dan pastikan posisi tangan aman sebelum menggunakan alat.')
      return
    }
    if (operation.capability && !tool?.capabilities.includes(operation.capability)) {
      notify('Pilih perlengkapan dengan kemampuan yang sesuai untuk tindakan ini.')
      return
    }
    dispatch({ type: 'operation', operation: operation.id })
    if (operation.id === 'inspect') setShowInspection(true)
    if (operation.id === 'crimp')
      notify('Konektor telah di-crimp. Perubahan urutan memerlukan konektor baru.')
  }
  const nextIndex = OPERATIONS.findIndex((operation) => !end[operation.field])
  return (
    <>
      <ScreenTitle
        eyebrow="MISI 02 / CABLE WORKSHOP"
        title={
          state.activeCase === 'own'
            ? 'Bangun koneksimu, satu konduktor setiap kali.'
            : 'Perbaiki berdasarkan bukti.'
        }
        right={
          <Pill>
            {currentCase.code} · REV {cable.revision}
          </Pill>
        }
      >
        Susun kedua ujung, periksa pemasangan, lalu uji hasilnya. Setiap konduktor memiliki satu
        tempat.
      </ScreenTitle>
      {state.activeCase !== 'own' && (
        <div className="notice amber">
          <Wrench size={18} />
          <span>{currentCase.label} · Pekerjaan asli kelompok disimpan terpisah.</span>
        </div>
      )}
      <div className="workshop-layout">
        <aside className="panel tool-shelf">
          <div className="eyebrow">PERLENGKAPAN</div>
          <h2>Alat kerja</h2>
          <p className="fine-print">Pilih alat sebelum menggunakannya.</p>
          {TOOLS.filter((item) => ['stripper', 'cutter', 'crimper'].includes(item.id)).map(
            (item) => (
              <button
                key={item.id}
                className={`shelf-tool ${toolId === item.id ? 'active' : ''}`}
                aria-pressed={toolId === item.id}
                onClick={() => setToolId(item.id)}
              >
                <img src={item.photo} alt="" />
                <span>{item.name}</span>
                {toolId === item.id && <Check size={15} />}
              </button>
            ),
          )}
          <div className="shelf-note">
            <ShieldCheck size={20} />
            <p>Jari jauh dari mata potong. Kabel tidak terhubung ke perangkat.</p>
          </div>
          <p className="fine-print">Konektor pengganti: {cable.replacements}</p>
        </aside>
        <Panel className="connector-panel">
          <div className="workbench-top">
            <div className="segmented" role="group" aria-label="Pilih ujung kabel">
              {([0, 1] as EndIndex[]).map((index) => (
                <button
                  key={index}
                  className={state.activeEnd === index ? 'active' : ''}
                  onClick={() => {
                    dispatch({ type: 'selectEnd', end: index })
                    setSelected(null)
                    setShowInspection(false)
                  }}
                >
                  Ujung {index + 1}
                  {cable.ends[index].crimped && <LockKeyhole size={13} />}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={openReference}>
              Referensi standar
              <ArrowRight size={15} />
            </Button>
          </div>
          <div className="workbench-canvas">
            <span className="canvas-label">MEJA TERMINASI / UJUNG {state.activeEnd + 1}</span>
            <ConnectorView
              end={end}
              selected={selected}
              onSelect={setSelected}
              onPlace={place}
              onClear={(slot) => dispatch({ type: 'clear', slot })}
              onCancelSelection={() => setSelected(null)}
              label={`Konektor Ujung ${state.activeEnd + 1}`}
            />
          </div>
          <div className="palette-heading">
            <h3>Delapan konduktor</h3>
            <span>{end.pins.filter(Boolean).length}/8 ditempatkan</span>
          </div>
          <p className="fine-print">
            {end.crimped
              ? 'Susunan dikunci setelah crimp. Ganti konektor untuk mengubahnya.'
              : !end.untwisted
                ? 'Kupas jaket dan buka pasangan untuk mulai menyusun.'
                : selected
                  ? `${WIRE_INFO[selected].name} dipilih. Pilih pin tujuan. Delete / Backspace mengosongkan pin.`
                  : 'Pilih konduktor, lalu pilih nomor pin tujuan. Pada layar sentuh, panel pin muncul di bawah.'}
          </p>
          <ConductorPalette
            end={end}
            selected={selected}
            onSelect={(wire) => setSelected(selected === wire ? null : wire)}
          />
          <div className="button-row">
            <Button
              variant="ghost"
              disabled={!state.undo || end.crimped}
              onClick={() => {
                dispatch({ type: 'undo' })
                setSelected(null)
              }}
            >
              <Undo2 size={16} />
              Urungkan penempatan
            </Button>
            <label className="intended-standard">
              Rencana standar
              <select
                aria-label="Standar yang dituju"
                disabled={end.crimped}
                value={end.intended}
                onChange={(e) =>
                  dispatch({
                    type: 'endSetting',
                    field: 'intended',
                    value: e.target.value as Standard,
                  })
                }
              >
                <option>T568A</option>
                <option>T568B</option>
              </select>
            </label>
          </div>
          <div className="design-check">
            <Button variant="secondary" onClick={() => setCheckedRevision(cable.revision)}>
              <Eye size={16} />
              Periksa Rancangan
            </Button>
            <p className="fine-print">
              Menilai susunan kedua ujung sebelum crimp. Tidak mengukur kontak dan tidak mengisi
              jawaban.
            </p>
            {design && (
              <div role="status" className={`notice ${design.pass ? 'success' : 'amber'}`}>
                <div>
                  <strong>
                    {design.pass
                      ? 'Susunan kedua ujung sesuai rancangan crossover.'
                      : 'Rancangan masih perlu ditinjau.'}
                  </strong>
                  {design.findings.length > 0 && (
                    <ul>
                      {design.findings.map((finding) => (
                        <li key={finding}>{finding}</li>
                      ))}
                    </ul>
                  )}
                  {design.pass && (
                    <p>
                      Selanjutnya periksa kedalaman konduktor dan pemasangan, lakukan crimp, lalu
                      buktikan kontinuitas melalui tester.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
      <Panel>
        <div className="panel-title">
          <ShieldCheck size={19} />
          <h2>Prosedur kerja</h2>
          <Pill>{end.crimped ? 'Konektor terpasang' : 'Persiapan terminasi'}</Pill>
        </div>
        <div className="safety-row">
          <label className="check-control">
            <input
              type="checkbox"
              checked={cable.disconnected}
              disabled={cable.ends.some((e) => e.crimped)}
              onChange={(e) =>
                dispatch({ type: 'safety', key: 'disconnected', value: e.target.checked })
              }
            />
            Kabel dilepas dari perangkat
          </label>
          <label className="check-control">
            <input
              type="checkbox"
              checked={cable.safeHands}
              disabled={cable.ends.some((e) => e.crimped)}
              onChange={(e) =>
                dispatch({ type: 'safety', key: 'safeHands', value: e.target.checked })
              }
            />
            Tangan aman dari bagian pemotong
          </label>
        </div>
        <ol className="procedure-steps">
          {OPERATIONS.map((operation, index) => (
            <li
              key={operation.id}
              className={end[operation.field] ? 'done' : nextIndex === index ? 'current' : ''}
            >
              <span>{end[operation.field] ? <Check size={16} /> : `0${index + 1}`}</span>
              <Button
                variant="ghost"
                disabled={
                  end.crimped ||
                  !!end[operation.field] ||
                  index > nextIndex ||
                  (operation.id === 'insert' && !end.pins.some(Boolean))
                }
                onClick={() => operate(operation)}
              >
                {operation.label}
              </Button>
            </li>
          ))}
        </ol>
        <div className="button-row">
          <Button
            variant="secondary"
            disabled={!end.inserted}
            onClick={() => setShowInspection(!showInspection)}
          >
            <Eye size={16} />
            Inspeksi detail
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!cable.disconnected || !cable.safeHands || !tool?.capabilities.includes('cut')) {
                notify('Pilih alat pemotong; pastikan kabel dilepas dan tangan aman.')
                return
              }
              dispatch({ type: 'operation', operation: 'replace' })
              setSelected(null)
              setShowInspection(false)
              notify('Konektor dipotong. Siapkan dan pasang konektor baru pada ujung ini.')
            }}
          >
            <Scissors size={16} />
            {end.crimped ? 'Potong & ganti konektor' : 'Mulai ulang ujung ini'}
          </Button>
        </div>
        {showInspection && (
          <div className="termination-detail">
            <h3>Inspeksi Ujung {state.activeEnd + 1}</h3>
            <p>
              Amati apakah setiap konduktor mencapai bagian depan konektor. Perubahan kondisi hanya
              dapat dilakukan sebelum crimp.
            </p>
            <div className="depth-controls">
              {end.pins.map((wire, index) => (
                <label key={index} className="check-control">
                  <input
                    type="checkbox"
                    checked={end.reaches[index]}
                    disabled={end.crimped}
                    onChange={(e) =>
                      dispatch({
                        type: 'endSetting',
                        field: 'reaches',
                        pin: index,
                        value: e.target.checked,
                      })
                    }
                  />
                  <span>
                    Pin {index + 1}
                    <small>
                      {wire ? WIRE_INFO[wire].name : 'Kosong'} ·{' '}
                      {end.reaches[index] ? 'mencapai depan' : 'terlalu pendek'}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <label className="check-control">
              <input
                type="checkbox"
                checked={end.jacket}
                disabled={end.crimped}
                onChange={(e) =>
                  dispatch({ type: 'endSetting', field: 'jacket', value: e.target.checked })
                }
              />
              Jaket masuk ke area penjepit konektor
            </label>
            <p className="fine-print">
              Setelah mengubah kondisi, lakukan “Periksa pemasangan” lagi. Tester kontinuitas tidak
              memeriksa kekuatan penjepit jaket.
            </p>
          </div>
        )}
      </Panel>
      <div className="screen-footer">
        <span>
          <RotateCcw size={15} />
          Kamu dapat mencoba, mengukur, dan memperbaiki tanpa penalti.
        </span>
        <Button
          disabled={!cable.ends.every((e) => e.crimped)}
          onClick={() => dispatch({ type: 'navigate', screen: 'testing' })}
        >
          Bawa ke LAN tester
          <ArrowRight size={17} />
        </Button>
      </div>
    </>
  )
}
