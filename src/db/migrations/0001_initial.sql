-- ============================================================================
-- CLARA FINTECH PLATFORM - INITIAL SCHEMA MIGRATION (0001_initial.sql)
-- Generated for PostgreSQL / SQLite / Supabase
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'creator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'campus', 'agency', 'corporate', 'general'
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  scheme TEXT NOT NULL DEFAULT 'full', -- 'full', 'dp', 'installment'
  status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid'
  public_token TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  label TEXT NOT NULL,
  percentage INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  due_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
  paid_at TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  installment_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'qris', -- 'qris', 'va_bca', 'va_mandiri', 'va_bri'
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  proof_url TEXT,
  FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE CASCADE
);
