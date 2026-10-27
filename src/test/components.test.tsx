import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectorView, ConductorPalette } from '../components/Connector'
import { TesterDevice } from '../components/Tester'
import {
  assembledCable,
  blankEnd,
  buildWireMap,
  EXPECTED_MAP,
  placeWire,
  STANDARDS,
  WIRE_INFO,
} from '../domain/cable'
import type { Wire } from '../domain/cable'
import { createSession, sessionReducer } from '../domain/session'
import { saveSession } from '../domain/persistence'
import { TOOLS } from '../content'
import App from '../App'

function Harness({ crimped = false }: { crimped?: boolean }) {
  const [end, setEnd] = useState(() =>
    crimped ? assembledCable().ends[0] : { ...blankEnd(), stripped: true, untwisted: true },
  )
  const [selected, setSelected] = useState<Wire | null>(null)
  return (
    <>
      <ConnectorView
        label="Konektor latihan"
        end={end}
        selected={selected}
        onSelect={setSelected}
        onPlace={(wire, slot) => {
          setEnd(placeWire(end, wire, slot))
          setSelected(null)
        }}
      />
      <ConductorPalette end={end} selected={selected} onSelect={setSelected} />
    </>
  )
}
async function completeManualTester(
  user: ReturnType<typeof userEvent.setup>,
  prediction = 'Kami memperkirakan pasangan pengirim menuju penerima.',
) {
  await user.click(screen.getByLabelText(/Pasang Ujung .* ke MAIN/))
  await user.click(screen.getByLabelText(/Pasang Ujung .* ke REMOTE/))
  await user.click(screen.getByRole('button', { name: 'Daya mati' }))
  await user.selectOptions(screen.getByLabelText('Mode pemindaian'), 'manual')
  await user.type(screen.getByLabelText('Menurutmu, apa hasil testernya nanti?'), prediction)
  await user.click(screen.getByRole('button', { name: 'Mulai pengujian' }))
  for (let i = 0; i < 7; i++)
    await user.click(screen.getByRole('button', { name: 'Pin berikutnya' }))
  await user.click(screen.getByRole('button', { name: 'Simpan pengamatan' }))
}
function unlocked() {
  const state = createSession()
  state.started = true
  state.screen = 'workshop'
  state.board = {
    hypothesis: 'Kabel belum sesuai',
    questions: 'Bagaimana peta pin?',
    plan: 'Periksa dan ukur',
  }
  state.evidence = ['power', 'ports', 'existing']
  state.toolAnswers = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool.capabilities[0]]))
  state.decisions = [
    {
      choice: 'crossover',
      reason: 'Dua port MDI tanpa Auto-MDIX',
      evidence: ['ports', 'existing'],
      at: new Date().toISOString(),
    },
  ]
  state.settings.reducedMotion = true
  return state
}

