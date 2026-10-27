# Panduan fasilitasi CrossLink

## Persiapan

- Satu laptop/desktop atau perangkat sentuh dan satu kit praktik per kelompok 2–3 siswa.
- Kit: kabel UTP empat pasangan, konektor 8P8C tertutup yang sesuai kabel, alat kupas/potong, tang crimp yang kompatibel, serta tester dan remote.
- Siapkan bahan per siswa agar pengamatan TP4 dapat dilakukan individual, dengan alat kelompok bergantian. Jadwalkan titik pengamatan saat pengupasan, penyisipan, dan crimp.
- Jalankan server lokal serta periksa foto alat, nomor pin, prosedur keselamatan, dan ukuran persiapan sesuai produk sekolah.
- Siswa menggunakan alias. Rotasikan operator, analis, dan pencatat setiap misi; untuk dua siswa, analis merangkap pencatat.

### Jika kelompok memakai ponsel

1. Siapkan satu komputer penyaji dan hubungkan komputer serta ponsel kelompok ke Wi-Fi lokal yang sama.
2. Pada komputer, jalankan `pnpm build`, lalu klik `Start-CrossLink-Mobile.cmd` dan biarkan server berjalan.
3. Siswa membuka alamat `http://ALAMAT-IP-KOMPUTER:5174/` yang ditampilkan launcher. `localhost` atau `127.0.0.1` pada ponsel menunjuk ke ponsel itu sendiri, sehingga bukan alamat komputer penyaji.
4. Jika tidak terhubung, periksa Wi-Fi, alamat IP, pembatasan jaringan tamu, dan firewall bersama pengelola jaringan sekolah. Launcher tidak mengubah firewall atau memublikasikan game ke internet secara otomatis.

Pada layar ≤600 piksel, diagram delapan pin tetap terlihat dalam orientasi yang benar. Siswa memilih konduktor, lalu mengetuk tujuan pin pada panel berlabel; drag tidak diperlukan. Jika panel pilihan terbuka, tombol batal mengembalikan siswa ke ruang kerja. Sediakan orientasi perangkat yang nyaman; kontrol mengikuti lebar layar dan ruang aman tepi ponsel.

Gunakan alias dan satu sesi per kelompok. Progres hanya berada pada browser yang dipakai, bukan tersinkron pada komputer penyaji. Ekspor JSON sebelum berganti perangkat/browser/alamat; impor sesi tersebut untuk melanjutkan. Laporan dari ponsel dapat dicetak melalui fasilitas browser, atau diekspor sebagai sesi lalu dibuka pada komputer untuk pencetakan A4.

## Pertemuan pertama — 90 menit

| Menit | Fase dan kegiatan                                                           | Bukti yang diharapkan                                       |
| ----- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 0–10  | PBL 1: orientasi masalah dua komputer gagal membentuk link                  | Pertanyaan awal, tanpa langsung memberi susunan kabel       |
| 10–20 | PBL 2: organisasi kelompok, dugaan, informasi yang belum diketahui, rencana | Papan kasus dan pembagian peran                             |
| 20–40 | PBL 3: investigasi kedua PC, enam perlengkapan, kabel tersedia              | Tiga bukti dan keputusan dengan minimal dua bukti pendukung |
| 40–65 | PBL 3: workshop virtual                                                     | Susunan kedua ujung serta kondisi pemasangan                |
| 65–80 | PBL 3: pengujian dan perbaikan kabel sendiri                                | Peta pin, pembacaan terstruktur, interpretasi               |
| 80–90 | Diskusi sementara dan ekspor sesi                                           | Dugaan yang berubah, pertanyaan untuk pertemuan kedua       |

## Pertemuan kedua — 90 menit

| Menit | Fase dan kegiatan                         | Bukti yang diharapkan                                       |
| ----- | ----------------------------------------- | ----------------------------------------------------------- |
| 0–5   | Meninjau bukti; lanjutkan atau impor sesi | Mengingat alasan keputusan                                  |
| 5–25  | PBL 3: tiga tiket diagnosis dan perbaikan | Pengukuran sebelum/sesudah, diagnosis, tindakan, penjelasan |
| 25–65 | PBL 3: praktik fisik paralel              | Observasi individual TP4 oleh guru                          |
| 65–80 | PBL 4: penyajian hasil                    | Laporan kelompok dan argumentasi berdasarkan bukti          |
| 80–90 | PBL 5: analisis dan refleksi individu     | Refleksi perubahan dugaan, link vs peta pin, batas simulasi |

