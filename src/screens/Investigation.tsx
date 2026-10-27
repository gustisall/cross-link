import { useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  Search,
  Wrench,
} from 'lucide-react'
import { CAPABILITIES, decisionFeedback, EVIDENCE, TOOLS } from '../content'
import { assembledCable } from '../domain/cable'
import { evidenceReady, workshopUnlocked } from '../domain/session'
import { LabScene } from '../components/LabScene'
import { TesterDevice } from '../components/Tester'
import { Button, Dialog, Field, NextButton, Panel, Pill, ScreenTitle, useGame } from '../ui'

const existing = assembledCable('T568B', 'T568B')
export function Investigation() {
  const { state, dispatch, notify } = useGame()
  const [inspect, setInspect] = useState<string | null>(null),
    [tested, setTested] = useState(false)
  const [toolIndex, setToolIndex] = useState(0),
    [capability, setCapability] = useState('')
  const tool = TOOLS[toolIndex],
    toolKnown = !!state.toolAnswers[tool.id]
  const toolsFound = Object.keys(state.toolAnswers).length
  const savedDecision = state.decisions.at(-1)
  const feedback = savedDecision
    ? decisionFeedback(savedDecision.choice, savedDecision.evidence)
    : null
  function collect(id: string) {
    dispatch({ type: 'evidence', id })
    notify('Bukti ditambahkan ke jurnal kelompok.')
  }
  return (
    <>
      <ScreenTitle
        eyebrow="MISI 01 / INVESTIGASI"
        title="Cari bukti. Jangan buru-buru menyimpulkan."
        right={<Pill tone="success">{state.evidence.length}/3 bukti</Pill>}
      >
        Periksa kondisi perangkat, kenali perlengkapan, dan uji kabel yang sudah tersedia.
      </ScreenTitle>
      <div className="investigation-layout">
        <div>
          <LabScene onInspect={setInspect} />
          <div className="scene-actions">
            <Button variant="secondary" onClick={() => setInspect('devices')}>
              <Cpu size={16} />
              Periksa perangkat
            </Button>
            <Button variant="secondary" onClick={() => setInspect('existing')}>
              <Search size={16} />
              Uji kabel tersedia
            </Button>
          </div>
        </div>
        <Panel className="mission-note">
          <span className="eyebrow">CATATAN PENYELIDIKAN</span>
          <h2>Apa yang sudah kamu temukan?</h2>
          <div className="evidence-checks">
            {EVIDENCE.map((item) => (
              <div key={item.id} className={state.evidence.includes(item.id) ? 'found' : ''}>
                <CheckCircle2 size={18} />
                <span>
                  {item.title}
                  <small>
                    {state.evidence.includes(item.id) ? 'Tercatat di jurnal' : 'Belum diperiksa'}
                  </small>
                </span>
              </div>
            ))}
          </div>
          <div className="note-divider" />
          <p className="fine-print">
            Satu hasil pengamatan bisa mengubah dugaan. Catat sumbernya agar alasanmu dapat
            ditelusuri.
          </p>
        </Panel>
      </div>
      <Panel className="tool-section">
        <div className="panel-title">
          <Wrench size={19} />
          <h2>Kenali perlengkapanmu</h2>
          <Pill>{toolsFound}/6 teridentifikasi</Pill>
        </div>
        <p>Amati contoh fisiknya. Pilih fungsi yang dapat dilakukan alat tersebut.</p>
        <div className="tool-tabs">
          {TOOLS.map((item, index) => (
            <button
              key={item.id}
              className={toolIndex === index ? 'active' : ''}
              onClick={() => {
                setToolIndex(index)
                setCapability('')
              }}
              aria-label={`Periksa perlengkapan ${index + 1}`}
              aria-pressed={toolIndex === index}
            >
              <img src={item.photo} alt="" />
              <span>{state.toolAnswers[item.id] ? item.name : `Perlengkapan ${item.code}`}</span>
              {state.toolAnswers[item.id] && <Check size={15} />}
            </button>
          ))}
        </div>
        <div className="tool-inspector" key={tool.id}>
          <div className="tool-photo">
            <img src={tool.photo} alt={tool.cue} />
            <span>CONTOH FISIK · {tool.code}</span>
          </div>
          <div>
            <span className="eyebrow">INSPEKSI PERLENGKAPAN {tool.code}</span>
            <h3>{toolKnown ? tool.name : 'Apa fungsi perlengkapan ini?'}</h3>
            <p>{tool.cue}</p>
            <label className="field">
              Pilih fungsi
              <select value={capability} onChange={(e) => setCapability(e.target.value)}>
                <option value="">Pilih berdasarkan pengamatan…</option>
                {CAPABILITIES.map((cap) => (
                  <option value={cap.id} key={cap.id}>
                    {cap.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="secondary"
              disabled={!capability}
              onClick={() => {
                const correct = tool.capabilities.includes(capability)
                dispatch({ type: 'tool', tool: tool.id, capability, correct })
                notify(
                  correct
                    ? 'Fungsi sesuai dengan kemampuan perlengkapan ini.'
                    : 'Fungsi tersebut belum sesuai. Perhatikan bagian kerja alat dan coba lagi.',
                )
              }}
            >
              <ClipboardCheck size={16} />
              Periksa pilihan
            </Button>
            {toolKnown && (
              <div className="tool-answer">
                <CheckCircle2 size={18} />
                <p>{tool.detail}</p>
              </div>
            )}
            <p className="fine-print">
              Foto berlisensi terbuka. Atribusi tersedia pada menu “Sumber & panduan”.
            </p>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="panel-title">
          <ClipboardCheck size={19} />
          <h2>Ajukan dugaan untuk diuji</h2>
        </div>
        <p>
          Gunakan bukti untuk memilih kabel. Dugaan awal boleh keliru; hasil pengujian akan
          membantumu meninjaunya.
        </p>
        <div className="two-column">
          <div>
            <label className="field">
              Kabel mana yang kamu pilih?
              <select
                value={state.decisionDraft.choice}
                onChange={(e) =>
                  dispatch({
                    type: 'decisionDraft',
                    draft: { ...state.decisionDraft, choice: e.target.value },
                  })
                }
              >
                <option value="">Pilih jenis kabel…</option>
                <option value="straight">Straight-through</option>
                <option value="crossover">Crossover</option>
                <option value="rollover">Rollover</option>
              </select>
            </label>
            <Field
              label="Mengapa memilih kabel itu?"
              value={state.decisionDraft.reason}
              onChange={(reason) =>
                dispatch({ type: 'decisionDraft', draft: { ...state.decisionDraft, reason } })
              }
              placeholder="Kami memilih kabel ini karena…"
            />
          </div>
          <div>
            <h3>Hubungkan minimal dua bukti</h3>
            {EVIDENCE.map((item) => (
              <label className="check-control evidence-choice" key={item.id}>
                <input
                  type="checkbox"
                  disabled={!state.evidence.includes(item.id)}
                  checked={state.decisionDraft.evidence.includes(item.id)}
                  onChange={(e) =>
                    dispatch({
                      type: 'decisionDraft',
                      draft: {
                        ...state.decisionDraft,
                        evidence: e.target.checked
                          ? [...state.decisionDraft.evidence, item.id]
                          : state.decisionDraft.evidence.filter((id) => id !== item.id),
                      },
                    })
                  }
                />
                <span>
                  {item.title}
                  <small>
                    {state.evidence.includes(item.id)
                      ? item.text
                      : 'Kumpulkan melalui pemeriksaan terlebih dahulu.'}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="button-row">
          <Button
            variant="secondary"
            disabled={
              !evidenceReady(state) ||
              !state.decisionDraft.choice ||
              !state.decisionDraft.reason.trim() ||
              state.decisionDraft.evidence.length < 2
            }
            onClick={() => {
              dispatch({ type: 'decision' })
              notify(
                decisionFeedback(state.decisionDraft.choice, state.decisionDraft.evidence).message,
              )
            }}
          >
            Simpan {state.decisions.length ? 'revisi dugaan' : 'dugaan'}
          </Button>
          {state.decisions.length > 0 && (
            <Pill tone="success">{state.decisions.length} keputusan tercatat</Pill>
          )}
        </div>
        {feedback && (
          <div className={`notice ${feedback.tone}`} role="status">
            <div>
              <strong>{feedback.title}</strong>
              <p>{feedback.message}</p>
            </div>
          </div>
        )}
      </Panel>
      <div className="screen-footer">
        <span>
          {workshopUnlocked(state)
            ? 'Bukti dan pengenalan alat lengkap. Rotasikan peran sebelum lanjut.'
            : 'Kumpulkan 3 bukti, identifikasi 6 perlengkapan, dan simpan dugaan.'}
        </span>
        <NextButton
          disabled={!workshopUnlocked(state)}
          onClick={() => dispatch({ type: 'navigate', screen: 'workshop' })}
        >
          Buka Cable Workshop
        </NextButton>
      </div>
      {inspect === 'devices' && (
        <Dialog title="Inspeksi perangkat laboratorium" onClose={() => setInspect(null)} wide>
          <div className="device-compare">
            <table>
              <thead>
                <tr>
                  <th>Pemeriksaan</th>
                  <th>PC-01</th>
                  <th>PC-02</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Daya</th>
                  <td>Menyala</td>
                  <td>Menyala</td>
                </tr>
                <tr>
                  <th>NIC</th>
                  <td>Aktif</td>
                  <td>Aktif</td>
                </tr>
                <tr>
                  <th>Link</th>
                  <td>Belum aktif</td>
                  <td>Belum aktif</td>
                </tr>
                <tr>
                  <th>Ethernet</th>
                  <td>10BASE-T / 100BASE-TX</td>
                  <td>10BASE-T / 100BASE-TX</td>
                </tr>
                <tr>
                  <th>Tipe port</th>
                  <td>MDI</td>
                  <td>MDI</td>
                </tr>
                <tr>
                  <th>Auto-MDI/MDIX</th>
                  <td>Tidak tersedia</td>
                  <td>Tidak tersedia</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Kedua perangkat memakai port Ethernet lama. Catat kondisi operasi dan spesifikasinya
            sebagai dua bukti yang berbeda.
          </p>
          <div className="button-row">
            <Button onClick={() => collect('power')} disabled={state.evidence.includes('power')}>
              Catat kondisi perangkat
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => collect('ports')}
              disabled={state.evidence.includes('ports')}
            >
              Catat spesifikasi port
            </Button>
          </div>
        </Dialog>
      )}
      {inspect === 'existing' && (
        <Dialog title="Pemeriksaan kabel tersedia" onClose={() => setInspect(null)} wide>
          <p>
            Kedua konektor terpasang dan kondisi luar kabel tampak utuh. Gunakan tester untuk
            mencari bukti kontinuitas.
          </p>
          <TesterDevice
            cable={existing}
            reducedMotion={state.settings.reducedMotion}
            onComplete={() => setTested(true)}
          />
          <Button
            disabled={!tested || state.evidence.includes('existing')}
            onClick={() => collect('existing')}
          >
            {state.evidence.includes('existing')
              ? 'Bukti sudah tercatat'
              : 'Catat hasil pengukuran sebagai bukti'}
          </Button>
        </Dialog>
      )}
    </>
  )
}
