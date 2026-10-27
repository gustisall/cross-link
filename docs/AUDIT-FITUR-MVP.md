# Audit fitur CrossLink terhadap prompt acuan

Tanggal pemeriksaan: **27 Oktober 2026 (Asia/Jakarta)**.

Acuan: [salinan prompt pengguna](PROMPT-ACUAN-MVP.txt), dibandingkan dengan implementasi yang sudah ada. Rancangan sebelumnya tetap menjadi konteks, terutama penggunaan kelompok, pembelajaran dua pertemuan, dan penilaian fisik TP4 oleh guru.

## Tindak lanjut rekomendasi dan dukungan mobile

Pembaruan **27 Oktober 2026** menindaklanjuti audit berikut. Bagian audit awal, matriks, dan hasil 41 tes di bawah dipertahankan sebagai **baseline historis**, bukan daftar kekurangan yang masih sama pada versi setelah perubahan.

| Temuan awal                                               | Tindak lanjut implementasi                                                                                                                                                        | Verifikasi                                                                                                                                             |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BUG-01: label MAIN tidak mengikuti arah hasil tersimpan   | Hasil historis membawa arah MAIN/REMOTE; konfigurasi scan dan draft tester disimpan per pekerjaan, terpisah dari snapshot pengukuran.                                             | Tes regresi lulus; MAIN Ujung 2 dan hasil tersimpan diverifikasi pada alur browser.                                                                    |
| GAP-01: tiket straight-through belum ada                  | RP–03 ditambahkan sebagai kabel B/B dengan pemetaan lurus, diagnosis, terminasi ulang, dan pengujian ulang; jumlah pekerjaan menjadi empat.                                       | RP–03 B/B→B–A diselesaikan di browser; laporan mencapai 4/4. Regresi migrasi/kelulusan lulus.                                                          |
| GAP-02: Periksa Rancangan belum ada                       | Pemeriksaan susunan aktual dua ujung sebelum crimp tersedia; tidak bergantung pada kontak listrik dan tidak mengisi jawaban otomatis.                                             | Regresi kelengkapan/keunikan serta independensi rancangan terhadap kontak/crimp lulus.                                                                 |
| GAP-03: feedback keputusan belum kontekstual              | Pertanyaan peninjauan mengikuti pilihan jenis kabel dan bukti yang dipilih; dugaan salah tetap dapat diuji.                                                                       | Pilihan straight-through, feedback, dan revisi crossover diverifikasi melalui browser.                                                                 |
| GAP-04: celah tes Undo/Reset, laporan, serta alur browser | Tes regresi domain, sesi, dan komponen diperluas untuk undo/reset, data laporan, empat pekerjaan, serta arah MAIN.                                                                | 59/59 tes lulus dan build berhasil; alur browser lengkap serta undo/pengosongan/batal terverifikasi. Cetak fisik belum diuji.                          |
| GAP-05: bahasa, visual, animasi, dan dukungan mobile      | Label umum dilokalkan; kontrol sentuh ≤600 piksel, diagram pin utuh, panel tujuan pin, safe area, input 16 piksel, dan transisi yang menghormati pengurangan animasi ditambahkan. | Viewport 360–1366 piksel tanpa overflow halaman; target pin ≥48 piksel, navigasi/dialog serta pengurangan animasi terverifikasi. HP fisik belum diuji. |

Sesi baru memakai `schemaVersion: 2`; key browser `crosslink.session.v1` dipertahankan. Impor/progres v1 yang valid dimigrasi otomatis dengan menambahkan RP–03 dan draft tester tanpa menghapus kabel, alias, keputusan, refleksi, atau snapshot sebelumnya. Data malformed tetap ditolak.

Mobile dapat menggunakan hasil build melalui `Start-CrossLink-Mobile.cmd` / `--lan`, pada port 5174 dan alamat IP komputer di Wi-Fi yang sama. Mode desktop biasa tetap memakai localhost port 5173. Mode LAN tidak mengubah firewall, tidak memublikasikan situs ke internet, dan tidak menyinkronkan progres antarbrowser. Instalasi PWA tidak termasuk cakupan.

