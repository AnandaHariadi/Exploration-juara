-- CLARA demo database — migrasi 001
-- Simulasi lokal untuk tim backend. Produksi dapat memetakan skema ini ke PostgreSQL/Supabase.
-- Uang disimpan sebagai bilangan bulat rupiah. Tanggal memakai ISO 8601.

CREATE TABLE IF NOT EXISTS demo_users (
  id            TEXT PRIMARY KEY,           -- BUDI | SITI | HENDRA | ADMIN
  name          TEXT NOT NULL,
  role_title    TEXT NOT NULL,
  department    TEXT NOT NULL,
  initials      TEXT NOT NULL,
  avatar_bg     TEXT NOT NULL,
  badge_bg      TEXT NOT NULL,
  badge_text    TEXT NOT NULL,
  description   TEXT NOT NULL,
  primary_focus TEXT NOT NULL
);

-- Satu baris: pengguna demo yang sedang aktif. Mode demo, bukan login produksi.
CREATE TABLE IF NOT EXISTS demo_session (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  active_user_id TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  FOREIGN KEY (active_user_id) REFERENCES demo_users(id)
);

-- Penanda internal demo, misalnya apakah proyek contoh sudah pernah di-seed.
CREATE TABLE IF NOT EXISTS demo_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Kolom ringkasan dipakai untuk query/daftar; rincian (acuan, milestone, RAB,
-- biaya, invoice, event, permintaan perubahan, peringatan) berada di data_json.
CREATE TABLE IF NOT EXISTS projects (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  client                TEXT NOT NULL,
  status                TEXT NOT NULL,
  contract_value        INTEGER NOT NULL,
  planned_cost          INTEGER NOT NULL,
  actual_cost           INTEGER NOT NULL DEFAULT 0,
  billable_value        INTEGER NOT NULL DEFAULT 0,
  billed_value          INTEGER NOT NULL DEFAULT 0,
  paid_value            INTEGER NOT NULL DEFAULT 0,
  progress              INTEGER NOT NULL DEFAULT 0,
  baseline_version      TEXT NOT NULL DEFAULT 'V1.0',
  start_date            TEXT NOT NULL,
  end_date              TEXT NOT NULL,
  revision_limit        INTEGER NOT NULL DEFAULT 3,
  active_revision_count INTEGER NOT NULL DEFAULT 0,
  data_json             TEXT NOT NULL
);
