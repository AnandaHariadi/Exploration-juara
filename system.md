# CLARA — System Documentation

> Contract Business Intelligence & Monitoring Platform  
> Hackathon MVP System Specification  
> Frontend: Next.js  
> Backend: Node.js + Express + TypeScript  
> AI: Gemini / LLM + Embeddings + OCR / Document Parsing  
> Status: MVP — authentication and authorization are intentionally deferred

---

# 1. Product Definition

CLARA adalah **Contract Business Intelligence & Monitoring Platform** yang mengubah kontrak dari dokumen pasif menjadi baseline bisnis yang dapat dipantau selama project berjalan.

CLARA membantu bisnis menjawab empat pertanyaan utama:

1. **Apa yang kita sepakati?**
2. **Apa yang kita rencanakan?**
3. **Apa yang benar-benar terjadi?**
4. **Apakah nilai kontrak sudah terealisasi?**

Core statement:

> **What we agreed. What we planned. What actually happened. What we realized.**

Prinsip utama:

> **AI understands language.**  
> **Backend calculates facts.**  
> **Frontend explains the state.**  
> **Human confirms the truth.**

---

# 2. Product Scope

CLARA memiliki dua lapisan besar.

## 2.1 Existing CLARA Legal Intelligence

Kemampuan yang sudah ada dan dapat direuse:

- Contract OCR / document parsing
- Contract risk review
- Legal clause detection
- Legal RAG
- Legal Q&A
- Evidence / citations
- Document drafting
- Knowledge graph / retrieval jika masih digunakan

## 2.2 New CLARA Business Monitoring Layer

Fokus utama MVP hackathon:

- Contract + RAB extraction
- Baseline creation
- Baseline confirmation
- Project monitoring
- Actual cost tracking
- Invoice tracking
- Change Request
- Baseline versioning
- Budget variance
- Scope variance
- Billing variance
- Contract value realization
- Evidence-based alerts
- Business impact dashboard

---

# 3. System Philosophy

CLARA tidak boleh menjadi:

```text
Upload PDF
↓
AI membaca
↓
AI bebas memberi kesimpulan
```

CLARA harus menggunakan alur:

```text
DOCUMENT
↓
AI UNDERSTANDING
↓
STRUCTURED DATA
↓
USER CONFIRMATION
↓
CONFIRMED BASELINE
↓
ACTUAL PROJECT DATA
↓
DETERMINISTIC RECONCILIATION
↓
ALERT + FINANCIAL IMPACT
↓
AI EXPLANATION
↓
HUMAN DECISION
```

---

# 4. Core Business Model

CLARA menggunakan empat sumber kebenaran utama.

## 4.1 Agreement

Berasal dari:

- Contract
- PKS
- SPK
- SOW
- MoU jika memang memiliki detail yang cukup
- Addendum

Menjawab:

> Apa yang disepakati?

Contoh data:

- contract value
- deadline
- scope
- milestone
- payment terms
- billing trigger
- revision limit
- rate
- penalty
- obligations

---

## 4.2 Plan

Berasal dari:

- RAB
- Budget Plan
- Quotation
- Cost Proposal

Menjawab:

> Apa yang direncanakan?

Contoh data:

- UI/UX budget
- Development budget
- Infrastructure budget
- Vendor budget
- Other planned cost
- Total planned cost

RAB adalah **planned cost**, bukan actual cost.

---

## 4.3 Actual Project

Berasal dari:

- milestone updates
- progress updates
- actual tasks
- revision count
- actual scope
- actual project events

Menjawab:

> Apa yang benar-benar terjadi?

---

## 4.4 Finance

Berasal dari:

- actual cost
- invoice
- payment

Menjawab:

> Apa yang benar-benar keluar dan masuk secara finansial?

---

# 5. Primary System Flow

