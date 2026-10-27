import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { LockKeyhole, X } from 'lucide-react'
import { WIRES, WIRE_INFO } from '../domain/cable'
import type { Termination, Wire } from '../domain/cable'

export function wireStyle(wire: Wire): CSSProperties {
  const info = WIRE_INFO[wire]
  return {
    '--wire-color': info.color,
    background: info.stripe
      ? `repeating-linear-gradient(150deg,#f8faf8 0px,#f8faf8 9px,${info.color} 9px,${info.color} 16px)`
      : info.color,
  } as CSSProperties
}
export function WireSwatch({ wire }: { wire: Wire }) {
  return <span key={wire} className="wire-swatch" style={wireStyle(wire)} aria-hidden="true" />
}
function useCompactConnector() {
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)')
    const update = () => setCompact(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return compact
}
function PinContents({ wire }: { wire: Wire | null }) {
  return (
    <>
      <span
        key={wire ?? 'empty'}
        className={`conductor-line ${wire ? 'is-filled' : ''}`}
        style={wire ? wireStyle(wire) : {}}
      />
      <span className="pin-code">{wire ? WIRE_INFO[wire].short : '—'}</span>
    </>
  )
}
export function ConnectorView({
  end,
  selected,
  onSelect,
  onPlace,
  onClear,
  onCancelSelection,
  label,
  readonly = false,
}: {
  end: Termination
  selected?: Wire | null
  onSelect?: (wire: Wire) => void
  onPlace?: (wire: Wire, slot: number) => void
  onClear?: (slot: number) => void
  onCancelSelection?: () => void
  label: string
  readonly?: boolean
}) {
  const compact = useCompactConnector()
  const locked = end.crimped || readonly || !end.untwisted
  const placing = compact && !locked && !!selected && !!onCancelSelection
  const stage = end.crimped
    ? 'crimped'
    : end.inspected
      ? 'inspected'
      : end.inserted
        ? 'inserted'
        : end.trimmed
          ? 'trimmed'
          : end.untwisted
            ? 'untwisted'
            : end.stripped
              ? 'stripped'
              : 'ready'
  const stageText = {
    ready: 'Siapkan kabel dengan alat yang sesuai.',
    stripped: 'Jaket sudah dikupas. Buka pasangan kabel.',
    untwisted: 'Pasangan sudah dibuka. Susun 8 konduktor.',
    trimmed: 'Ujung konduktor sudah diratakan.',
    inserted: 'Konduktor masuk ke konektor. Periksa posisinya.',
    inspected: 'Pemasangan sudah diperiksa. Siap untuk crimp.',
    crimped: 'Konektor terkunci setelah crimp.',
  }[stage]
  function activatePin(wire: Wire | null, slot: number) {
    if (selected) onPlace?.(selected, slot)
    else if (wire) onSelect?.(wire)
  }
  return (
    <div className={`connector-wrap ${compact ? 'compact-connector' : ''}`} data-stage={stage}>
      <div className="connector-orientation">
        <span>KONTAK EMAS DI ATAS</span>
        <span>PIN 1 ←</span>
      </div>
      <div className="connector-scroll">
        <div
          className={`connector-body ${end.crimped ? 'is-crimped' : ''}`}
          role="group"
          aria-label={label}
          aria-hidden={compact || undefined}
        >
          <div className="connector-tip" />
          <div className="pin-row">
            {end.pins.map((wire, index) => (
              <div className="pin-column" key={index}>
                <span className="pin-number">{index + 1}</span>
                <span className="gold-contact" />
                {compact ? (
                  <span className={`pin-slot pin-preview ${wire ? 'occupied' : ''}`}>
                    <PinContents wire={wire} />
                  </span>
                ) : (
                  <button
                    className={`pin-slot ${wire ? 'occupied' : ''} ${selected === wire && wire ? 'selected' : ''}`}
                    disabled={locked}
                    aria-label={`Pin ${index + 1}: ${wire ? WIRE_INFO[wire].name : 'kosong'}`}
                    title={wire ? WIRE_INFO[wire].name : 'Pilih konduktor, lalu tempatkan di sini'}
                    draggable={!!wire && !locked}
                    onDragStart={(event) => {
                      if (wire) {
                        event.dataTransfer.setData('text/plain', wire)
                        onSelect?.(wire)
                      }
                    }}
                    onDragOver={(event) => {
                      if (!locked) event.preventDefault()
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const dragged = event.dataTransfer.getData('text/plain') as Wire
                      if (WIRES.includes(dragged)) onPlace?.(dragged, index)
                    }}
                    onClick={() => activatePin(wire, index)}
                    onKeyDown={(event) => {
                      if (event.key === 'Delete' || event.key === 'Backspace') {
                        event.preventDefault()
                        onClear?.(index)
                      }
                    }}
                  >
                    <PinContents wire={wire} />
                  </button>
                )}
                {wire && !end.reaches[index] && (
                  <span className="depth-marker" title="Konduktor tidak mencapai kontak">
                    ↓
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="connector-shoulder">
            <span>
              {end.crimped ? (
                <>
                  <LockKeyhole size={13} /> SUDAH DI-CRIMP
                </>
              ) : (
                '8P8C · UJUNG TERTUTUP'
              )}
            </span>
          </div>
          <div className={`cable-jacket ${end.jacket ? '' : 'loose'}`} />
        </div>
      </div>
      <p className="orientation-note">Kepala di atas · kabel ke bawah · kait di belakang</p>
      {!readonly && (
        <p key={stage} className="connector-stage" role="status">
          <span aria-hidden="true" />
          {stageText}
        </p>
      )}
      {compact && (
        <div
          className={`touch-placement-controls ${placing ? 'is-placement' : ''}`}
          role="group"
          aria-label={`${label} · penempatan pin`}
        >
          <div className="touch-placement-heading">
            <div>
              <strong>
                {placing ? `Tempatkan ${WIRE_INFO[selected!].name}` : 'Kontrol pin sentuh'}
              </strong>
              <small>
                {placing
                  ? 'Ketuk nomor pin tujuan. Tidak perlu menyeret.'
                  : 'Pin 1–8 mengikuti urutan pada gambar di atas.'}
              </small>
            </div>
            {placing && (
              <button
                className="touch-placement-cancel"
                onClick={onCancelSelection}
                aria-label="Batalkan pemilihan konduktor"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="touch-pin-grid">
            {end.pins.map((wire, index) => (
              <div className="touch-pin-card" key={index}>
                <button
                  className={`touch-pin-target ${selected === wire && wire ? 'selected' : ''}`}
                  disabled={locked}
                  aria-label={`Pin ${index + 1}: ${wire ? WIRE_INFO[wire].name : 'kosong'}`}
                  onClick={() => activatePin(wire, index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Delete' || event.key === 'Backspace') {
                      event.preventDefault()
                      onClear?.(index)
                    }
                  }}
                >
                  <span className="touch-pin-number">Pin {index + 1}</span>
                  {wire ? <WireSwatch wire={wire} /> : <span className="touch-pin-empty" />}
                  <span className="touch-pin-name">
                    {placing && wire
                      ? WIRE_INFO[wire].short
                      : wire
                        ? WIRE_INFO[wire].name
                        : 'Kosong'}
                  </span>
                </button>
                {wire && onClear && !locked && !placing && (
                  <button
                    className="touch-pin-clear"
                    onClick={() => onClear(index)}
                    aria-label={`Kosongkan pin ${index + 1}`}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export function ConductorPalette({
  end,
  selected,
  onSelect,
}: {
  end: Termination
  selected: Wire | null
  onSelect: (wire: Wire) => void
}) {
  const compact = useCompactConnector()
  return (
    <div className="conductor-palette" role="group" aria-label="Pilih konduktor">
      {WIRES.map((wire) => (
        <button
          key={wire}
          className={`wire-chip ${selected === wire ? 'selected' : ''} ${end.pins.includes(wire) ? 'placed' : ''}`}
          aria-pressed={selected === wire}
          disabled={end.crimped || !end.untwisted}
          draggable={!compact && end.untwisted && !end.crimped}
          onDragStart={(event) => {
            event.dataTransfer.setData('text/plain', wire)
            onSelect(wire)
          }}
          onClick={() => onSelect(wire)}
        >
          <WireSwatch wire={wire} />
          <span>
            {WIRE_INFO[wire].name}
            <small>
              {end.pins.includes(wire) ? `Pin ${end.pins.indexOf(wire) + 1}` : 'Belum ditempatkan'}
            </small>
          </span>
          <b>{WIRE_INFO[wire].short}</b>
        </button>
      ))}
    </div>
  )
}
