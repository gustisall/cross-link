import { ArrowRight, Check, Download, FileText, Printer, ShieldCheck, Users } from 'lucide-react'
import { CASES, EVIDENCE } from '../content'
import { evaluateCable, WIRE_INFO } from '../domain/cable'
import { allCasesComplete, caseCompleted, latestTest, readingCorrect } from '../domain/session'
import { exportSession } from '../domain/persistence'
import { Button, Field, Panel, Pill, ScreenTitle, useGame } from '../ui'

const mapText = (map: (number | null)[]) => map.map((pin, i) => `${i + 1}→${pin ?? '—'}`).join('  ')
const actionLabels: Record<string, string> = {
  reterminate: 'Potong dan terminasi ulang',
  recrimp: 'Tekan kembali konektor tanpa mengubah susunan',
  ignore: 'Gunakan karena indikator link menyala',
  none: 'Tidak perlu perbaikan',
}
const cableLabels: Record<string, string> = {
  straight: 'Straight-through',
  crossover: 'Crossover',
  rollover: 'Rollover',
}
export function Report() {
  const { state, dispatch } = useGame(),
    own = state.cables.own,
    evaluated = evaluateCable(own),
    decision = state.decisions.at(-1)
  const status = (attempted: boolean, passed: boolean) =>
    !attempted ? 'Belum dicoba' : passed ? 'Sesuai dalam simulasi' : 'Perlu diperbaiki'
  const tps = [
    [
      'TP1',
      'Fungsi perlengkapan',
      status(state.toolAttempts.length > 0, Object.keys(state.toolAnswers).length === 6),
    ],
    [
      'TP2',
      'Pemilihan jenis kabel',
      status(
        state.decisions.length > 0,
        decision?.choice === 'crossover' &&
          decision.evidence.includes('ports') &&
          decision.evidence.includes('existing'),
      ),
    ],
    [
      'TP3',
      'Susunan T568A / T568B',
      status(
        own.ends.some((e) => e.pins.some(Boolean)),
        evaluated.standardMatch && own.ends.every((e) => e.crimped),
      ),
    ],
    ['TP4', 'Pemasangan fisik konektor', 'Memerlukan observasi praktik fisik oleh guru'],
    [
      'TP5',
      'Pengujian dan pembacaan pin',
      status(
        state.tests.length > 0,
        state.tests.some((t) => t.observation.trim() && readingCorrect(t)),
      ),
    ],
    [
      'TP6',
      'Diagnosis dan perbaikan',
      status(
        state.tests.some((t) => t.caseId !== 'own'),
        CASES.filter((item) => item.id !== 'own').every((item) => caseCompleted(state, item.id)),
      ),
    ],
  ]
  return (
    <div className="report-screen">
      <ScreenTitle
        eyebrow="FASE PBL 04 / PENYAJIAN HASIL"
        title="Sebuah solusi, lengkap dengan buktinya."
        right={
          <div className="button-row no-print">
            <Button variant="secondary" onClick={() => exportSession(state)}>
              <Download size={16} />
              Ekspor sesi
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={16} />
              Cetak LKPD
            </Button>
          </div>
        }
      >
        Gunakan laporan ini untuk presentasi, diskusi, dan pengamatan praktik fisik.
      </ScreenTitle>
      <Panel>
        <div className="report-heading">
          <div>
            <span className="eyebrow">LAPORAN TEKNISI / LAB–001</span>
            <h2>{state.group}</h2>
            <p>{state.members.join(' · ')}</p>
          </div>
          <Pill tone={allCasesComplete(state) ? 'success' : 'amber'}>
            {allCasesComplete(state)
              ? `Bukti ${CASES.length} pekerjaan lengkap`
              : 'Laporan sementara'}
          </Pill>
        </div>
        <h3>Masalah</h3>
        <p>
          Dua komputer Ethernet 10/100 lama tanpa Auto-MDI/MDIX belum membentuk link melalui kabel
          tersedia.
        </p>
        <div className="two-column">
          <div>
            <h3>Dugaan awal</h3>
            <p className="preserve-lines">{state.board.hypothesis || 'Belum dicatat.'}</p>
            <h3>Rencana penyelidikan</h3>
            <p className="preserve-lines">{state.board.plan || 'Belum dicatat.'}</p>
          </div>
          <div>
            <h3>Informasi yang dicari</h3>
            <p className="preserve-lines">{state.board.questions || 'Belum dicatat.'}</p>
            <h3>Keputusan terbaru</h3>
            <p>
              <strong>
                {decision
                  ? (cableLabels[decision.choice] ?? decision.choice)
                  : 'Belum ada keputusan'}
              </strong>
            </p>
            <p className="preserve-lines">{decision?.reason || 'Alasan belum dicatat.'}</p>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="panel-title">
          <FileText size={19} />
          <h2>Bukti capaian pembelajaran</h2>
        </div>
        <div className="table-scroll">
          <table className="tp-table">
            <thead>
              <tr>
                <th>TP</th>
                <th>Tujuan</th>
                <th>Status bukti</th>
              </tr>
            </thead>
            <tbody>
              {tps.map(([tp, title, result]) => (
                <tr key={tp}>
                  <th>{tp}</th>
                  <td>{title}</td>
                  <td>
                    <span
                      className={`tp-result ${result === 'Sesuai dalam simulasi' ? 'success' : result === 'Belum dicoba' ? '' : 'amber'}`}
                    >
                      {result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine-print">
          Status otomatis berasal dari tindakan dan hasil terstruktur. Kualitas alasan bebas serta
          transfer ke alat nyata ditinjau guru. Bantuan tidak mengurangi nilai.
        </p>
      </Panel>
      <Panel>
        <h2>Jurnal bukti</h2>
        {state.evidence.length === 0 ? (
          <p>Belum ada bukti yang dikumpulkan.</p>
        ) : (
          EVIDENCE.filter((item) => state.evidence.includes(item.id)).map((item) => (
            <div className="report-evidence" key={item.id}>
              <Check size={17} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <small>Sumber: {item.source}</small>
              </div>
            </div>
          ))
        )}
      </Panel>
      <Panel>
        <h2>Susunan kabel kelompok · revisi {own.revision}</h2>
        <div className="two-column">
          {own.ends.map((end, index) => (
            <div key={index}>
              <h3>Ujung {index + 1}</h3>
              <p className="fine-print">
                Rencana: {end.intended} · Aktual:{' '}
                {evaluated.standards[index] ?? 'Belum sesuai standar'}
              </p>
              <ol className="report-wires">
                {end.pins.map((wire, pin) => (
                  <li key={pin}>{wire ? WIRE_INFO[wire].name : 'Kosong'}</li>
                ))}
              </ol>
              <p>
                Crimp: {end.crimped ? 'sudah' : 'belum'} · Jaket:{' '}
                {end.jacket ? 'masuk penjepit' : 'belum masuk penjepit'}
              </p>
            </div>
          ))}
        </div>
        <p>
          Konektor pengganti: {own.replacements}. Status kabel:{' '}
          {evaluated.pass ? 'memenuhi spesifikasi model latihan' : 'masih memerlukan pemeriksaan'}.
        </p>
      </Panel>
      {CASES.map((item) => {
        const runs = state.tests.filter((t) => t.caseId === item.id),
          first = runs[0],
          last = latestTest(state, item.id),
          repairs = state.repairs.filter((r) => r.caseId === item.id)
        return (
          <Panel key={item.id}>
            <div className="panel-title">
              <h2>
                {item.code} · {item.label}
              </h2>
              <Pill tone={caseCompleted(state, item.id) ? 'success' : ''}>
                {caseCompleted(state, item.id) ? 'Selesai' : 'Belum selesai'} · {runs.length}{' '}
                pengujian
              </Pill>
            </div>
            {!first ? (
              <p>Belum diuji.</p>
            ) : (
              <>
                <div className="map-comparison">
                  <div>
                    <span>Pengujian awal · rev {first.revision}</span>
                    <p className="fine-print">
                      MAIN Ujung {first.main + 1} → REMOTE Ujung {first.main === 0 ? 2 : 1}
                    </p>
                    <code>{mapText(first.map)}</code>
                    <p className="preserve-lines">Prediksi: {first.prediction}</p>
                    <p className="preserve-lines">
                      Pengamatan: {first.observation || 'Belum dicatat.'}
                    </p>
                  </div>
                  <div>
                    <span>
                      Pengujian terbaru · rev {last!.revision}
                      {last!.revision !== state.cables[item.id].revision ? ' · hasil lama' : ''}
                    </span>
                    <p className="fine-print">
                      MAIN Ujung {last!.main + 1} → REMOTE Ujung {last!.main === 0 ? 2 : 1}
                    </p>
                    <code>{mapText(last!.map)}</code>
                    <p className="preserve-lines">
                      Pengamatan: {last!.observation || 'Belum dicatat.'}
                    </p>
                    <p>
                      Pembacaan pin {last!.readingPin}: {last!.readingAnswer || 'belum dijawab'} ·{' '}
                      {readingCorrect(last!) ? 'sesuai' : 'perlu diperiksa'}
                    </p>
                  </div>
                </div>
                {repairs.map((repair, index) => (
                  <div className="repair-record" key={index}>
                    <h3>
                      Catatan diagnosis {index + 1}: {repair.diagnosis}
                    </h3>
                    <p className="preserve-lines">Bukti: {repair.evidence}</p>
                    <p>Tindakan: {actionLabels[repair.action] ?? repair.action}</p>
                    <p className="preserve-lines">Perubahan: {repair.explanation}</p>
                  </div>
                ))}
              </>
            )}
          </Panel>
        )
      })}
      <Panel>
        <h2>Perkembangan keputusan dan penggunaan bantuan</h2>
        {state.decisions.map((item, index) => (
          <div className="decision-history" key={index}>
            <strong>
              Keputusan {index + 1} · {cableLabels[item.choice] ?? item.choice}
            </strong>
            <p className="preserve-lines">{item.reason}</p>
            <small>
              Bukti:{' '}
              {item.evidence.map((id) => EVIDENCE.find((e) => e.id === id)?.title).join(', ')}
            </small>
          </div>
        ))}
        <p>
          {state.hints.length
            ? `${state.hints.length} pembukaan petunjuk: ${state.hints.map((hint) => `${hint.screen} tingkat ${hint.level}`).join('; ')}.`
            : 'Belum menggunakan petunjuk bertingkat.'}
        </p>
        <p>
          Identifikasi perlengkapan: {state.toolAttempts.length} percobaan. Tidak ada penalti
          percobaan atau durasi.
        </p>
      </Panel>
      <Panel className="physical-rubric">
        <div className="panel-title">
          <ShieldCheck size={20} />
          <h2>TP4 · Lembar observasi praktik fisik</h2>
        </div>
        <p>
          Guru mengamati setiap siswa saat praktik. Status virtual tidak menggantikan penilaian ini.
          Gunakan alat sesuai petunjuk produsen dan kebijakan keselamatan sekolah.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Aspek pengamatan</th>
                {state.members.map((member, i) => (
                  <th key={i}>{member}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                'Pemilihan dan penggunaan alat',
                'Keselamatan dan posisi tangan',
                'Pengupasan jaket tanpa merusak konduktor',
                'Urutan dan perataan konduktor',
                'Penyisipan penuh dan posisi jaket',
                'Penggunaan tang crimp',
                'Pemeriksaan serta pengujian akhir',
              ].map((aspect) => (
                <tr key={aspect}>
                  <td>{aspect}</td>
                  {state.members.map((_, i) => (
                    <td key={i}>
                      □ Perlu bimbingan
                      <br />□ Teramati sesuai
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="teacher-notes">
          Catatan guru / tindak lanjut: <br />
          <br />
          <br />
          Tanggal: __________________ &nbsp; Guru: __________________
        </div>
      </Panel>
      <Panel>
        <h2>Refleksi yang telah dicatat</h2>
        <h3>Perubahan dugaan</h3>
        <p className="preserve-lines">{state.reflections.group || 'Belum dicatat.'}</p>
        <h3>Link dan spesifikasi kabel</h3>
        <p className="preserve-lines">{state.reflections.link || 'Belum dicatat.'}</p>
        <h3>Persiapan praktik fisik</h3>
        <p className="preserve-lines">{state.reflections.physical || 'Belum dicatat.'}</p>
        {state.members.map((member, index) => (
          <div key={index}>
            <h3>{member}</h3>
            <p className="preserve-lines">
              {state.reflections.individual[index] || 'Refleksi individu belum dicatat.'}
            </p>
          </div>
        ))}
      </Panel>
      <div className="screen-footer no-print">
        <span>Presentasikan bukti, perubahan dugaan, dan keterbatasan pengujian.</span>
        <Button onClick={() => dispatch({ type: 'navigate', screen: 'reflection' })}>
          Evaluasi & refleksi
          <ArrowRight size={17} />
        </Button>
      </div>
    </div>
  )
}
export function Reflection() {
  const { state, dispatch } = useGame()
  return (
    <>
      <ScreenTitle
        eyebrow="FASE PBL 05 / ANALISIS & EVALUASI"
        title="Apa yang sudah kamu pelajari?"
      >
        Ingat kembali kegiatanmu. Tuliskan jawaban singkat untuk catatan belajar.
      </ScreenTitle>
      <Panel>
        <Field
          label="Apakah dugaan awalmu berubah? Apa buktinya?"
          value={state.reflections.group}
          onChange={(value) => dispatch({ type: 'reflection', field: 'group', value })}
        />
        <Field
          label="Lampu link menyala. Apa lagi yang perlu diperiksa pada delapan pin?"
          value={state.reflections.link}
          onChange={(value) => dispatch({ type: 'reflection', field: 'link', value })}
        />
        <Field
          label="Apa yang masih perlu kamu latih dengan alat asli?"
          value={state.reflections.physical}
          onChange={(value) => dispatch({ type: 'reflection', field: 'physical', value })}
        />
      </Panel>
      <Panel>
        <div className="panel-title">
          <Users size={20} />
          <h2>Refleksi individu</h2>
        </div>
        {state.members.map((member, index) => (
          <Field
            key={index}
            label={`${member}: apa yang kamu kerjakan dan masih ingin kamu latih?`}
            value={state.reflections.individual[index] ?? ''}
            onChange={(value) => dispatch({ type: 'individual', index, value })}
          />
        ))}
      </Panel>
      <div className="notice">
        <ShieldCheck size={20} />
        <span>
          Sesudah simulasi, lakukan praktik fisik dengan pengawasan guru. TP4 memerlukan observasi
          individual.
        </span>
      </div>
      <div className="screen-footer">
        <span>Refleksi tidak dinilai dengan pencocokan kata otomatis.</span>
        <Button onClick={() => dispatch({ type: 'navigate', screen: 'report' })}>
          Kembali ke laporan
          <ArrowRight size={17} />
        </Button>
      </div>
    </>
  )
}