```text
CREATE PROJECT
      ↓
UPLOAD CONTRACT + RAB
      ↓
DOCUMENT PARSING / OCR
      ↓
AI EXTRACTION
      ↓
STRUCTURED CANDIDATE DATA
      ↓
USER REVIEW & CONFIRMATION
      ↓
ACTIVE BASELINE V1
      │
      ├── Project Events
      ├── Milestone Updates
      ├── Actual Cost
      ├── Invoice
      ├── Payment
      └── Change Request
               ↓
       APPROVED CHANGE?
          YES ↓
       BASELINE V2/V3
               ↓
      RECONCILIATION ENGINE
               ↓
    ┌──────────┼──────────┐
    ↓          ↓          ↓
  Budget      Scope      Billing
 Variance    Variance    Variance
    │          │          │
    └──────────┼──────────┘
               ↓
       BUSINESS IMPACT
               ↓
           EVIDENCE
               ↓
       AI EXPLANATION
               ↓
          HUMAN REVIEW
```

---

# 6. Current MVP Roles

Authentication belum menjadi prioritas.

Tidak perlu membuat:

- login flow
- auth middleware
- permission middleware
- RBAC kompleks
- JWT enforcement

Untuk MVP, hanya gunakan **logical role** pada desain product:

## Project / Owner

Mengelola:

- project
- contract
- RAB
- baseline
- milestone
- progress
- scope
- Change Request

## Finance

Mengelola:

- actual cost
- invoice
- payment

Untuk hackathon satu user dapat mengakses seluruh fitur.

---

# 7. Recommended Tech Stack

## 7.1 Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
Motion
PDF.js
React Hook Form
Zod
Axios / fetch wrapper
```

Optional:

```text
TanStack Query
Recharts
Sonner
date-fns
```

### Purpose

**Next.js**
- application framework
- routing
- page composition
- server/client component separation

**shadcn/ui**
- reusable UI primitives
- dialog
- sheet
- dropdown
- tabs
- table
- form
- alert
- card

**Lucide Icons**
- consistent icon system

**Motion**
- page transitions
- loading states
- subtle interaction animation
- alert transitions

**PDF.js**
- render contract/RAB/invoice preview
- navigate PDF pages
- support evidence highlighting

**Zod**
- frontend validation
- shared API response validation if needed

---

## 7.2 Backend

```text
Node.js
Express.js
TypeScript
Controller → Service → Repository pattern
Zod
Database
```

Database dapat menyesuaikan existing CLARA.

Jika existing CLARA masih menggunakan Neo4j:

```text
Neo4j
```

Jika ingin lebih cepat untuk operational business entities:

```text
PostgreSQL
```

Namun untuk hackathon jangan migrasi stack hanya demi ideal architecture jika existing CLARA sudah stabil.

---

## 7.3 AI Layer

```text
Gemini / compatible LLM
Embedding Model
OCR / PDF Parsing
Existing CLARA RAG
Existing CLARA Legal Knowledge
```

AI tidak membutuhkan custom model training untuk MVP.

---

# 8. Frontend Architecture

Recommended structure:

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [projectId]/
│   │       ├── page.tsx
│   │       ├── baseline/
│   │       ├── monitoring/
│   │       ├── finance/
│   │       ├── changes/
│   │       └── alerts/
│   ├── legal/
│   │   └── page.tsx
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── project/
│   ├── baseline/
│   ├── monitoring/
│   ├── finance/
│   ├── alerts/
│   ├── evidence/
│   ├── documents/
│   └── ui/
│
├── lib/
│   ├── api.ts
│   ├── utils.ts
│   ├── validation.ts
│   └── constants.ts
│
├── hooks/
│   ├── use-projects.ts
│   ├── use-project.ts
│   ├── use-baseline.ts
│   ├── use-finance.ts
│   └── use-alerts.ts
│
├── services/
│   ├── project.service.ts
│   ├── document.service.ts
│   ├── baseline.service.ts
│   ├── monitoring.service.ts
│   ├── finance.service.ts
│   ├── change-request.service.ts
│   └── alert.service.ts
│
├── types/
│   ├── project.ts
│   ├── baseline.ts
│   ├── finance.ts
│   ├── alert.ts
│   └── api.ts
│
└── public/
```

---

# 9. Frontend Page Model

## 9.1 Dashboard

Menampilkan:

- Contract Value
- Planned Cost
- Actual Cost
- Project Progress
- Billable Value
- Billed Value
- Paid Value
- Unbilled Value
- Active Alerts

Example:

```text
Contract Value   Rp120M
Planned Cost      Rp75M
Actual Cost       Rp61M
Progress             75%
Billable Value     Rp84M
Billed Value       Rp48M
Unbilled Value     Rp36M
```