describe('Interaksi komponen', () => {
  it('penempatan konduktor dapat dilakukan dengan keyboard', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const wire = screen.getByRole('button', { name: /Putih–hijau Belum ditempatkan/ })
    wire.focus()
    await user.keyboard('{Enter}')
    const slot = screen.getByRole('button', { name: 'Pin 1: kosong' })
    slot.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Pin 1: Putih–hijau' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pin 2: kosong' })).toBeInTheDocument()
  })
  it('drag-and-drop menempatkan lalu menukar konduktor tanpa duplikasi', () => {
    render(<Harness />)
    const transferData = new Map<string, string>()
    const dataTransfer = {
      setData: (format: string, value: string) => transferData.set(format, value),
      getData: (format: string) => transferData.get(format) ?? '',
    }
    fireEvent.dragStart(screen.getByRole('button', { name: /Putih–hijau Belum ditempatkan/ }), {
      dataTransfer,
    })
    fireEvent.dragOver(screen.getByRole('button', { name: 'Pin 1: kosong' }), { dataTransfer })
    fireEvent.drop(screen.getByRole('button', { name: 'Pin 1: kosong' }), { dataTransfer })
    fireEvent.dragStart(screen.getByRole('button', { name: /Hijau Belum ditempatkan/ }), {
      dataTransfer,
    })
    fireEvent.drop(screen.getByRole('button', { name: 'Pin 2: kosong' }), { dataTransfer })
    fireEvent.dragStart(screen.getByRole('button', { name: 'Pin 1: Putih–hijau' }), {
      dataTransfer,
    })
    fireEvent.drop(screen.getByRole('button', { name: 'Pin 2: Hijau' }), { dataTransfer })
    expect(screen.getByRole('button', { name: 'Pin 1: Hijau' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pin 2: Putih–hijau' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Putih–hijau Pin 2/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hijau Pin 1/ })).toBeInTheDocument()
  })
  it('konektor yang sudah di-crimp tidak dapat disusun ulang', () => {
    render(<Harness crimped />)
    expect(screen.getByRole('button', { name: 'Pin 1: Putih–hijau' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Putih–hijau Pin 1/ })).toBeDisabled()
  })
  it('tester manual memancarkan peta dari engine dan menyimpan sekali', async () => {
    const user = userEvent.setup(),
      done = vi.fn()
    render(<TesterDevice cable={assembledCable()} reducedMotion={false} onComplete={done} />)
    expect(screen.getByRole('button', { name: 'Mulai pengujian' })).toBeDisabled()
    await completeManualTester(user)
    expect(done).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('row')).toHaveLength(9)
    const rows = screen.getAllByRole('row').slice(1)
    rows.forEach((row, i) =>
      expect(within(row).getByText(`Terhubung ke pin ${EXPECTED_MAP[i]}`)).toBeInTheDocument(),
    )
  })
  it('tester otomatis dan tabel menggunakan pengukuran yang sama', () => {
    vi.useFakeTimers()
    try {
      const done = vi.fn()
      render(<TesterDevice cable={assembledCable()} reducedMotion={false} onComplete={done} />)
      fireEvent.click(screen.getByLabelText('Pasang Ujung 1 ke MAIN'))
      fireEvent.click(screen.getByLabelText('Pasang Ujung 2 ke REMOTE'))
      fireEvent.click(screen.getByRole('button', { name: 'Daya mati' }))
      fireEvent.change(screen.getByLabelText('Menurutmu, apa hasil testernya nanti?'), {
        target: { value: 'Pemetaan silang' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Mulai pengujian' }))
      for (let i = 0; i < 8; i++)
        act(() => {
          vi.advanceTimersByTime(650)
        })
      expect(done).toHaveBeenCalledTimes(1)
      expect(screen.getAllByRole('row')).toHaveLength(9)
      expect(screen.getByText('8 pin telah diamati')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
  it('konektor kosong dapat disusun dan di-crimp melalui seluruh prosedur', async () => {
    const user = userEvent.setup()
    saveSession(unlocked())
    render(<App />)
    await user.click(screen.getByLabelText('Kabel dilepas dari perangkat'))
    await user.click(screen.getByLabelText('Tangan aman dari bagian pemotong'))
    await user.click(screen.getByRole('button', { name: 'Tang crimp multifungsi' }))
    for (const [index, standard] of (['T568A', 'T568B'] as const).entries()) {
      if (index === 1) await user.click(screen.getByRole('button', { name: 'Ujung 2' }))
      await user.click(screen.getByRole('button', { name: 'Kupas jaket' }))
      await user.click(screen.getByRole('button', { name: 'Buka pasangan' }))
      for (const [pin, wire] of STANDARDS[standard].entries()) {
        fireEvent.click(
          screen.getByRole('button', {
            name: new RegExp(`${WIRE_INFO[wire].name} Belum ditempatkan`),
          }),
        )
        fireEvent.click(screen.getByRole('button', { name: `Pin ${pin + 1}: kosong` }))
      }
      await user.click(screen.getByRole('button', { name: 'Ratakan & potong' }))
      await user.click(screen.getByRole('button', { name: 'Masukkan konduktor' }))
      await user.click(screen.getByRole('button', { name: 'Periksa pemasangan' }))
      await user.click(screen.getByRole('button', { name: 'Crimp konektor' }))
    }
    await user.click(screen.getByRole('button', { name: 'Bawa ke LAN tester' }))
    expect(
      screen.getByRole('heading', { name: 'Biarkan hasil pengukuran berbicara.' }),
    ).toBeInTheDocument()
    await completeManualTester(user)
    await user.type(
      screen.getByLabelText('Apa yang terlihat pada tester?'),
      'Semua delapan jalur sesuai; pin 1 menuju 3.',
    )
    await user.selectOptions(
      screen.getByLabelText('MAIN pin 1 terhubung ke pin berapa di REMOTE?'),
      '3',
    )
    expect(
      screen.getByText(/Kabel memenuhi spesifikasi latihan pada revisi ini/),
    ).toBeInTheDocument()
  }, 30000)
  it('alur open: pengukuran, diagnosis, ganti konektor, uji ulang, laporan', async () => {
    const user = userEvent.setup()
    let fixture = unlocked()
    fixture.screen = 'testing'
    fixture.activeCase = 'open'
    saveSession(fixture)
    render(<App />)
    expect(screen.getByRole('button', { name: 'Inspeksi / perbaiki di workshop' })).toBeDisabled()
    await completeManualTester(user)
    await user.type(
      screen.getByLabelText('Apa yang terlihat pada tester?'),
      'Pin 2 tidak terhubung. Lokasi perlu diperiksa.',
    )
    await user.selectOptions(
      screen.getByLabelText('MAIN pin 2 terhubung ke pin berapa di REMOTE?'),
      'open',
    )
    await user.selectOptions(screen.getByLabelText('Masalah apa yang kamu temukan?'), 'open')
    await user.type(
      screen.getByLabelText('Apa buktinya?'),
      'MAIN 2 tidak menunjukkan sambungan; konduktor terlalu pendek pada konektor.',
    )
    await user.selectOptions(screen.getByLabelText('Bagaimana cara memperbaikinya?'), 'reterminate')
    await user.click(screen.getByRole('button', { name: 'Inspeksi / perbaiki di workshop' }))
    await user.click(screen.getByRole('button', { name: 'Ujung 2' }))
    await user.click(screen.getByRole('button', { name: 'Tang crimp multifungsi' }))
    await user.click(screen.getByRole('button', { name: 'Potong & ganti konektor' }))
    await user.click(screen.getByRole('button', { name: 'Kupas jaket' }))
    await user.click(screen.getByRole('button', { name: 'Buka pasangan' }))
    for (const [pin, wire] of STANDARDS.T568B.entries()) {
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(`${WIRE_INFO[wire].name} Belum ditempatkan`),
        }),
      )
      fireEvent.click(screen.getByRole('button', { name: `Pin ${pin + 1}: kosong` }))
    }
    for (const label of [
      'Ratakan & potong',
      'Masukkan konduktor',
      'Periksa pemasangan',
      'Crimp konektor',
    ])
      await user.click(screen.getByRole('button', { name: label }))
    await user.click(screen.getByRole('button', { name: 'Bawa ke LAN tester' }))
    await completeManualTester(user)
    await user.type(
      screen.getByLabelText('Apa yang terlihat pada tester?'),
      'Pin 2 kini menuju 6 setelah terminasi ulang.',
    )
    await user.selectOptions(
      screen.getByLabelText('MAIN pin 2 terhubung ke pin berapa di REMOTE?'),
      '6',
    )
    await user.type(
      screen.getByLabelText('Apa yang berubah setelah diperbaiki? Mengapa?'),
      'Konduktor kini mencapai kontak sehingga jalurnya tersambung.',
    )
    await user.click(screen.getByRole('button', { name: 'Simpan kesimpulan' }))
    expect(screen.getByText('Pekerjaan terdokumentasi')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lihat laporan sementara' }))
    expect(screen.getByText('Memerlukan observasi praktik fisik oleh guru')).toBeInTheDocument()
    expect(screen.getByText('Catatan diagnosis 1: open')).toBeInTheDocument()
  }, 30000)
  it('riwayat sesi dipulihkan setelah memuat ulang komponen', () => {
    const state = unlocked()
    state.cables.own = assembledCable()
    const tested = sessionReducer(state, {
      type: 'test',
      caseId: 'own',
      revision: 0,
      main: 0,
      prediction: 'Silang',
    })
    expect(buildWireMap(tested.tests[0].snapshot)).toEqual(EXPECTED_MAP)
    saveSession(tested)
    const view = render(<App />)
    view.unmount()
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Bangun koneksimu, satu konduktor setiap kali.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pin 1: Putih–hijau' })).toBeDisabled()
  })
})