> Verifikasi akhir tindak lanjut: **59/59 tes lulus** pada 4 berkas; TypeScript dan build Vite berhasil. Browser IAB menyelesaikan alur awal sampai empat pekerjaan, laporan, refleksi, dan pemulihan sesi. Pemeriksaan alamat LAN dari komputer sendiri juga berhasil; akses dari HP fisik/perangkat lain, printer sekolah, dan validasi pembelajaran oleh guru belum diuji. Angka 41 pada bagian berikut adalah baseline historis.

## Kesimpulan audit awal (baseline)

Alur inti sudah diimplementasikan: orientasi, papan kasus, investigasi, penyusunan dua ujung kabel, crimp virtual, tester berbasis identitas konduktor, diagnosis/perbaikan, laporan, dan refleksi. **Seluruh persyaratan prompt baru belum terpenuhi.**

Kekurangan utama:

1. Belum ada tiket troubleshooting straight-through dengan siklus diagnosis dan perbaikan sendiri.
2. Belum ada aksi **Periksa Rancangan** sebelum crimp yang menilai susunan kedua ujung.
3. Feedback atas pilihan jenis kabel yang keliru belum spesifik pada bukti.
4. Cakupan pengujian Undo/Reset, isi data laporan, dan browser dari awal sampai akhir belum lengkap.
5. Ada bug pemulihan arah MAIN pada tampilan hasil tester yang tersimpan.

Audit ini menghasilkan dokumen temuan dan prioritas; fitur game dan engine tidak diubah dalam pemeriksaan ini.

### Arti status

- **Ada:** perilaku tersedia dalam kode; kolom bukti tidak otomatis berarti telah diuji di browser/perangkat nyata.
- **Sebagian:** sebagian perilaku tersedia, tetapi ada ketentuan prompt yang belum dipenuhi.
- **Belum ada:** tidak ditemukan implementasi aksi atau skenario yang diminta.
- **Belum diverifikasi:** implementasi tersedia, tetapi pemeriksaan tertentu belum dijalankan.

## Matriks persyaratan

