# CLARA — Alur Pengguna dan Kontrak Data Frontend

Status: spesifikasi Tahap 1. Acuan utama: PRD (2).md, terutama bagian 7–14, 18–19, 23, dan 26. Diagram yang diberikan pengguna dipakai sebagai peta layar dan perpindahan tindakan. Dokumen ini belum menyatakan API, SQLite, OCR, atau AI sudah terimplementasi.

## 1. Ruang lingkup dan peran

Alur inti dimulai ketika proyek dibuat dan kontrak bersama RAB masuk. Landing, dashboard portofolio, dan pemilih pengguna demo adalah pintu masuk untuk presentasi, bukan prasyarat perhitungan. PRD menempatkan Project/Business Owner dan Finance sebagai peran utama. Untuk MVP keduanya dapat memakai satu workspace; tidak ada RBAC penuh. Budi, Siti, Hendra, dan Admin adalah sudut pandang demo. Pemilih pengguna mengubah konteks tampilan dan mencatat pelaku tindakan, tanpa berpura-pura sebagai login produksi.

Keputusan manusia wajib untuk mengaktifkan acuan proyek dan menyetujui perubahan resmi. AI membantu membaca dokumen dan mencocokkan kemungkinan scope; angka, status selisih terverifikasi, dan dampak rupiah dihitung oleh aturan deterministik.

## 2. Alur utama sesuai PRD

| Urutan | Layar atau tahap | Input dan tindakan pengguna | Hasil yang harus tersimpan/terlihat | Bila gagal atau data belum ada |
| --- | --- | --- | --- | --- |
| 0 | Landing / dashboard portofolio | Masuk mode demo, pilih pengguna dan proyek | Konteks pengguna dan daftar proyek; CTA membuat proyek bila kosong | Dashboard kosong mengatakan belum ada data, bukan semua proyek aman |
| 1 | Buat proyek | Isi nama/klien; unggah kontrak dan RAB atau pilih data contoh yang diberi label | Proyek DRAFT dan catatan dokumen beserta sumbernya | Validasi berkas dan informasi; dapat mengulang tanpa membuat proyek ganda |
| 2 | Analisis dokumen | Minta OCR/ekstraksi atas dokumen | Kandidat acuan kontrak dan rencana biaya, status proses, sumber per field | Gagal atau butuh tinjauan; tidak mengarang nilai, pasal, atau confidence |
| 3 | Tinjau hasil | Periksa dan koreksi nilai, scope, milestone, syarat tagih, tenggat, batas revisi, serta RAB | Kandidat yang diedit, belum aktif | Field wajib atau angka tidak konsisten ditunjukkan dekat field |
| 4 | Setujui acuan proyek | Konfirmasi eksplisit oleh pengguna | Versi V1 aktif; dokumen dan kandidat tetap dapat ditelusuri | Tanpa konfirmasi, proyek tidak masuk rekonsiliasi aktif |
| 5 | Pantau pekerjaan | Catat event penting: milestone selesai, progres berubah, revisi, atau scope baru | Event dan keadaan proyek terbaru, terkait milestone/scope yang tepat | Event ambigu diberi status perlu tinjauan, bukan otomatis pelanggaran |
| 6 | Catat keuangan | Masukkan biaya aktual, invoice, dan pembayaran | Riwayat transaksi dan ringkasan biaya/tagihan/kas yang dihitung ulang | Data biaya belum lengkap tidak menghasilkan klaim laba aktual |
| 7 | Rekonsiliasi | Sistem membandingkan acuan aktif dengan pekerjaan dan keuangan | Status sesuai, indikasi perlu tinjauan, atau selisih terverifikasi; bukti dan besaran yang dapat dihitung | Bukti kurang diberi label perlu tinjauan; nominal tidak ditebak |
| 8 | Tinjau peringatan | Buka rincian bukti dan ambil tindakan | Status dibaca/ditangani/selesai; tindak lanjut tertaut ke sumber | Membaca peringatan tidak menyelesaikan masalah |
| 9 | Permintaan perubahan | Ajukan dan setujui perubahan resmi | Hanya perubahan APPROVED menghasilkan V2/V3; versi lama tersimpan | DRAFT, PENDING, dan REJECTED tidak mengubah acuan aktif |

Alur pengguna demo yang mewakili PRD: pilih Budi → buka/buat proyek → unggah kontrak dan RAB → tinjau hasil → setujui V1 → catat UAT selesai dan revisi → pilih Siti → catat biaya/invoice/pembayaran → lihat selisih dan bukti → ajukan perubahan → setujui → lihat V2 serta peringatan yang dihitung ulang. Hendra dapat meninjau ringkasan dan bukti. Admin dapat mengulang data demo. Pergantian sudut pandang tidak mengubah isi proyek.

## 3. State antarmuka

