# Cakupan verifikasi CrossLink

## Persiapan deployment Vercel — 27 Oktober 2026

- Konfigurasi Vercel tersedia di `vercel.json`: preset Vite, build `npm run build`, hasil `dist`, dan installer pnpm 11.25.0 dengan `--frozen-lockfile`. Node dipatok ke 24.x; Vite menetapkan output `dist` dan menonaktifkan source map produksi.
- Installer yang sama berhasil dijalankan. `npm run build` lulus TypeScript dan Vite; `npm test` lulus **62/62 tes pada 5 berkas**. Runtime lokal tidak menyertakan npm di PATH, sehingga npm 11.6.2 dijalankan melalui `pnpm --package=npm@11.6.2 dlx npm ...`; dependency proyek tetap mengikuti lockfile pnpm.
- Server preview hasil produksi mengembalikan HTTP 200 untuk halaman `/` pada dua permintaan berturut-turut dan seluruh **20 file hasil build**, termasuk JS, CSS, font, enam foto, favicon, kredit, serta lisensi. Isi setiap respons aset sama dengan file di `dist`; tidak ada aset hilang atau file `.map` produksi. Ini pemeriksaan HTTP lokal, bukan deployment cloud atau pengujian browser visual baru.
- Tidak ditemukan route pathname, React Router, atau History API. Refresh tetap pada URL `/`; karena itu rewrite tidak dibutuhkan untuk versi ini. Pemeriksaan nama file menemukan tidak ada import/aset hilang atau perbedaan kapitalisasi path; build Linux Vercel belum dijalankan.
- Pemeriksaan pola rahasia dan tinjauan sumber frontend tidak menemukan API key, token akses, kredensial, atau private key pada berkas yang diperiksa. Tidak ada `.env*` di root. `.gitignore` ditambah perlindungan `.env`, `.env.*`, `.vercel/`, dan log lokal; aturan ignore diperiksa dengan Git.
- Tidak ada perubahan kode gameplay, desain, atau schema sesi pada persiapan deployment. Proyek belum dipublikasikan ke akun Vercel. Langkah publikasi dan pengecekan URL production ada di [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md).

Pembaruan setelah audit **27 Oktober 2026** mencakup tiga tiket troubleshooting, pemeriksaan rancangan sebelum crimp, pemulihan arah MAIN, draft tester, migrasi sesi v1→v2, dan antarmuka mobile. Rincian baseline audit disimpan dalam [audit fitur](AUDIT-FITUR-MVP.md).

## Pemeriksaan otomatis

Jalankan `pnpm test` dan `pnpm build` dari folder proyek. Tes integrasi menggunakan React Testing Library dan DOM simulasi; hasilnya tidak sama dengan pengujian perangkat sentuh fisik atau sertifikasi kabel.

Hasil pemeriksaan akhir pembaruan **27 Oktober 2026**:

- `pnpm test`: **62/62 pengujian lulus** pada 5 berkas setelah pembaruan animasi dan bahasa siswa.
- `pnpm build`: **berhasil**, termasuk TypeScript strict dan build Vite.
- Build hanya memunculkan peringatan anotasi komentar pihak ketiga pada Zod; peringatan tersebut tidak menggagalkan build.

Baseline sebelum pembaruan adalah 41 tes pada 3 berkas. Angka itu dipertahankan sebagai riwayat dalam audit awal; pembaruan mobile sebelumnya mencapai 59 tes. Hasil terbaru setelah pembaruan animasi adalah 62 tes di atas.

Cakupan yang diperiksa/diperluas:

