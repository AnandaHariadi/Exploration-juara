# 🗄️ Dokumentasi Layer Database — Clara Platform

Folder `src/db/` merupakan pusat seluruh arsitektur data dan persistensi platform **Clara**. Struktur ini dirancang modular agar memudahkan pengembangan lokal maupun transisi ke database produksi berskala besar.

---

## 📁 Struktur Direktori `src/db/`

```
src/db/
├── index.ts          # Inisialisasi koneksi database (Drizzle ORM)
├── schema.ts         # Definisi tabel, relasi, tipe TypeScript (Drizzle Schema)
├── repository.ts     # Data Access Layer / Query functions (CRUD Invoices, Clients, Payments)
├── store.ts          # Penyimpan file JSON lokal otomatis (data/db.json)
├── migrations/       # Folder skrip migrasi SQL siap eksekusi
│   └── 0001_initial.sql
└── README.md         # Panduan konfigurasi & penggunaan (file ini)
```

---

## ⚙️ 2 Mode Operasional Database

### 1. Mode Lokal / Demo (Default — Zero Config)
- **Engine:** In-Memory & Local JSON Store (`data/db.json`).
- **Kelebihan:** Aplikasi langsung berjalan lancar tanpa perlu install server database (MySQL/PostgreSQL/Docker).
- **Lokasi file data:** Folder `data/db.json` di root proyek.

### 2. Mode Produksi / Skala Besar (Drizzle ORM)
Platform sudah disiapkan untuk langsung terhubung dengan:
- **SQLite:** Disimpan di `data/app.db` via `better-sqlite3`.
- **PostgreSQL / Supabase / Neon:** Cukup ganti adapter Drizzle di `src/db/index.ts` dan set `DATABASE_URL` di file `.env`.

---

## 📊 Relasi Tabel (Entity Relationship)

```
[users] ──(1:N)──> [clients] ──(1:N)──> [invoices] ──(1:N)──> [installments] ──(1:1)──> [payments]
```

1. **`users`**: Profil pengguna utama Clara (nama, email, studio/usaha).
2. **`clients`**: Kategori klien (`campus`, `agency`, `corporate`, `general`).
3. **`invoices`**: Data tagihan, nomor faktur unik, skema pembayaran (`full`, `dp`, `installment`), dan token publik unik klien.
4. **`installments`**: Pembagian termin otomatis (Down Payment, Termin Tengah, Pelunasan).
5. **`payments`**: Catatan riwayat pembayaran terverifikasi (metode QRIS, Virtual Account BCA/Mandiri/BRI).

---

## 🚀 Menjalankan Migrasi Baru
Jika Anda ingin menerapkan skema SQL ke database eksternal:
1. Skrip SQL siap pakai tersedia di [`src/db/migrations/0001_initial.sql`](file:///c:/Users/ASUS%20TUF/OneDrive/Dokumen/Exploration/src/db/migrations/0001_initial.sql).
2. Anda juga dapat menggunakan Drizzle Kit dengan menyalin `drizzle.config.ts.example` menjadi `drizzle.config.ts`.
