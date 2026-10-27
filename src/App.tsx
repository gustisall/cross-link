import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Cable,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  FolderInput,
  HelpCircle,
  Home,
  Leaf,
  Menu,
  MessageSquare,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { CASES, EVIDENCE, HINTS, SCHEDULE, TOOLS } from './content'
import { STANDARDS, WIRE_INFO } from './domain/cable'
import type { Standard } from './domain/cable'
import {
  allCasesComplete,
  boardReady,
  canNavigate,
  caseCompleted,
  createSession,
  sessionReducer,
  workshopUnlocked,
} from './domain/session'
import type { Screen, Session } from './domain/session'
import { exportSession, loadSession, parseSession, saveSession } from './domain/persistence'
import { WireSwatch } from './components/Connector'
import { Briefing, CaseBoard, Welcome } from './screens/Orientation'
import { Investigation } from './screens/Investigation'
import { Workshop } from './screens/Workshop'
import { Testing } from './screens/Testing'
import { Reflection, Report } from './screens/Reporting'
import { Button, Dialog, GameContext, Pill } from './ui'

type Overlay = 'reference' | 'journal' | 'hint' | 'settings' | 'sources' | 'new' | null
const NAV = [
  {
    id: 'brief' as Screen,
    title: 'Permintaan tugas',
    subtitle: 'Pahami masalah',
    icon: Home,
    number: '01',
  },
  {
    id: 'board' as Screen,
    title: 'Papan kasus',
    subtitle: 'Rencanakan penyelidikan',
    icon: ClipboardList,
    number: '02',
  },
  {
    id: 'investigation' as Screen,
    title: 'Investigasi',
    subtitle: 'Kumpulkan bukti',
    icon: SearchIcon,
    number: '03',
  },
  {
    id: 'workshop' as Screen,
    title: 'Cable Workshop',
    subtitle: 'Bangun kabelmu',
    icon: Wrench,
    number: '04',
  },
  {
    id: 'testing' as Screen,
    title: 'Testing & Repair',
    subtitle: 'Uji dan perbaiki',
    icon: Cable,
    number: '05',
  },
  {
    id: 'report' as Screen,
    title: 'Laporan teknisi',
    subtitle: 'Presentasikan hasil',
    icon: FileText,
    number: '06',
  },
  {
    id: 'reflection' as Screen,
    title: 'Refleksi',
    subtitle: 'Evaluasi prosesmu',
    icon: MessageSquare,
    number: '07',
  },
]
function SearchIcon({ size = 20 }: { size?: number }) {
  return <FlaskConical size={size} />
}
function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Cable size={24} />
      </span>
      <div>
        Cross<span>Link</span>
        <small>CABLE TECHNICIAN</small>
      </div>
    </div>
  )
}

