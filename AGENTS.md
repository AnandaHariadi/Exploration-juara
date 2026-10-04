# AGENTS.md - Development Rules & Guidelines

Dokumen ini berisi aturan baku, alur kerja (SOP), dan standar teknis yang WAJIB ditaati oleh setiap AI Agent yang bekerja di repositori **CLARA (Contract Intelligence for Business Value)**.

---

## 1. Ground Rules & Workflow (Wajib & Mutlak)

### A. Alur Kerja: AUDIT -> GAS -> KERJAKAN
1. **AUDIT**: Setiap kali ada permintaan fitur, refaktor, atau perubahan kode, Agent WAJIB melakukan audit terlebih dahulu (analisa kebutuhan, file yang terdampak, dan rancangan teknis).
2. **MENUNGGU**: Agent DILARANG menyentuh, membuat, atau mengedit kode sebelum user memberikan instruksi tegas berupa kata **"GAS"**.
3. **KERJAKAN**: Eksekusi kodingan baru boleh dimulai HANYA setelah ada perintah **"GAS"** dari user.

### B. Aturan Git Commit
- Agent **DILARANG KERAS** menjalankan `git commit` secara mandiri tanpa instruksi eksplisit dari user.
- Jika diinstruksikan untuk commit, commit harus menggunakan identitas user sebagai author / co-author yang sah.

---

## 2. Git Branching Strategy

- **`main`**: Branch Produksi / Stabil untuk deployment dan pitch.
- **`staging` / `feat/*`**: Branch Pengembangan dan sinkronisasi fitur aktif.

---

## 3. Tech Stack & Arsitektur Sistem (CLARA)

Prinsip Inti:
> **"AI interprets. The deterministic engine calculates. Humans decide."**

### A. Frontend Business App (`frontend/`, Port 3000)
- **Framework**: Next.js 15 (App Router `src/app/(app)/...`) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **Database**: SQLite (`frontend/data/clara.db` via `better-sqlite3`) sebagai *single source of truth* untuk data bisnis dan proyek.
- **Engine Deterministik**: [`engine.ts`](src/lib/engine.ts) menghitung fakta, angka rupiah, pemakaian anggaran, hak tagih, dan anomali. AI dilarang keras mengarang atau menghitung angka finansial.
- **Domain & Dokumen**: [`domain.ts`](src/lib/domain.ts) untuk mutasi state & baseline versioning (V1, V2); [`guardian.ts`](src/lib/guardian.ts) untuk Document Guardian; [`remediation.ts`](src/lib/remediation.ts) untuk Remediation Copilot.

### B. Backend AI Service (`backend/`, Port 3001)
- **Framework**: Node.js + Express.js + TypeScript
- **AI Models**: Google Generative AI (Gemini 2.5 Flash, Gemini Embeddings)
- **Modul**:
  - OCR & Ekstraksi Kontrak Multimodal ([`contractExtractionService.ts`](src/services/extraction/contractExtractionService.ts))
  - Guardrail Hukum ([`guardrailService.ts`](src/services/guardrail/guardrailService.ts))
  - Legal RAG & Retrieval ([`hybridRetrieval.ts`](src/services/retrieval/hybridRetrieval.ts))
  - Document Studio & Self-Review ([`studioService.ts`](src/services/studio/studioService.ts))
  - Renderer PDF ([`pdfService.ts`](src/services/drafter/pdfService.ts))
- **Integrasi**: Endpoint server-to-server [`/api/v1/integration/*`](src/routes/integration.ts) diproteksi `AI_SERVICE_KEY`.

---

## 4. Standar Kode & Kualitas
- Strictly Type-Safe (TypeScript tanpa `any` yang tidak perlu).
- Semua nominal uang disimpan dan dihitung dalam integer Rupiah (hindari floating point precision error).
- Tidak merusak struktur komponen dan styling yang sudah ada.
- Menjaga integritas komentar dan dokumentasi kode.
- Selalu sediakan mode fallback (data contoh berlabel jelas) agar demo tetap berjalan mulus meskipun AI service offline.
