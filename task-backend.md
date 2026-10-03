# CLARA — Backend / Reconciliation Engine Task List

> Role: Backend / Business Logic Engineer  
> Scope: Hackathon MVP  
> Total: 15 tasks

---

## TASK 01 — Define Backend Domain Model

**Goal:** Menentukan entity utama CLARA agar semua data punya struktur yang konsisten.

### Core Entities
- User
- Project
- ContractDocument
- RABDocument
- AgreementBaseline
- PlanBaseline
- BaselineVersion
- Milestone
- ScopeItem
- ProjectEvent
- ActualCost
- Invoice
- Payment
- ChangeRequest
- Alert
- Evidence

### Checklist
- [ ] Define entity relationship
- [ ] Define required field
- [ ] Define optional field
- [ ] Define ID strategy
- [ ] Define timestamps
- [ ] Define project status
- [ ] Define baseline version relation

### Done When
Semua service backend menggunakan model data yang sama.

---

## TASK 02 — Setup Backend Project Structure

**Goal:** Menyiapkan backend CLARA yang modular dan mudah diintegrasikan.

### Checklist
- [ ] Setup Node.js + TypeScript
- [ ] Setup Express
- [ ] Setup environment variables
- [ ] Setup request validation
- [ ] Setup error handler
- [ ] Setup logging
- [ ] Setup API versioning
- [ ] Reuse existing CLARA backend jika memungkinkan

### Suggested Modules

```text
services/
├── project/
├── baseline/
├── finance/
├── monitoring/
├── change-request/
├── reconciliation/
├── evidence/
└── alert/
```

### Done When
Backend dapat dijalankan dan health endpoint bekerja.

---

## TASK 03 — Design & Setup Database Schema

**Goal:** Menyimpan seluruh lifecycle project dengan aman.

### Checklist
- [ ] Project table/node
- [ ] Agreement Baseline
- [ ] Plan Baseline
- [ ] Baseline Version
- [ ] Milestone
- [ ] Scope Item
- [ ] Project Event
- [ ] Actual Cost
- [ ] Invoice
- [ ] Payment
- [ ] Change Request
- [ ] Alert
- [ ] Evidence reference
- [ ] Migration / initialization script

### Important
Baseline lama tidak boleh ditimpa ketika ada perubahan.

### Done When
Data project dapat disimpan dan dibaca kembali lengkap dengan version history.

---

## TASK 04 — Build Project Management API

**Goal:** Menyediakan API lifecycle dasar project.

### Endpoints Minimum

```text
POST   /projects
GET    /projects
GET    /projects/:id
PATCH  /projects/:id
```

### Checklist
- [ ] Create project
- [ ] List project
- [ ] Detail project
- [ ] Project status
- [ ] Client data
- [ ] Project metadata
- [ ] Error handling

### Done When
Frontend dapat membuat dan membuka project.

---

## TASK 05 — Build Document Intake API

**Goal:** Menerima dokumen yang dibutuhkan AI pipeline.

### Supported Input
- Contract
- RAB
- Invoice
- Change Request / Addendum

### Checklist
- [ ] Upload endpoint
- [ ] File validation
- [ ] Document type
- [ ] File metadata
- [ ] Link document ke project
- [ ] Trigger AI/OCR processing
- [ ] Processing status
- [ ] Failure status

### Done When
Frontend dapat upload dokumen dan mendapatkan processing status.

---

## TASK 06 — Build Baseline Candidate API

**Goal:** Menyimpan hasil extraction AI sebagai candidate sebelum user confirmation.

### Flow

```text
AI Extraction
↓
Baseline Candidate
↓
User Review
↓
Confirm
↓
Active Baseline
```

### Checklist
- [ ] Save agreement candidate
- [ ] Save plan candidate
- [ ] Allow user edit
- [ ] Store AI confidence
- [ ] Store evidence reference
- [ ] Prevent candidate from being used by reconciliation engine

### Done When
Hasil AI belum dianggap source of truth sebelum dikonfirmasi.

---

## TASK 07 — Build Baseline Confirmation & Locking

**Goal:** Membuat baseline resmi yang dipakai sistem.

### Checklist
- [ ] Confirm Agreement Baseline
- [ ] Confirm Plan Baseline
- [ ] Create Baseline V1
- [ ] Mark baseline as ACTIVE
- [ ] Lock confirmed data
- [ ] Store who confirmed
- [ ] Store confirmation timestamp

### Rule
Reconciliation Engine hanya boleh membaca baseline yang sudah dikonfirmasi.

### Done When
Project memiliki baseline aktif yang valid.

---

## TASK 08 — Build Project Event & Monitoring API

**Goal:** Mendukung event-based project tracking.

