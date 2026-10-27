import type { CaseId } from './domain/cable'

export const EVIDENCE = [
  {
    id: 'power',
    title: 'Perangkat beroperasi',
    source: 'Panel kedua PC',
    text: 'PC-01 dan PC-02 menyala. NIC keduanya aktif; indikator link belum menyala.',
  },
  {
    id: 'ports',
    title: 'Spesifikasi port Ethernet',
    source: 'Label NIC kedua PC',
    text: 'Kedua port bertipe MDI, 10BASE-T/100BASE-TX, tanpa Auto-MDI/MDIX.',
  },
  {
    id: 'existing',
    title: 'Peta kabel tersedia',
    source: 'Uji kabel tersedia',
    text: 'MAIN 1–8 terhubung ke REMOTE 1–8 secara berurutan. Semua jalur memiliki kontinuitas.',
  },
] as const
export const CASES: { id: CaseId; label: string; code: string; description: string }[] = [
  {
    id: 'own',
    label: 'Kabel kelompok',
    code: 'CL–01',
    description: 'Buktikan bahwa kabel buatan kelompokmu memenuhi kebutuhan kasus.',
  },
  {
    id: 'open',
    label: 'Tiket perbaikan 01',
    code: 'RP–01',
    description:
      'Sebuah kabel belum lolos pemeriksaan. Ukur jalurnya, lalu selidiki kedua konektor.',
  },
  {
    id: 'miswire',
    label: 'Tiket perbaikan 02',
    code: 'RP–02',
    description: 'Indikator link saja belum cukup. Periksa seluruh delapan jalur kabel ini.',
  },
  {
    id: 'straight',
    label: 'Tiket perbaikan 03',
    code: 'RP–03',
    description:
      'Kabel tampak utuh, tetapi dua komputer lama belum membentuk link. Uji petanya dan periksa kecocokannya dengan kedua port.',
  },
]

