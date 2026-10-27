import { ArrowRight, Check, ClipboardCheck, Eye, Wrench } from 'lucide-react'
import { CASES } from '../content'
import { evaluateCable } from '../domain/cable'
import type { CaseId } from '../domain/cable'
import {
  allCasesComplete,
  canNavigate,
  caseCompleted,
  latestTest,
  readingCorrect,
} from '../domain/session'
import type { Diagnosis } from '../domain/session'
import { TesterDevice } from '../components/Tester'
import { LabScene } from '../components/LabScene'
import { Button, Field, Panel, Pill, ScreenTitle, useGame } from '../ui'

export function Testing() {
  const { state, dispatch, notify } = useGame()
  const id = state.activeCase,
    cable = state.cables[id],
    ticket = CASES.find((c) => c.id === id)!
  const current = latestTest(state, id, true),
    previous = latestTest(state, id),
    evaluation = evaluateCable(cable)
  const before = state.tests.find(
    (test) => test.caseId === id && !evaluateCable(test.snapshot).pass,
  )
  const draft = state.repairDrafts[id],
    interpreted = !!current?.observation.trim()
  const complete = caseCompleted(state, id)
  function select(id: CaseId) {
    dispatch({ type: 'selectCase', id })
  }
  return (
    <>
      <ScreenTitle
        eyebrow="MISI 03 / CABLE TESTING & REPAIR"
        title="Biarkan hasil pengukuran berbicara."
        right={
          <Pill>
            {CASES.filter((c) => caseCompleted(state, c.id)).length}/{CASES.length} pekerjaan
          </Pill>
        }
      >
        Tulis dugaanmu, jalankan tester, lalu baca hasilnya. Gunakan hasil itu untuk memilih
        perbaikan.
      </ScreenTitle>
      <div className="case-tabs" role="group" aria-label="Pilih kabel untuk diuji">
        {CASES.map((item) => (
          <button
            className={id === item.id ? 'active' : ''}
            aria-pressed={id === item.id}
            key={item.id}
            onClick={() => select(item.id)}
          >
            <span>{item.code}</span>
            <strong>{item.label}</strong>
            {caseCompleted(state, item.id) && <Check size={17} />}
          </button>
        ))}
      </div>
      <div className="testing-layout">
        <Panel className="tester-panel">
          <div className="panel-title">
            <h2>{ticket.label}</h2>
            <Pill>REV {cable.revision}</Pill>
          </div>
          <p>{ticket.description}</p>
          {previous && !current && (
            <div className="notice amber">
              Kabel telah berubah. Hasil revisi {previous.revision} tersimpan sebagai riwayat;
              lakukan pengujian baru.
            </div>
          )}
          <TesterDevice
            key={`${id}-${cable.revision}`}
            cable={cable}
            reducedMotion={state.settings.reducedMotion}
            savedRun={current}
            draft={state.testerDrafts[id]}
            onDraftChange={(draft) => dispatch({ type: 'testerDraft', caseId: id, draft })}
            onComplete={(main, prediction) => {
              dispatch({ type: 'test', caseId: id, revision: cable.revision, main, prediction })
              notify('Hasil 8 pin sudah disimpan. Tuliskan apa yang kamu lihat pada tester.')
            }}
          />
        </Panel>
        <aside>
          <Panel>
            <span className="eyebrow">CATATAN TEKNISI</span>
            <h2>Ukur dahulu. Jelaskan kemudian.</h2>
            <ol className="numbered-list">
              <li>Pasang MAIN dan REMOTE.</li>
              <li>Nyalakan tester dan tulis dugaan hasilnya.</li>
              <li>Jalankan pemindaian delapan pin.</li>
              <li>Catat hasil yang berbeda dari dugaanmu.</li>
              <li>Periksa konektor, perbaiki, lalu uji lagi.</li>
            </ol>
            <div className="notice">
              <Eye size={18} />
              <span>
                Tester menunjukkan hubungan pin. Hasil open belum menentukan ujung mana yang
                bermasalah.
              </span>
            </div>
          </Panel>
          <Panel className="link-preview">
            <span className="eyebrow">MODEL KONEKSI PC</span>
            <LabScene key={`${id}-${evaluation.link}`} live={evaluation.link} compact />
            <div className="link-status">
              <span className={`status-dot ${evaluation.link ? 'green' : 'amber'}`} />
              <strong>
                {evaluation.link ? 'Jalur TX/RX terhubung' : 'Jalur TX/RX belum sesuai'}
              </strong>
            </div>
            <p>
              Link 10/100 hanya menggunakan pin 1, 2, 3, dan 6. Periksa tetap seluruh delapan pin.
            </p>
            <p className="fine-print">
              Indikator ini model sederhana; bukan pengujian bandwidth, IP, atau kualitas sinyal.
            </p>
          </Panel>
        </aside>
      </div>
      {current && (
        <Panel>
          <div className="panel-title">
            <ClipboardCheck size={19} />
            <h2>Baca hasil pengukuran</h2>
            <Pill>REV {current.revision}</Pill>
          </div>
          <Field
            label="Apa yang terlihat pada tester?"
            value={current.observation}
            onChange={(value) => dispatch({ type: 'observation', id: current.id, value })}
            placeholder="MAIN pin … terhubung ke REMOTE pin … Ada pin yang tidak tersambung?"
          />
          <label className="field">
            MAIN pin {current.readingPin} terhubung ke pin berapa di REMOTE?
            <select
              value={current.readingAnswer}
              onChange={(e) => dispatch({ type: 'reading', id: current.id, value: e.target.value })}
            >
              <option value="">Pilih berdasarkan pengamatan…</option>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i} value={String(i + 1)}>
                  REMOTE pin {i + 1}
                </option>
              ))}
              <option value="open">Tidak ada sambungan</option>
            </select>
          </label>
          {current.readingAnswer && (
            <p className={readingCorrect(current) ? 'text-success' : 'text-amber'}>
              {readingCorrect(current)
                ? 'Pembacaan sesuai pengamatan tester.'
                : 'Tinjau lagi baris pin sumber tersebut pada tabel pengamatan.'}
            </p>
          )}
          {interpreted && (
            <div className="validation-grid">
              <div className={evaluation.continuity ? 'good' : 'attention'}>
                <span>Sambungan pin (kontinuitas)</span>
                <strong>
                  {evaluation.continuity ? '8 jalur tersambung' : 'Ada jalur terbuka'}
                </strong>
              </div>
              <div className={evaluation.crossover ? 'good' : 'attention'}>
                <span>Peta crossover</span>
                <strong>{evaluation.crossover ? 'Sesuai kebutuhan' : 'Perlu diperiksa'}</strong>
              </div>
              <div className={evaluation.standardMatch ? 'good' : 'attention'}>
                <span>Inspeksi susunan digital</span>
                <strong>
                  {evaluation.standardMatch ? 'A–B / B–A sesuai' : 'Belum sesuai standar'}
                </strong>
              </div>
              <div className={evaluation.workmanship ? 'good' : 'attention'}>
                <span>Inspeksi pemasangan</span>
                <strong>
                  {evaluation.workmanship ? 'Sesuai model latihan' : 'Perlu diperiksa'}
                </strong>
              </div>
            </div>
          )}
          {interpreted && (
            <p className={`notice ${evaluation.pass ? 'success' : 'amber'}`}>
              {evaluation.pass
                ? 'Kabel memenuhi spesifikasi latihan pada revisi ini. Jelaskan hasilnya dalam laporan.'
                : 'Ada persyaratan yang belum terpenuhi. Bandingkan pengamatan, inspeksi konektor, dan referensi sebelum memperbaiki.'}
            </p>
          )}
          <p className="fine-print">
            Kesesuaian susunan dan pemasangan berasal dari inspeksi model digital, terpisah dari
            pengukuran kontinuitas tester.
          </p>
        </Panel>
      )}
      <Panel>
        <div className="panel-title">
          <Wrench size={19} />
          <h2>Temukan masalah & perbaiki</h2>
          {complete && <Pill tone="success">Pekerjaan terdokumentasi</Pill>}
        </div>
        <div className="two-column">
          <div>
            <label className="field">
              Masalah apa yang kamu temukan?
              <select
                value={draft.diagnosis}
                onChange={(e) =>
                  dispatch({
                    type: 'repairDraft',
                    draft: { ...draft, diagnosis: e.target.value as Diagnosis },
                  })
                }
              >
                <option value="">Pilih setelah membaca bukti…</option>
                <option value="open">Pin tidak tersambung (open)</option>
                <option value="miswire">Pin menuju tujuan yang salah (miswire)</option>
                <option value="straight">Kabel lurus belum cocok untuk kasus ini</option>
                <option value="workmanship">Kondisi pemasangan</option>
                <option value="correct">Kabel sudah sesuai dalam simulasi</option>
              </select>
            </label>
            <Field
              label="Apa buktinya?"
              value={draft.evidence}
              onChange={(evidence) =>
                dispatch({ type: 'repairDraft', draft: { ...draft, evidence } })
              }
              placeholder="Kami melihat pin … pada tester. Saat konektor diperiksa, …"
            />
          </div>
          <div>
            <label className="field">
              Bagaimana cara memperbaikinya?
              <select
                value={draft.action}
                onChange={(e) =>
                  dispatch({ type: 'repairDraft', draft: { ...draft, action: e.target.value } })
                }
              >
                <option value="">Pilih tindakan…</option>
                <option value="reterminate">
                  Potong konektor, pasang yang baru, lalu uji lagi
                </option>
                <option value="recrimp">Tekan kembali konektor tanpa mengubah susunan</option>
                <option value="ignore">Gunakan karena indikator link menyala</option>
                <option value="none">Tidak perlu perbaikan</option>
              </select>
            </label>
            <Field
              label="Apa yang berubah setelah diperbaiki? Mengapa?"
              value={draft.explanation}
              onChange={(explanation) =>
                dispatch({ type: 'repairDraft', draft: { ...draft, explanation } })
              }
              placeholder="Sebelumnya … Setelah diperbaiki … Ini terjadi karena …"
            />
          </div>
        </div>
        {id !== 'own' && !previous && (
          <p className="fine-print">
            Lakukan pengukuran awal tiket ini sebelum membuka workshop, agar hasil sebelum dan
            sesudah dapat dibandingkan.
          </p>
        )}
        <div className="button-row">
          <Button
            variant="secondary"
            disabled={!canNavigate(state, 'workshop')}
            onClick={() => dispatch({ type: 'navigate', screen: 'workshop' })}
          >
            <Eye size={16} />
            Inspeksi / perbaiki di workshop
          </Button>
          <Button
            disabled={
              !current ||
              !interpreted ||
              !draft.diagnosis ||
              !draft.action ||
              !draft.evidence.trim() ||
              !draft.explanation.trim() ||
              (id !== 'own' && !before)
            }
            onClick={() => {
              if (!current) return
              dispatch({
                type: 'repair',
                repair: {
                  ...draft,
                  caseId: id,
                  beforeTestId: before?.id ?? current.id,
                  afterTestId: current.id,
                },
              })
              const message = !evaluation.pass
                ? 'Catatan disimpan. Kabel masih perlu diperbaiki. Periksa hasil tester dan kedua konektor.'
                : id !== 'own' && draft.diagnosis !== id
                  ? 'Catatan disimpan. Apakah masalah pilihanmu cocok dengan hasil tester awal?'
                  : id !== 'own' && draft.action !== 'reterminate'
                    ? 'Catatan disimpan. Apakah cara itu bisa memperbaiki posisi konduktor di konektor yang sudah di-crimp?'
                    : id !== 'own' && before?.revision === current.revision
                      ? 'Catatan disimpan. Uji kembali kabel setelah diperbaiki.'
                      : !readingCorrect(current)
                        ? 'Catatan disimpan. Periksa lagi jawaban pin pada tabel tester.'
                        : 'Masalah, perbaikan, dan hasil uji sudah dicatat.'
              notify(message)
            }}
          >
            Simpan kesimpulan
          </Button>
        </div>
        {state.repairs.filter((r) => r.caseId === id).length > 0 && (
          <p className="fine-print">
            {state.repairs.filter((r) => r.caseId === id).length} catatan diagnosis tersimpan.
            Riwayat tetap tersedia dalam laporan.
          </p>
        )}
      </Panel>
      {allCasesComplete(state) && (
        <div className="success-banner">
          <div>
            <Pill tone="success">PEKERJAAN SELESAI</Pill>
            <h2>Koneksi yang dapat kamu jelaskan.</h2>
            <p>
              Seluruh {CASES.length} pekerjaan memiliki bukti. Siapkan praktik fisik dan
              presentasikan hasil kelompokmu.
            </p>
          </div>
          <Button onClick={() => dispatch({ type: 'navigate', screen: 'report' })}>
            Susun laporan
            <ArrowRight size={17} />
          </Button>
        </div>
      )}
      <div className="screen-footer">
        <span>Hasil terbaru dan riwayat tetap tersimpan di jurnal sesi.</span>
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: 'navigate', screen: 'report' })}
        >
          Lihat laporan sementara
          <ArrowRight size={17} />
        </Button>
      </div>
    </>
  )
}
