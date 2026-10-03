# CLARA — Rencana Kerja Frontend dan Pengalaman Pengguna

> Fokus: frontend, alur pengguna, bahasa antarmuka, dan demo yang datanya tersimpan.
> Kerjakan satu tahap sampai selesai sebelum lanjut. Tanda selesai hanya untuk alur yang sudah diuji, bukan sekadar tampilan yang sudah ada.

## Kondisi repo saat audit

- Aplikasi menggunakan Next.js App Router, React, TypeScript, dan Tailwind CSS. Daftar lama yang menyebut Vite, React Router, Axios, serta folder pages tidak sesuai repo.
- Landing dan halaman dashboard, proyek, pemantauan, keuangan, perubahan pekerjaan, peringatan, dan pencarian klausul sudah memiliki tampilan awal.
- Data aplikasi masih memakai localStorage. Belum ada API atau SQLite.
- Persona Budi, Siti, Hendra, dan Admin masih berupa data tetap di frontend, belum menjadi pengguna demo yang disimpan.
- Upload dokumen dan pemrosesannya masih simulasi. Sebagian metrik dan status belum berubah mengikuti tindakan pengguna.
- Checklist lama terlalu banyak bertanda selesai meskipun fungsi belum terhubung. Seluruh pekerjaan di bawah dimulai sebagai belum selesai dan diverifikasi satu per satu.

## Prinsip produk dan bahasa

- Pengguna harus tahu kondisi proyek, tindakan berikutnya, dan alasan sebuah angka atau peringatan muncul.
- Gunakan bahasa Indonesia yang ringkas. Istilah teknis internal boleh dipakai dalam kode/API, tetapi label utama antarmuka memakai kata yang dipahami pengguna.
- Usulan istilah: "baseline" → "acuan proyek" atau "kesepakatan awal"; "billable" → "siap ditagih"; "unbilled" → "belum ditagih"; "variance" → "selisih"; "change request" → "permintaan perubahan"; "evidence" → "bukti pendukung".
- Jelaskan angka uang dengan konteks. "Belum ditagih" adalah pekerjaan yang sudah berhak ditagih, bukan otomatis kerugian.
- Data contoh, hasil simulasi, dan hasil pemeriksaan dokumen sungguhan harus terlihat berbeda. Jangan menampilkan kutipan atau tingkat keyakinan seolah sudah diverifikasi bila sumbernya belum ada.
- Font, ukuran huruf, warna, animasi, dan dekorasi dipilih karena membantu keterbacaan serta tindakan pengguna.

## Tahap 1 — Tetapkan alur frontend dan kebutuhan data

- [x] Petakan alur pengguna demo: masuk/pilih pengguna → lihat tugas sesuai peran → buka proyek → lakukan tindakan → lihat perubahan ringkasan.
- [x] Petakan alur proyek baru: isi informasi → unggah berkas atau pilih data contoh → tinjau hasil → koreksi → setujui acuan proyek.
- [x] Definisikan state kosong, memuat, gagal, berhasil, perlu ditinjau, dan selesai untuk setiap alur.
- [x] Tetapkan arti dan rumus nilai kontrak, rencana biaya, biaya aktual, siap ditagih, sudah ditagih, sudah dibayar, dan belum ditagih.
- [x] Tetapkan kontrak data frontend–API untuk pengguna demo, proyek, dokumen, acuan proyek dan versinya, milestone, event, biaya, invoice, pembayaran, permintaan perubahan, serta peringatan.
- [x] Pisahkan akses data dari komponen agar halaman dapat beralih dari localStorage ke API tanpa mengulang desain.

Rincian Tahap 1 ada di [Alur Pengguna dan Kontrak Data Frontend](frontend-flow-contract.md). Urutan bisnis mengikuti PRD; diagram user flow menjadi rujukan perpindahan layar. Halaman kini memakai kontrak akses data async dan hook bersama; penyimpanan lokal berada di adapter yang dapat diganti saat API Tahap 2 tersedia.

**Selesai jika:** alur, istilah, aturan angka, dan respons tiap tindakan dipakai sebagai acuan implementasi, lalu komponen tidak lagi mengakses localStorage secara langsung.

## Tahap 2 — Pengguna demo dan SQLite

SQLite adalah penyimpanan lokal untuk demo dan pengujian. Browser mengaksesnya melalui API/server Next.js, bukan langsung ke file database. Pilihan database produksi diputuskan terpisah.

