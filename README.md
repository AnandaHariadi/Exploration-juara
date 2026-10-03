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

## Alur demo singkat

Tidak perlu login. Pilih Budi, Siti, atau Hendra dari profil di kanan atas. Pilihan peran tersimpan per browser; proyek dan tombol **Atur ulang data demo** masih memakai data bersama. Untuk mengulang presentasi, atur ulang data lebih dulu (ini juga menghapus perubahan pengunjung lain).

Mulai sebagai **Budi** lewat **Proyek baru**, isi nama proyek dan klien, pilih salah satu jalur di bawah, lalu pilih **Gunakan berkas contoh**. Semua berkas dan proyek contoh diberi label data demo.

| Jalur | Setelah acuan V1 disetujui | Langkah yang ditunjukkan |
| --- | --- | --- |
| Kesepakatan saja | Nilai, tenggat, revisi, ruang lingkup, dan hak tagih hanya muncul bila ketentuannya tersedia. Perbandingan biaya terhadap RAB belum tersedia. | Catat progres atau tahap selesai. Tambahkan RAB lewat **Acuan proyek**, periksa hasil baca, lalu setujui V2. |
| RAB saja | Biaya bisa dibandingkan dengan rencana. Nilai kesepakatan, laba rencana, dan hak tagih belum tersedia. | Catat biaya. Tambahkan kesepakatan lewat **Acuan proyek**, periksa hasil AI atau gunakan isian manual, lalu setujui V2. |
| Kesepakatan + RAB | Pemantauan pekerjaan, biaya, dan tagihan memakai acuan yang lengkap. | Lanjutkan cerita persetujuan perubahan di bawah. |

Untuk mencoba keputusan manusia: **Budi** mencatat pekerjaan atau revisi di luar acuan dan mengajukan perubahan → **Siti** memeriksa dampak biaya → **Hendra** menyetujui atau menolak. Jika disetujui internal, **Budi** mencatat bukti persetujuan klien; setelah itu perubahan berlaku sebagai acuan baru. AI membantu membaca dokumen dan menyiapkan saran; sistem menghitung angka; manusia menyetujui.

Jika layanan AI tidak tersedia, gunakan **Muat data contoh (tanpa AI)** untuk kesepakatan contoh, atau **Isi manual**. RAB contoh tetap dibaca oleh parser sistem tanpa AI. Setelah presentasi, periksa riwayat V1/V2, peringatan, dan bukti di halaman proyek.

## Contoh presentasi lengkap

Mulai dengan **Atur ulang data demo** bila memang ingin menghapus seluruh perubahan sebelumnya. Pilih **Budi Santoso** dari profil di header.

1. Buka **Proyek baru**. Isi *Sistem Manajemen Armada* dan *PT Astra Sahabat Logistik*. Pilih **Kesepakatan + RAB**, lalu **Gunakan berkas contoh**.
2. Kontrak contoh dianalisis otomatis. Bila layanan AI gagal, pilih **Muat data contoh (tanpa AI)**. Tinjau nilai kesepakatan Rp120.000.000, RAB Rp75.000.000, tenggat, batas revisi, dan syarat tagih. Setujui acuan V1.
3. Di **Pemantauan**, catat progres 60%, selesaikan tahap *UAT diterima*, dan catat 5 revisi. Di **Keuangan**, catat biaya Rp64.000.000.
4. Buka **Peringatan** dan **Lihat bukti**. Tahap UAT menghasilkan Rp30.000.000 yang siap ditagih tetapi belum dibuatkan invoice. Dua revisi melampaui batas tiga revisi; tarif kesepakatan menunjukkan tambahan Rp4.000.000.
5. Sebagai **Budi**, buat dan ajukan permintaan perubahan. Gunakan saran AI bila tersedia, atau isi permintaan secara manual. Acuan belum berubah pada tahap ini.
6. Ganti pengguna ke **Siti**. Dari dashboard atau tab **Perubahan**, periksa dampak biaya dan teruskan permintaan.
7. Ganti pengguna ke **Hendra**. Setujui atau tolak permintaan. Jika disetujui internal, acuan tetap V1 sampai ada persetujuan klien.
8. Kembali ke **Budi**. Lampirkan atau pilih bukti persetujuan klien di **Dokumen & AI**, lalu catat persetujuan pada tab **Perubahan**. Acuan V2 berlaku dan V1 tetap ada di riwayat.
9. Buka **Acuan proyek** dan **Peringatan** untuk menunjukkan perubahan yang resmi serta tagihan UAT yang masih perlu dikerjakan.
