import { ScanLine } from 'lucide-react'

function Computer({ x, label, live }: { x: number; label: string; live: boolean }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx="130" cy="369" rx="103" ry="11" fill="#263b45" opacity=".12" />
      <path d="M105 303h42l9 37H96z" fill="#9baeb1" />
      <rect x="79" y="336" width="94" height="9" rx="4" fill="#b6c3c4" />
      <rect
        x="33"
        y="159"
        width="190"
        height="147"
        rx="10"
        fill="#dce3df"
        stroke="#a5b4b3"
        strokeWidth="2"
      />
      <rect x="44" y="169" width="168" height="117" rx="5" fill="#182e3d" />
      <path
        d="M60 196h52m-52 9h88m-88 10h35"
        stroke="#6fa39f"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="95"
        y="234"
        width="22"
        height="17"
        rx="3"
        fill="none"
        stroke="#6fc2ae"
        strokeWidth="2"
      />
      <rect
        x="151"
        y="234"
        width="22"
        height="17"
        rx="3"
        fill="none"
        stroke="#6fc2ae"
        strokeWidth="2"
      />
      <path
        d="M117 243h34"
        stroke={live ? '#75d1aa' : '#6a7d81'}
        strokeWidth="2"
        strokeDasharray={live ? '' : '4 4'}
      />
      <circle className="computer-power-led" cx="200" cy="297" r="3" fill="#79b49b" />
      <rect
        x="235"
        y="224"
        width="55"
        height="127"
        rx="6"
        fill="#c3cfcc"
        stroke="#9dafaf"
        strokeWidth="2"
      />
      <path d="M246 241h33m-33 8h33m-33 40h20m-20 6h20m-20 6h20" stroke="#91a29f" strokeWidth="3" />
      <circle cx="263" cy="270" r="6" fill="#e8ece5" stroke="#7b9391" />
      <rect x="250" y="319" width="20" height="13" rx="2" fill="#344955" />
      <circle cx="276" cy="324" r="3" fill={live ? '#68c796' : '#cc9051'} />
      <path d="M58 349h135l15 18H44z" fill="#e3e7df" stroke="#a9b8b3" />
      <path d="M63 354h128m-132 5h137" stroke="#b6c3bb" strokeWidth="2" strokeDasharray="5 3" />
      <text x="45" y="146" fontSize="11" fontFamily="monospace" letterSpacing="2" fill="#657d7e">
        {label}
      </text>
    </g>
  )
}
export function LabScene({
  onInspect,
  live = false,
  compact = false,
}: {
  onInspect?: (target: string) => void
  live?: boolean
  compact?: boolean
}) {
  return (
    <div className={`lab-scene ${compact ? 'compact' : ''}`}>
      <svg
        className={live ? 'is-linked' : ''}
        viewBox="0 0 800 440"
        role="img"
        aria-label="Laboratorium jaringan dengan dua komputer lama, kabel penghubung, dan meja kerja teknisi"
      >
        <defs>
          <linearGradient id="wall" x2="0" y2="1">
            <stop stopColor="#e7eef4" />
            <stop offset="1" stopColor="#d9e6ef" />
          </linearGradient>
          <pattern id="labgrid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M25 0H0v25" fill="none" stroke="#adc0ce" strokeWidth=".5" />
          </pattern>
        </defs>
        <rect width="800" height="440" fill="url(#wall)" />
        <rect width="800" height="440" fill="url(#labgrid)" opacity=".35" />
        <path d="M0 117h800M0 119h800" stroke="#c7d7cf" />
        <rect x="272" y="37" width="259" height="65" rx="6" fill="#f4f6ee" stroke="#b5c8bd" />
        <circle cx="292" cy="59" r="4" fill="#078776" />
        <text x="305" y="63" fontSize="11" fontFamily="monospace" letterSpacing="2" fill="#527773">
          LAB JARINGAN / 01
        </text>
        <text x="291" y="83" fontSize="10" fontFamily="monospace" fill="#79918a">
          KONEKSI ETHERNET LANGSUNG
        </text>
        <path d="M0 350h800v27H0z" fill="#c7c8b5" />
        <path d="M0 375h800v65H0z" fill="#b6b9a8" />
        <path d="M0 375h800" stroke="#9ca795" strokeWidth="3" />
        <Computer x={22} label="KOMPUTER 01" live={live} />
        <Computer x={453} label="KOMPUTER 02" live={live} />
        <path
          d="M299 328v47q0 22 30 22h190q29 0 29-22v-47"
          fill="none"
          stroke="#7f8f83"
          strokeWidth="10"
        />
        <path
          d="M299 328v47q0 22 30 22h190q29 0 29-22v-47"
          fill="none"
          stroke="#e7b85a"
          strokeWidth="6"
        />
        {live && (
          <path
            className="lab-signal-flow"
            d="M299 328v47q0 22 30 22h190q29 0 29-22v-47"
            fill="none"
            stroke="#b6ffde"
            strokeWidth="4"
            strokeDasharray="10 18"
          />
        )}
        <rect
          x="354"
          y="333"
          width="80"
          height="39"
          rx="5"
          fill="#315866"
          transform="rotate(-8 394 350)"
        />
        <path d="M368 343h31m-31 6h31" stroke="#92beb8" strokeWidth="2" />
        <circle cx="420" cy="346" r="3" fill="#bcd18c" />
        <g transform="translate(740 87)">
          <path d="M0 41Q-35 7-8 0Q7 8 0 41M0 41Q24 1 36 11Q39 30 0 41" fill="#699c80" />
          <path d="M-17 37h40l-5 35h-30z" fill="#d1aa84" />
        </g>
        <text x="24" y="422" fontSize="10" fontFamily="monospace" fill="#4e675c">
          CAT5e · 4 PASANG BERPILIN
        </text>
        <text x="614" y="422" fontSize="10" fontFamily="monospace" fill="#4e675c">
          {live ? 'TX / RX TERHUBUNG' : 'MENUNGGU INVESTIGASI'}
        </text>
      </svg>
      {onInspect && (
        <>
          <button className="hotspot pc-one" onClick={() => onInspect('devices')}>
            <ScanLine size={16} />
            Periksa PC-01
          </button>
          <button className="hotspot pc-two" onClick={() => onInspect('devices')}>
            <ScanLine size={16} />
            Periksa PC-02
          </button>
          <button className="hotspot cable-spot" onClick={() => onInspect('existing')}>
            <ScanLine size={16} />
            Uji kabel tersedia
          </button>
        </>
      )}
      <div className="scene-caption">
        <span className={`status-dot ${live ? 'green' : 'amber'}`} />
        {live ? 'Jalur aktif 10/100 terhubung dalam model' : 'Link belum terbentuk'}
        <span>Laboratorium sekolah</span>
      </div>
    </div>
  )
}
