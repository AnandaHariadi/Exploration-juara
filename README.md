# CLARA — Contract Intelligence for Business Value

> What we agreed · What we planned · What actually happened · What we realized.
> AI understands language. Backend calculates facts. Frontend explains the state. Human confirms the truth.

## Architecture

```
Browser ──► Next.js app (frontend/, :3000)
              ├─ API routes ──► SQLite (frontend/data/clara.db)   ← single source of truth for business data
              │                 deterministic engine (src/lib/engine.ts): metrics, reconciliation, alerts, evidence
              └─ server-side AI client (src/lib/ai.ts) ──► CLARA AI service (backend/, :3001)
                                                            OCR · extraction · evidence check · legal RAG (Gemini, optional Neo4j)
```

- The browser only calls `/api/*` on the Next.js app. It never sees the AI service URL, Gemini key, or Neo4j credentials.
- AI output is validated twice (AI service + Next.js) and only ever becomes a **candidate**. A human confirms it into baseline **V1**.
- Only an **approved** change request creates a new baseline version (V2, V3…). Old versions are archived, never edited.

## Run locally

Requirements: Node.js 20+.

```bash
npm run install:all            # once
cp backend/.env.example backend/.env    # then set GOOGLE_AI_API_KEY for real AI analysis

# terminal 1 — AI service (http://localhost:3001/health)
npm run dev:ai
# terminal 2 — business app (http://localhost:3000)
npm run dev:frontend
```

The app runs without the AI service or without a Gemini key: the UI shows “Analisis gagal — layanan AI tidak tersedia” or “kunci Gemini belum diatur”, and the labelled **data contoh** (sample) path keeps the demo working. Neo4j and Redis are optional (legal RAG citations / legacy async queue).

### Environment variables

| Where | Variable | Purpose |
| --- | --- | --- |
| backend/.env | `GOOGLE_AI_API_KEY` | **Required for AI.** Gemini key, server-only. |
| backend/.env | `GEMINI_MODEL` | Default `gemini-2.5-flash`. |
| backend/.env | `AI_SERVICE_KEY` | Optional shared secret; must equal `CLARA_AI_SERVICE_KEY`. |
| backend/.env | `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` | Optional legal knowledge graph for RAG. |
| backend/.env | `ENABLE_QUEUE`, `REDIS_URL` | Optional legacy BullMQ worker (off by default). |
| backend/.env | `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET` | Legacy standalone CLARA login only; not used by the business app. |
| frontend/.env.local | `CLARA_AI_URL` | AI service URL, default `http://localhost:3001`. |
| frontend/.env.local | `CLARA_AI_SERVICE_KEY` | Optional, see above. |
| frontend/.env.local | `CLARA_AI_TIMEOUT_MS` | Analysis timeout, default 150000. |

No `NEXT_PUBLIC_*` variables are used. Never commit `.env` files.

## Tests

```bash
npm --prefix backend test                    # unit tests (guardrails, retrieval)
npm --prefix frontend run test:api           # 69-check API scenario of the full pitch flow (app must be running)
E2E_MODE=AI npm --prefix frontend run test:api   # same, through real AI extraction
npx --prefix frontend playwright install chromium  # once
npm --prefix frontend run test:ui            # browser: full pitch flow by clicking + all routes at 1440/1280/390 px
```

All tests start with a demo reset and can be rerun.

## Pitch demo script

1. Sidebar → **Atur ulang data demo** (confirm). Header → choose **Budi Santoso**.
2. Dashboard → **Siapkan acuan** → *Sistem Manajemen Armada & Logistik* (contract PDF + RAB CSV already attached; *Buka sumber* opens them).
3. **Analisis dengan AI** (or **Muat data contoh (tanpa AI)** if AI is unavailable).
4. Review: Rp120.000.000 · RAB Rp75.000.000 · deadline 30 Nov 2026 · 3 revisions · UAT 25% — each with the quoted clause and page.
5. **Setujui sebagai acuan V1** → planned profit Rp45.000.000.
6. Pemantauan: progres **60** → Simpan. Keuangan: biaya **64000000** → Catat biaya (85,3% of RAB).
7. Pemantauan: **UAT diterima** → Tandai selesai. Do not create an invoice.
8. Pemantauan: revisi **5** → Catat.
9. Peringatan → *UAT diterima selesai, belum ditagih* → **Lihat bukti**: Pasal 4.1 (hal. 2), UAT event, no invoice, 25% × Rp120.000.000 = Rp30.000.000 belum ditagih.
10. *2 revisi di luar acuan V1* → bukti 5 − 3 = 2.
11. Perubahan → **Isi otomatis** (+2 revisi) → nilai **4000000**, hari **5** → Ajukan → **Setujui perubahan**.
12. Acuan proyek tab: **V2 aktif** Rp124.000.000, 5 revisi, tenggat 5 Des 2026; **V1 diarsipkan**. The revision alert is resolved automatically; the Rp30.000.000 billing alert stays open.
13. Optional: Siti → Keuangan → **Buat tagihan** → **Catat pembayaran**; dashboard updates. Hendra → Peringatan.
