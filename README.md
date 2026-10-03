# CLARA — Contract Intelligence for Business Value

> CLARA doesn't just read contracts. It watches what happens after the contract is signed.
> **Detect → Explain → Quantify → Resolve → Approve → Monitor.**
> AI interprets. The deterministic engine calculates. Humans decide.

## Architecture

```
Browser ──► Next.js app (frontend/, :3000)
              ├─ API routes ──► SQLite (frontend/data/clara.db) — single source of truth for business data
              │     ├─ engine.ts      deterministic metrics, reconciliation, alerts, cross-document checks, evidence
              │     ├─ domain.ts      baseline versions, events, finance, change-request governance, drafts
              │     ├─ guardian.ts    Document Guardian: automatic analysis of every uploaded document
              │     └─ remediation.ts Remediation Copilot: CR proposals, drafting, self-review, explanations
              └─ server-side AI client (ai.ts) ──► CLARA AI service (backend/, :3001)
                                                    OCR · extraction · evidence check · guardrails · legal RAG · drafting · PDF
```

- The browser only calls `/api/*`. It never sees the AI service URL, Gemini key, or Neo4j credentials.
- AI output is validated twice and only ever becomes a **candidate**, a **finding**, or a **draft**. Numbers (billing, variance, exposure, rate differences) are calculated by the engine.
- Every finding is labelled **Perhitungan terverifikasi** (engine), **Temuan AI** (AI interpretation) or **Dicatat pengguna**. Exposure is never presented as a loss.
- Change requests are governed: PIC submits → Finance reviews impact → Decision maker approves internally → client approval evidence → new baseline version (V2, V3…). Older versions are archived, never edited. Alerts explained by an approved change become **SUPERSEDED**.

## AI capabilities

| Capability | Where |
| --- | --- |
| Automatic analysis on upload (contract, RAB, invoice, addendum, client approval, supporting docs) | Upload anywhere → Document Guardian; status UPLOADED → PROCESSING → ANALYZED / NEEDS_REVIEW / FAILED |
| Extraction of value, dates, revisions, milestones, scope, rates, revision price, penalties, with page-verified quotes | Project setup review, Dokumen & AI tab |
| Contract risk findings (AI + legacy CLARA guardrails) | Dokumen & AI tab, Peringatan (risk ≥ medium) |
| Cross-document checks: invoice rate vs contract, arithmetic, entitlement, billing before trigger, revisions charged vs baseline, potential duplicates, addendum vs baseline | Engine on every reconcile |
| Plain-language explanation of an alert | Evidence drawer → "Jelaskan dampak bisnis (AI)" |
| Generate change request from an alert (numbers from contract terms) + addendum draft | Evidence drawer → "Buat permintaan perubahan (AI)" |
| Document Studio: addendum, CR, clause revision, MoU, LoI, PKS, anomaly follow-up; AI revise; self-review; approve; export PDF | /studio, Dokumen & AI tab |
| Legal Q&A with RAG + project context | /legal-ai |

AI unavailable → documents stay stored with status FAILED and a retry; business data and dashboards keep working; drafts fall back to a clearly labelled template.

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
npm --prefix frontend run test:api           # full pitch scenario via API, AI unavailable path (app must be running)
E2E_MODE=AI npm --prefix frontend run test:api   # same with automatic AI analysis, invoice cross-checks, explanations
# Without a Gemini key, AI paths can be tested with the stub:
#   node backend/scripts/gemini-stub.mjs & GOOGLE_AI_API_KEY=stub GEMINI_BASE_URL=http://localhost:3999 npm run dev:ai
npx --prefix frontend playwright install chromium  # once
npm --prefix frontend run test:ui            # browser: full pitch flow by clicking + all routes at 1440/1280/390 px
```

All tests start with a demo reset and can be rerun.

## Pitch demo script

Start: sidebar → **Atur ulang data demo** (confirm). Header persona → **Budi Santoso**.

**A. Project start (Budi)**
1. **Proyek baru** → name *Sistem Manajemen Armada*, client *PT Astra Sahabat Logistik* → **Gunakan berkas contoh (demo)** → **Buat proyek & lanjut ke analisis**.
2. CLARA analyzes the contract automatically (no button). If AI is unavailable, click **Muat data contoh (tanpa AI)**.
3. Review: Rp120.000.000 · RAB Rp75.000.000 · 30 Nov 2026 · 3 revisions · UAT 25% · Rp2.000.000/extra revision · Rp500.000/hour — each with the quoted clause and page (*Buka sumber*).
4. **4 · Setujui sebagai acuan V1** (planned profit Rp45.000.000).

**B–C. Monitoring and anomalies**
5. Pemantauan: progres **60** → Simpan. Keuangan: biaya **64000000** → Catat biaya (85,3% of RAB).
6. Pemantauan: **UAT diterima** → Tandai selesai (no invoice). Catat revisi **5**.
7. Peringatan → *UAT diterima selesai, belum ditagih* → **Lihat bukti**: clause 4.1 p.2, UAT event, no invoice, 25% × Rp120.000.000 = Rp30.000.000 (belum ditagih, bukan kerugian). Optional: **Jelaskan dampak bisnis (AI)**.
8. *2 revisi di luar acuan V1* → bukti 5 − 3 = 2 · nilai menurut tarif kontrak Rp4.000.000.

**D. AI remediation**
9. In that drawer: **Buat permintaan perubahan (AI)** → CR drafted: +2 revisi, +Rp4.000.000 (2 × Rp2.000.000, Pasal 5), +5 hari, with an addendum draft that passed self-review.
10. **Ajukan untuk persetujuan internal**.

**E–F. Finance and decision**
11. Persona **Siti** → Dashboard → *Tinjau dampak keuangan CR/…* → **Konfirmasi dampak & teruskan**.
12. Persona **Hendra** → Dashboard → *Putuskan CR/…* → **Setujui internal**. Baseline is still V1 (client approval required).

**G. Official change**
13. Persona **Budi** → tab **Dokumen & AI** → **Surat persetujuan klien** (sample) — CLARA reads it as approval 045/ASL-PROC/X/2026.
14. Tab **Perubahan** → choose that document → **Catat persetujuan klien & resmikan** → **V2**: Rp124.000.000, 5 revisions, 5 Des 2026.

**H. Close the loop**
15. Acuan proyek: V2 active, V1 archived with the change list. Peringatan: revision alert gone (show resolved → *Dijelaskan perubahan resmi*); Rp30.000.000 billing alert stays open.
16. Dokumen & AI: approve the addendum draft → **Ekspor PDF untuk dikirim** (CLARA never sends documents itself).
17. Optional cross-document demo: Dokumen & AI → **Invoice pekerjaan tambahan** → CLARA flags Rp650.000 vs Rp500.000/hour (Rp6.000.000 verified difference), 8 revisions charged vs 5 allowed, and billing before the addendum milestone is done.
18. Dashboard / **Pusat AI**: summary, priorities, analyzed documents, prepared actions.