export function decisionFeedback(
  choice: string,
  evidenceIds: readonly string[],
): {
  tone: 'success' | 'amber'
  title: string
  message: string
} {
  if (!evidenceIds.includes('ports'))
    return {
      tone: 'amber',
      title: 'Hubungkan dugaan dengan spesifikasi port',
      message:
        'Periksa spesifikasi port kedua PC. Apakah sambungannya bisa menyesuaikan secara otomatis?',
    }
  if (!evidenceIds.includes('existing'))
    return {
      tone: 'amber',
      title: 'Bandingkan dengan pengukuran kabel tersedia',
      message: 'Uji kabel yang tersedia. Pin mana yang tersambung? Catat hasilnya sebagai bukti.',
    }
  if (choice === 'straight')
    return {
      tone: 'amber',
      title: 'Dugaan tersimpan; tinjau jalur sinyal',
      message:
        'Kabel awal sudah lurus, tetapi PC belum terhubung. Apakah jalur pengirim bertemu penerima? Periksa bukti port kedua PC. Kamu boleh menguji dugaanmu.',
    }
  if (choice === 'rollover')
    return {
      tone: 'amber',
      title: 'Dugaan tersimpan; periksa kebutuhan koneksi',
      message:
        'Kedua PC memakai port Ethernet. Apakah kabel pilihanmu dipakai untuk sambungan Ethernet? Periksa referensinya. Kamu boleh menguji dugaanmu.',
    }
  if (choice === 'crossover')
    return {
      tone: 'success',
      title: 'Dugaan memiliki bukti pendukung',
      message:
        'Bukti port dan kabel awal sudah dicatat. Sekarang buat kabelnya, lalu buktikan dengan tester.',
    }
  return {
    tone: 'amber',
    title: 'Pilih dugaan yang akan diuji',
    message:
      'Gunakan bukti kondisi port dan pengukuran kabel untuk menentukan jenis kabel beserta alasannya.',
  }
}
export const CAPABILITIES = [
  { id: 'carry', name: 'Menghantarkan sinyal' },
  { id: 'connect', name: 'Menghubungkan delapan kontak' },
  { id: 'strip', name: 'Mengupas jaket luar' },
  { id: 'cut', name: 'Memotong / meratakan' },
  { id: 'crimp', name: 'Menekan kontak konektor' },
  { id: 'test', name: 'Menguji kontinuitas pin' },
]
export const TOOLS = [
  {
    id: 'cable',
    name: 'Kabel UTP',
    code: '01',
    detail:
      'Empat pasang konduktor berpilin membawa sinyal. Jaket melindungi pasangan di dalamnya.',
    capabilities: ['carry'],
    photo: '/assets/cable.jpg',
    cue: 'Perhatikan empat pasangan konduktor yang dipilin.',
  },
  {
    id: 'connector',
    name: 'Konektor 8P8C',
    code: '02',
    detail: 'Delapan posisi dan delapan kontak. Konektor latihan ini tertutup di bagian depan.',
    capabilities: ['connect'],
    photo: '/assets/connector.jpg',
    cue: 'Cari delapan kontak, kait pengunci, dan tempat masuk kabel.',
  },
  {
    id: 'stripper',
    name: 'Cable stripper',
    code: '03',
    detail: 'Mengupas jaket luar. Sesuaikan kedalaman agar isolasi konduktor tidak terluka.',
    capabilities: ['strip'],
    photo: '/assets/stripper.jpg',
    cue: 'Cari bagian pemotong jaket dan celah tempat kabel.',
  },
  {
    id: 'cutter',
    name: 'Tang pemotong',
    code: '04',
    detail: 'Memotong kabel dan meratakan ujung konduktor. Jauhkan jari dari mata potong.',
    capabilities: ['cut'],
    photo: '/assets/cutter.jpg',
    cue: 'Perhatikan kedua mata potong di bagian kepala.',
  },
  {
    id: 'crimper',
    name: 'Tang crimp multifungsi',
    code: '05',
    detail: 'Menekan kontak konektor. Model multifungsi ini juga memiliki pemotong dan pengupas.',
    capabilities: ['crimp', 'cut', 'strip'],
    photo: '/assets/crimper.jpg',
    cue: 'Cari cetakan 8P untuk konektor dan bagian pemotong/pengupas.',
  },
  {
    id: 'tester',
    name: 'LAN tester + remote',
    code: '06',
    detail:
      'Menguji kontinuitas dan pemetaan pin. Tidak mengukur bandwidth atau sertifikasi kualitas kabel.',
    capabilities: ['test'],
    photo: '/assets/tester.jpg',
    cue: 'Perhatikan unit MAIN, REMOTE, port, dan indikator pin.',
  },
]
export const HINTS: Record<string, string[]> = {
  investigation: [
    'Apakah kedua PC sudah menyala? Bagaimana lampu link-nya?',
    'Buka spesifikasi port kedua PC. Apakah port bisa menyesuaikan sambungan secara otomatis?',
    'Lihat hasil tester kabel awal. Semua pin tersambung, tetapi PC belum terhubung. Apakah jalur kabel cocok dengan kedua port?',
  ],
  workshop: [
    'Sudahkah setiap pin terisi satu konduktor?',
    'Periksa urutan pin 1 sampai 8. Samakan arah konektor dengan gambar referensi.',
    'Bandingkan satu per satu dengan referensi T568A/T568B. Periksa juga apakah konduktor mencapai depan konektor.',
  ],
  testing: [
    'Lihat satu baris tabel tester. Pin MAIN tersambung ke mana?',
    'Adakah pin yang tidak tersambung atau menuju pin lain? Periksa kedua konektor sebelum menentukan letak masalah.',
    'Cocokkan urutan warna dan kedalaman konduktor dengan hasil tester. Gunakan referensi untuk memeriksa semua delapan jalur.',
  ],
}
export const SCHEDULE = [
  [
    'Pertemuan 1',
    '10′ orientasi · 10′ organisasi · 20′ investigasi · 25′ workshop · 15′ uji · 10′ diskusi',
  ],
  [
    'Pertemuan 2',
    '5′ tinjauan · 20′ diagnosis · 40′ praktik fisik · 15′ presentasi · 10′ refleksi',
  ],
]