---

## 9.2 Projects

Menampilkan:

- project name
- client
- progress
- contract value
- status
- alert count

Primary actions:

```text
Create Project
Open Project
```

---

## 9.3 Create Project

Flow:

```text
Project Information
↓
Upload Contract
↓
Upload RAB
↓
Process Documents
↓
Review Extraction
↓
Confirm Baseline
```

---

## 9.4 Baseline Confirmation

Frontend wajib menampilkan hasil AI sebagai editable candidate.

Example:

```text
Contract Value: Rp120M
Deadline: 20 Dec 2026
Revision Limit: 3
Milestone UAT: 25%

Planned Cost: Rp75M
```

Actions:

```text
Edit
Confirm & Lock Baseline
```

Tidak boleh langsung lock tanpa user confirmation.

---

## 9.5 Monitoring

Menampilkan:

- progress
- milestones
- project events
- revisions
- actual scope/tasks

Update bersifat **event-based**.

Tidak ada kewajiban daily input.

Examples:

```text
UAT Completed
Revision #5 Added
New Task Added
Scope Updated
```

---

## 9.6 Finance

Menampilkan:

- planned cost
- actual cost
- invoices
- payments

Actions:

```text
Add Actual Cost
Add Invoice
Mark Payment
```

---

## 9.7 Change Request

Fields:

```text
title
reason
additional_scope
additional_value
deadline_extension
revision_change
status
```

Statuses:

```text
DRAFT
PENDING
APPROVED
REJECTED
```

Hanya `APPROVED` yang dapat membuat baseline baru.

---

## 9.8 Alerts & Evidence

Alert example:

```text
VERIFIED BILLING DIFFERENCE

Expected: Rp30M
Invoice: Rp20M
Difference: Rp10M
```

Evidence:

```text
Contract
Clause 4.2
25% payment after UAT

Project
UAT Completed

Invoice
Rp20M
```

---

## 9.9 Legal AI

Existing CLARA features:

- contract risk review
- legal Q&A
- document drafting

Ini adalah supporting feature, bukan core flow monitoring.

---

# 10. PDF.js Usage

PDF.js digunakan untuk document preview.

Supported documents:

- contract
- RAB
- invoice
- Change Request
- addendum

Recommended UI:

```text
┌─────────────────────────┬──────────────────────┐
│                         │ Extracted Data       │
│      PDF Preview        │                      │
│                         │ Contract Value       │
│      Page 4 / 12        │ Rp120M              │
│                         │                      │
│  highlighted evidence   │ Evidence: Clause 4.2│
│                         │                      │
└─────────────────────────┴──────────────────────┘
```

Frontend should support:

- page navigation
- zoom
- evidence page jump
- highlight evidence
- source snippet display

---

# 11. Motion Usage

Motion hanya digunakan untuk UX enhancement.

Good usage:

- page transition
- drawer transition
- alert appearing
- loading state
- baseline confirmation transition
- expanded evidence section

Avoid:

- excessive animation
- long intro animation
- distracting dashboard movement

Principle:

> Motion should explain state change, not decorate everything.

---

# 12. UI Design Principles

CLARA adalah business intelligence product.

UI harus:

- clean
- trustworthy
- data-first
- minimal
- readable
- evidence-driven

Prioritize:

```text
Insight
↓
Impact
↓
Evidence
↓
Action
```

Avoid:

- terlalu banyak gradient
- gamification
- excessive cards
- AI-looking neon UI
- overly complex charts

---

# 13. Backend Architecture

Recommended structure:

