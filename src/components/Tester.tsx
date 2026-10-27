import { useEffect, useMemo, useRef, useState } from 'react'
import { Cable as CableIcon, Pause, Play, Power, RotateCcw, SkipForward } from 'lucide-react'
import { buildWireMap } from '../domain/cable'
import type { Cable, EndIndex, PinMap } from '../domain/cable'
import type { TesterDraft, TestRun } from '../domain/session'
import { Button, Field, Pill } from '../ui'

export function WireMapTable({ map, count = 8 }: { map: PinMap; count?: number }) {
  return (
    <div className="wire-map-table">
      <table>
        <caption className="sr-only">Pemetaan kontinuitas pin</caption>
        <thead>
          <tr>
            <th>MAIN</th>
            <th />
            <th>REMOTE</th>
            <th>Pengamatan</th>
          </tr>
        </thead>
        <tbody>
          {map.slice(0, count).map((pin, i) => (
            <tr key={i}>
              <td>
                <span className="pin-label">{i + 1}</span>
              </td>
              <td className="map-arrow">→</td>
              <td>
                <span className={`pin-label ${pin === null ? 'open' : ''}`}>{pin ?? '—'}</span>
              </td>
              <td>{pin === null ? 'Tidak ada sambungan teramati' : `Terhubung ke pin ${pin}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {count === 0 && <p className="empty-text">Pengamatan muncul setelah pemindaian dimulai.</p>}
    </div>
  )
}
export function TesterDevice({
  cable,
  reducedMotion,
  onComplete,
  savedRun,
  draft,
  onDraftChange,
}: {
  cable: Cable
  reducedMotion: boolean
  onComplete: (main: EndIndex, prediction: string) => void
  savedRun?: Pick<TestRun, 'map' | 'main' | 'prediction' | 'revision'>
  draft?: TesterDraft
  onDraftChange?: (draft: TesterDraft) => void
}) {
  const [power, setPower] = useState(false),
    [plugged, setPlugged] = useState([false, false])
  const [main, setMain] = useState<EndIndex>(draft?.main ?? savedRun?.main ?? 0),
    [prediction, setPrediction] = useState(draft?.prediction ?? savedRun?.prediction ?? '')
  const [manual, setManual] = useState(reducedMotion || draft?.manual || false),
    [step, setStep] = useState(-1),
    [running, setRunning] = useState(false),
    [done, setDone] = useState(false)
  const completedRef = useRef(false)
  const scan = useRef<{ main: EndIndex; prediction: string; map: PinMap } | null>(null)
  const callback = useRef(onComplete)
  callback.current = onComplete
  const map = useMemo(() => buildWireMap(cable, main), [cable, main])
  const ready =
    power &&
    plugged.every(Boolean) &&
    cable.ends.every((end) => end.crimped) &&
    prediction.trim().length > 0
  const visible = done ? 8 : step + 1
  function finish() {
    setRunning(false)
    setDone(true)
    if (!completedRef.current) {
      completedRef.current = true
      const measured = scan.current
      if (measured) callback.current(measured.main, measured.prediction)
    }
  }
  const finishRef = useRef(finish)
  finishRef.current = finish
  useEffect(() => {
    if (!running || manual || reducedMotion) return
    const timer = setTimeout(() => {
      if (step < 7) setStep(step + 1)
      else finishRef.current()
    }, 650)
    return () => clearTimeout(timer)
  }, [running, manual, reducedMotion, step])
  useEffect(() => {
    if (reducedMotion) {
      setManual(true)
      setRunning(false)
    }
  }, [reducedMotion])
  function start() {
    if (!ready) return
    scan.current = { main, prediction, map: [...map] }
    completedRef.current = false
    setDone(false)
    setStep(0)
    setRunning(!manual)
  }
  function next() {
    if (step < 7) setStep(step + 1)
    else finish()
  }
  function changeDraft(patch: Partial<TesterDraft>) {
    const next = { main, prediction, manual, ...patch }
    setMain(next.main)
    setPrediction(next.prediction)
    setManual(next.manual)
    onDraftChange?.(next)
  }
  const historical = step < 0 && !!savedRun
  const displayMap = historical ? savedRun.map : (scan.current?.map ?? map)
  const count = historical ? 8 : visible
  const locked = step >= 0 && !done
  return (
    <div
      className={`tester-widget ${power ? 'is-powered' : ''}`}
      data-scanning={step >= 0 && !done}
    >
      <div className="tester-hardware">
        <div className="tester-main">
          <div className="tester-brand">
            CROSSLINK<span>TESTER KABEL JARINGAN</span>
          </div>
          <div className="tester-model">
            CT–108 <span>MAIN</span>
          </div>
          <div className={`tester-port ${plugged[0] ? 'is-connected' : ''}`}>
            <CableIcon size={21} />
            <span>8P8C</span>
          </div>
          <div className="led-grid">
            {map.map((_, i) => (
              <div key={i} className="led-item">
                <span>{i + 1}</span>
                <i className={power && step === i ? 'lit' : ''} />
              </div>
            ))}
          </div>
          <div className="power-label">
            <i className={`status-dot ${power ? 'green' : ''}`} />
            {power ? 'DAYA HIDUP' : 'DAYA MATI'}
          </div>
          <div className="device-ribs" />
        </div>
        <div
          className={`tester-cable-art ${plugged.every(Boolean) ? 'is-connected' : ''}`}
          aria-hidden="true"
        >
          <span />
          <span />
        </div>
        <div className="tester-remote">
          <div className="remote-brand">CT–108</div>
          <strong>REMOTE</strong>
          <div className={`tester-port ${plugged[1] ? 'is-connected' : ''}`}>
            <CableIcon size={19} />
          </div>
          <div className="led-grid">
            {map.map((_, i) => (
              <div key={i} className="led-item">
                <span>{i + 1}</span>
                <i
                  data-testid={`remote-pin-${i + 1}`}
                  className={power && step >= 0 && map[step] === i + 1 ? 'lit' : ''}
                />
              </div>
            ))}
          </div>
          <div className="device-ribs" />
        </div>
      </div>
      {power && step >= 0 && (
        <div
          className={`signal-readout ${displayMap[step] === null ? 'is-open' : ''}`}
          role="status"
          aria-label="Jalur pin yang sedang diuji"
        >
          <span>
            MAIN <b>{step + 1}</b>
          </span>
          <span className="signal-track" aria-hidden="true">
            <i key={`${main}-${step}`} />
          </span>
          <span>
            REMOTE <b>{displayMap[step] ?? '—'}</b>
          </span>
          <small>
            {displayMap[step] === null
              ? 'Tidak ada sambungan pada jalur ini.'
              : `Pin ${step + 1} tersambung ke pin ${displayMap[step]}.`}
          </small>
        </div>
      )}
      <div className="tester-connections">
        <label className="check-control">
          <input
            type="checkbox"
            checked={plugged[0]}
            disabled={locked}
            onChange={(e) => setPlugged([e.target.checked, plugged[1]])}
          />
          Pasang Ujung {main + 1} ke MAIN
        </label>
        <label className="check-control">
          <input
            type="checkbox"
            checked={plugged[1]}
            disabled={locked}
            onChange={(e) => setPlugged([plugged[0], e.target.checked])}
          />
          Pasang Ujung {main === 0 ? 2 : 1} ke REMOTE
        </label>
      </div>
      <div className="tester-settings">
        <Button
          variant={power ? 'primary' : 'secondary'}
          disabled={running}
          onClick={() => {
            setPower(!power)
            setStep(-1)
            setDone(false)
            scan.current = null
          }}
        >
          <Power size={16} />
          Daya {power ? 'hidup' : 'mati'}
        </Button>
        <label className="select-label">
          Mode
          <select
            aria-label="Mode pemindaian"
            value={manual ? 'manual' : 'auto'}
            disabled={running || reducedMotion}
            onChange={(e) => changeDraft({ manual: e.target.value === 'manual' })}
          >
            <option value="auto">Otomatis</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <label className="select-label">
          MAIN
          <select
            aria-label="Ujung pada MAIN"
            value={main}
            disabled={locked}
            onChange={(e) => {
              changeDraft({ main: Number(e.target.value) as EndIndex })
              setStep(-1)
              setDone(false)
              setPlugged([false, false])
              scan.current = null
            }}
          >
            <option value="0">Ujung 1</option>
            <option value="1">Ujung 2</option>
          </select>
        </label>
      </div>
      <Field
        label="Menurutmu, apa hasil testernya nanti?"
        value={prediction}
        onChange={(prediction) => changeDraft({ prediction })}
        disabled={locked}
        placeholder="Kami menduga tester akan menunjukkan…"
        rows={2}
      />
      {!cable.ends.every((end) => end.crimped) && (
        <p className="notice amber">Pasang dan crimp kedua konektor di workshop sebelum menguji.</p>
      )}
      <div className="button-row">
        <Button disabled={!ready || locked} onClick={start}>
          {done ? <RotateCcw size={16} /> : <Play size={16} />}{' '}
          {done ? 'Uji ulang' : 'Mulai pengujian'}
        </Button>
        {manual && step >= 0 && !done && (
          <Button variant="secondary" onClick={next} disabled={!ready}>
            <SkipForward size={16} />
            {step === 7 ? 'Simpan pengamatan' : 'Pin berikutnya'}
          </Button>
        )}
        {!manual && step >= 0 && !done && (
          <Button variant="secondary" onClick={() => setRunning(!running)}>
            {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Jeda' : 'Lanjutkan'}
          </Button>
        )}
        {done && <Pill tone="success">8 pin telah diamati</Pill>}
      </div>
      {historical && (
        <p className="saved-test-context" role="status">
          Hasil tersimpan · rev {savedRun.revision} · MAIN Ujung {savedRun.main + 1} → REMOTE Ujung{' '}
          {savedRun.main === 0 ? 2 : 1}
        </p>
      )}
      {historical && savedRun.main !== main && (
        <p className="fine-print">
          Konfigurasi uji berikutnya memakai MAIN Ujung {main + 1}. Tabel di bawah tetap merupakan
          hasil tersimpan dengan arah yang tercantum di atas.
        </p>
      )}
      {step >= 0 && (
        <p className="saved-test-context">
          Pengukuran ini · MAIN Ujung {(scan.current?.main ?? main) + 1} → REMOTE Ujung{' '}
          {(scan.current?.main ?? main) === 0 ? 2 : 1}
        </p>
      )}
      <WireMapTable map={displayMap} count={count} />
      <p className="fine-print">
        Tester ini memodelkan kontinuitas. Tidak mengukur bandwidth, NEXT, panjang, atau mendeteksi
        split pair.
      </p>
    </div>
  )
}
