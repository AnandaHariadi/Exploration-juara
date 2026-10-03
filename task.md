# CLARA — Frontend Task List

> Role: Product / UIUX / Frontend  
> Scope: Hackathon MVP  
> Total: 15 tasks

---

## TASK 01 — Setup Frontend Project Structure

**Goal:** Menyiapkan struktur frontend CLARA agar mudah dikembangkan dan diintegrasikan.

### Checklist
- [x] Setup project React + Vite
- [x] Setup Tailwind CSS
- [x] Setup React Router
- [x] Buat struktur folder `pages`, `components`, `services`, `hooks`, `types`
- [x] Setup API client / Axios
- [x] Buat environment variable untuk backend URL

### Done When
Frontend dapat dijalankan dan routing dasar bekerja.

---

## TASK 02 — Build App Layout & Navigation

**Goal:** Membuat layout utama aplikasi CLARA.

### Checklist
- [x] Sidebar navigation
- [x] Header/topbar
- [x] Responsive layout
- [x] Navigation state aktif
- [x] Menu utama:
  - Dashboard
  - Projects
  - Contract & RAB
  - Monitoring
  - Finance
  - Change Request
  - Alerts & Evidence
  - Legal AI

### Done When
User dapat berpindah antarhalaman tanpa reload.

---

## TASK 03 — Build Dashboard Overview

**Goal:** Menampilkan kondisi project secara cepat.

### Data yang ditampilkan
- Contract Value
- Planned Cost
- Actual Cost
- Project Progress
- Billable Value
- Billed Value
- Unbilled Value
- Jumlah alert

### Checklist
- [x] Summary cards
- [x] Project health section
- [x] Priority alerts
- [x] Progress indicator
- [x] Link ke detail project

### Done When
Owner dapat memahami kondisi project dari satu layar.

---

## TASK 04 — Build Projects Page

**Goal:** Menampilkan semua project yang sedang dikelola.

### Checklist
- [x] Project list
- [x] Project status
- [x] Contract value
- [x] Progress
- [x] Alert indicator
- [x] Button `Open Project`
- [x] Button `Create Project`

### Done When
User dapat melihat dan membuka project tertentu.

---

## TASK 05 — Build New Project Flow

**Goal:** Membuat flow pembuatan project baru.

### Flow
`Create Project → Upload Contract → Upload RAB → AI Extraction → Confirmation → Baseline`

### Checklist
- [x] Project name
- [x] Client name
- [x] Contract upload
- [x] RAB upload
- [x] Upload status
- [x] Continue button

### Done When
User dapat memulai project dan mengirim dokumen ke backend.

---

## TASK 06 — Build AI Extraction Loading & Result UI

**Goal:** Menampilkan proses dan hasil ekstraksi Contract + RAB.

### Checklist
- [x] Processing/loading state
- [x] Error state
- [x] Contract extraction result
- [x] RAB extraction result
- [x] Group hasil berdasarkan kategori
- [x] Tampilkan source/evidence jika tersedia

### Data contoh
- Contract value
- Deadline
- Scope
- Milestones
- Payment terms
- Revision limit
- Planned cost

### Done When
Hasil ekstraksi AI mudah dibaca user.

---

## TASK 07 — Build Baseline Confirmation Page

**Goal:** Memastikan AI tidak langsung dianggap benar.

### Checklist
- [x] Semua hasil extraction dapat direview
- [x] Field penting dapat diedit
- [x] Tampilkan Agreement Baseline
- [x] Tampilkan Plan Baseline
- [x] Warning sebelum baseline dikunci
- [x] Button `Confirm & Lock Baseline`

### Done When
Baseline hanya aktif setelah dikonfirmasi user.

---

## TASK 08 — Build Project Detail Page

**Goal:** Menjadi pusat informasi satu project.

### Sections
- Overview
- Baseline
- Monitoring
- Finance
- Change Requests
- Alerts

### Checklist
- [x] Project header
- [x] Status
- [x] Client
- [x] Contract value
- [x] Active baseline version
- [x] Tab navigation

### Done When
Semua informasi project dapat diakses dari satu halaman.

---

## TASK 09 — Build Project Monitoring UI

**Goal:** Memungkinkan update project berbasis event, bukan input harian.

### Checklist
- [x] Progress update
- [x] Milestone status
- [x] Revision count
- [x] Add project event
- [x] Add task/scope item
- [x] Event history / timeline

### Event contoh
- Milestone completed
- New task added
- Revision added
- Scope changed