```text
backend/
├── src/
│   ├── controllers/
│   │   ├── project.controller.ts
│   │   ├── document.controller.ts
│   │   ├── baseline.controller.ts
│   │   ├── monitoring.controller.ts
│   │   ├── finance.controller.ts
│   │   ├── change-request.controller.ts
│   │   ├── reconciliation.controller.ts
│   │   └── alert.controller.ts
│   │
│   ├── services/
│   │   ├── project.service.ts
│   │   ├── document.service.ts
│   │   ├── baseline.service.ts
│   │   ├── monitoring.service.ts
│   │   ├── finance.service.ts
│   │   ├── change-request.service.ts
│   │   ├── reconciliation.service.ts
│   │   ├── business-impact.service.ts
│   │   └── evidence.service.ts
│   │
│   ├── repositories/
│   │   ├── project.repository.ts
│   │   ├── baseline.repository.ts
│   │   ├── finance.repository.ts
│   │   └── alert.repository.ts
│   │
│   ├── ai/
│   │   ├── extraction/
│   │   ├── scope-matching/
│   │   ├── explanation/
│   │   └── prompts/
│   │
│   ├── validators/
│   ├── types/
│   ├── routes/
│   ├── utils/
│   └── index.ts
│
└── package.json
```

---

# 14. Backend Layer Responsibilities

## Controller

Controller bertanggung jawab terhadap:

- menerima request
- membaca params/body/file
- memanggil service
- mengembalikan response
- HTTP status

Controller tidak melakukan business calculation.

Example:

```text
POST /projects/:id/actual-costs

Controller
↓
FinanceService.addActualCost()
↓
Repository
↓
Response
```

---

## Service

Service bertanggung jawab terhadap:

- business rule
- orchestration
- calculation
- validation
- reconciliation trigger

Example:

```text
Invoice Created
↓
FinanceService
↓
ReconciliationService
↓
Billing Variance Recalculated
↓
Alert Updated
```

---

## Repository

Repository bertanggung jawab terhadap:

- database query
- create
- read
- update
- persistence

Repository tidak membuat business decision.

---

# 15. No Authentication Middleware for MVP

Current rule:

```text
NO AUTH MIDDLEWARE
NO JWT REQUIREMENT
NO RBAC MIDDLEWARE
```

Routes dapat langsung digunakan.

Example:

```ts
router.get("/projects", projectController.list)
```

Bukan:

```ts
router.get(
  "/projects",
  authMiddleware,
  roleMiddleware,
  projectController.list
)
```

Authentication dapat ditambahkan setelah core product stabil.

---

# 16. Core Domain Models

## Project

```ts
type Project = {
  id: string
  name: string
  clientName: string
  status: "DRAFT" | "ACTIVE" | "COMPLETED"
  progress: number
  activeBaselineVersion: number | null
  createdAt: string
  updatedAt: string
}
```

---

## Agreement Baseline

```ts
type AgreementBaseline = {
  contractValue: number | null
  startDate: string | null
  deadline: string | null
  revisionLimit: number | null
  scope: ScopeItem[]
  milestones: Milestone[]
  paymentTerms: PaymentTerm[]
  obligations: Obligation[]
}
```

---

## Plan Baseline

```ts
type PlanBaseline = {
  items: BudgetItem[]
  totalPlannedCost: number
}
```

---

## Baseline Version

```ts
type BaselineVersion = {
  version: number
  agreement: AgreementBaseline
  plan: PlanBaseline
  status: "ACTIVE" | "ARCHIVED"
  sourceChangeRequestId?: string
  confirmedAt: string
}
```

---

## Project Event

```ts
type ProjectEvent = {
  id: string
  projectId: string
  type:
    | "PROGRESS_UPDATED"
    | "MILESTONE_COMPLETED"
    | "TASK_ADDED"
    | "REVISION_ADDED"
    | "SCOPE_CHANGED"
    | "NOTE_ADDED"
  data: unknown
  createdAt: string
}
```

---

## Actual Cost

```ts
type ActualCost = {
  id: string
  category: string
  description: string
  amount: number
  date: string
}
```

---

## Invoice

```ts
type Invoice = {
  id: string
  invoiceNumber: string
  milestoneId?: string
  amount: number
  issueDate: string
  dueDate?: string
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED"
}
```

---

## Change Request

```ts
type ChangeRequest = {
  id: string
  title: string
  reason?: string
  additionalScope?: ScopeItem[]
  additionalValue?: number
  deadlineExtensionDays?: number
  revisionChange?: number
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
}
```

---

## Alert

```ts
type Alert = {
  id: string
  type:
    | "BUDGET_VARIANCE"
    | "SCOPE_VARIANCE"
    | "BILLING_VARIANCE"
    | "REVISION_VARIANCE"
    | "DEADLINE_WARNING"
    | "UNBILLED_VALUE"

  status:
    | "MATCH"
    | "WARNING"
    | "VERIFIED_DEVIATION"

  impact?: number
  message: string
  evidence: Evidence[]
}
```