- V01–V12: A–B/B–A, straight-through, open pin 6 ujung 2, miswire 4/5, peta benar dengan susunan nonstandar, jaket longgar, slot kosong, duplikasi, arah MAIN terbalik, kedaluwarsa revisi, dan determinisme.
- Penelusuran identitas konduktor pada 50 permutasi deterministik.
- Prosedur keselamatan, penguncian sesudah crimp, penukaran slot, undo penempatan normal, dan reset satu ujung tanpa mengubah ujung lain.
- Pemeriksaan rancangan pra-crimp yang tidak bergantung pada kontak listrik: susunan lengkap A–B/B–A dapat sesuai meskipun konektor belum di-crimp; susunan salah atau belum lengkap tidak lulus.
- Empat pekerjaan terpisah: kabel kelompok, open RP–01, miswire RP–02, serta straight-through RP–03. Masing-masing tiket membutuhkan bukti sebelum/sesudah dan keputusan perbaikan.
- Pemulihan arah MAIN beserta peta tersimpan pada kasus asimetris, serta penyimpanan prediksi dan mode tester per pekerjaan.
- Snapshot kabel, kemajuan berbasis bukti, feedback keputusan, dan hipotesis salah yang tetap dapat diuji.
- Round-trip sesi v2, migrasi v1 yang mempertahankan progres, penolakan impor tidak valid, data lokal rusak, dan kegagalan storage.
- Data laporan nyata: pilihan/alasan, kedua susunan, peta sebelum/sesudah, arah MAIN, diagnosis, serta tindak lanjut.
- Kontrol keyboard dan kontrol sentuh non-drag, tester manual/otomatis, perakitan dari kosong, serta siklus diagnosis → terminasi ulang → uji ulang → laporan.
- Pembuatan ID sesi/tes pada browser HTTP LAN yang tidak menyediakan `crypto.randomUUID`, melalui fallback berbasis `crypto.getRandomValues`.

## Pemeriksaan browser dan mobile sebelum pembaruan animasi

Catatan browser di bawah berasal dari pemeriksaan versi mobile sebelumnya. Pemeriksaan visual ulang untuk perubahan animasi/bahasa terbaru belum dapat dijalankan: alat browser gagal memulai karena berkas runtime tidak tersedia. Hasil viewport sebelumnya tidak diklaim sebagai pengujian ulang CSS animasi terbaru.

Pengujian antarmuka dilakukan melalui browser dalam aplikasi (IAB) pada server QA port 5175, dengan interaksi melalui kontrol permainan. Ini pengujian browser nyata pada ukuran viewport berbeda, bukan pengujian layar sentuh HP fisik.

### Alur lengkap yang dijalankan

1. Mulai dari welcome, briefing, dan papan kasus.
2. Kumpulkan tiga bukti dan identifikasi enam perlengkapan.
3. Pilih hipotesis straight-through, amati feedback, lalu revisi menjadi crossover.
4. Susun kabel kelompok A–B, selesaikan crimp, dan lakukan pengujian.
5. Ukur serta perbaiki open RP–01; ukur miswire RP–02 dengan MAIN di Ujung 2 lalu terminasi ulang; ubah straight-through B/B pada RP–03 menjadi B–A dan uji ulang.
6. Capai **4/4 pekerjaan**, buka laporan, isi refleksi, dan muat ulang halaman untuk memeriksa pemulihan sesi.

Tidak ada error konsol yang teramati pada alur tersebut. Laporan dan pengujian mempertahankan arah MAIN sesuai data hasilnya.

### Viewport dan kontrol mobile

Workshop, tester, dan laporan diperiksa pada:

| Viewport | Hasil lebar halaman                                                 |
| -------- | ------------------------------------------------------------------- |
| 360×800  | `scrollWidth == clientWidth`; tidak ada overflow horizontal halaman |
| 390×844  | `scrollWidth == clientWidth`; tidak ada overflow horizontal halaman |
| 768×1024 | `scrollWidth == clientWidth`; tidak ada overflow horizontal halaman |
| 1280×800 | `scrollWidth == clientWidth`; tidak ada overflow horizontal halaman |
| 1366×768 | `scrollWidth == clientWidth`; tidak ada overflow horizontal halaman |

- Target pin terukur sekurang-kurangnya 48 piksel. Kontrol pin inline terukur setinggi 72 piksel; panel tujuan tetap setinggi 67 piksel per tombol, dengan lebar sekitar 67 piksel pada viewport 360 dan 75 piksel pada viewport 390.
- Pilih konduktor → pilih pin, batal, pengosongan pin, dan undo diverifikasi melalui browser tanpa drag.
- Navigasi mobile menyembunyikan/inert-kan area utama dan mengunci scroll latar ketika terbuka; dialog pengaturan dapat dioperasikan.
- Pengurangan animasi menghasilkan animasi `none`; tester langkah manual tetap berfungsi.
- Diagram delapan pin, panel pilihan di bawah, dan layout satu kolom diperiksa pada viewport ponsel.

Hasil ini tidak memperluas klaim ke perangkat HP fisik, pembaca layar, atau printer sekolah yang belum diuji.

