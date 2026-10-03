# CLARA — Frontend Platform

> **Contract Intelligence for Business Value**  
> Hackathon MVP Frontend Implementation

CLARA mengubah kontrak dari dokumen pasif menjadi baseline bisnis terstruktur yang dipantau selama project berjalan, mencocokkan:
**Agreement (Kontrak) ⟷ Plan (RAB) ⟷ Actual (Progress & Biaya) ⟷ Realized (Invoice & Cash In)**.

---

## 🚀 Cara Menjalankan

Dari direktori root maupun dari direktori `frontend`:

```bash
# Jalankan dari dalam folder frontend
cd frontend
npm run dev

# Atau langsung dari root Exploration-juara
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📂 Struktur Modul Frontend

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/        # TASK 03 — Dashboard Overview & Business Value KPIs
│   │   │   ├── projects/         # TASK 04 — Projects List & Filters
│   │   │   ├── projects/new/     # TASK 05, 06, 07 — Onboarding, AI Extraction, Baseline Lock
│   │   │   ├── projects/[id]/    # TASK 08 - 13 — Project Detail with Interactive Tabs
│   │   │   ├── monitoring/       # TASK 09, 10 — Scope Reconciliation & Revision Limits
│   │   │   ├── finance/          # TASK 11, 12 — Value Realization & Unbilled Gap Invoicing
│   │   │   ├── change-requests/  # TASK 13 — Change Request Flow & Versioning (V1 -> V2)
│   │   │   ├── alerts/           # TASK 14 — Global Alerts & Evidence Drawer
│   │   │   └── legal-ai/         # CLARA Legal Assistant (Contract Q&A & Citations)
│   │   ├── layout.tsx            # Root Layout
│   │   └── page.tsx              # Auto-redirect to /dashboard
│   ├── components/
│   │   ├── layout/               # Sidebar (8 Core Menus) & Topbar Header
│   │   ├── shared/               # Badges, Status Indicators, Formatters
│   │   └── alerts/               # EvidenceDrawer with clause citations & actions
│   ├── services/
│   │   ├── storage.ts            # Local interactive store (persists across demo sessions)
│   │   └── mockData.ts           # Realistic datasets (ASL ERP, BMS Mobile Banking, PSP IoT)
│   ├── types/                    # Domain models for Contract, Baseline, Variance, Alerts
│   └── lib/                      # Indonesian Rupiah formatter, date helper, cn()
```

---

## 🎯 Fitur Demo Interaktif (Hackathon Ready)

1. **Alur End-to-End P0**:
   - `Upload Kontrak & RAB` ➔ `AI Extraction Preview` ➔ `Human Baseline Confirmation` ➔ `Baseline Locked (V1.0)`.
2. **Reconciliation & Variance Detection**:
   - Deteksi *Budget Overrun* (Actual vs RAB).
   - Deteksi *Scope Deviation* (`NEEDS_REVIEW` vs SOW).
   - Deteksi *Revision Limit* (Klien melebihi kuota revisi gratis).
   - Deteksi *Billing Gap* (Milestone selesai tapi belum ditagihkan).
3. **Evidence Drawer**:
   - Setiap alert memiliki kutipan pasal kontrak, dokumen asal, tingkat keyakinan (confidence score), dan estimasi kerugian dalam Rupiah.
4. **Change Request & Versioning**:
   - Pengajuan dan persetujuan CR langsung menaikkan versi baseline (V1.0 ➔ V2.0).
5. **Reset Demo Data**:
   - Tombol *Reset Demo Data* di sidebar bawah untuk mengembalikan state simulasi kapan saja saat presentasi.
