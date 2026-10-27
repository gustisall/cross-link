# Deployment CrossLink melalui Vercel

Persiapan diperiksa pada **27 Oktober 2026 (Asia/Jakarta)**. Perubahan hanya menyentuh konfigurasi build, perlindungan file lokal, dan dokumentasi. Kode gameplay, komponen, CSS, konten pembelajaran, serta format sesi tidak diubah.

## Konfigurasi yang disiapkan

| Pengaturan | Nilai |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | Folder yang berisi `package.json` dan `vercel.json` |
| Node.js | `24.x`, mengikuti `engines.node` pada `package.json` |
| Install Command | `npx --yes pnpm@11.25.0 install --frozen-lockfile` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment variables aplikasi | Tidak diperlukan |

`vercel.json` menyimpan preset, installer, build command, dan output directory. Vite juga menetapkan `build.outDir: 'dist'` secara eksplisit, dengan source map produksi dinonaktifkan. `tsc -b` tetap dijalankan sebelum Vite sehingga kesalahan TypeScript menggagalkan build.

Proyek mempertahankan `pnpm-lock.yaml` sebagai lockfile acuan. Penggunaan `npm run build` hanya menjalankan script build; instalasi dependency tetap memakai versi pnpm yang dipin. Installer eksplisit menghindari pemilihan pnpm lama berdasarkan format lockfile. Pengaturan Corepack tambahan tidak diperlukan untuk installer ini.

## Langkah publikasi

1. Push sumber proyek ke repository GitHub yang dapat diakses akun Vercel Anda. Sertakan `src/`, `public/`, `index.html`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `vite.config.ts`, dan `vercel.json`. File lokal yang tercantum pada `.gitignore` tidak perlu diunggah.
2. Buka dashboard Vercel, pilih **Add New → Project**, lalu impor repository tersebut.
3. Pilih root directory yang memuat `package.json`. Jika proyek berada langsung di root repository, gunakan root repository.
4. Periksa bahwa Vercel memakai konfigurasi pada tabel di atas. Tidak perlu mengisi API key atau environment variable aplikasi.
5. Klik **Deploy** dan baca build log. Pastikan instalasi memakai pnpm **11.25.0**, TypeScript lulus, Vite membangun, dan hasil berada di `dist`.
6. Setelah status **Ready**, buka URL deployment dari dashboard. Gunakan satu URL production yang tetap untuk pembelajaran.

Build/upload jarak jauh di Vercel belum dijalankan dalam persiapan ini. Status Ready dan akses URL publik harus dikonfirmasi setelah deployment melalui akun Anda.

## Routing dan refresh halaman

Navigasi game menggunakan `state.screen` pada reducer React dan tetap berada di URL `/`. Proyek tidak memakai React Router, `BrowserRouter`, History API, atau route pathname. Saat halaman dimuat ulang, Vercel melayani `dist/index.html`; aplikasi memulihkan sesi dari `localStorage` pada browser tersebut. Karena tidak ada route URL yang harus diterjemahkan ke HTML, **rewrite tidak diperlukan pada versi sekarang**.

Jika nanti ditambahkan route URL seperti `/workshop` melalui client-side router, tambahkan properti berikut pada `vercel.json`, sambil mempertahankan pengaturan build yang sudah ada:

```json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

Konfigurasi tersebut baru diperlukan ketika route URL benar-benar digunakan. Uji membuka langsung dan me-refresh setiap route setelah perubahan routing.

## Pemeriksaan setelah website terbit

- Buka URL production pada laptop dan HP; pastikan game, foto perlengkapan, font, favicon, dan referensi tampil.
- Mulai sesi percobaan menggunakan alias, pindah layar, lalu refresh. Pastikan kembali ke sesi yang sama pada URL dan browser yang sama.
- Periksa `/assets/credits.json` serta foto alat dari URL production untuk memastikan aset statis terlayani.
- Coba ekspor/impor JSON dan laporan cetak/PDF sebelum digunakan di kelas.
- Tetap lakukan pengamatan praktik fisik individual untuk TP4.

Progres dari localhost tidak otomatis pindah ke domain Vercel. Ekspor JSON dari sesi lama, lalu impor pada website publik. Progres juga terpisah antarbrowser/perangkat dan antar-URL deployment; tidak ada dashboard guru atau sinkronisasi server pada versi ini. Website publik memerlukan koneksi internet; launcher lokal dapat dipertahankan sebagai cadangan.

## Keamanan sumber frontend

Pemeriksaan pola rahasia dan tinjauan kode tidak menemukan API key, token akses, kredensial, atau private key pada sumber frontend dan file teks proyek yang diperiksa. Tidak ada `.env*` pada root saat pemeriksaan. Request aplikasi hanya mengambil aset kredit lokal; tidak ada backend, analytics, atau layanan AI yang memerlukan kredensial.

`.gitignore` kini mengecualikan `.env`, `.env.*`, `.vercel/`, dan log lokal, dengan pengecualian `.env.example` untuk template tanpa rahasia. `dist/`, `node_modules/`, dan data pengujian juga tetap diabaikan. Pemeriksaan ini tidak menjamin semua bentuk rahasia dapat terdeteksi; tinjau file baru sebelum push berikutnya.

Jangan menaruh rahasia pada `src/`, `public/`, atau environment variable berawalan `VITE_`: data frontend yang dibundel dapat dibaca pengguna. Jika kelak ada fitur yang memerlukan kunci rahasia, simpan dan gunakan kunci tersebut pada backend.

## Verifikasi lokal

Hasil pengujian deployment lokal dicatat di bagian terbaru [VALIDATION.md](VALIDATION.md). Pemeriksaan lokal bukan bukti deployment cloud sudah berhasil.

Referensi: [Vite di Vercel](https://vercel.com/docs/frameworks/frontend/vite), [konfigurasi build](https://vercel.com/docs/builds/configure-a-build), [package manager](https://vercel.com/docs/package-managers), dan [versi Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