---

# 17. API Design

Base:

```text
/api/v1
```

---

## Projects

```text
POST   /projects
GET    /projects
GET    /projects/:projectId
PATCH  /projects/:projectId
```

---

## Documents

```text
POST /projects/:projectId/documents
GET  /projects/:projectId/documents
GET  /documents/:documentId
```

---

## AI Extraction

```text
POST /documents/:documentId/extract
GET  /documents/:documentId/extraction
```

---

## Baseline

```text
GET  /projects/:projectId/baseline/candidate
PUT  /projects/:projectId/baseline/candidate
POST /projects/:projectId/baseline/confirm
GET  /projects/:projectId/baselines
GET  /projects/:projectId/baselines/:version
```

---

## Monitoring

```text
POST /projects/:projectId/events
GET  /projects/:projectId/events
PATCH /projects/:projectId/progress
PATCH /projects/:projectId/milestones/:milestoneId
```

---

## Finance

```text
POST /projects/:projectId/actual-costs
GET  /projects/:projectId/actual-costs

POST /projects/:projectId/invoices
GET  /projects/:projectId/invoices

POST /projects/:projectId/payments
GET  /projects/:projectId/payments
```

---

## Change Request

```text
POST  /projects/:projectId/change-requests
GET   /projects/:projectId/change-requests
GET   /change-requests/:id
PATCH /change-requests/:id
POST  /change-requests/:id/approve
POST  /change-requests/:id/reject
```

---

## Reconciliation

```text
POST /projects/:projectId/reconcile
GET  /projects/:projectId/reconciliation
```

---

## Alerts

```text
GET   /projects/:projectId/alerts
GET   /alerts/:alertId
PATCH /alerts/:alertId
```

---

## Dashboard

```text
GET /projects/:projectId/summary
GET /dashboard/summary
```

---

# 18. Standard API Response

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "BASELINE_NOT_CONFIRMED",
    "message": "Project baseline must be confirmed before reconciliation."
  }
}
```

---

# 19. AI Architecture

AI memiliki empat fungsi utama.

```text
Document Understanding
Semantic Matching
Evidence Retrieval
Explanation
```

AI tidak menjadi financial calculator.

---

# 20. AI Document Pipeline

```text
UPLOAD DOCUMENT
↓
PARSE / OCR
↓
DOCUMENT CLASSIFICATION
↓
STRUCTURED EXTRACTION
↓
SCHEMA VALIDATION
↓
EVIDENCE MAPPING
↓
BASELINE CANDIDATE
↓
USER CONFIRMATION
```

---

# 21. Supported Document Types

```text
CONTRACT
PKS
SPK
SOW
MOU
RAB
QUOTATION
INVOICE
CHANGE_REQUEST
ADDENDUM
UNKNOWN
```

AI harus mengembalikan:

```json
{
  "documentType": "CONTRACT",
  "confidence": 0.94
}
```

---

# 22. Contract Extraction Schema

Minimum:

```json
{
  "project_name": null,
  "client_name": null,
  "contract_value": null,
  "start_date": null,
  "deadline": null,
  "revision_limit": null,
  "scope": [],
  "milestones": [],
  "payment_terms": [],
  "obligations": [],
  "penalties": []
}
```

Rule:

> Missing value harus `null`, bukan hasil tebakan.

---

# 23. RAB Extraction Schema

```json
{
  "items": [
    {
      "category": "Development",
      "description": "Frontend Development",
      "quantity": 1,
      "unit": "project",
      "unit_price": 40000000,
      "planned_cost": 40000000
    }
  ],
  "total_planned_cost": 75000000
}
```

---

# 24. Evidence Schema

```json
{
  "document_id": "doc_123",
  "page": 4,
  "section": "Payment Terms",
  "text": "25% payment upon UAT approval"
}
```

Every important extracted field should have evidence if available.

---

# 25. AI Extraction Rules

AI MUST:

- return structured JSON
- preserve missing data as null
- attach evidence
- attach confidence if possible
- avoid guessing monetary values
- avoid guessing dates
- avoid guessing legal meaning when unsupported

AI MUST NOT:

- create contract clauses
- calculate financial results
- update baseline directly
- decide final business action
- label semantic mismatch as confirmed violation

---

# 26. Semantic Scope Matching

Example:

Contract scope:

```text
Dashboard
Payment Integration
Landing Page
```

Actual task:

```text
WhatsApp Integration
```

AI output:

```json
{
  "status": "NEEDS_REVIEW",
  "confidence": 0.77,
  "matchedScopeItem": null,
  "reason": "The task does not clearly match any scope item in the active baseline."
}
```

Allowed statuses:

```text
MATCH
POSSIBLE_MATCH
NEEDS_REVIEW
```

Do not use:

```text
CONTRACT_VIOLATION
CLIENT_BREACH
ILLEGAL_SCOPE
```

---

# 27. AI Alert Explanation

Backend calculation:

```json
{
  "type": "BILLING_VARIANCE",
  "expected": 30000000,
  "actual": 20000000,
  "difference": 10000000
}
```

AI explanation:

```text
UAT telah selesai. Berdasarkan baseline aktif,
milestone tersebut memiliki nilai tagih Rp30 juta.