| Acuan | Persyaratan                                                | Status                                     | Bukti / batas yang ditemukan                                                                                                                                                                                        |
| ----- | ---------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | Lingkungan simulator 2D dengan perangkat SVG/CSS           | Ada                                        | `LabScene`, `ConnectorView`, dan `TesterDevice`; interaksi memiliki konsekuensi pada state.                                                                                                                         |
| A     | Dark navy, cyan, dan amber                                 | Sebagian                                   | Navy pada sidebar/workbench dan warna status tersedia; area utama tetap terang dan banyak memakai aksen hijau/teal. Ini selisih arahan visual, bukan kegagalan gameplay.                                            |
| A     | Animasi kabel, konektor, dan indikator                     | Sebagian                                   | Scan indikator berjalan otomatis/manual; perpindahan konduktor dan pemasangan konektor masih perubahan keadaan langsung, tanpa animasi khusus.                                                                      |
| A, E  | Responsif, label warna, alternatif non-drag                | Ada; verifikasi perangkat belum lengkap    | Breakpoint, pola konduktor, nama warna, klik/tap, serta keyboard tersedia. Belum diverifikasi langsung pada semua resolusi dan perangkat sentuh sasaran.                                                            |
| B1    | Start screen, judul, deskripsi, mulai, informasi simulasi  | Ada                                        | Layar `Welcome`; tombol setara bernama “Mulai investigasi”, alias kelompok, serta keterangan persiapan praktik fisik.                                                                                               |
| B2    | Briefing dan catatan penyelidikan tanpa membocorkan solusi | Ada                                        | `Briefing` dan `CaseBoard`; spesifikasi rinci ditemukan saat inspeksi, mengikuti rancangan informasi bertahap.                                                                                                      |
| B3    | Inspeksi PC, kabel tersedia, alat, dan referensi standar   | Ada                                        | Tiga bukti, enam perlengkapan, referensi T568A/T568B bertahap.                                                                                                                                                      |
| B3    | Kabel awal 1→1 sampai 8→8                                  | Ada                                        | `assembledCable('T568B', 'T568B')` pada investigasi; hasil dihitung engine.                                                                                                                                         |
| B3    | Pilihan jenis kabel dan alasan teknis                      | Ada                                        | Pilihan, alasan bebas, minimal dua bukti, serta riwayat revisi keputusan disimpan. Mutu alasan bebas ditinjau guru.                                                                                                 |
| B3    | Feedback khusus ketika pilihan kabel keliru                | Sebagian                                   | Semua pilihan mendapat pesan penyimpanan dugaan yang sama. Ketidaksesuaian dapat ditemukan lewat tester dan status TP2, tetapi belum ada feedback kontekstual pada keputusan awal.                                  |
| B4    | Delapan konduktor unik pada setiap ujung                   | Ada                                        | Identitas konduktor tetap, penukaran posisi, slot kosong, dan penolakan duplikat.                                                                                                                                   |
| B4    | Drag-and-drop serta klik/tap/keyboard                      | Ada                                        | Handler drag/drop dan penempatan melalui tombol; keyboard memiliki tes komponen. Drag langsung belum memiliki tes browser khusus.                                                                                   |
| B4    | T568A–T568B maupun kebalikannya diterima                   | Ada                                        | Diperiksa dari susunan aktual, bukan label standar yang dipilih; kedua arah memiliki unit test.                                                                                                                     |
| B4    | Undo dan Reset                                             | Ada, dengan batas                          | Undo satu penempatan terakhir; reset per ujung melalui “Mulai ulang ujung ini” / “Potong & ganti konektor”. Setelah crimp diperlukan konektor baru.                                                                 |
| B4    | Periksa Rancangan                                          | **Belum ada**                              | “Periksa pemasangan” hanya menandai inspeksi prosedur dan membuka detail. Evaluasi standar/peta saat ini ditampilkan pada tahap testing, bukan pemeriksaan rancangan sebelum crimp.                                 |
| B5    | Prosedur crimp sederhana dan kesalahan kontak              | Ada                                        | Persiapan, perataan, penyisipan, kedalaman tiap konduktor, jaket, inspeksi, dan crimp memengaruhi model. Tahap prasyarat diblokir jika dilompati.                                                                   |
| B5    | Simulasi tidak membuktikan keterampilan fisik              | Ada                                        | TP4 selalu memerlukan observasi individual guru; rubrik cetak tersedia.                                                                                                                                             |
| B6    | Tester menghitung peta dari kabel pemain                   | Ada                                        | `buildWireMap` menelusuri identitas konduktor dan kontak; animasi dan tabel memakai hasil yang sama.                                                                                                                |
| B6    | Membedakan crossover, straight, miswire, dan open          | Ada                                        | Engine serta unit test mencakup keempat kondisi; model link dipisahkan dari kelulusan delapan pin.                                                                                                                  |
| B6, E | Hasil tersimpan tetap konsisten dengan arah MAIN           | **Sebagian; ada bug**                      | Snapshot menyimpan arah, tetapi komponen hanya menerima `savedMap` dan memulai label MAIN dari Ujung 1. Lihat BUG-01.                                                                                               |
| B7    | Tiga kasus khusus: straight, open, miswire                 | **Sebagian**                               | Bank pekerjaan berisi `own`, `open`, `miswire`. Kabel awal memang straight, tetapi tidak memiliki siklus troubleshooting/perbaikan sendiri. Kabel kelompok bebas disusun dan tidak menjamin kasus straight dialami. |
| B7    | Bukti, diagnosis, tindakan, retry, feedback deterministik  | Ada untuk dua tiket khusus                 | Pengukuran sebelum/sesudah, draft diagnosis, tindakan terminasi ulang, alasan, dan feedback tersimpan. Tidak ada penentuan hasil acak.                                                                              |
| B8    | Laporan dari data permainan                                | Ada                                        | Pilihan/alasan, kedua susunan, snapshot pengujian, diagnosis, perbaikan, status TP dan pekerjaan, bantuan, serta refleksi dibaca dari sesi.                                                                         |
| B8    | Cetak laporan                                              | Ada; hasil cetak belum diverifikasi visual | Tombol `window.print()` dan aturan A4 tersedia. Belum dinyatakan bebas pemotongan pada semua panjang laporan/printer.                                                                                               |
| B8    | Tidak meminta nama lengkap/data pribadi                    | Ada                                        | Masukan menggunakan nama kelompok dan alias teknisi.                                                                                                                                                                |
| C     | Hint tiga tingkat dan informasi alat/standar               | Ada                                        | Pertanyaan, fokus konsep, referensi terarah; tidak mengisi susunan otomatis.                                                                                                                                        |
| C     | Lima fase PBL dengan fasilitasi guru                       | Ada                                        | Orientasi, organisasi, penyelidikan, laporan, refleksi; jadwal, rotasi peran, dan panduan praktik fisik tersedia.                                                                                                   |
| D     | React, strict TypeScript, Vite, komponen reusable          | Ada                                        | Konfigurasi strict aktif; UI, konten, engine, state, penyimpanan, dan laporan dipisahkan.                                                                                                                           |
| D, E  | Progres lokal dan pemindahan layar                         | Ada untuk data inti                        | Reducer, autosave, ekspor/impor, keputusan, kabel, tes, draft diagnosis, dan refleksi dipertahankan. Prediksi/operasi tester yang belum disimpan masih state lokal komponen.                                        |
| E     | Bahasa Indonesia yang konsisten                            | Sebagian                                   | Instruksi utama Indonesia; masih ada label seperti `CONTACTS FACE UP`, `CRIMPED`, `CLOSED END`, `TERMINATION BENCH`, dan beberapa kode tindakan pada laporan.                                                       |
| F     | Seluruh pengujian dan build dijalankan                     | Ada                                        | Pengujian ulang audit: 41/41 lulus; build produksi berhasil. Rincian cakupan masih memiliki celah di bawah.                                                                                                         |
| G, H  | Vertical slice dapat dimainkan                             | Ada, didukung tes integrasi sebagian alur  | Perakitan dan siklus open hingga laporan teruji; seluruh perjalanan mulai welcome sampai semua tiket selesai belum diuji sekaligus melalui browser.                                                                 |