Alokasi bukan timer permainan. Sesuaikan fasilitasi jika uji awal menunjukkan siswa memerlukan waktu lebih; jangan menuntaskan TP4 hanya karena simulasi selesai.

Empat pekerjaan pada versi ini ialah kabel kelompok, open RP–01, miswire RP–02, dan straight-through RP–03. Tiket ketiga meminta siswa membedakan kontinuitas kabel dari kecocokan pola hubungan pin terhadap dua port MDI lama. Cakupan tiga tiket perlu diuji waktunya pada kelompok kecil; jaga waktu praktik fisik dan pengamatan individual TP4.

## Pertanyaan fasilitasi

- Bukti apa yang dapat menyingkirkan dugaan bahwa komputer mati atau NIC tidak aktif?
- Mengapa spesifikasi Auto-MDI/MDIX penting pada keputusan kabel?
- Bagaimana hubungan konduktor yang sama pada dua ujung menentukan tujuan pin?
- Apakah pengamatan open membuktikan kerusakan ada pada satu ujung tertentu?
- Mengapa tiket kedua dapat menampilkan jalur TX/RX terhubung tetapi gagal spesifikasi?
- Apa yang tidak dapat dibuktikan oleh tester kontinuitas sederhana?
- Setelah konektor di-crimp, mengapa mengubah urutan memerlukan konektor baru?
- Mengapa rancangan dapat sesuai sebelum crimp, sementara kontinuitas baru dapat dibuktikan setelah kontak terbentuk?
- Jika arah MAIN ditukar, apa yang harus berubah pada pembacaan dan label hasil pengukuran?

## Menggunakan pemeriksaan rancangan dan feedback

“Periksa Rancangan” memeriksa susunan aktual kedua ujung sebelum pemasangan. Hasilnya tidak mengisi jawaban otomatis dan tidak menyatakan kualitas crimp atau keterampilan fisik. Setelah siswa memperbaiki susunan, mereka tetap harus menyelesaikan pemasangan, menguji, lalu membandingkan hasil.

Feedback pemilihan kabel mengarahkan siswa kembali ke bukti port dan kabel awal. Dugaan yang keliru tetap dapat diuji. Mintalah siswa menjelaskan perubahan alasan ketika hasil tidak mendukung dugaan awal, bukan hanya mengganti pilihan sampai mendapat tanda sesuai.

## Asesmen

TP1–TP3 dan TP5–TP6 menggunakan status bukti formatif. Periksa kualitas alasan tertulis dan transfer pemahaman melalui diskusi. Pembacaan tester memiliki pertanyaan terstruktur yang diperiksa terhadap hasil pengukuran aktual; teks bebas tetap dibaca guru.

**TP4: nilai langsung keterampilan setiap siswa.** Cetak laporan A4 dari layar Laporan teknisi untuk rubrik alat, keselamatan, persiapan, urutan, penyisipan, crimp, dan pengujian. Beri catatan atau tindak lanjut; aplikasi tidak menyimpan atau menyatakan nilai fisik siswa.

Petunjuk dapat digunakan tanpa penalti. Riwayatnya membantu mengidentifikasi dukungan yang dibutuhkan. File JSON hanya untuk pemindahan sesi; berkas tersebut tidak memiliki tanda tangan digital.

## Gerbang penggunaan kelas

1. Guru memeriksa kebenaran materi, gambar pin, dan kesesuaian foto alat sekolah.
2. Guru memastikan bahan praktik, perlindungan mata sesuai kebutuhan alat, posisi tangan, dan kabel terlepas dari perangkat saat terminasi.
3. Kelompok kecil mencoba seluruh alur; catat waktu, kebingungan instruksi, dan aksesibilitas.
4. Pastikan setiap siswa memperoleh praktik serta pengamatan individual. Penilaian simulasi tidak menggantikan hal ini.

## Bahasa dan animasi untuk siswa pemula

Pertanyaan dalam game dipersingkat dan boleh dijawab dalam satu atau dua kalimat. Gunakan pertanyaan “Apa yang terlihat pada tester?”, “Apa buktinya?”, dan “Apa yang berubah setelah diperbaiki? Mengapa?” untuk memandu diskusi. Kesederhanaan bahasa tidak mengurangi tuntutan menunjukkan bukti dan alasan; kualitas jawaban bebas tetap ditinjau guru.

Animasi menjadi petunjuk tindakan, tanpa nilai kecepatan. Jalur open berhenti sebelum REMOTE; indikator link pada dua PC tetap hanya model jalur aktif 10/100. Siswa dapat mengaktifkan Kurangi animasi. TP4 tetap memerlukan observasi individual pada praktik alat asli.