### Done When
PM dapat memperbarui kondisi project hanya saat ada event penting.

---

## TASK 10 — Build Scope Comparison UI

**Goal:** Menampilkan perbandingan scope baseline dengan pekerjaan aktual.

### Status
- `MATCH`
- `NEEDS REVIEW`
- `APPROVED CHANGE`

### Checklist
- [x] Contract scope list
- [x] Actual scope/task list
- [x] Match indicator
- [x] Possible deviation indicator
- [x] Evidence button

### Done When
User dapat melihat task mana yang sesuai atau berpotensi keluar scope.

---

## TASK 11 — Build Finance Tracking Page

**Goal:** Menampilkan planned cost, actual cost, billing, dan payment.

### Checklist
- [x] Planned Cost
- [x] Actual Cost
- [x] Cost breakdown
- [x] Add actual cost form
- [x] Invoice list
- [x] Add/upload invoice
- [x] Invoice status
- [x] Payment status

### Done When
Finance dapat memperbarui data finansial project.

---

## TASK 12 — Build Billing & Value Realization UI

**Goal:** Menampilkan apakah nilai kontrak sudah terealisasi.

### Metrics
- Contract Value
- Billable Value
- Billed Value
- Paid Value
- Unbilled Value

### Checklist
- [x] Value summary
- [x] Milestone billing table
- [x] Billing mismatch indicator
- [x] Completed but unbilled indicator

### Done When
User dapat melihat gap antara hak tagih dengan invoice aktual.

---

## TASK 13 — Build Change Request Flow

**Goal:** Mendukung perubahan resmi project dan baseline versioning.

### Checklist
- [x] Create Change Request
- [x] Additional scope
- [x] Additional value
- [x] Deadline extension
- [x] Reason/notes
- [x] Status:
  - DRAFT
  - PENDING
  - APPROVED
  - REJECTED
- [x] Baseline version history

### Done When
Approved Change Request dapat terlihat sebagai Baseline V2/V3.

---

## TASK 14 — Build Alerts & Evidence Drawer

**Goal:** Setiap warning harus transparan dan punya bukti.

### Alert Types
- Budget Variance
- Scope Variance
- Billing Variance
- Revision Limit
- Deadline Risk

### Checklist
- [x] Alert list
- [x] Severity/status
- [x] Rp impact
- [x] `Show Evidence`
- [x] Contract evidence
- [x] Project evidence
- [x] Finance evidence
- [x] Human review action

### Done When
User dapat mengetahui alasan CLARA menghasilkan sebuah alert.

---

## TASK 15 — Frontend Integration, Demo Polish & Fallback

**Goal:** Menyatukan seluruh frontend dengan backend dan menyiapkan demo hackathon.

### Checklist
- [x] Integrasikan API real
- [x] Loading state semua request
- [x] Empty state
- [x] Error handling
- [x] Success feedback
- [x] Responsive check
- [x] Demo dataset
- [x] Demo project siap pakai
- [x] Fallback mock data jika backend gagal
- [x] Final UI polish
- [x] Pastikan alur demo berjalan:
  `Upload → Extract → Confirm → Monitor → Detect → Evidence`

### Done When
Frontend siap digunakan untuk demo end-to-end.

---

# Frontend MVP Priority

## P0 — Wajib Jadi
1. App Layout
2. Dashboard
3. Projects
4. Contract + RAB Upload
5. AI Extraction Result
6. Baseline Confirmation
7. Project Detail
8. Project Monitoring
9. Finance
10. Alerts & Evidence

## P1 — Sangat Penting
11. Scope Comparison
12. Billing / Value Realization
13. Change Request

## P2 — Polish
14. Responsive & UX polish
15. Demo fallback / presentation mode

---

# Main Frontend Flow

```text
Dashboard
   ↓
Projects
   ↓
Create Project
   ↓
Upload Contract + RAB
   ↓
AI Processing
   ↓
Review Extraction
   ↓
Confirm Baseline
   ↓
Project Active
   ↓
Monitoring + Finance
   ↓
CLARA Detects Variance
   ↓
Alert + Rp Impact
   ↓
Show Evidence
   ↓
Human Decision
```

---

## Frontend Principle

> Frontend CLARA harus membuat user dapat memahami masalah dalam beberapa detik, bukan sekadar menampilkan data sebanyak mungkin.

Prioritaskan:
- clarity,
- evidence,
- financial impact,
- simple project flow,
- human confirmation.