| Area | Kosong | Memuat | Berhasil | Gagal/perlu tinjauan |
| --- | --- | --- | --- | --- |
| Dashboard/proyek | Belum ada proyek; ajakan buat proyek. Nol bukan status sehat | Kerangka ringkasan dan tombol yang belum siap dinonaktifkan | Ringkasan sesuai proyek dan versi acuan aktif | Gagal mengambil data dengan aksi coba lagi; data lama tidak diklaim terbaru |
| Unggah dokumen | Pilih kontrak dan RAB | Progres unggah yang nyata, tidak memakai timer sebagai klaim pemrosesan | Nama, tipe, ukuran, dan status berkas | Format/ukuran gagal; berkas dapat dipilih ulang |
| Ekstraksi/kandidat | Belum ada hasil; tombol tinjau tidak aktif | Status antrean/proses dari server | Field usulan, sumber, dan confidence hanya bila benar-benar tersedia | Parsing gagal atau field penting tidak ditemukan; input manual/tinjau |
| Konfirmasi acuan | Kandidat belum lengkap | Menyimpan konfirmasi | V1/Vn dan waktu/pelaku terlihat | Konflik versi atau validasi; acuan lama tetap aktif |
| Monitoring/keuangan | Belum ada event atau transaksi; beri petunjuk aksi | Simpan/ambil data | Riwayat dan ringkasan diperbarui bersama | Simpan gagal, tidak tampil sebagai sukses; input tetap ada |
| Peringatan/bukti | Tidak ada alert; bedakan belum ada data dari tidak ada selisih | Mengambil bukti | Sumber dan angka dapat dibuka serta diperiksa | Bukti belum cukup diberi label indikasi/perlu tinjauan |
| Perubahan | Belum ada permintaan | Menyimpan/menyetujui | Status dan versi acuan baru tampil | Persetujuan gagal tidak mengubah versi atau angka |

Semua mutasi menampilkan umpan balik yang menyebut apa yang berubah. Proses yang dapat berulang harus aman dari duplikasi. Navigasi balik tidak menghapus isian yang belum berhasil disimpan.

## 4. Definisi angka dan aturan domain

Semua uang disimpan sebagai bilangan bulat rupiah. Tanggal memakai ISO 8601; antarmuka menampilkan format Indonesia. Angka portofolio adalah penjumlahan proyek yang terlihat dalam konteks/filter, dengan versi acuan aktif masing-masing.

| Label antarmuka | Definisi sumber tunggal | Rumus atau aturan |
| --- | --- | --- |
| Nilai kontrak | Nilai dalam acuan kontrak aktif | Nilai V1 ditambah perubahan nilai dari permintaan resmi yang disetujui |
| Rencana biaya | RAB dalam acuan rencana aktif | Jumlah item RAB; tidak dicampur dengan biaya aktual |
| Biaya aktual | Biaya yang benar-benar dicatat | Jumlah record biaya valid, sesuai mata uang rupiah |
| Selisih biaya | Biaya aktual dibanding rencana | Biaya aktual − rencana biaya; positif berarti melebihi rencana |
| Pemakaian anggaran | Proporsi biaya aktual terhadap rencana | Biaya aktual / rencana biaya × 100%; bila rencana nol, tampilkan tidak tersedia |
| Siap ditagih | Hak tagih yang pemicunya terpenuhi menurut acuan aktif | Jumlah nilai milestone yang telah memenuhi syarat dan bukti penerimaan; tidak otomatis sama dengan progres umum |
| Sudah ditagih | Nilai invoice yang diterbitkan dan belum dibatalkan | Jumlah invoice sah; draft dan invoice batal tidak dihitung |
| Belum ditagih | Hak tagih yang belum mempunyai invoice | Maksimum 0 dari siap ditagih − sudah ditagih; kelebihan tagih ditunjukkan sebagai selisih tersendiri |
| Sudah dibayar | Pembayaran yang tercatat terhadap invoice | Jumlah payment valid; dapat lebih kecil dari nilai invoice bila parsial |
| Selisih revisi | Revisi di luar batas acuan aktif | Maksimum 0 dari jumlah revisi aktual − batas revisi aktif |
| Laba rencana | Perkiraan sebelum pelaksanaan | Nilai kontrak − rencana biaya |

Progres pekerjaan tidak boleh disamakan dengan persentase termin pembayaran. Progres hanya berasal dari event progres yang divalidasi atau bobot pekerjaan tersendiri jika datanya tersedia. Jika data biaya, invoice, atau pembayaran belum lengkap, tampilkan status data belum lengkap. "Belum ditagih", exposure, dan potensi risiko bukan kerugian aktual. Pekerjaan tambahan yang belum jelas harus bertanda kemungkinan selisih dan perlu tinjauan.

Sebuah milestone hanya dapat menjadi siap ditagih saat syarat kontraknya terpenuhi. Pembuatan invoice memerlukan milestone siap ditagih dan tidak boleh membuat invoice ganda untuk pemicu yang sama. Perubahan resmi menyalin acuan lama ke riwayat, memperbarui nilai/scope/tenggat/batas revisi sesuai isi persetujuan, lalu menghitung ulang selisih.

## 5. Kontrak data frontend–API yang dituju

Rute mengikuti rancangan system.md dengan awalan /api/v1. Ini adalah kontrak target untuk Tahap 2, belum endpoint yang tersedia. Next.js App Router dapat menyediakan route handler di server; browser tidak membuka file SQLite secara langsung. Penyimpanan dokumen juga memerlukan endpoint server.

