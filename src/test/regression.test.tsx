import { createSession, sessionReducer } from '../domain/session'
import { assembledCable, buildWireMap, createCases, STANDARDS, WIRE_INFO } from '../domain/cable'
import type { Standard } from '../domain/cable'
import { CASES, decisionFeedback, TOOLS } from '../content'
import { saveSession } from '../domain/persistence'
import { TesterDevice } from '../components/Tester'
import { Report } from '../screens/Reporting'
import { GameContext } from '../ui'
import App from '../App'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const change = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const mapText = (map: (number | null)[]) => map.map((pin, i) => `${i + 1}→${pin ?? '—'}`).join('  ')

function measure(prediction: string) {
  fireEvent.click(screen.getByLabelText(/Pasang Ujung .* ke MAIN/))
  fireEvent.click(screen.getByLabelText(/Pasang Ujung .* ke REMOTE/))
  click('Daya mati')
  const mode = screen.getByLabelText('Mode pemindaian')
  if (!(mode as HTMLSelectElement).disabled) fireEvent.change(mode, { target: { value: 'manual' } })
  change('Menurutmu, apa hasil testernya nanti?', prediction)
  click('Mulai pengujian')
  for (let i = 0; i < 7; i++) click('Pin berikutnya')
  click('Simpan pengamatan')
}
function assembleEnd(index: 0 | 1, standard: Standard) {
  click(`Ujung ${index + 1}`)
  click('Tang crimp multifungsi')
  click('Kupas jaket')
  click('Buka pasangan')
  change('Standar yang dituju', standard)
  for (const [pin, wire] of STANDARDS[standard].entries()) {
    click(new RegExp(`${WIRE_INFO[wire].name} Belum ditempatkan`))
    fireEvent.click(screen.getByRole('button', { name: `Pin ${pin + 1}: kosong` }))
  }
  for (const operation of [
    'Ratakan & potong',
    'Masukkan konduktor',
    'Periksa pemasangan',
    'Crimp konektor',
  ])
    click(operation)
}
function recordObservation(pin: number, answer: string, observation: string) {
  change('Apa yang terlihat pada tester?', observation)
  change(`MAIN pin ${pin} terhubung ke pin berapa di REMOTE?`, answer)
}