## Menjalankan uji mobile/LAN

Pada komputer: `pnpm build`, lalu jalankan `Start-CrossLink-Mobile.cmd`. Mode ini melayani `dist/` pada `0.0.0.0:5174`. Pada HP, buka `http://ALAMAT-IP-KOMPUTER:5174/` sesuai keluaran launcher. Jangan menggunakan `127.0.0.1` pada HP untuk mengakses komputer.

Pemeriksaan launcher LAN yang sudah dijalankan:

- Launcher `--lan --no-open` melayani build produksi pada `0.0.0.0:5174`.
- Permintaan HTTP memperoleh status **200** melalui loopback dan dua alamat IPv4 adapter LAN komputer yang sama.
- Browser IAB membuka salah satu alamat IPv4 LAN tersebut pada viewport 390×844, membuat kelompok/sesi, membuka briefing, dan memuat ulang dengan progres tetap pulih.
- Tidak ada kegagalan pemuatan gambar atau error konsol yang teramati pada pemeriksaan asal LAN tersebut.

Koneksi dari **HP fisik/perangkat lain** dan jangkauan melewati firewall jaringan sekolah belum diuji. Pemeriksaan alamat LAN dari komputer sendiri tidak membuktikan perangkat lain sudah diizinkan mengaksesnya.

Tidak ada perubahan firewall otomatis dan tidak ada publikasi internet. Progres setiap browser/origin terpisah; ekspor/impor JSON diperlukan saat pindah perangkat atau alamat. Instalasi PWA belum termasuk cakupan.

## Masih memerlukan verifikasi guru/perangkat nyata

- Kesesuaian alat sekolah dan posisi fisik pin pada konektor yang dipakai.
- Prosedur keselamatan serta ukuran pengupasan/pemotongan dari produsen.
- Uji siswa Kelas X dalam alokasi dua pertemuan 90 menit, kini dengan tiga tiket khusus; sesuaikan fasilitasi berdasarkan waktu nyata.
- Observasi individual keterampilan fisik TP4.
- Uji sentuh fisik, pembaca layar, jaringan sekolah, serta hasil cetak pada printer sekolah.

## Batas model

Model link hanya menelusuri jalur aktif 10/100 pada kondisi kasus. Tidak memodelkan kualitas analog, negosiasi nyata, Auto-MDI/MDIX, IP, panjang, short, atau pengukuran split pair. Seluruh delapan pin tetap diwajibkan untuk memenuhi spesifikasi latihan.

Tidak ada penilaian otomatis semantik untuk alasan atau refleksi. Sesi lokal dapat diedit dan tidak dimaksudkan sebagai mekanisme nilai yang tahan manipulasi. TP4 tetap memerlukan praktik fisik dan pengamatan guru.

## Animasi dan pertanyaan sederhana — 27 Oktober 2026

- Pertanyaan dugaan, hasil tester, bukti, perbaikan, dan refleksi dipersingkat. Setiap jawaban bebas memiliki petunjuk untuk menjawab singkat dengan kata sendiri. Bukti, alasan sebab-akibat, dan syarat misi tetap dipertahankan.
- Animasi singkat mengikuti pemilihan/penempatan konduktor, tahap pemasangan dan crimp, sambungan tester, LED, temuan bukti, serta penyelesaian pekerjaan. Tidak ada animasi dekoratif tanpa batas atau jeda wajib sebelum siswa bisa melanjutkan.
- Jalur visual tester memakai peta pin dari engine yang sama. Jalur open berhenti sebelum REMOTE dan tetap memiliki penjelasan teks.
- Model dua PC menampilkan aliran hanya ketika jalur aktif 10/100 pada model terhubung; ini tetap bukan sertifikasi kabel nyata.
- Pengaturan Kurangi animasi dan prefers-reduced-motion menghentikan animasi; informasi teks dan pengujian manual tetap tersedia.
- Tiga tes tambahan memeriksa jalur open pada readout, perubahan petunjuk tahap tanpa mengisi jawaban, dan aliran link yang hanya muncul pada kondisi terhubung. Suite penuh 62/62 lulus dan TypeScript/Vite build berhasil.
- Pemeriksaan visual ulang pada desktop dan HP fisik masih diperlukan. Perubahan tidak memodifikasi schema sesi atau data kabel tersimpan.