Invoice yang tercatat sebesar Rp20 juta.

Terdapat selisih billing sebesar Rp10 juta.
```

LLM tidak boleh menghitung ulang angka tersebut.

---

# 28. Reconciliation Engine

Reconciliation Engine adalah jantung deterministic CLARA.

Input:

```text
Active Agreement Baseline
Active Plan Baseline
Actual Project Data
Actual Cost
Invoices
Payments
Approved Change Requests
Semantic Match Results
```

Output:

```text
MATCH
WARNING
VERIFIED_DEVIATION
```

---

# 29. Budget Variance

Formula:

```text
Budget Variance =
Actual Cost - Planned Cost
```

Example:

```text
Planned UI/UX = Rp15M
Actual UI/UX  = Rp18M

Variance = +Rp3M
```

---

# 30. Budget Utilization

Formula:

```text
Budget Utilization =
Actual Cost / Planned Cost × 100%
```

Example:

```text
Planned = Rp75M
Actual  = Rp61M

Utilization = 81.33%
```

---

# 31. Contract Value Realization

Metrics:

```text
Contract Value
Billable Value
Billed Value
Paid Value
Unbilled Value
```

Formula:

```text
Unbilled Value =
Billable Value - Billed Value
```

---

# 32. Billing Variance

Example:

```text
Contract milestone:
25% of Rp120M
= Rp30M

Actual Invoice:
Rp20M

Difference:
Rp10M
```

Output:

```text
VERIFIED_DEVIATION
```

---

# 33. Revision Variance

Example:

```text
Revision Limit: 3
Actual Revision: 5
```

Formula:

```text
Revision Variance =
Actual Revision - Revision Limit
```

Output:

```text
2 revisions beyond contracted allowance
```

---

# 34. Scope Variance

Scope variance memiliki AI component.

Flow:

```text
Actual Task
↓
Semantic Matching
↓
Check Active Baseline
↓
Check Approved Change Request
↓
MATCH / NEEDS REVIEW
```

Scope mismatch tidak otomatis menjadi verified contractual breach.

---

# 35. Profit Model

## Planned Profit

```text
Planned Profit =
Contract Value - Planned Cost
```

Example:

```text
Contract Value = Rp120M
Planned Cost   = Rp75M

Planned Profit = Rp45M
```

---

## Actual Profit

Hanya boleh dihitung jika actual cost dan realized revenue tersedia.

```text
Actual Profit =
Realized Revenue - Actual Cost
```

Jangan menggunakan RAB sebagai actual cost.

---

# 36. Baseline Versioning

Initial:

```text
Baseline V1
```

Approved Change Request:

```text
Additional Scope
+Rp8M
+7 days
```

System creates:

```text
Baseline V2
```

V1 tetap disimpan sebagai history.

Only one baseline is:

```text
ACTIVE
```

Older baseline:

```text
ARCHIVED
```

---

# 37. Change Request Rule

Only:

```text
APPROVED
```

can modify baseline.

These cannot modify baseline:

```text
DRAFT
PENDING
REJECTED
```

---

# 38. Alert Classification

## MATCH

Tidak ada deviasi.

## WARNING

Ada indikasi yang membutuhkan review.

Example:

```text
Possible Scope Deviation
```

## VERIFIED_DEVIATION

Dapat diverifikasi langsung melalui angka/data.

Example:

```text
Invoice expected Rp30M
Invoice actual Rp20M
Difference Rp10M
```

---

# 39. Evidence-First Rule

Every important alert should answer:

```text
What happened?
How large is the difference?
Why is CLARA saying this?
Where is the evidence?
```

Example:

```text
Alert:
Completed But Underbilled