## Temuan dan prioritas tindak lanjut

### BUG-01 — Arah MAIN pada hasil tersimpan dapat menyesatkan

**Prioritas: tinggi.** Berhubungan langsung dengan pembacaan peta pin.

Bukti kode:

- `Testing.tsx` memberikan `savedMap={current?.map}`, tetapi tidak meneruskan `current.main`.
- `TesterDevice` menginisialisasi `main` ke `0` setiap kali dipasang kembali.
- Jika belum menjalankan scan baru, tabel menggunakan `savedMap`, sementara label pemasangan mengikuti `main` lokal.

Probe render komponen pada audit mereproduksi:

| Data                                      | Hasil                               |
| ----------------------------------------- | ----------------------------------- |
| Pengujian tersimpan                       | MAIN pada Ujung 2, kabel kasus open |
| Peta tersimpan/yang dirender              | `3,6,1,4,5,–,7,8`                   |
| Label yang dirender                       | “Pasang Ujung 1 ke MAIN”            |
| Peta untuk label Ujung 1 yang ditampilkan | Seharusnya `3,–,1,4,5,2,7,8`        |

Perbaikan yang disarankan: tampilkan arah hasil historis secara eksplisit atau pulihkan arah MAIN bersama snapshot; bedakan hasil tersimpan dari konfigurasi scan baru. Tambahkan tes regresi pada kasus asimetris dan navigasi keluar/masuk layar.

### GAP-01 — Tiket straight-through belum tersedia

**Prioritas: tinggi; acuan B7.**

Tambahkan tiket deterministik dengan kedua ujung standar yang sama dan peta 1→1 sampai 8→8. Pemain harus mengukur, mendiagnosis kecocokan kabel terhadap dua port MDI lama, memilih perbaikan, melakukan terminasi ulang, lalu membandingkan hasil.

Pembaruan harus mencakup data kasus, tipe ID, state, schema impor, syarat penyelesaian, jumlah pekerjaan pada UI/laporan, dan tes. Pertahankan sesi lama melalui migrasi/default yang tervalidasi; jangan menghapus progres siswa.

### GAP-02 — Pemeriksaan rancangan sebelum crimp belum tersedia

**Prioritas: tinggi; acuan B4.**

Tambahkan aksi “Periksa Rancangan” untuk kedua ujung saat masih berupa susunan. Periksa kelengkapan, keunikan, dan kombinasi standar, tanpa mengisi jawaban otomatis. Pisahkan pemeriksaan rancangan dari kontinuitas: kabel yang belum di-crimp tidak boleh diberi kesimpulan rancangan salah hanya karena kontak belum terbentuk.

### GAP-03 — Feedback keputusan jenis kabel belum kontekstual

**Prioritas: sedang; acuan B3.**

