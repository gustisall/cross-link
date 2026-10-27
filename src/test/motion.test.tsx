import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { TesterDevice } from '../components/Tester'
import { ConnectorView } from '../components/Connector'
import { LabScene } from '../components/LabScene'
import { blankEnd, createCases } from '../domain/cable'

it('jalur animasi membaca hasil engine: open tidak ditampilkan mencapai REMOTE', () => {
  render(<TesterDevice cable={createCases().open} reducedMotion={true} onComplete={vi.fn()} />)
  expect(
    screen.queryByRole('status', { name: 'Jalur pin yang sedang diuji' }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByLabelText('Pasang Ujung 1 ke MAIN'))
  fireEvent.click(screen.getByLabelText('Pasang Ujung 2 ke REMOTE'))
  fireEvent.click(screen.getByRole('button', { name: 'Daya mati' }))
  fireEvent.change(screen.getByLabelText('Menurutmu, apa hasil testernya nanti?'), {
    target: { value: 'Saya akan memeriksa semua pin.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Mulai pengujian' }))
  const first = screen.getByRole('status', { name: 'Jalur pin yang sedang diuji' })
  expect(within(first).getByText('Pin 1 tersambung ke pin 3.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Pin berikutnya' }))
  const second = screen.getByRole('status', { name: 'Jalur pin yang sedang diuji' })
  expect(second).toHaveClass('is-open')
  expect(within(second).getByText('Tidak ada sambungan pada jalur ini.')).toBeInTheDocument()
  expect(within(second).queryByText(/tersambung ke pin/)).not.toBeInTheDocument()
  expect(screen.getByLabelText('Mode pemindaian')).toBeDisabled()
})

describe('status visual mengikuti pekerjaan', () => {
  it('petunjuk konektor berubah sesuai tahap, tanpa mengisi pin', () => {
    const end = blankEnd()
    const view = render(<ConnectorView end={end} label="Latihan tahap" />)
    expect(screen.getByRole('status')).toHaveTextContent('Siapkan kabel')
    view.rerender(
      <ConnectorView end={{ ...end, stripped: true, untwisted: true }} label="Latihan tahap" />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Susun 8 konduktor')
    expect(screen.getAllByRole('button', { name: /Pin \d: kosong/ })).toHaveLength(8)
  })
  it('aliran sinyal hanya muncul saat model link terhubung', () => {
    const view = render(<LabScene />)
    expect(view.container.querySelector('.lab-signal-flow')).toBeNull()
    view.rerender(<LabScene live />)
    expect(view.container.querySelector('.lab-signal-flow')).toBeInTheDocument()
  })
})
