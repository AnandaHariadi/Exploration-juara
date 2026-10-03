-- ==============================================================================
-- CLARA - Supabase PostgreSQL Schema
-- Paste and execute this script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/igublmncvmpkrgnzxgtu/sql/new
-- ==============================================================================

-- 1. Demo Personas (Budi, Siti, Hendra, Admin)
CREATE TABLE IF NOT EXISTS public.demo_users (
  id            TEXT PRIMARY KEY,
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

-- 2. Demo Active Session (Dropdown switcher)
CREATE TABLE IF NOT EXISTS public.demo_session (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  active_user_id TEXT NOT NULL REFERENCES public.demo_users(id),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Demo Metadata (Version control & seed markers)
CREATE TABLE IF NOT EXISTS public.demo_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 4. Projects (Main Business Entity with JSONB documents, milestones, alerts, baselines)
CREATE TABLE IF NOT EXISTS public.projects (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  client                TEXT NOT NULL,
  status                TEXT NOT NULL,
  contract_value        BIGINT NOT NULL,
  planned_cost          BIGINT NOT NULL,
  actual_cost           BIGINT NOT NULL DEFAULT 0,
  billable_value        BIGINT NOT NULL DEFAULT 0,
  billed_value          BIGINT NOT NULL DEFAULT 0,
  paid_value            BIGINT NOT NULL DEFAULT 0,
  progress              INTEGER NOT NULL DEFAULT 0,
  baseline_version      TEXT NOT NULL DEFAULT 'V1',
  start_date            TEXT NOT NULL,
  end_date              TEXT NOT NULL,
  revision_limit        INTEGER NOT NULL DEFAULT 3,
  active_revision_count INTEGER NOT NULL DEFAULT 0,
  data_json             JSONB NOT NULL
);

-- Enable RLS and grant service role full access
ALTER TABLE public.demo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on demo_users" ON public.demo_users;
CREATE POLICY "Service role full access on demo_users" ON public.demo_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access on demo_session" ON public.demo_session;
CREATE POLICY "Service role full access on demo_session" ON public.demo_session FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access on demo_meta" ON public.demo_meta;
CREATE POLICY "Service role full access on demo_meta" ON public.demo_meta FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access on projects" ON public.projects;
CREATE POLICY "Service role full access on projects" ON public.projects FOR ALL USING (true);