### Event Types
- MILESTONE_COMPLETED
- PROGRESS_UPDATED
- TASK_ADDED
- SCOPE_CHANGED
- REVISION_ADDED
- DEADLINE_UPDATED
- NOTE_ADDED

### Checklist
- [ ] Create event
- [ ] Update milestone
- [ ] Update progress
- [ ] Add actual task/scope
- [ ] Update revision count
- [ ] Event history
- [ ] Timestamp ordering

### Done When
PM dapat update project hanya ketika event penting terjadi.

---

## TASK 09 — Build Finance API

**Goal:** Menyimpan actual cost, invoice, dan payment.

### Actual Cost Fields

```text
category
description
amount
date
reference
```

### Invoice Fields

```text
invoice_number
milestone_id
amount
issue_date
due_date
status
```

### Payment Fields

```text
invoice_id
amount
paid_at
```

### Checklist
- [ ] Add actual cost
- [ ] Edit actual cost
- [ ] Create invoice
- [ ] Update invoice
- [ ] Record payment
- [ ] Aggregate finance totals

### Done When
Finance data project dapat dipakai reconciliation engine.

---

## TASK 10 — Build Change Request & Baseline Versioning

**Goal:** Mendukung perubahan resmi project tanpa merusak baseline lama.

### Change Request Status

```text
DRAFT
PENDING
APPROVED
REJECTED
```

### Possible Changes
- Additional scope
- Additional value
- Deadline extension
- Revision allowance
- Milestone change
- Payment term change

### Checklist
- [ ] Create change request
- [ ] Edit pending request
- [ ] Approve / reject
- [ ] Prevent unapproved CR from affecting baseline
- [ ] Generate Baseline V2/V3 after approval
- [ ] Preserve previous baseline
- [ ] Set newest approved baseline as ACTIVE

### Done When
Approved change request menghasilkan baseline versi baru.

---

## TASK 11 — Build Budget Variance Engine

**Goal:** Membandingkan Plan Baseline dengan Actual Cost secara deterministic.

### Formula

```text
Budget Variance =
Actual Cost - Planned Cost
```

### Per Category Example

```text
UI/UX Planned = Rp15M
UI/UX Actual  = Rp18M

Variance = +Rp3M
```

### Checklist
- [ ] Total variance
- [ ] Category variance
- [ ] Budget utilization %
- [ ] Over-budget detection
- [ ] Return raw calculation
- [ ] Never use LLM for calculation

### Done When
Sistem dapat menghasilkan budget alert dengan angka yang dapat diverifikasi.

---

## TASK 12 — Build Billing & Value Realization Engine

**Goal:** Menghitung nilai yang sudah billable, billed, paid, dan belum ditagihkan.

### Core Metrics

```text
Contract Value
Billable Value
Billed Value
Paid Value
Unbilled Value
```

### Formula

```text
Unbilled Value =
Billable Value - Billed Value
```

### Checklist
- [ ] Evaluate completed milestone
- [ ] Read payment trigger
- [ ] Calculate billable entitlement
- [ ] Compare invoice amount
- [ ] Calculate billing difference
- [ ] Calculate paid value
- [ ] Prevent negative invalid values
- [ ] Link calculation to evidence

### Done When
Sistem dapat mendeteksi completed-but-unbilled dan billing mismatch.

---

## TASK 13 — Build Scope & Revision Reconciliation Service

**Goal:** Menggabungkan hasil semantic matching AI dengan rule deterministic.

### Input

```text
Active Contract Scope
Actual Project Tasks
AI Semantic Match Result
Revision Limit
Actual Revision Count
Approved Change Requests
```

### Checklist
- [ ] Read active baseline only
- [ ] Check approved change request
- [ ] Save semantic matching result
- [ ] Detect possible scope deviation
- [ ] Compare revision count
- [ ] Generate verified revision deviation
- [ ] Separate semantic warning from deterministic deviation

### Status

```text
MATCH
WARNING
VERIFIED_DEVIATION
```

### Done When
Backend dapat membedakan indikasi scope dengan deviation yang benar-benar terukur.

---

## TASK 14 — Build Alert & Evidence Service

**Goal:** Mengubah hasil reconciliation menjadi alert yang transparan.

### Alert Types
- BUDGET_VARIANCE
- BILLING_VARIANCE
- SCOPE_VARIANCE
- REVISION_VARIANCE
- DEADLINE_WARNING
- UNBILLED_VALUE

### Alert Structure

```json
{
  "type": "BILLING_VARIANCE",
  "status": "VERIFIED_DEVIATION",
  "impact": 10000000,
  "evidence": []
}
```

### Checklist
- [ ] Generate alert
- [ ] Severity/status
- [ ] Rp impact
- [ ] Evidence references
- [ ] Contract evidence
- [ ] Project evidence
- [ ] Finance evidence
- [ ] Resolve/review status
- [ ] API for alert list & detail