- [x] Buat skema dan migrasi SQLite untuk pengguna demo serta data minimum yang diperlukan alur utama.
- [x] Seed pengguna demo: Budi (pengelola proyek), Siti (keuangan), Hendra (pimpinan), dan Admin. Seed proyek contoh harus konsisten secara angka dan status.
- [x] Buat alur memilih/masuk sebagai pengguna demo dan simpan sesi aktif di server. Jelaskan bahwa ini mode demo, bukan login produksi.
- [x] Terapkan peran demo sebagai konteks tampilan dan pencatatan pelaku tindakan, tanpa RBAC penuh sesuai PRD; UI dan API harus berperilaku sama.
- [x] Buat API baca/tulis untuk proyek, milestone/event, biaya, invoice/pembayaran, permintaan perubahan, dan peringatan yang diperlukan frontend.
- [x] Pindahkan sumber data utama dari localStorage ke SQLite melalui API. Refresh halaman dan browser baru harus membaca data yang sama.
- [x] Sediakan reset data demo yang disengaja, dengan konfirmasi dan hasil seed yang dapat diulang.
- [x] Uji perpindahan pengguna demo, perubahan data, refresh, dan reset.

Rincian implementasi Tahap 2:
- **Migrasi SQLite**: Berkas migrasi resmi di [`001_initial_schema.sql`](file:///D:/Exploration-juara/frontend/data/migrations/001_initial_schema.sql) dijalankan otomatis melalui runner tabel `schema_migrations`.
- **Seed Konsisten**: Proyek contoh `PRJ-101` (PT Astra Sahabat Logistik) konsisten secara finansial (Kontrak Rp 120M, RAB Rp 75M, Actual Cost Rp 64M, MLS-01 Lunas Rp 30M, MLS-02 Belum Ditagih Rp 42M, MLS-03 Pending Rp 48M).
- **Alur Billing & Payment**: Form event milestone wajib memilih `milestoneId`, API invoice menolak milestone yang belum selesai (409) dan mencegah tagihan ganda (409), endpoint pencatatan pembayaran di [`/api/projects/[id]/payments`](file:///D:/Exploration-juara/frontend/src/app/api/projects/%5Bid%5D/payments/route.ts) memvalidasi nominal, memperbarui `paidValue`, dan mencegah pembayaran ganda (409).
- **Idempotensi Change Request**: Persetujuan CR berulang ditolak dengan 409 sehingga nilai kontrak dan acuan proyek tidak bertambah ganda.
- **Error Handling & State UI**: [`dataClient.ts`](file:///D:/Exploration-juara/frontend/src/services/dataClient.ts) melempar error terstruktur tanpa menelan kegagalan; seluruh tombol aksi di UI memiliki state `busy`/`disabled` serta toast alert visual.
- **Verifikasi Teruji**: Seluruh 22 skenario pengujian di [`test-task2.mjs`](file:///D:/Exploration-juara/frontend/scripts/test-task2.mjs) berhasil lulus 100% (`PASS: 22 / FAIL: 0`).

**Selesai jika:** pengguna demo dan perubahan utama tersimpan di SQLite serta terbaca kembali lewat API.

## Tahap 3 — Perbaiki tampilan dan alur pengguna

### 3.1 Navigasi dan ringkasan

- [ ] Tata ulang sidebar, header, pemilih proyek, dan menu pengguna untuk desktop, tablet, serta ponsel.
- [ ] Dashboard menampilkan tindakan terpenting sesuai peran dan membawa pengguna ke proyek yang tepat.
- [ ] Tiap angka ringkasan memiliki label yang jelas, konteks proyek/periode, dan nilai yang sesuai detailnya.
- [ ] Bedakan peringatan baru, sudah dibaca, sedang ditangani, dan selesai. Membaca peringatan tidak menghapus masalah yang belum selesai.

### 3.2 Proyek baru

- [ ] Form punya input file nyata, validasi format/ukuran, dan pilihan data contoh yang diberi label jelas.
- [ ] Hasil pemrosesan ditampilkan sebagai usulan untuk ditinjau; sumber, nilai kontrak, anggaran, ruang lingkup, dan jadwal pembayaran dapat diperiksa.
- [ ] Hanya data yang benar-benar ditinjau dan disetujui pengguna yang menjadi acuan proyek aktif.
- [x] Bila pemrosesan dokumen belum tersedia, gunakan penjelasan mode demo yang jujur.

### 3.3 Pemantauan dan keuangan

- [ ] Event penyelesaian terhubung ke tahap pekerjaan yang dipilih dan memperbarui progres serta nilai siap ditagih.
- [ ] Biaya aktual memperbarui total dan selisih terhadap rencana biaya.
- [ ] Tagihan hanya dapat dibuat saat syarat tahap pekerjaan terpenuhi; status terkirim, lunas, dan terlambat mempunyai alur yang jelas.
- [ ] Permintaan perubahan mempunyai status, pihak yang menyetujui, dan riwayat perubahan nilai, ruang lingkup, serta tenggat.
- [ ] Bukti pendukung menunjukkan sumber yang dapat diperiksa dan tindakan lanjutan yang sesuai.
- [x] Pencarian klausul hanya mengklaim jawaban dari kontrak terpilih bila sumbernya benar-benar tersedia.

### 3.4 Keterbacaan dan akses

- [ ] Audit font: kurangi variasi yang tidak perlu, pakai ukuran teks yang nyaman, dan bedakan judul, angka, label, serta bantuan form secara konsisten.
- [ ] Ganti kata teknis dan campuran bahasa yang membingungkan dengan istilah Indonesia yang relevan. Uji apakah pengguna memahami label tanpa penjelasan lisan.
- [ ] Perbaiki kontras, jarak antar elemen, ukuran area klik, dan tampilan tabel/form di layar kecil.
- [ ] Hubungkan label dengan input, tampilkan kesalahan dekat field, dan berikan pesan setelah tindakan berhasil.
- [ ] Dialog dan panel bukti dapat digunakan dengan keyboard, mengelola fokus, dan mudah ditutup.

Catatan implementasi Tahap 3 (3 Oktober 2026): kerangka aplikasi dan dashboard dibuat ulang dengan susunan sidebar, kartu ringkasan, daftar proyek, peringatan, dan tahap siap ditagih. Warna merah/oranye/zinc dan font mengikuti landing page. Form proyek baru memakai pilihan data contoh atau isian manual; berkas hanya divalidasi di browser dan **belum diproses atau disimpan**. Halaman pencarian kini membaca data kesepakatan tersimpan tanpa membuat kutipan kontrak palsu. Label utama pada proyek, pemantauan, keuangan, dan perubahan memakai bahasa Indonesia. Build dan cek HTTP baca berhasil. Checklist interaksi tetap kosong karena verifikasi visual serta uji alur lewat browser belum terlaksana; koneksi browser pengujian gagal pada sesi ini.

Yang masih perlu diselesaikan sebelum Tahap 3 dinyatakan tuntas: pemrosesan berkas sungguhan dan peninjauan hasilnya bila fitur itu memang dibangun; status peringatan "sedang ditangani" yang tersimpan terpisah dari "sudah dibaca"; pengiriman tagihan nyata dan status jatuh tempo di data tersimpan; rujukan bukti ke dokumen yang bisa dibuka; serta uji alur ponsel/desktop langsung di browser. Selama masih mode demo, antarmuka menyebut sumber dan batasannya secara jelas.

**Selesai jika:** pengguna demo dapat menuntaskan alur utama di ponsel maupun desktop dan memahami setiap angka serta tindakan.

## Tahap 4 — Singkirkan elemen yang tidak membantu

- [ ] Audit menu, kartu, tombol, badge, font, dekorasi, animasi, dan teks promosi berdasarkan manfaatnya untuk tugas pengguna.
- [ ] Hapus atau sederhanakan pengulangan informasi antara dashboard dan detail proyek.
- [ ] Hapus kontrol yang tidak berfungsi; jika harus ada untuk demo, beri keterangan simulasi yang jelas.
- [ ] Hapus klaim hasil AI, bukti, dan dampak uang yang belum dapat dibuktikan dari data.
- [ ] Catat elemen yang dihapus atau diganti beserta alasan dan dampaknya pada alur.

**Selesai jika:** setiap elemen yang tersisa membantu pengguna memahami kondisi, mengambil tindakan, atau memeriksa bukti.

## Tahap 5 — Audit ulang dashboard dan sistem

- [ ] Inventaris setiap kartu, filter, tautan, tombol, dan notifikasi dashboard untuk tiap pengguna demo.
- [ ] Catat sumber data, rumus, tindakan, state kosong/loading/error, dan perubahan hasil setelah operasi terkait.
- [ ] Uji alur: buat proyek → setujui acuan → selesaikan tahap → muncul nilai siap ditagih → buat tagihan → catat pembayaran → periksa ringkasan dan peringatan.
- [ ] Uji biaya melebihi rencana, revisi melewati batas, tambahan pekerjaan, dan persetujuan perubahan.
- [ ] Cocokkan angka dashboard, detail proyek, dan record SQLite; selisih menjadi bug dengan langkah reproduksi.
- [ ] Susun matriks fungsi: berjalan, gagal, atau belum dibuat, lalu urutkan perbaikan berikutnya.

**Selesai jika:** semua fungsi dashboard mempunyai hasil audit yang dapat direproduksi dan angka utama konsisten dengan data tersimpan.

## Urutan kerja

1. Finalisasi alur dan kontrak data.
2. Bangun pengguna demo dan SQLite.
3. Perbaiki tampilan serta bahasa antarmuka.
4. Singkirkan elemen yang tidak membantu.
5. Audit ulang fungsi dashboard dan sistem.

Kerjakan satu tahap pada satu waktu. Jangan menandai pekerjaan selesai hanya karena tampilannya sudah dibuat.