Saat ini pilihan straight-through, crossover, dan rollover memperoleh pesan yang sama: “Dugaan tersimpan”. Tambahkan pertanyaan peninjauan berdasarkan spesifikasi port dan bukti yang dipilih. Dugaan yang salah tetap boleh diuji, sesuai rancangan PBL; feedback tidak perlu langsung menyebut susunan jawaban.

### GAP-04 — Pengujian wajib belum seluruhnya memiliki cakupan khusus

**Prioritas: sedang; acuan F7–F8 dan H.**

| Tes wajib                                                            | Kondisi saat audit                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1–F6: A–B, B–A, straight, tertukar, open, susunan salah tidak lulus | Tercakup dan lulus.                                                                                                                                                                                                                                                        |
| F7: Undo/Reset menjaga konsistensi delapan konduktor                 | Sebagian. Ada tes penggantian konektor, keunikan penempatan, dan larangan undo setelah crimp. Belum ada tes undo normal setelah menempatkan/menukar/mengosongkan, serta reset draft yang memastikan baki + slot tetap delapan konduktor unik dan ujung lain tidak berubah. |
| F8: laporan memakai data permainan sebenarnya                        | Sebagian. Tes integrasi mencapai laporan dan memeriksa catatan diagnosis/TP4. Belum ada assertion khusus pada seluruh susunan, peta salah/sebelum/sesudah, pilihan, alasan, dan arah MAIN dari sesi yang sengaja dibuat berbeda.                                           |
| Alur browser awal sampai akhir                                       | Belum lengkap. Riwayat pemeriksaan sebelumnya mencakup orientasi sampai pembukaan workshop, bukan seluruh tiket sampai laporan akhir. Audit kali ini tidak menjalankan sesi browser baru.                                                                                  |
| Drag/drop, sentuh, ukuran layar, dan cetak                           | Handler/CSS ada; pemeriksaan browser/perangkat/hasil cetak menyeluruh belum tercatat.                                                                                                                                                                                      |

### GAP-05 — Kelengkapan bahasa, visual, dan animasi

**Prioritas: rendah setelah fungsi inti.**

Terjemahkan instruksi umum dan status prosedur ke bahasa Indonesia; istilah standar seperti T568A, MAIN/REMOTE, open/miswire dapat diberi padanan sesuai konteks. Gunakan label yang mudah dipahami pada laporan untuk kode tindakan seperti `none`, `ignore`, dan `recrimp`.

Jika arahan visual pada prompt terbaru dipakai secara ketat, sesuaikan dominasi navy/cyan/amber. Tambahkan transisi pendek pada perpindahan konduktor/pemasangan konektor, dengan tetap menghormati pengurangan animasi. Penyesuaian visual tidak menggantikan penyelesaian GAP-01/02.

## Hasil verifikasi aktual

- `pnpm test`: **41 pengujian lulus**, 3 berkas: 19 engine, 15 sesi/penyimpanan, 7 komponen/integrasi.
- `pnpm run build`: **berhasil**, termasuk pemeriksaan TypeScript strict.
- Build memunculkan peringatan anotasi komentar pihak ketiga pada Zod; tidak menggagalkan build.
- Probe SSR/render statis terhadap komponen tester: **BUG-01 direproduksi** dengan perbedaan label MAIN dan peta tersimpan.
- Probe bukan pengujian browser, sentuh, atau cetak; klaim kelulusan tidak diperluas ke pemeriksaan yang belum dilakukan.

## Urutan pengerjaan yang direkomendasikan

1. Perbaiki BUG-01 beserta tes regresinya.
2. Tambahkan tiket straight-through lengkap dan kompatibilitas sesi lama.
3. Tambahkan Periksa Rancangan tanpa auto-fill jawaban.
4. Lengkapi feedback keputusan dan tes F7/F8.
5. Jalankan alur browser lengkap, drag/non-drag, viewport sasaran, dan cetak.
6. Lengkapi bahasa, warna, dan animasi setelah fungsi terverifikasi.

Short, pengukuran split pair, backend, AI, leaderboard, dan penilaian semantik otomatis bukan persyaratan MVP prompt ini; ketiadaannya tidak dihitung sebagai fitur yang tertinggal. Penilaian keterampilan fisik TP4 tetap merupakan tugas guru.
