import {
  ArrowRight,
  Cable,
  Check,
  ClipboardList,
  FlaskConical,
  FolderInput,
  Monitor,
  Users,
} from 'lucide-react'
import { LabScene } from '../components/LabScene'
import { boardReady } from '../domain/session'
import { SCHEDULE } from '../content'
import { Button, Field, NextButton, Panel, Pill, ScreenTitle, useGame } from '../ui'

export function Welcome({ onImport }: { onImport: () => void }) {
  const { state, dispatch } = useGame()
  return (
    <div className="welcome-screen">
      <div className="welcome-top">
        <Pill tone="success">
          <span className="status-dot green" />
          LABORATORIUM VIRTUAL
        </Pill>
        <span className="mono">SMK / KELAS X</span>
      </div>
      <div className="welcome-hero">
        <div>
          <div className="eyebrow">SEBUAH KASUS. DELAPAN KONDUKTOR.</div>
          <h1 tabIndex={-1}>
            Link terputus.
            <br />
            <span>Kamu teknisinya.</span>
          </h1>
          <p>
            Dua komputer lama. Satu koneksi yang belum bekerja. Selidiki masalahnya, bangun kabelmu,
            dan buktikan solusinya.
          </p>
          <div className="hero-meta">
            <span>
              <Users size={16} />
              2–3 teknisi
            </span>
            <span>
              <FlaskConical size={16} />
              Belajar lewat penyelidikan
            </span>
          </div>
        </div>
        <div className="hero-ticket">
          <span className="ticket-pin" />
          <span className="eyebrow">PERMINTAAN TUGAS</span>
          <strong>LAB–001</strong>
          <p>“Komputer menyala, tetapi keduanya belum terhubung.”</p>
          <div>
            <span className="status-dot amber" />
            Menunggu investigasi
          </div>
        </div>
      </div>
      <LabScene />
      <div className="start-grid">
        <Panel>
          <div className="panel-title">
            <Users size={19} />
            <h2>Siapkan tim teknisi</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              dispatch({ type: 'start' })
            }}
          >
            <label className="field">
              Nama kelompok
              <input
                required
                maxLength={80}
                value={state.group}
                onChange={(e) =>
                  dispatch({ type: 'group', group: e.target.value, members: state.members })
                }
              />
            </label>
            <div className="member-fields">
              {state.members.map((member, index) => (
                <label className="field" key={index}>
                  Alias teknisi {index + 1}
                  <input
                    required
                    maxLength={60}
                    value={member}
                    onChange={(e) =>
                      dispatch({
                        type: 'group',
                        group: state.group,
                        members: state.members.map((v, i) => (i === index ? e.target.value : v)),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="button-row">
              <Button type="submit">
                {state.started ? 'Buka kembali kasus' : 'Mulai investigasi'}
                <ArrowRight size={17} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  dispatch({
                    type: 'group',
                    group: state.group,
                    members:
                      state.members.length === 2
                        ? [...state.members, 'Teknisi 03']
                        : state.members.slice(0, 2),
                  })
                }
              >
                {state.members.length === 2 ? '+ Teknisi ketiga' : 'Gunakan dua teknisi'}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel className="start-note">
          <ClipboardList size={24} />
          <h2>Ruang untuk mencoba.</h2>
          <p>
            Tidak ada hitung mundur atau penalti kesalahan. Catat bukti, uji dugaan, dan perbaiki
            pekerjaanmu.
          </p>
          <p className="fine-print">
            Sesi tersimpan di browser ini. Ekspor untuk berpindah komputer. Praktik fisik tetap
            dinilai guru.
          </p>
          <Button variant="secondary" onClick={onImport}>
            <FolderInput size={16} />
            Impor sesi kelompok
          </Button>
        </Panel>
      </div>
    </div>
  )
}
export function Briefing() {
  const { dispatch } = useGame()
  return (
    <>
      <ScreenTitle
        eyebrow="FASE PBL 01 / ORIENTASI MASALAH"
        title="Sebuah koneksi yang belum bekerja."
      >
        Baca permintaan laboratorium. Mulailah dari pertanyaan, lalu cari bukti.
      </ScreenTitle>
      <LabScene />
      <div className="two-column">
        <Panel>
          <Pill>BRIEF TEKNISI · LAB–001</Pill>
          <h2>Hubungkan dua komputer secara langsung.</h2>
          <p>
            PC-01 dan PC-02 akan dipakai untuk koneksi Ethernet langsung. Ketika kabel yang tersedia
            dipasang, indikator link keduanya tidak aktif.
          </p>
          <blockquote>
            “Periksa perangkat dan perlengkapannya. Tentukan kabel yang dibutuhkan, buat, lalu
            tunjukkan bukti bahwa pekerjaanmu sesuai.”
          </blockquote>
          <p>
            Jangan menyimpulkan penyebab hanya dari lampu link. Ada informasi pada perangkat dan
            kabel yang perlu kamu temukan.
          </p>
          <NextButton onClick={() => dispatch({ type: 'navigate', screen: 'board' })}>
            Susun rencana penyelidikan
          </NextButton>
        </Panel>
        <Panel>
          <div className="panel-title">
            <Monitor size={19} />
            <h2>Hasil pekerjaanmu</h2>
          </div>
          <ul className="check-list">
            <li>
              <Check />
              Bukti pemeriksaan perangkat dan alat
            </li>
            <li>
              <Check />
              Dugaan dan alasan pemilihan kabel
            </li>
            <li>
              <Check />
              Dua terminasi serta hasil tester
            </li>
            <li>
              <Check />
              Diagnosis, perbaikan, dan laporan
            </li>
          </ul>
          <div className="notice">
            <Cable size={18} />
            <span>
              Simulasi mempersiapkan praktik. Keterampilan pemasangan konektor dinilai langsung oleh
              guru.
            </span>
          </div>
        </Panel>
      </div>
    </>
  )
}
export function CaseBoard() {
  const { state, dispatch } = useGame()
  const rotation = state.screen === 'board' ? 0 : 1
  return (
    <>
      <ScreenTitle
        eyebrow="FASE PBL 02 / MENGORGANISASIKAN PENYELIDIKAN"
        title="Mulai dari dugaan sederhana."
      >
        Diskusikan bersama. Jawaban singkat boleh; kamu bisa mengubahnya setelah menemukan bukti.
      </ScreenTitle>
      <div className="case-board">
        <div className="board-column">
          <span className="board-number">01 / DUGAAN</span>
          <Field
            label="Menurutmu, mengapa kedua PC belum terhubung?"
            value={state.board.hypothesis}
            onChange={(value) => dispatch({ type: 'board', field: 'hypothesis', value })}
            placeholder="Kami menduga masalahnya ada pada…"
            rows={6}
          />
        </div>
        <div className="board-column">
          <span className="board-number">02 / PERTANYAAN</span>
          <Field
            label="Apa yang ingin kamu cari tahu?"
            value={state.board.questions}
            onChange={(value) => dispatch({ type: 'board', field: 'questions', value })}
            placeholder="Kami ingin tahu apakah…"
            rows={6}
          />
        </div>
        <div className="board-column">
          <span className="board-number">03 / RENCANA</span>
          <Field
            label="Apa yang akan kamu periksa lebih dulu?"
            value={state.board.plan}
            onChange={(value) => dispatch({ type: 'board', field: 'plan', value })}
            placeholder="Pertama, kami akan memeriksa…"
            rows={6}
          />
        </div>
      </div>
      <Panel>
        <div className="panel-title">
          <Users size={19} />
          <h2>Setiap teknisi memiliki peran</h2>
          <Pill>BERGILIR SETIAP MISI</Pill>
        </div>
        <div className="role-grid">
          {['Operator', 'Analis', 'Pencatat / penguji'].map((role, i) => (
            <div key={role}>
              <span className="role-avatar">{i + 1}</span>
              <div>
                <strong>{role}</strong>
                <p>
                  {state.members[(i + rotation) % state.members.length]}
                  {state.members.length === 2 && i === 2 ? ' · peran rangkap' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div className="two-column schedule">
        {SCHEDULE.map(([title, description]) => (
          <Panel key={title}>
            <h3>
              {title} <span>90 menit</span>
            </h3>
            <p>{description}</p>
          </Panel>
        ))}
      </div>
      <div className="screen-footer">
        <span>Isi tiga catatan untuk membuka laboratorium.</span>
        <NextButton
          disabled={!boardReady(state)}
          onClick={() => dispatch({ type: 'navigate', screen: 'investigation' })}
        >
          Masuk laboratorium
        </NextButton>
      </div>
    </>
  )
}