### Done When
Frontend dapat membuka alert dan melihat dasar perhitungannya.

---

## TASK 15 — Build Project Summary API, Integration Test & Demo Seed

**Goal:** Menyatukan semua data menjadi dashboard-ready response dan memastikan demo end-to-end berjalan.

### Dashboard Response Minimum

```json
{
  "contract_value": 120000000,
  "planned_cost": 75000000,
  "actual_cost": 63000000,
  "project_progress": 70,
  "billable_value": 84000000,
  "billed_value": 48000000,
  "paid_value": 36000000,
  "unbilled_value": 36000000,
  "active_baseline": "V1",
  "alerts": []
}
```

### Checklist
- [ ] Build project summary endpoint
- [ ] Aggregate baseline data
- [ ] Aggregate monitoring data
- [ ] Aggregate finance data
- [ ] Aggregate alert count
- [ ] End-to-end API test
- [ ] Seed demo project
- [ ] Seed Contract Baseline
- [ ] Seed RAB
- [ ] Seed progress
- [ ] Seed actual cost
- [ ] Seed invoice
- [ ] Seed alert
- [ ] Prepare fallback data

### Demo Flow

```text
Create Project
↓
Upload Contract + RAB
↓
AI Extraction
↓
Confirm Baseline
↓
Update Milestone
↓
Add Actual Cost
↓
Add Invoice
↓
Run Reconciliation
↓
Generate Alert
↓
Show Rp Impact + Evidence
```

### Done When
Frontend dapat menjalankan demo CLARA dari awal sampai insight akhir.

---

# Backend MVP Priority

## P0 — Wajib Jadi

1. Domain Model
2. Database Schema
3. Project API
4. Document Intake
5. Baseline Candidate
6. Baseline Confirmation
7. Project Monitoring API
8. Finance API
9. Budget Variance Engine
10. Billing / Value Realization Engine
11. Alert & Evidence Service

## P1 — Sangat Penting

12. Change Request & Baseline Versioning
13. Scope / Revision Reconciliation
14. Project Summary API

## P2 — Polish

15. Logging, validation, automated test, demo fallback

---

# Core Backend Flow

```text
PROJECT CREATED
      ↓
DOCUMENT UPLOAD
Contract + RAB
      ↓
AI EXTRACTION
      ↓
BASELINE CANDIDATE
      ↓
USER CONFIRMATION
      ↓
ACTIVE BASELINE V1
      │
      ├──────── Project Events
      ├──────── Actual Cost
      ├──────── Invoice / Payment
      └──────── Change Request
                    ↓
            If CR Approved
                    ↓
             ACTIVE BASELINE V2
      │
      ▼
RECONCILIATION ENGINE
      │
      ├── Budget Variance
      ├── Billing Variance
      ├── Scope Variance
      └── Revision Variance
      │
      ▼
ALERT + RP IMPACT + EVIDENCE
      │
      ▼
FRONTEND / HUMAN REVIEW
```

---

# Backend Responsibility

Backend bertanggung jawab terhadap:

- source of truth project,
- baseline lifecycle,
- financial calculations,
- project event history,
- baseline versioning,
- reconciliation,
- alert generation,
- evidence relation,
- API untuk frontend dan AI service.

---

# Backend Must Not

Backend tidak boleh:

- menganggap AI extraction sebagai confirmed data,
- mengubah baseline tanpa confirmation / approved change request,
- menggunakan RAB sebagai actual cost,
- menggunakan LLM untuk arithmetic financial calculation,
- menyebut possible scope mismatch sebagai verified violation,
- menghapus baseline lama saat membuat baseline baru,
- menghitung actual profit jika actual cost belum tersedia.

---

# Core Calculation Principle

> Confirmed data is the source of truth.  
> Deterministic code calculates the numbers.  
> AI interprets language.  
> Human approves business context.

---

# Integration Contract

## AI → Backend

AI mengirim:

```text
Structured Extraction
Evidence
Confidence
Semantic Match Result
Explanation
```

## Backend → AI

Backend mengirim:

```text
Confirmed Baseline
Actual Project Data
Deterministic Reconciliation Result
Relevant Evidence
```

## Backend → Frontend

Backend mengirim:

```text
Project Summary
Baseline
Monitoring Data
Finance Data
Alerts
Evidence
Change Request History
```

---

# Hackathon Success Criteria

Backend dianggap selesai jika satu demo project dapat melakukan:

```text
Contract + RAB
→ Confirmed Baseline
→ Project Update
→ Actual Cost
→ Invoice
→ Reconciliation
→ Rp Difference
→ Evidence
→ Dashboard
```

Tanpa perlu full ERP, full accounting system, atau integration ke Jira/ClickUp.
