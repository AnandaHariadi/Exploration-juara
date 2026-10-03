# CLARA — Frontend Task List

> Role: Product / UIUX / Frontend  
> Scope: Hackathon MVP  
> Total: 15 tasks

---

## TASK 01 — Setup Frontend Project Structure

**Goal:** Menyiapkan struktur frontend CLARA agar mudah dikembangkan dan diintegrasikan.

### Checklist
- [ ] Setup project React + Vite
- [ ] Setup Tailwind CSS
- [ ] Setup React Router
- [ ] Buat struktur folder `pages`, `components`, `services`, `hooks`, `types`
- [ ] Setup API client / Axios
- [ ] Buat environment variable untuk backend URL

### Done When
Frontend dapat dijalankan dan routing dasar bekerja.

---

## TASK 02 — Build App Layout & Navigation

**Goal:** Membuat layout utama aplikasi CLARA.

### Checklist
- [ ] Sidebar navigation
- [ ] Header/topbar
- [ ] Responsive layout
- [ ] Navigation state aktif
- [ ] Menu utama:
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
- [ ] Summary cards
- [ ] Project health section
- [ ] Priority alerts
- [ ] Progress indicator
- [ ] Link ke detail project

### Done When
Owner dapat memahami kondisi project dari satu layar.

---

## TASK 04 — Build Projects Page

**Goal:** Menampilkan semua project yang sedang dikelola.

### Checklist
- [ ] Project list
- [ ] Project status
- [ ] Contract value
- [ ] Progress
- [ ] Alert indicator
- [ ] Button `Open Project`
- [ ] Button `Create Project`

### Done When
User dapat melihat dan membuka project tertentu.

---

## TASK 05 — Build New Project Flow

**Goal:** Membuat flow pembuatan project baru.

### Flow
`Create Project → Upload Contract → Upload RAB → AI Extraction → Confirmation → Baseline`

### Checklist
- [ ] Project name
- [ ] Client name
- [ ] Contract upload
- [ ] RAB upload
- [ ] Upload status
- [ ] Continue button

### Done When
User dapat memulai project dan mengirim dokumen ke backend.

---

## TASK 06 — Build AI Extraction Loading & Result UI

**Goal:** Menampilkan proses dan hasil ekstraksi Contract + RAB.

### Checklist
- [ ] Processing/loading state
- [ ] Error state
- [ ] Contract extraction result
- [ ] RAB extraction result
- [ ] Group hasil berdasarkan kategori
- [ ] Tampilkan source/evidence jika tersedia

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
- [ ] Semua hasil extraction dapat direview
- [ ] Field penting dapat diedit
- [ ] Tampilkan Agreement Baseline
- [ ] Tampilkan Plan Baseline
- [ ] Warning sebelum baseline dikunci
- [ ] Button `Confirm & Lock Baseline`

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
- [ ] Project header
- [ ] Status
- [ ] Client
- [ ] Contract value
- [ ] Active baseline version
- [ ] Tab navigation

### Done When
Semua informasi project dapat diakses dari satu halaman.

---

## TASK 09 — Build Project Monitoring UI

**Goal:** Memungkinkan update project berbasis event, bukan input harian.

### Checklist
- [ ] Progress update
- [ ] Milestone status
- [ ] Revision count
- [ ] Add project event
- [ ] Add task/scope item
- [ ] Event history / timeline

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
- [ ] Contract scope list
- [ ] Actual scope/task list
- [ ] Match indicator
- [ ] Possible deviation indicator
- [ ] Evidence button

### Done When
User dapat melihat task mana yang sesuai atau berpotensi keluar scope.

---

## TASK 11 — Build Finance Tracking Page

**Goal:** Menampilkan planned cost, actual cost, billing, dan payment.

### Checklist
- [ ] Planned Cost
- [ ] Actual Cost
- [ ] Cost breakdown
- [ ] Add actual cost form
- [ ] Invoice list
- [ ] Add/upload invoice
- [ ] Invoice status
- [ ] Payment status

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
- [ ] Value summary
- [ ] Milestone billing table
- [ ] Billing mismatch indicator
- [ ] Completed but unbilled indicator

### Done When
User dapat melihat gap antara hak tagih dengan invoice aktual.

---

## TASK 13 — Build Change Request Flow

**Goal:** Mendukung perubahan resmi project dan baseline versioning.

### Checklist
- [ ] Create Change Request
- [ ] Additional scope
- [ ] Additional value
- [ ] Deadline extension
- [ ] Reason/notes
- [ ] Status:
  - DRAFT
  - PENDING
  - APPROVED
  - REJECTED
- [ ] Baseline version history

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
- [ ] Alert list
- [ ] Severity/status
- [ ] Rp impact
- [ ] `Show Evidence`
- [ ] Contract evidence
- [ ] Project evidence
- [ ] Finance evidence
- [ ] Human review action

### Done When
User dapat mengetahui alasan CLARA menghasilkan sebuah alert.

---

## TASK 15 — Frontend Integration, Demo Polish & Fallback

**Goal:** Menyatukan seluruh frontend dengan backend dan menyiapkan demo hackathon.

### Checklist
- [ ] Integrasikan API real
- [ ] Loading state semua request
- [ ] Empty state
- [ ] Error handling
- [ ] Success feedback
- [ ] Responsive check
- [ ] Demo dataset
- [ ] Demo project siap pakai
- [ ] Fallback mock data jika backend gagal
- [ ] Final UI polish
- [ ] Pastikan alur demo berjalan:
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