Impact:
Rp10M

Evidence:
Contract Clause 4.2
UAT completed
Invoice Rp20M
```

---

# 40. Project Summary Model

Backend summary response:

```json
{
  "projectId": "project_001",
  "contractValue": 120000000,
  "plannedCost": 75000000,
  "actualCost": 61000000,
  "projectProgress": 75,
  "billableValue": 84000000,
  "billedValue": 48000000,
  "paidValue": 36000000,
  "unbilledValue": 36000000,
  "activeBaselineVersion": 1,
  "alerts": {
    "budget": 1,
    "scope": 2,
    "billing": 1
  }
}
```

---

# 41. Frontend ↔ Backend Contract

Frontend should not calculate business truth independently.

Bad:

```text
Frontend calculates billing gap.
```

Good:

```text
Backend returns billing gap.
Frontend formats and displays it.
```

Frontend may calculate only presentation-level values such as:

- percentage bar width
- display formatting
- local sorting/filtering

---

# 42. AI ↔ Backend Contract

AI produces:

```text
Structured Extraction
Evidence
Confidence
Semantic Match
Natural Language Explanation
```

Backend produces:

```text
Confirmed Baseline
Deterministic Calculations
Business State
Alert State
```

---

# 43. PDF Evidence Interaction

Recommended flow:

```text
User opens alert
↓
Clicks Show Evidence
↓
Evidence Drawer opens
↓
PDF.js jumps to page
↓
Relevant clause highlighted
```

This is one of the most important trust-building interactions in the product.

---

# 44. Data Update Strategy

CLARA does not require daily manual input.

Use **event-based updates**.

Project user updates only when:

- milestone completed
- progress changed
- task added
- scope changed
- revision added
- Change Request approved

Finance updates only when:

- cost incurred
- invoice issued
- payment received

---

# 45. Reconciliation Trigger

Reconciliation may run after:

```text
Baseline Confirmed
Project Event Created
Actual Cost Created
Invoice Created
Payment Created
Change Request Approved
```

For MVP:

```text
Run reconciliation immediately after write operation.
```

No queue is required unless existing infrastructure already supports it.

---

# 46. Error Handling

AI error example:

```json
{
  "success": false,
  "error": {
    "code": "EXTRACTION_FAILED",
    "message": "Unable to extract contract data."
  }
}
```

Baseline error:

```json
{
  "success": false,
  "error": {
    "code": "BASELINE_NOT_CONFIRMED",
    "message": "Confirm baseline before project reconciliation."
  }
}
```

Financial validation:

```text
No NaN
No Infinity
No negative invoice without explicit credit-note support
```

---

# 47. Loading States

Frontend should have explicit states:

```text
Uploading
Parsing
Extracting
Waiting for Confirmation
Confirmed
Reconciling
Ready
Failed
```

Avoid generic endless spinner.

---

# 48. Empty States

Examples:

No contract:

```text
Upload your contract to create the project agreement baseline.
```

No RAB:

```text
Upload RAB to compare planned cost with actual cost.
```

No invoice:

```text
No invoice has been recorded for this project.
```

---

# 49. Demo Dataset

Prepare one deterministic project.

Example:

```text
Project:
ERP Client A

Contract Value:
Rp120M

Planned Cost:
Rp75M

Revision Limit:
3

UAT:
25% payment trigger

Progress:
75%

Actual Cost:
Rp61M

Actual Revision:
5

UAT:
Completed

Invoice:
Rp20M
```

Expected CLARA results:

```text
Revision Variance:
+2 revisions

Expected UAT Billing:
Rp30M