describe('Regresi hasil tersimpan dan laporan', () => {
  it('hasil tersimpan MAIN Ujung 2 tidak dilabeli Ujung 1 saat komponen dimuat kembali', () => {
    const cable = createCases().open
    const savedRun = {
      map: buildWireMap(cable, 1),
      main: 1 as const,
      prediction: 'Pemeriksaan dari ujung kedua.',
      revision: 0,
    }
    const done = vi.fn()
    const view = render(
      <TesterDevice cable={cable} reducedMotion={false} onComplete={done} savedRun={savedRun} />,
    )
    expect(screen.getByLabelText('Ujung pada MAIN')).toHaveValue('1')
    expect(
      screen.getByText('Hasil tersimpan · rev 0 · MAIN Ujung 2 → REMOTE Ujung 1'),
    ).toBeInTheDocument()
    const firstRows = screen.getAllByRole('row').slice(1)
    expect(within(firstRows[5]).getByText('Tidak ada sambungan teramati')).toBeInTheDocument()
    view.unmount()
    render(
      <TesterDevice cable={cable} reducedMotion={false} onComplete={done} savedRun={savedRun} />,
    )
    expect(screen.getByLabelText('Ujung pada MAIN')).toHaveValue('1')
    change('Ujung pada MAIN', '0')
    expect(screen.getByText(/Konfigurasi uji berikutnya memakai MAIN Ujung 1/)).toBeInTheDocument()
    measure('Pengukuran baru dari ujung pertama.')
    expect(done).toHaveBeenLastCalledWith(0, 'Pengukuran baru dari ujung pertama.')
    expect(
      screen.queryByText('Hasil tersimpan · rev 0 · MAIN Ujung 2 → REMOTE Ujung 1'),
    ).not.toBeInTheDocument()
    const newRows = screen.getAllByRole('row').slice(1)
    expect(within(newRows[1]).getByText('Tidak ada sambungan teramati')).toBeInTheDocument()
    expect(within(newRows[5]).getByText('Terhubung ke pin 2')).toBeInTheDocument()
  })
  it('laporan menampilkan susunan, alasan, peta sebelum/sesudah, dan arah MAIN dari data sesi', () => {
    let state = createSession()
    state.started = true
    state.group = 'Kelompok Data Nyata'
    state.members = ['Alias Merpati', 'Alias Kenari']
    state.board.hypothesis = 'Dugaan khusus dari bukti awal.'
    state.decisions = [
      {
        choice: 'crossover',
        reason: 'Alasan unik: kedua port MDI tidak menyesuaikan jalur.',
        evidence: ['ports', 'existing'],
        at: new Date().toISOString(),
      },
    ]
    state.cables.own = assembledCable()
    state.cables.own.revision = 2
    ;[state.cables.own.ends[1].pins[0], state.cables.own.ends[1].pins[3]] = [
      state.cables.own.ends[1].pins[3],
      state.cables.own.ends[1].pins[0],
    ]
    state = sessionReducer(state, {
      type: 'test',
      caseId: 'own',
      revision: 2,
      main: 0,
      prediction: 'Prediksi sebelum perbaikan khusus.',
    })
    state = sessionReducer(state, {
      type: 'observation',
      id: state.tests[0].id,
      value: 'Peta awal berbeda pada jalur tertentu.',
    })
    const beforeMap = [...state.tests[0].map]
    state.cables.own = assembledCable('T568B', 'T568A')
    state.cables.own.revision = 9
    state = sessionReducer(state, {
      type: 'test',
      caseId: 'own',
      revision: 9,
      main: 1,
      prediction: 'Prediksi sesudah perbaikan dari ujung kedua.',
    })
    const latest = state.tests.at(-1)!
    state = sessionReducer(state, {
      type: 'observation',
      id: latest.id,
      value: 'Peta akhir setelah tindakan nyata.',
    })
    render(
      <GameContext.Provider value={{ state, dispatch: vi.fn(), notify: vi.fn() }}>
        <Report />
      </GameContext.Provider>,
    )
    expect(screen.getByText('Kelompok Data Nyata')).toBeInTheDocument()
    expect(screen.getByText('Alias Merpati · Alias Kenari')).toBeInTheDocument()
    expect(screen.getAllByText(state.decisions[0].reason).length).toBeGreaterThan(0)
    const cableSection = screen
      .getByRole('heading', { name: 'CL–01 · Kabel kelompok' })
      .closest('section')!
    expect(within(cableSection).getByText('MAIN Ujung 1 → REMOTE Ujung 2')).toBeInTheDocument()
    expect(within(cableSection).getByText('MAIN Ujung 2 → REMOTE Ujung 1')).toBeInTheDocument()
    const codeMaps = [...cableSection.querySelectorAll('code')].map(
      (element) => element.textContent,
    )
    expect(codeMaps).toEqual([mapText(beforeMap), mapText(latest.map)])
    expect(codeMaps[0]).not.toEqual(codeMaps[1])
    expect(
      within(cableSection).getByText('Pengamatan: Peta akhir setelah tindakan nyata.'),
    ).toBeInTheDocument()
    const wireSection = screen
      .getByRole('heading', { name: 'Susunan kabel kelompok · revisi 9' })
      .closest('section')!
    const wireLists = within(wireSection).getAllByRole('list')
    expect(
      within(wireLists[0])
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(STANDARDS.T568B.map((wire) => WIRE_INFO[wire].name))
    expect(
      within(wireLists[1])
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(STANDARDS.T568A.map((wire) => WIRE_INFO[wire].name))
    expect(screen.getByText('Memerlukan observasi praktik fisik oleh guru')).toBeInTheDocument()
  })
  it('Periksa Rancangan menilai susunan sebelum crimp dan membatalkan hasil ketika susunan berubah', () => {
    const state = createSession()
    state.started = true
    state.screen = 'workshop'
    state.cables.own = assembledCable()
    state.cables.own.ends.forEach((end) => {
      end.crimped = false
      end.inserted = false
      end.reaches.fill(false)
    })
    saveSession(state)
    render(<App />)
    click('Periksa Rancangan')
    expect(screen.getByText('Susunan kedua ujung sesuai rancangan crossover.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pin 1: Putih–hijau' })).toBeEnabled()
    click(/Hijau Pin 2/)
    click('Pin 1: Putih–hijau')
    expect(
      screen.queryByText('Susunan kedua ujung sesuai rancangan crossover.'),
    ).not.toBeInTheDocument()
    click('Periksa Rancangan')
    expect(screen.getByText('Rancangan masih perlu ditinjau.')).toBeInTheDocument()
  })
})

describe('Feedback keputusan berbasis bukti', () => {
  it('pilihan keliru mendapat arah pemeriksaan tanpa membocorkan tabel jawaban', () => {
    const straight = decisionFeedback('straight', ['ports', 'existing'])
    const rollover = decisionFeedback('rollover', ['ports', 'existing'])
    expect(straight.tone).toBe('amber')
    expect(straight.message).toMatch(/MDI|pengirim|penerima/)
    expect(rollover.tone).toBe('amber')
    expect(rollover.message).toMatch(/Ethernet/)
    expect(straight.message).not.toBe(rollover.message)
    expect(straight.message).not.toMatch(/T568A|T568B|3,\s*6,\s*1/)
    expect(decisionFeedback('crossover', ['ports']).tone).toBe('amber')
    expect(decisionFeedback('crossover', ['ports', 'existing']).tone).toBe('success')
  })
})

describe('Alur belajar lengkap tanpa progres siap pakai', () => {
  it('welcome → investigasi → kabel kelompok → tiga tiket → laporan → refleksi', () => {
    render(<App />)
    change('Nama kelompok', 'Tim Alur Lengkap')
    click('Mulai investigasi')
    click('Susun rencana penyelidikan')
    change('Menurutmu, mengapa kedua PC belum terhubung?', 'Kabel belum sesuai kebutuhan port.')
    change('Apa yang ingin kamu cari tahu?', 'Spesifikasi NIC dan peta kabel.')
    change(
      'Apa yang akan kamu periksa lebih dulu?',
      'Baca spesifikasi, kenali alat, dan ukur jalur.',
    )
    click('Masuk laboratorium')
    click('Periksa perangkat')
    click('Catat kondisi perangkat')
    click('Catat spesifikasi port')
    click('Tutup panel')
    fireEvent.click(screen.getAllByRole('button', { name: 'Uji kabel tersedia' }).at(-1)!)
    measure('Delapan jalur awal mungkin lurus.')
    click('Catat hasil pengukuran sebagai bukti')
    click('Tutup panel')
    for (const [index, tool] of TOOLS.entries()) {
      fireEvent.click(screen.getByRole('button', { name: `Periksa perlengkapan ${index + 1}` }))
      change(/Pilih fungsi/, tool.capabilities[0])
      click('Periksa pilihan')
    }
    change('Kabel mana yang kamu pilih?', 'straight')
    change('Mengapa memilih kabel itu?', 'Dugaan pertama menggunakan kabel yang tersedia.')
    fireEvent.click(screen.getByLabelText(/Spesifikasi port Ethernet/))
    fireEvent.click(screen.getByLabelText(/Peta kabel tersedia/))
    click('Simpan dugaan')
    expect(
      screen.getAllByText(decisionFeedback('straight', ['ports', 'existing']).message).length,
    ).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Buka Cable Workshop' })).toBeEnabled()
    change('Kabel mana yang kamu pilih?', 'crossover')
    change(
      'Mengapa memilih kabel itu?',
      'Setelah melihat bukti port MDI, pengirim perlu menuju penerima.',
    )
    click('Simpan revisi dugaan')
    click('Buka Cable Workshop')
    fireEvent.click(screen.getByLabelText('Kabel dilepas dari perangkat'))
    fireEvent.click(screen.getByLabelText('Tangan aman dari bagian pemotong'))
    assembleEnd(0, 'T568A')
    assembleEnd(1, 'T568B')
    click('Bawa ke LAN tester')
    measure('Peta kelompok akan silang pada pasangan aktif.')
    recordObservation(1, '3', 'Kabel kelompok memiliki delapan jalur sesuai.')
    for (const id of ['open', 'miswire', 'straight'] as const) {
      const ticket = CASES.find((item) => item.id === id)!
      click(new RegExp(`${ticket.code}.*${ticket.label}`))
      measure(`Periksa seluruh pin pada kasus ${id}.`)
      const readingPin = id === 'open' ? 2 : id === 'miswire' ? 4 : 1
      recordObservation(
        readingPin,
        id === 'open' ? 'open' : id === 'miswire' ? '5' : '1',
        `Bukti awal kasus ${id} perlu diperbaiki.`,
      )
      change('Masalah apa yang kamu temukan?', id)
      change('Apa buktinya?', `Peta dan inspeksi menunjukkan masalah ${id}.`)
      change('Bagaimana cara memperbaikinya?', 'reterminate')
      click('Inspeksi / perbaiki di workshop')
      click('Ujung 2')
      click('Tang crimp multifungsi')
      click('Potong & ganti konektor')
      assembleEnd(1, id === 'straight' ? 'T568A' : 'T568B')
      click('Bawa ke LAN tester')
      measure(`Uji ulang setelah perbaikan ${id}.`)
      recordObservation(
        readingPin,
        id === 'open' ? '6' : id === 'miswire' ? '4' : '3',
        `Peta kasus ${id} kini sesuai.`,
      )
      change(
        'Apa yang berubah setelah diperbaiki? Mengapa?',
        `Terminasi baru memperbaiki jalur kasus ${id}; hasil sebelum dan sesudah berbeda.`,
      )
      click('Simpan kesimpulan')
      expect(screen.getByText('Pekerjaan terdokumentasi')).toBeInTheDocument()
    }
    click('Susun laporan')
    expect(screen.getByRole('heading', { name: 'Tim Alur Lengkap' })).toBeInTheDocument()
    expect(screen.queryByText('Laporan sementara')).not.toBeInTheDocument()
    for (const ticket of CASES)
      expect(
        screen.getByRole('heading', { name: `${ticket.code} · ${ticket.label}` }),
      ).toBeInTheDocument()
    expect(screen.getByText('Memerlukan observasi praktik fisik oleh guru')).toBeInTheDocument()
    click('Evaluasi & refleksi')
    change(
      'Apakah dugaan awalmu berubah? Apa buktinya?',
      'Dugaan lurus berubah setelah melihat port dan pengukuran.',
    )
    change(
      'Lampu link menyala. Apa lagi yang perlu diperiksa pada delapan pin?',
      'Link tidak memeriksa seluruh delapan jalur dan kualitas terminasi.',
    )
    change(
      'Apa yang masih perlu kamu latih dengan alat asli?',
      'Keterampilan memasang konektor dan keselamatan penggunaan alat.',
    )
    click('Kembali ke laporan')
    expect(
      screen.getByText('Dugaan lurus berubah setelah melihat port dan pengukuran.'),
    ).toBeInTheDocument()
  }, 60000)
})