export default function App() {
  const [initial] = useState(loadSession)
  const [state, dispatch] = useReducer(sessionReducer, initial.session ?? createSession())
  const [warning, setWarning] = useState(initial.warning),
    [toast, setToast] = useState(''),
    [overlay, setOverlay] = useState<Overlay>(null),
    [mobileNav, setMobileNav] = useState(false)
  const [pendingImport, setPendingImport] = useState<Session | null>(null),
    fileInput = useRef<HTMLInputElement>(null)
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 960px)').matches)
  const notify = useCallback((message: string) => setToast(message), [])
  useEffect(() => {
    if (state.started) setWarning(saveSession(state))
  }, [state])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 6500)
    return () => clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [state.screen])
  useEffect(() => {
    const media = matchMedia('(max-width: 960px)')
    const listener = () => {
      setNarrow(media.matches)
      if (!media.matches) setMobileNav(false)
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])
  useEffect(() => {
    if (!narrow || !mobileNav) return
    const previous = document.activeElement as HTMLElement | null
    const sidebar = document.getElementById('sidebar')
    sidebar?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNav(false)
      if (event.key === 'Tab') {
        const items = [
            ...(sidebar?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
          ],
          first = items[0],
          last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [narrow, mobileNav])
  const navigate = (screen: Screen) => {
    dispatch({ type: 'navigate', screen })
    setMobileNav(false)
  }
  const currentNav = NAV.find((item) => item.id === state.screen)
  const stage = ['workshop'].includes(state.screen)
    ? 1
    : ['testing', 'report', 'reflection'].includes(state.screen)
      ? 2
      : 0
  const roles = state.members.map(
    (_, index) => state.members[(index + stage) % state.members.length],
  )
  const failedTests = state.tests.filter(
    (test) =>
      test.caseId === state.activeCase &&
      test.map.some((pin, i) => pin !== [3, 6, 1, 4, 5, 2, 7, 8][i]),
  ).length
  function navDone(id: Screen) {
    return id === 'brief'
      ? boardReady(state)
      : id === 'board'
        ? boardReady(state)
        : id === 'investigation'
          ? workshopUnlocked(state)
          : id === 'workshop'
            ? state.cables.own.ends.every((e) => e.crimped)
            : id === 'testing'
              ? allCasesComplete(state)
              : id === 'reflection'
                ? !!state.reflections.group.trim() &&
                  !!state.reflections.link.trim() &&
                  !!state.reflections.physical.trim()
                : false
  }
  return (
    <GameContext.Provider value={{ state, dispatch, notify }}>
      <div className={`app ${state.settings.reducedMotion ? 'reduce-motion' : ''}`}>
        <a className="skip-link" href="#main-content">
          Lewati navigasi
        </a>
        <aside
          id="sidebar"
          className={`sidebar ${mobileNav ? 'is-open' : ''}`}
          inert={narrow && !mobileNav}
          role={narrow && mobileNav ? 'dialog' : undefined}
          aria-modal={narrow && mobileNav ? true : undefined}
          aria-label="Navigasi pembelajaran"
        >
          <button
            className="brand-button"
            aria-label="Halaman awal CrossLink"
            onClick={() => navigate('welcome')}
          >
            <Logo />
          </button>
          <button
            className="mobile-close"
            onClick={() => setMobileNav(false)}
            aria-label="Tutup navigasi"
          >
            <X />
          </button>
          <div className="sidebar-label">RUANG KERJA TEKNISI</div>
          <nav aria-label="Tahapan pembelajaran">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${state.screen === item.id ? 'active' : ''}`}
                disabled={!canNavigate(state, item.id)}
                onClick={() => navigate(item.id)}
                title={
                  !canNavigate(state, item.id)
                    ? item.id === 'investigation'
                      ? 'Lengkapi papan kasus terlebih dahulu.'
                      : 'Lengkapi bukti, perlengkapan, dan dugaan terlebih dahulu.'
                    : item.subtitle
                }
                aria-current={state.screen === item.id ? 'step' : undefined}
              >
                <item.icon size={19} />
                <span>
                  {item.title}
                  <small>{item.subtitle}</small>
                </span>
                {navDone(item.id) ? (
                  <Check className="nav-check" size={15} />
                ) : (
                  <span className="nav-number">{item.number}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-case">
            <span className="sidebar-label">KASUS AKTIF</span>
            <div>
              <span className="status-dot amber" />
              <strong>LAB–001</strong>
              <Pill>10/100</Pill>
            </div>
            <p>
              Dua komputer.
              <br />
              Satu koneksi langsung.
            </p>
            <div className="tiny-progress">
              <span
                style={{
                  width: `${[boardReady(state), workshopUnlocked(state), state.cables.own.ends.every((e) => e.crimped), allCasesComplete(state)].filter(Boolean).length * 25}%`,
                }}
              />
            </div>
            <small>Setiap bukti membawa kemajuan.</small>
          </div>
          <button
            className="sidebar-help"
            onClick={() => {
              setMobileNav(false)
              setOverlay('sources')
            }}
          >
            <BookOpen size={18} />
            <span>
              Sumber & panduan<small>Materi, lisensi, dan panduan guru</small>
            </span>
            <ChevronRight size={15} />
          </button>
          <div className="sidebar-bottom">
            <Leaf size={13} />
            Belajar melalui penyelidikan<span>v1.0</span>
          </div>
        </aside>
        {mobileNav && (
          <button
            className="nav-backdrop"
            aria-label="Tutup navigasi"
            onClick={() => setMobileNav(false)}
          />
        )}
        <div className="app-main" inert={narrow && mobileNav}>
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="mobile-menu"
                aria-label="Buka navigasi"
                aria-expanded={mobileNav}
                aria-controls="sidebar"
                onClick={() => setMobileNav(true)}
              >
                <Menu size={22} />
              </button>
              <span>Laboratorium virtual</span>
              <ChevronRight size={14} />
              <strong>{currentNav?.title ?? 'Selamat datang'}</strong>
            </div>
            <div className="topbar-actions">
              <span className="save-indicator">
                <span className={`status-dot ${warning ? 'amber' : 'green'}`} />
                {warning ? 'Perlu cadangan' : state.started ? 'Tersimpan lokal' : 'Mode lokal'}
              </span>
              <button
                aria-label="Pengaturan dan sesi"
                className="icon-button"
                onClick={() => setOverlay('settings')}
              >
                <Settings2 size={19} />
              </button>
              <div className="profile-avatar" aria-label={state.group}>
                {state.group.charAt(0).toUpperCase() || 'T'}
              </div>
            </div>
          </header>
          <main id="main-content">
            {warning && (
              <div role="alert" className="notice amber storage-warning">
                {warning}
                <Button variant="secondary" onClick={() => exportSession(state)}>
                  Ekspor sesi
                </Button>
              </div>
            )}
            {state.started && state.screen !== 'welcome' && (
              <div className="team-strip">
                <span>
                  <Users size={14} />
                  {state.group}
                </span>
                <span>
                  Operator: <strong>{roles[0]}</strong>
                </span>
                <span>
                  Analis: <strong>{roles[1]}</strong>
                </span>
                <span>
                  Pencatat: <strong>{roles[2] ?? roles[1]}</strong>
                </span>
                <Pill>PBL · BELAJAR DARI BUKTI</Pill>
              </div>
            )}
            {state.screen === 'welcome' && <Welcome onImport={() => fileInput.current?.click()} />}
            {state.screen === 'brief' && <Briefing />}
            {state.screen === 'board' && <CaseBoard />}
            {state.screen === 'investigation' && <Investigation />}
            {state.screen === 'workshop' && (
              <Workshop openReference={() => setOverlay('reference')} />
            )}
            {state.screen === 'testing' && <Testing />}
            {state.screen === 'report' && <Report />}
            {state.screen === 'reflection' && <Reflection />}
          </main>
          <footer className="app-footer">
            <span>CrossLink · Dasar-Dasar Teknik Jaringan Komputer dan Telekomunikasi</span>
            <span>
              <ShieldCheck size={13} />
              Simulasi persiapan praktik fisik
            </span>
          </footer>
        </div>
        {state.started && (
          <div className="utility-dock no-print" inert={narrow && mobileNav}>
            <button onClick={() => setOverlay('journal')}>
              <ClipboardList size={18} />
              <span>Jurnal</span>
              <b>{state.evidence.length}</b>
            </button>
            <button onClick={() => setOverlay('reference')}>
              <BookOpen size={18} />
              <span>Referensi</span>
            </button>
            <button
              className={failedTests >= 2 ? 'hint-suggested' : ''}
              onClick={() => setOverlay('hint')}
            >
              <HelpCircle size={18} />
              <span>Petunjuk</span>
              {failedTests >= 2 && <span className="status-dot amber" />}
            </button>
          </div>
        )}
        {toast && (
          <div className="toast no-print" role="status">
            <Check size={18} />
            <span>{toast}</span>
            <button onClick={() => setToast('')} aria-label="Tutup pemberitahuan">
              <X size={16} />
            </button>
          </div>
        )}
        <input
          className="sr-only"
          tabIndex={-1}
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label="Berkas sesi JSON"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            try {
              if (file.size > 8_000_000) throw new Error('Ukuran maksimum sesi adalah 8 MB.')
              setPendingImport(parseSession(await file.text()))
            } catch (error) {
              notify(error instanceof Error ? error.message : 'Sesi tidak dapat diimpor.')
            }
          }}
        />
        {overlay && (
          <Dialog
            title={
              overlay === 'reference'
                ? 'Buku saku teknisi'
                : overlay === 'journal'
                  ? 'Jurnal penyelidikan'
                  : overlay === 'hint'
                    ? 'Petunjuk penyelidikan'
                    : overlay === 'settings'
                      ? 'Pengaturan & sesi'
                      : overlay === 'sources'
                        ? 'Sumber & panduan'
                        : 'Mulai sesi baru'
            }
            onClose={() => setOverlay(null)}
            wide={overlay === 'reference' || overlay === 'sources'}
          >
            {overlay === 'reference' && <Reference unlocked={state.decisions.length > 0} />}
            {overlay === 'journal' && (
              <>
                <Pill>{state.evidence.length} BUKTI TERCATAT</Pill>
                {EVIDENCE.filter((e) => state.evidence.includes(e.id)).map((item) => (
                  <div className="journal-card" key={item.id}>
                    <small>{item.source}</small>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                ))}
                {state.evidence.length === 0 && (
                  <p>
                    Periksa objek laboratorium dan simpan pengamatan untuk mulai mengisi jurnal.
                  </p>
                )}
                <h3>Perkembangan dugaan</h3>
                {state.decisions.map((decision, i) => (
                  <div className="journal-card" key={i}>
                    <strong>
                      {i + 1}. {decision.choice}
                    </strong>
                    <p>{decision.reason}</p>
                  </div>
                ))}
                <h3>Pekerjaan</h3>
                {CASES.map((ticket) => (
                  <p key={ticket.id}>
                    {ticket.label}:{' '}
                    {caseCompleted(state, ticket.id) ? 'bukti lengkap' : 'dalam penyelidikan'}
                  </p>
                ))}
              </>
            )}
            {overlay === 'hint' && (
              <HintPanel
                state={state}
                onReveal={(level) => dispatch({ type: 'hint', level })}
                onReference={() => setOverlay('reference')}
              />
            )}
            {overlay === 'settings' && (
              <>
                <label className="check-control">
                  <input
                    type="checkbox"
                    checked={state.settings.reducedMotion}
                    onChange={(e) => dispatch({ type: 'motion', value: e.target.checked })}
                  />
                  Kurangi animasi dan gunakan tester langkah manual
                </label>
                <div className="notice">
                  <Save size={18} />
                  <span>
                    Data berada di browser ini. Gunakan ekspor untuk pindah komputer atau membuat
                    cadangan. Tidak ada akun atau pengiriman data ke server.
                  </span>
                </div>
                <div className="button-stack">
                  <Button onClick={() => exportSession(state)}>
                    <ArrowDownToLine size={17} />
                    Ekspor sesi JSON
                  </Button>
                  <Button variant="secondary" onClick={() => fileInput.current?.click()}>
                    <FolderInput size={17} />
                    Impor sesi
                  </Button>
                  <Button variant="danger" onClick={() => setOverlay('new')}>
                    <Plus size={17} />
                    Mulai sesi kelompok baru
                  </Button>
                </div>
              </>
            )}
            {overlay === 'sources' && <Sources />}
            {overlay === 'new' && (
              <>
                <p>
                  Sesi baru mengganti sesi aktif di browser ini. Ekspor sesi sekarang jika ingin
                  menyimpannya.
                </p>
                <div className="button-row">
                  <Button variant="secondary" onClick={() => exportSession(state)}>
                    Ekspor sesi aktif
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      const session = createSession()
                      dispatch({ type: 'load', session })
                      setWarning(saveSession(session))
                      setOverlay(null)
                      notify('Sesi baru siap. Isi identitas kelompok untuk mulai.')
                    }}
                  >
                    Buat sesi baru
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        )}
        {pendingImport && (
          <Dialog title="Tinjau sesi yang akan diimpor" onClose={() => setPendingImport(null)}>
            <h3>{pendingImport.group}</h3>
            <p>{pendingImport.members.join(' · ')}</p>
            <p>
              {pendingImport.evidence.length} bukti · {pendingImport.tests.length} pengujian ·{' '}
              {pendingImport.decisions.length} keputusan
            </p>
            <p>Impor mengganti sesi aktif. Ekspor sesi sekarang jika masih diperlukan.</p>
            <div className="button-row">
              <Button variant="secondary" onClick={() => exportSession(state)}>
                Cadangkan sesi aktif
              </Button>
              <Button
                onClick={() => {
                  dispatch({ type: 'load', session: pendingImport })
                  setWarning(saveSession(pendingImport))
                  setPendingImport(null)
                  setOverlay(null)
                  notify('Sesi kelompok berhasil dipulihkan.')
                }}
              >
                Gunakan sesi ini
                <ArrowRight size={16} />
              </Button>
            </div>
          </Dialog>
        )}
      </div>
    </GameContext.Provider>
  )
}

function Reference({ unlocked }: { unlocked: boolean }) {
  return (
    <>
      <Pill>REFERENSI · BUKAN PENGISI OTOMATIS</Pill>
      <h3>Mulai dari kebutuhan perangkat</h3>
      <p>
        Dalam kasus ini, dua port MDI lama mengirim melalui pin 1/2 dan menerima melalui 3/6.
        Periksa spesifikasi perangkat sebelum menentukan koneksi. Auto-MDI/MDIX pada perangkat lain
        dapat mengubah kebutuhannya.
      </p>
      {unlocked ? (
        <>
          <h3>T568A dan T568B</h3>
          <p>
            Nomor pin tetap: kontak emas menghadap pengamat, kepala di atas, kabel keluar di bawah,
            kait di belakang, pin 1 di kiri.
          </p>
          <div className="table-scroll">
            <table className="reference-table">
              <thead>
                <tr>
                  <th>Pin</th>
                  <th>T568A</th>
                  <th>T568B</th>
                </tr>
              </thead>
              <tbody>
                {STANDARDS.T568A.map((_, i) => (
                  <tr key={i}>
                    <th>{i + 1}</th>
                    {(['T568A', 'T568B'] as Standard[]).map((standard) => (
                      <td key={standard}>
                        <WireSwatch wire={STANDARDS[standard][i]} />
                        {WIRE_INFO[STANDARDS[standard][i]].name}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Pasangan hijau dan oranye berpindah posisi. Biru dan cokelat tetap. Bandingkan referensi
            dengan susunan aktual kedua ujungmu.
          </p>
        </>
      ) : (
        <div className="notice amber">
          Ajukan dugaan pada tahap investigasi untuk membuka referensi susunan konduktor sesuai
          kebutuhan penyelidikan.
        </div>
      )}
      <h3>Membaca tester</h3>
      <p>
        Baca pin sumber pada MAIN, lalu amati pin tujuan pada REMOTE. Tidak ada indikator tujuan
        berarti sambungan belum teramati. Tester kontinuitas tidak menentukan lokasi putus secara
        pasti.
      </p>
      <h3>Sebelum crimp</h3>
      <ul>
        <li>Kabel terlepas dan tangan jauh dari bagian pemotong.</li>
        <li>Konduktor tersusun, rata, serta mencapai bagian depan konektor tertutup.</li>
        <li>Jaket masuk ke area penjepit. Buka pilinan secukupnya.</li>
        <li>Gunakan konektor dan tang yang sesuai, lalu lakukan pengujian.</li>
      </ul>
      <p className="fine-print">
        Ikuti ukuran persiapan dari konektor yang digunakan di sekolah. Simulasi tidak mengukur
        ketepatan gerak atau menggantikan instruksi guru.
      </p>
    </>
  )
}
function HintPanel({
  state,
  onReveal,
  onReference,
}: {
  state: Session
  onReveal: (level: number) => void
  onReference: () => void
}) {
  const context =
    state.screen === 'workshop'
      ? 'workshop'
      : state.screen === 'testing'
        ? 'testing'
        : 'investigation'
  const shown = Math.max(
    0,
    ...state.hints.filter((hint) => hint.screen === state.screen).map((hint) => hint.level),
  )
  return (
    <>
      <p>
        Gunakan bantuan sebanyak yang diperlukan. Penggunaannya dicatat untuk diskusi dan tidak
        mengurangi nilai.
      </p>
      {HINTS[context].slice(0, shown).map((hint, i) => (
        <div className="journal-card" key={i}>
          <Pill>TINGKAT {i + 1}</Pill>
          <p>{hint}</p>
        </div>
      ))}
      {shown < 3 && (
        <Button onClick={() => onReveal(shown + 1)}>
          Buka petunjuk tingkat {shown + 1}
          <ChevronRight size={16} />
        </Button>
      )}
      {shown === 3 && (
        <Button variant="secondary" onClick={onReference}>
          <BookOpen size={17} />
          Buka referensi teknisi
        </Button>
      )}
    </>
  )
}
function Sources() {
  const [credits, setCredits] = useState<
    {
      toolId: string
      title: string
      author: string
      source: string
      license: string
      licenseUrl: string
      changes: string
    }[]
  >([])
  useEffect(() => {
    fetch('/assets/credits.json')
      .then((r) => r.json())
      .then(setCredits)
      .catch(() => setCredits([]))
  }, [])
  return (
    <>
      <h3>Panduan dua pertemuan</h3>
      {SCHEDULE.map(([title, text]) => (
        <p key={title}>
          <strong>{title}:</strong> {text}
        </p>
      ))}
      <p>
        Rotasikan operator, analis, dan pencatat setiap misi. Gunakan laporan untuk penyajian hasil,
        lalu lakukan refleksi individu.
      </p>
      <div className="notice amber">
        <ShieldCheck size={19} />
        <span>
          TP4 membutuhkan pengamatan individual saat praktik fisik. Ketepatan materi dan kesesuaian
          alat sekolah perlu dikonfirmasi guru sebelum penggunaan kelas.
        </span>
      </div>
      <h3>Acuan teknis dan pembelajaran</h3>
      <ul className="source-list">
        <li>
          <a
            href="https://www.cisco.com/c/en/us/support/docs/routers/10000-series-routers/46792-ethbase.html"
            target="_blank"
            rel="noreferrer"
          >
            Cisco — Ethernet 10/100 dan pinout crossover
          </a>
        </li>
        <li>
          <a
            href="https://www.flukenetworks.com/knowledge-base/application-or-standards-articles-copper/differences-between-wiring-codes-t568a-vs"
            target="_blank"
            rel="noreferrer"
          >
            Fluke Networks — T568A / T568B
          </a>
        </li>
        <li>
          <a
            href="https://www.flukenetworks.com/support/knowledge-base/linkiq/split-pair-identification"
            target="_blank"
            rel="noreferrer"
          >
            Fluke Networks — split pair dan batas kontinuitas
          </a>
        </li>
        <li>
          <a
            href="https://bbgtkdiy.kemendikdasmen.go.id/produk/bukudigital/saintika/html/materi10.html"
            target="_blank"
            rel="noreferrer"
          >
            Kemendikdasmen — sintaks Problem Based Learning
          </a>
        </li>
      </ul>
      <h3>Kredit foto perlengkapan</h3>
      <p>
        Foto digunakan sebagai contoh fisik; bentuk alat sekolah dapat berbeda. Hasil crop/resize
        tetap mengikuti lisensi masing-masing foto.
      </p>
      {credits.map((credit) => (
        <div className="asset-credit" key={credit.toolId}>
          <img src={TOOLS.find((tool) => tool.id === credit.toolId)?.photo} alt="" />
          <div>
            <strong>{credit.title}</strong>
            <p>
              {credit.author} ·{' '}
              <a href={credit.licenseUrl} target="_blank" rel="noreferrer">
                {credit.license}
              </a>
            </p>
            <a href={credit.source} target="_blank" rel="noreferrer">
              Halaman sumber foto
            </a>
            <small>Perubahan: {credit.changes}</small>
          </div>
        </div>
      ))}
      <p>
        <a href="/assets/credits.json" download>
          Kredit aset dalam format JSON
        </a>
      </p>
      <p className="fine-print">
        Ilustrasi laboratorium dan antarmuka dibuat khusus untuk CrossLink. Font Inter disertakan
        secara lokal, berlisensi{' '}
        <a href="/assets/INTER-OFL.txt" target="_blank" rel="noreferrer">
          SIL OFL
        </a>
        .
      </p>
    </>
  )
}