| Entitas | Field minimum yang dibaca frontend | Operasi utama |
| --- | --- | --- |
| Pengguna demo/sesi | id, nama, label peran, sesi aktif, modeDemo | daftar pengguna, baca sesi, pilih pengguna |
| Proyek | id stabil, nama, klien, status, versi acuan aktif, waktu perubahan | daftar, detail, buat, ubah draft |
| Dokumen | id, projectId, jenis CONTRACT/RAB, nama, tipe, ukuran, status, lokasi sumber | unggah, daftar, buka sumber |
| Kandidat ekstraksi | id, projectId, status, nilai/ruang lingkup/milestone/RAB, referensi sumber per field, confidence opsional | mulai proses, baca, koreksi, konfirmasi |
| Acuan versi | id, projectId, nomor versi, status ACTIVE/ARCHIVED, kontrak, RAB, tanggal dan pelaku persetujuan | baca aktif dan riwayat |
| Milestone/event | id, projectId, milestoneId bila relevan, tipe, tanggal, pelaku, status, bukti | catat, daftar, perbarui status |
| Biaya aktual | id, projectId, kategori, tanggal, nominal, keterangan, bukti | catat, daftar |
| Invoice/payment | id, projectId, milestoneId, nomor, nominal, status, tanggal; payment mempunyai invoiceId dan nominal | terbitkan/catat invoice, catat pembayaran, daftar |
| Permintaan perubahan | id, projectId, versi asal, alasan, perubahan scope/nilai/tenggat/revisi, status, pelaku persetujuan | ajukan, lihat, setujui/tolak |
| Peringatan/bukti | id, projectId, tipe, status, klasifikasi, nominal dengan jenis dampak, sumber dokumen/event/invoice | daftar, detail, tandai dibaca, tindak lanjut, selesaikan |
| Ringkasan | projectId atau portfolio, versi acuan, waktu dihitung, semua metrik dari bagian 4, hitung status alert | ringkasan proyek dan portofolio |

Respons sukses mengikuti bentuk system.md: success true dan data. Respons gagal: success false, error berisi code dan message yang dapat ditampilkan. Operasi daftar menyertakan penanda halaman/jumlah jika diperlukan. Semua record baru memakai ID unik stabil dari server. Mutasi menerima idempotency key atau perlindungan setara untuk mencegah pengiriman ganda. Status dokumen dan ekstraksi terpisah dari status proyek.

Rute inti target: GET /demo/users; GET dan POST /demo/session; GET dan POST /projects; GET /projects/:id; POST /projects/:id/documents; POST /documents/:id/extract; GET dan PUT /projects/:id/baseline/candidate; POST /projects/:id/baseline/confirm; GET /projects/:id/baselines; GET dan POST /projects/:id/events; GET dan POST /projects/:id/actual-costs; GET dan POST /projects/:id/invoices; POST /projects/:id/payments; GET dan POST /projects/:id/change-requests; POST /change-requests/:id/approve; GET /projects/:id/reconciliation; GET /projects/:id/alerts; GET /projects/:id/summary; GET /dashboard/summary. Pemilihan metode/rute akhir harus konsisten dengan backend yang benar-benar dibangun.

## 6. Batas komponen frontend

Halaman dan komponen memanggil satu lapisan akses data untuk query dan mutasi; komponen tidak membaca localStorage, file SQLite, atau menghitung status domain sendiri. Lapisan itu mengubah respons API menjadi tipe UI, menangani loading/error, dan meminta ulang ringkasan sesudah mutasi. Server menjadi sumber tunggal untuk perhitungan dan status yang memengaruhi uang, acuan, serta peringatan. Data contoh hanya masuk melalui seed demo yang diberi label, bukan fallback tersembunyi ketika API gagal.

Pemisahan Tahap 1 telah dibuat: halaman memakai dataClient dan hook pembaca data bersama, sedangkan storageService hanya dipanggil oleh adapter browser. Adapter API dan SQLite belum dibuat; itu termasuk Tahap 2.

## 7. Skenario penerimaan Tahap 1 dan integrasi berikutnya

Contoh PRD: nilai kontrak Rp120 juta, RAB Rp75 juta, 3 revisi, pemicu UAT 25%. Setelah UAT diterima, siap ditagih Rp30 juta. Jika invoice UAT belum ada, belum ditagih Rp30 juta dengan bukti kontrak, event UAT, dan daftar invoice. Biaya aktual Rp64 juta berarti pemakaian anggaran sekitar 85,3%, bukan biaya yang melampaui RAB. Lima revisi berarti dua revisi perlu ditinjau. Perubahan disetujui +2 revisi, +Rp4 juta, +5 hari menghasilkan V2: nilai Rp124 juta dan jatah 5 revisi; alert revisi dihitung ulang tanpa menghapus riwayat V1.

Spesifikasi Tahap 1 dianggap siap untuk implementasi jika peta alur, state, arti angka, bentuk data, dan batas komponen di atas dipakai konsisten. Keberhasilan sistem baru dapat dinyatakan setelah Tahap 2–5 diimplementasikan dan skenario ini diuji end-to-end.
