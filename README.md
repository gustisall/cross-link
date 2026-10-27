# CrossLink: Cable Technician

Simulator teknisi jaringan berbasis **React + TypeScript + Vite** untuk siswa SMK Kelas X. Pemain mengumpulkan bukti, merakit kabel UTP crossover, mengoperasikan tester, mendiagnosis, memperbaiki, dan menyajikan hasil. Seluruh logika berjalan lokal tanpa backend atau layanan AI.

## Menjalankan

**Di Windows pada workspace ini:** klik dua kali `Start-CrossLink.cmd`. Browser akan terbuka otomatis ke [CrossLink lokal](http://127.0.0.1:5173/). Launcher memakai Node dari PATH, atau Node bundel Codex bila tersedia. Jika server sudah berjalan, launcher memakai server tersebut tanpa menyalakan server kedua. Jika launcher memulai server baru, biarkan terminal tetap terbuka selama bermain; tekan Ctrl+C untuk berhenti.

**Jangan klik `index.html` untuk menjalankan game.** File itu merupakan titik masuk proyek React/Vite dan membutuhkan server lokal. Bila dibuka langsung dari folder, halaman menampilkan petunjuk membuka launcher dan tautan game lokal.

**Instalasi pada komputer lain:** siapkan Node.js 24.x dan pnpm 11.25.0 (versi penguncian proyek), lalu:

```sh
pnpm install
pnpm dev
```

Alternatif dengan Node/npm standar: `npm install`, lalu `npm run dev`. Lockfile acuan proyek adalah `pnpm-lock.yaml`; gunakan pnpm untuk instalasi yang mengikuti versi terkunci. Instalasi awal membutuhkan internet atau cache paket. **Permainan tidak membutuhkan internet** setelah server lokal berjalan: foto, font, konten, dan engine disertakan di proyek.

```sh
pnpm test          # unit, komponen, dan integrasi alur React
pnpm build         # pemeriksaan TypeScript + build produksi
pnpm preview       # melayani dist/ secara lokal
```

Jangan membuka `index.html` langsung melalui `file://`. Server bind ke `127.0.0.1`. Port dev default 5173; preview 4173. Penyimpanan mengikuti origin browser: gunakan ekspor/impor bila berpindah port atau komputer.

### Publikasi melalui Vercel

Proyek memiliki `vercel.json` dengan preset **Vite**, build command **`npm run build`**, dan output **`dist`**. Versi Node dipatok ke **24.x** pada `package.json`. Installer Vercel memakai `npx --yes pnpm@11.25.0 install --frozen-lockfile` agar mengikuti `pnpm-lock.yaml` dan pengaturan build dependency proyek. Tidak diperlukan API key atau environment variable untuk menjalankan game.

Push sumber proyek ke repository GitHub, lalu impor repository tersebut melalui **Add New → Project** di Vercel. Pilih root directory yang berisi `package.json`, periksa pengaturan di atas, lalu deploy. Petunjuk lengkap, hasil pemeriksaan, dan cara memeriksa versi yang terbit ada di [panduan deployment Vercel](docs/DEPLOY-VERCEL.md).

Navigasi saat ini memakai state pada URL `/`, tanpa route seperti `/workshop`; rewrite URL tidak diperlukan. Ekspor sesi sebelum berpindah dari localhost ke domain Vercel karena penyimpanan mengikuti browser dan alamat website. Setelah dipublikasikan, siswa dapat menggunakan URL Vercel tanpa menjalankan launcher atau menyalakan komputer pengembang.

### Membuka dari HP / tablet pada Wi-Fi yang sama

1. Hubungkan komputer dan HP ke jaringan Wi-Fi lokal yang sama.
2. Pada komputer, jalankan `pnpm build` terlebih dahulu. Ini menyiapkan folder `dist/` yang digunakan mode mobile/LAN.
3. Klik dua kali **`Start-CrossLink-Mobile.cmd`**. Biarkan jendela server tetap terbuka.
4. Baca alamat LAN yang ditampilkan launcher, lalu buka alamat tersebut di browser HP. Bentuknya `http://ALAMAT-IP-KOMPUTER:5174/`, misalnya `http://192.168.1.10:5174/` jika itu IPv4 komputer pada jaringan tersebut.

`127.0.0.1` atau `localhost` di HP menunjuk ke HP itu sendiri, bukan komputer. Gunakan **alamat IP komputer** yang dicetak launcher. Mode mobile memakai `--lan`, melayani hasil build pada `0.0.0.0:5174`, dan tidak memublikasikan game ke internet. Jalankan `pnpm build` lagi setelah kode diubah, kemudian mulai ulang launcher mobile.

Jika HP belum dapat terhubung, pastikan alamat benar, server masih berjalan, serta jaringan tidak memakai isolasi perangkat seperti sebagian Wi-Fi tamu. Firewall komputer juga dapat membatasi koneksi masuk; launcher tidak mengubah pengaturan firewall secara otomatis. Mode komputer biasa tetap tersedia melalui `Start-CrossLink.cmd` pada localhost port 5173.

Antarmuka mobile menyediakan kontrol sentuh untuk menempatkan konduktor tanpa drag, navigasi yang dapat dibuka/tutup, panel satu kolom, dan area aman pada layar berponi. Ukuran teks input minimum 16 piksel membantu mencegah pembesaran otomatis saat mengetik pada browser ponsel. Mode ini berjalan di browser; instalasi aplikasi/PWA belum menjadi fitur versi ini.

Progres tersimpan **terpisah pada setiap browser dan alamat server**. Untuk memindahkan sesi komputer ke HP atau beralih antara port 5173 dan 5174, ekspor JSON dari sesi awal lalu impor pada browser tujuan. Tidak ada sinkronisasi kelompok otomatis.

## Alur yang tersedia

1. **Orientasi & papan kasus:** identitas kelompok 2–3 siswa, dugaan, pertanyaan, rencana.
2. **Investigasi:** kondisi kedua NIC, spesifikasi port, pengukuran kabel tersedia, enam foto perlengkapan, keputusan berbasis bukti. Dugaan salah tetap bisa diuji.
3. **Workshop:** pilih alat, keselamatan, kupas, buka pasangan, tempatkan konduktor, periksa rancangan, ratakan, masukkan, inspeksi, crimp. Klik/tap atau keyboard menjadi interaksi utama; drag tersedia sebagai alternatif.
4. **Testing:** hubungkan MAIN/REMOTE, power, prediksi, scan otomatis atau manual, interpretasi pin. Hasil berasal dari model kabel.
5. **Repair:** empat pekerjaan: kabel kelompok, open (RP–01), miswire 4/5 (RP–02), dan straight-through yang belum sesuai kebutuhan dua port MDI lama (RP–03). Lakukan uji awal sebelum memperbaiki setiap tiket.
6. **Laporan & refleksi:** bukti TP, riwayat keputusan, pengujian, diagnosis, bantuan, refleksi individu, serta rubrik cetak observasi fisik.

Tidak ada timer penilaian, leaderboard, nyawa, penalti percobaan, atau pengurangan nilai karena bantuan.

## Kontrol workshop

- Pilih konduktor, lalu pin tujuan. Enter/Spasi mengoperasikan tombol; Delete/Backspace pada slot mengosongkannya.
- Penempatan pada konduktor yang sudah terpasang menukar posisi. Penempatan dari baki mengembalikan penghuni slot lama ke baki.
- Sebelum crimp, penempatan terakhir dapat diurungkan. Setelah crimp, pilih alat pemotong dan ganti konektor untuk mengubahnya.
- Pilihan “Rencana standar” menyimpan niat; tidak mengisi susunan atau mengubah penilaian aktual.
- **Periksa Rancangan** mengevaluasi kelengkapan dan kombinasi standar kedua ujung sebelum crimp. Pemeriksaan ini tidak menilai kontak listrik, tidak mengisi jawaban otomatis, dan tidak menggantikan pengujian tester setelah pemasangan.
- Inspeksi detail menunjukkan kedalaman tiap konduktor dan posisi jaket. Sesudah mengubah kondisi, lakukan pemeriksaan ulang sebelum crimp.

Pada layar selebar 600 piksel atau kurang, diagram konektor menampilkan delapan pin secara utuh dalam orientasi kiri-ke-kanan yang benar. Gunakan kontrol sentuh berlabel untuk menempatkan konduktor; tidak perlu menyeret. Ketika konduktor dipilih, panel tujuan pin dapat muncul di bagian bawah dengan delapan tombol besar dan tombol batal. Nama konduktor tetap ditampilkan; tombol “Kosongkan pin” tersedia sebelum crimp untuk posisi yang terisi. Panel ini memakai target sentuh sekurang-kurangnya 48 piksel.

## Arsitektur

- `src/domain/cable.ts`: engine murni untuk konduktor, kontak, pemetaan, standar, link indikatif, dan pemasangan.
- `src/domain/session.ts`: reducer, snapshot pengujian, revisi kabel, keputusan, bantuan, dan kemajuan.
- `src/domain/persistence.ts`: validasi Zod, autosave, ekspor/impor JSON versi 2, serta migrasi sesi versi 1.
- `src/screens/`: alur belajar; `src/components/`: konektor, tester, ilustrasi laboratorium.
- `src/content.ts`: bukti, perlengkapan, petunjuk, dan alokasi waktu.
- `public/assets/`: enam foto nyata dengan kredit dan lisensi; Inter disertakan melalui paket lokal.

Animasi dan tabel tester membaca peta yang sama. Snapshot hasil uji tidak berubah ketika kabel diperbaiki; revisi lama tidak dapat meluluskan revisi baru.

Hasil tester tersimpan menyertakan arah MAIN/REMOTE. Tampilan membedakan arah hasil historis dari konfigurasi scan baru; draft prediksi, pilihan MAIN, dan mode pengujian disimpan per pekerjaan agar dapat dilanjutkan setelah pindah layar.

## Batas teknis dan asesmen

Konteks hanya dua port MDI 10BASE-T/100BASE-TX tanpa Auto-MDI/MDIX. A–B maupun B–A diterima, dengan peta `3,6,1,4,5,2,7,8`.

Kesesuaian standar, kontinuitas, dan pemasangan dinilai terpisah. Kerusakan pada jalur di luar pin 1/2/3/6 dapat menggagalkan spesifikasi delapan pin tanpa mematikan model link 10/100.

Tester memodelkan kontinuitas, bukan panjang, NEXT, bandwidth, IP, atau sertifikasi transmisi. Short, putus di tengah kabel, dan pengukuran split pair belum dimodelkan. Kondisi kerusakan deterministik, tidak diacak setelah tindakan pemain.

**TP4 selalu memerlukan pengamatan individual oleh guru saat praktik fisik.** Alasan bebas dan refleksi tidak dinilai secara semantik oleh aplikasi. Ekspor JSON dapat diedit; hasilnya merupakan bukti formatif lokal, bukan nilai yang dilindungi dari perubahan.

## Penyimpanan dan privasi

Satu sesi aktif pada `localStorage` dengan key `crosslink.session.v1`. Gunakan alias siswa. Tidak ada analytics atau pengiriman data. Sumber eksternal hanya dibuka jika pengguna memilih tautannya; kredit foto dibaca dari aset lokal.

Isi sesi sekarang menggunakan **`schemaVersion: 2`**. Key browser lama sengaja dipertahankan agar progres yang sudah ada ditemukan. Sesi versi 1 yang valid dimigrasi otomatis: kabel/tiket lama, alias, keputusan, refleksi, dan snapshot tetap dipertahankan; tiket RP–03 serta draft tester ditambahkan. Draft MAIN dan prediksi dipulihkan dari pengujian terakhir bila tersedia. Data rusak atau format tidak didukung tidak direset diam-diam.

Impor divalidasi sebelum sesi aktif diganti. Berkas tidak valid, duplikasi konduktor, versi yang tidak didukung, dan snapshot uji tidak konsisten ditolak. Batas ukuran impor 8 MB. Jika storage tidak tersedia, permainan tetap berjalan dalam memori dengan pemberitahuan agar diekspor. Menutup browser tanpa ekspor dalam kondisi tersebut kehilangan perubahan.

## Penggunaan kelas dan validasi

Lihat [panduan guru](docs/PANDUAN-GURU.md), [cakupan validasi](docs/VALIDATION.md), dan [kredit aset](docs/ASSET-CREDITS.md). Sebelum penggunaan kelas, guru perlu mengonfirmasi isi, orientasi konektor, kesesuaian alat serta prosedur sekolah, dan melakukan uji kelompok kecil sesuai alokasi 2 × 90 menit.

Pemeriksaan terhadap prompt implementasi tambahan pengguna tersedia pada [audit fitur MVP](docs/AUDIT-FITUR-MVP.md). Dokumen ini membedakan fitur yang sudah ada, sebagian, belum dibuat, dan belum diverifikasi, beserta prioritas tindak lanjut.

## Animasi dan pertanyaan siswa

Animasi singkat memberi respons saat memilih/menempatkan konduktor, melakukan crimp, menghubungkan tester, membaca jalur pin, dan menyelesaikan pekerjaan. Jalur pada tester mengikuti hasil engine; open ditampilkan berhenti sebelum REMOTE. Aktifkan **Kurangi animasi** pada pengaturan untuk menghentikan gerak dan memakai tester manual. Preferensi pengurangan gerak pada sistem/browser juga dihormati.

Pertanyaan memakai bahasa singkat, misalnya “Apa buktinya?” dan “Apa yang berubah setelah diperbaiki? Mengapa?”. Siswa tetap perlu mencatat bukti, memilih tindakan, dan menjelaskan hasil dengan kata sendiri. Jawaban tidak diisi otomatis. Lihat `docs/VALIDATION.md` untuk batas verifikasi versi terbaru.