Invoice:
Rp20M

Billing Difference:
Rp10M
```

---

# 50. Demo Story

Recommended demo:

```text
1. Create Project

2. Upload Contract + RAB

3. AI extracts:
   Contract Value
   Scope
   Milestones
   Deadline
   Budget

4. User confirms baseline

5. Project starts

6. Update:
   UAT completed
   Revision = 5
   Actual cost = Rp61M

7. Add invoice:
   Rp20M

8. CLARA reconciles

9. Dashboard shows:
   Billing Difference Rp10M
   Revision Variance +2

10. Open Evidence

11. PDF jumps to relevant clause

12. User decides next action
```

---

# 51. Hackathon MVP Priority

## P0

Must work:

- Next.js layout
- Project list
- Create project
- Contract upload
- RAB upload
- PDF preview
- AI extraction
- User confirmation
- Baseline V1
- Project event update
- Actual cost
- Invoice
- Budget variance
- Billing variance
- Revision variance
- Alerts
- Evidence
- Project dashboard

## P1

Important:

- Semantic scope matching
- Change Request
- Baseline V2
- Legal AI integration
- Payment tracking

## P2

Optional:

- portfolio analytics
- complex charts
- external integrations
- authentication
- advanced permission
- forecasting
- predictive model

---

# 52. Out of Scope

Do not build during MVP:

- full accounting system
- full ERP
- payroll
- employee performance
- autonomous invoicing
- autonomous negotiation
- automatic legal decision
- prediction of business failure
- custom model training
- Jira integration
- ClickUp integration
- complex RBAC
- auth middleware

---

# 53. Development Ownership

## Frontend Engineer

Owns:

- Next.js
- shadcn/ui
- PDF.js
- Lucide
- Motion
- frontend states
- project flow
- evidence UX
- dashboard

---

## AI Engineer

Owns:

- document parsing
- extraction
- schema output
- evidence mapping
- semantic matching
- AI explanations
- legal AI reuse

---

## Backend Engineer

Owns:

- controllers
- services
- repositories
- database
- baseline
- project events
- finance
- Change Request
- reconciliation
- calculations
- alerts

---

# 54. Integration Rule

Do not wait until the end of the hackathon to integrate.

First agree on:

```text
TypeScript types
API response shape
AI JSON schema
Project demo data
```

Then each person works against the same contract.

---

# 55. Shared Type Strategy

Recommended:

Create a shared specification document or package for:

```text
Project
Baseline
Milestone
ScopeItem
ActualCost
Invoice
ChangeRequest
Alert
Evidence
```

If repository structure allows:

```text
packages/shared-types/
```

Otherwise duplicate carefully from one canonical `types.md` or `types.ts`.

---

# 56. Code Quality Rules

## Frontend

- keep components small
- avoid business calculation in components
- use shadcn primitives
- centralize API access
- use typed responses
- provide loading/error/empty states

## Backend

- controller thin
- service owns business logic
- repository owns DB query
- validate all input
- financial calculation deterministic
- never trust AI output without validation

## AI

- structured JSON
- preserve evidence
- confidence where useful
- no fabricated value
- no autonomous baseline update

---

# 57. Naming Convention

Use English for code.

Example:

```text
contractValue
plannedCost
actualCost
billableValue
billedValue
paidValue
unbilledValue
revisionLimit
actualRevisionCount
activeBaselineVersion
```

UI language may use Indonesian or English depending on final product direction.

---

# 58. Final System Principle

CLARA should never communicate:

> AI knows what is best for your business.

CLARA should communicate:

> Based on your confirmed agreement and available project data, this is what changed, how large the difference is, and which evidence supports it.

Final decision belongs to the user.

---

# 59. One-Line Architecture

```text
Contract + RAB
→ AI Understanding
→ Human-Confirmed Baseline
→ Project + Finance Actuals
→ Deterministic Reconciliation
→ Business Impact
→ Evidence
→ Human Decision
```

---

# 60. Product Positioning

CLARA is not simply:

```text
AI Contract Reader
```

CLARA is:

> **A contract intelligence system that connects agreements, project execution, and financial realization.**

Tagline:

> **Understand what you agreed to, monitor what actually happens, and protect the value of every contract.**
