# Product Requirements Document (PRD)

## CLARA — Contract Intelligence for Business Value

**Version:** 1.1  
**Status:** Hackathon MVP  
**Theme:** Optimizing Business Value Through Data and Insight  

---

## 1. Product Summary

CLARA adalah platform **Contract Intelligence** yang mengubah kontrak dari dokumen pasif menjadi **baseline bisnis yang dapat dipantau selama project berjalan**.

CLARA membantu bisnis pada dua fase:

1. **Before signing** — memahami kontrak, risiko, kewajiban, dan dampak bisnis sebelum kontrak disetujui.
2. **After signing** — memantau apakah pelaksanaan project, biaya, scope, milestone, dan invoice masih sesuai dengan kontrak serta rencana awal.

### Product Vision

> **Turn contracts into living business intelligence.**

### Core Principle

> **Kontrak adalah apa yang disepakati. RAB adalah apa yang direncanakan. Progress dan actual cost adalah apa yang terjadi. Invoice adalah apa yang sudah direalisasikan menjadi uang. CLARA mencocokkan semuanya.**

---

## 2. Problem Statement

Bisnis berbasis project sering memiliki data yang tersebar di banyak tempat:

- kontrak / PKS / SOW berisi kesepakatan,
- RAB berisi rencana biaya,
- project tracker berisi progress,
- finance mencatat biaya aktual dan invoice.

Masalahnya, data tersebut sering tidak dibandingkan secara konsisten.

Akibatnya bisnis dapat mengalami:

- klausul atau kewajiban kontrak yang tidak dipahami,
- deadline atau milestone terlewat,
- scope project bertambah tanpa terlihat jelas,
- biaya aktual melampaui rencana,
- pekerjaan selesai tetapi belum ditagihkan,
- invoice tidak sesuai dengan rate atau milestone kontrak,
- perubahan resmi sudah disetujui tetapi baseline project belum diperbarui,
- sulit mengetahui apakah nilai kontrak benar-benar terealisasi.

CLARA menyelesaikan masalah tersebut dengan membangun **baseline terstruktur** dari kontrak dan RAB, lalu melakukan **reconciliation** terhadap data aktual selama project berjalan.

---

## 3. Target Users

### Primary Roles

#### 1. Project / Business Owner

Dapat berupa:

- Owner / Founder,
- COO / Operations Manager,
- Project Manager,
- Business Development / Partnership.

Tanggung jawab utama di CLARA:

- upload kontrak dan RAB,
- mengonfirmasi hasil extraction,
- memantau milestone dan scope,
- mencatat approved change request,
- meninjau alert project.

#### 2. Finance

Dapat berupa:

- Finance staff,
- Accounting staff,
- Owner pada bisnis kecil.

Tanggung jawab utama di CLARA:

- memasukkan actual cost,
- memasukkan invoice,
- memperbarui status pembayaran,
- meninjau billing mismatch.

> Untuk hackathon, kedua role dapat menggunakan **satu account / satu workspace**. Full role-based access bukan prioritas MVP.

### Target Market Awal

Bisnis berbasis kontrak dan project, terutama:

- Software house,
- IT outsourcing,
- Digital agency,
- Consulting firm,
- Creative agency,
- Professional service business.

Karakteristik target awal:

- memiliki project client berbasis kontrak,
- menggunakan milestone, scope, rate, atau payment term,
- memiliki RAB atau budget project,
- belum menggunakan enterprise contract management system yang kompleks.

---

## 4. Customer Profile

### Customer Jobs

- Membaca dan memahami kontrak bisnis.
- Menilai risiko sebelum tanda tangan.
- Mengelola banyak kontrak dan kewajiban.
- Mengambil keputusan: **sign, negotiate, atau reject**.
- Memantau pelaksanaan kontrak setelah ditandatangani.

### Pains

- Kontrak panjang dan sulit dipahami.
- Tidak punya legal expert khusus.
- Risiko tersembunyi dalam klausul.
- Terlambat mengetahui deadline atau kewajiban.
- Sulit mengetahui **dampak finansial dari risiko kontrak**.
- Sulit mengetahui apakah pelaksanaan project dan invoice sudah sesuai dengan isi kontrak.
- Risiko adanya kewajiban atau nilai kontrak yang belum terealisasi.

### Gains

- Memahami kontrak dengan cepat.
- Mengetahui risiko dan prioritasnya.
- Mengetahui potensi financial exposure.
- Mendapat rekomendasi tindakan.
- Keputusan bisnis lebih cepat dan berbasis data.
- Mengetahui apakah **kontrak, progress project, dan invoice sudah selaras**.
- Mengetahui nilai kontrak yang belum terealisasi atau perlu ditindaklanjuti.

---

## 5. Value Proposition

### Products & Services

- **AI Contract Analyzer**.
- Contract Risk & Compliance Detection.
- Business Impact Analytics.
- Contract Portfolio Dashboard.
- AI Legal Q&A & Document Drafter.
- **Contract Execution Monitoring**.

### Pain Relievers

- OCR mengubah PDF/gambar menjadi data terstruktur.
- AI menjelaskan klausul dalam bahasa sederhana.
- Otomatis mendeteksi klausul berisiko.
- Menghubungkan klausul dengan dasar hukum.
- Menghitung **potential business exposure** jika data mendukung.
- Memberikan alert untuk deadline dan kewajiban.
- Membandingkan **contract, project, dan invoice** untuk mendeteksi mismatch, kewajiban terlewat, atau billing gap.

### Gain Creators

- **Contract → Data → Insight → Action**.
- Risk score dan priority level.
- Financial exposure estimation.
- Portfolio-level contract analytics.
- Rekomendasi **Sign / Review / Renegotiate**.
- Membantu bisnis mengurangi risiko dan mengoptimalkan nilai kontrak.
- Contract execution monitoring setelah kontrak ditandatangani.
- Membantu memastikan nilai yang disepakati dalam kontrak benar-benar terealisasi.

---

## 6. Product Positioning

### Positioning

> **CLARA — Contract Intelligence for Business Value**

### One-Liner

> **CLARA turns contracts into actionable business insights, helping businesses understand risks, monitor execution, and protect contract value.**

### Main Product Question

CLARA membantu bisnis menjawab:

> **Apa yang kita sepakati, apa yang kita rencanakan, apa yang benar-benar terjadi, dan apakah nilai kontraknya sudah terealisasi?**

---

## 7. Input Model

CLARA tidak bergantung pada satu dokumen saja.

### A. Contract / Agreement

Contoh:

- PKS,
- kontrak project,
- SPK,
- SOW,
- MoU jika memang memuat ketentuan operasional / finansial,
- lampiran kontrak.

Data yang dicari:

- contract value,
- scope,
- milestone,
- payment trigger,
- payment term,
- deadline,
- rate,
- revision limit,
- penalty,
- obligations,
- termination / renewal.

### B. RAB / Budget Plan

RAB menjadi **plan baseline**, bukan actual cost.

Data yang dicari:

- planned labor cost,
- planned vendor cost,
- planned infrastructure cost,
- planned operational cost,
- total planned cost.

### C. Project Progress

Di-update saat ada event penting, bukan wajib setiap hari.

Contoh event:

- milestone selesai,
- progress berubah signifikan,
- task / scope baru muncul,
- revision bertambah,
- change request disetujui.

### D. Actual Cost

Data real biaya selama project berjalan.

Contoh:

- labor cost,
- vendor cost,
- infrastructure cost,
- operational expense.

### E. Invoice

Data penagihan aktual:

- invoice amount,
- milestone,
- invoice date,
- payment status,
- rate / quantity jika relevan.

### F. Change Request / Amendment

Digunakan untuk memperbarui baseline jika perubahan sudah disetujui secara resmi.

---

## 8. Baseline Model

CLARA menggunakan dua baseline utama.

### 8.1 Contract Baseline

Berasal dari kontrak dan dokumen agreement.

Menyimpan:

- contract value,
- scope,
- milestones,
- payment triggers,
- deadlines,
- rates,
- revision allowance,
- obligations.

### 8.2 Plan Baseline

Berasal dari RAB / budget awal.

Menyimpan:

- planned cost per category,
- total planned cost,
- planned margin jika contract value tersedia.

### Baseline Creation Flow

```text
Contract + RAB
      ↓
AI / OCR Extraction
      ↓
Structured Draft Baseline
      ↓
USER CONFIRMATION
      ↓
Baseline V1 Locked
```

**User confirmation wajib** sebelum baseline dipakai untuk monitoring.

CLARA tidak boleh langsung menganggap hasil OCR / LLM sebagai kebenaran final.

---

## 9. Baseline Versioning & Change Request

Project nyata dapat berubah.

Jika perubahan sudah disetujui secara resmi, CLARA tidak boleh terus menganggap perubahan tersebut sebagai penyimpangan.

Contoh:

```text
Baseline V1
3 revisions included
Deadline 30 Nov
Contract Value Rp120M
        ↓
Approved Change Request
+2 revisions
+5 days
+Rp4M
        ↓
Baseline V2
5 revisions included
Deadline 5 Dec
Contract Value Rp124M
```

### Rule

- **Unapproved change** → Possible Deviation / Needs Review.
- **Approved change request** → Update baseline version.
- Baseline lama tetap disimpan untuk audit trail.

---

## 10. Tracking Model

CLARA menggunakan **event-based tracking**, bukan daily manual reporting.

User hanya perlu memperbarui data ketika ada perubahan penting.

### Project Events

- milestone completed,
- milestone delayed,
- new scope/task,
- revision added,
- change request approved.

### Finance Events

- actual cost recorded,
- invoice created,
- invoice paid,
- invoice revised.

### MVP Update Methods

- manual form,
- CSV upload,
- document upload bila relevan.

### Future Integrations

- Jira / ClickUp / Trello,
- accounting software,
- ERP,
- invoice platform.

---

## 11. Core Product Flow

```text
                 PROJECT START
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
      CONTRACT / SOW             RAB
    What was agreed?        What was planned?
          │                       │
          └───────────┬───────────┘
                      ▼
              AI / OCR EXTRACTION
                      ▼
              USER CONFIRMATION
                      ▼
                BASELINE V1
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     Progress      Actual Cost    Invoice
        │             │             │
        └─────────────┼─────────────┘
                      ▼
            RECONCILIATION ENGINE
                      ▼
      ┌───────────────┼────────────────┐
      ▼               ▼                ▼
 Scope Variance   Budget Variance   Billing Variance
      │               │                │
      └───────────────┼────────────────┘
                      ▼
           Evidence + Business Impact
                      ▼
                Human Review
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
        Action            Approved Change?
                                  │
                                  ▼
                            Baseline V2
```

---

## 12. Core Monitoring Detectors — MVP

### 12.1 Budget Variance

Membandingkan RAB dengan actual cost.

Contoh:

```text
Planned UI/UX Cost   Rp15M
Actual UI/UX Cost    Rp18M
Variance             +Rp3M
```

Output:

> **Budget variance: +Rp3M above plan.**

Jika progress baru 60% tetapi 98% total budget sudah digunakan, CLARA dapat memberi warning berdasarkan angka tersebut.

---

### 12.2 Scope / Revision Variance

Membandingkan contracted scope dengan actual project activity.

Contoh deterministik:

```text
Contract revisions included: 3
Actual revisions: 5
Difference: 2
```

Output:

> **2 revisions beyond current baseline.**

Untuk task baru yang tidak eksplisit di kontrak, AI hanya boleh memberi label:

> **Possible scope deviation — human review required.**

CLARA tidak boleh langsung menyatakan pelanggaran kontrak.

---

### 12.3 Billing Variance

Membandingkan payment entitlement dengan invoice aktual.

#### Completed but Unbilled

```text
Contract:
UAT Accepted → 25% billable

Contract Value:
Rp120M

Expected Billing:
Rp30M

Project:
UAT = Completed

Invoice:
Not Found
```

Output:

> **Rp30M billable value requires attention.**

#### Rate / Amount Mismatch

```text
Contract Rate: Rp500k / hour
Invoice Rate:  Rp450k / hour
Hours:         40

Verified Billing Difference: Rp2M
```

---

### 12.4 Deadline / Milestone Variance — Optional MVP

Membandingkan contract deadline dengan project schedule aktual.

Contoh:

```text
Contract Deadline: 30 Nov
Projected Finish:   10 Dec
Variance:            +10 days
```

Output:

> **Projected completion exceeds current contractual deadline by 10 days.**

---

## 13. Profitability Logic

CLARA harus membedakan **planned profitability** dan **actual profitability**.

### Planned Profit

Jika contract value dan RAB tersedia:

```text
Planned Profit
= Contract Value - Planned Cost
```

Contoh:

```text
Contract Value   Rp120M
RAB              Rp75M
Planned Profit   Rp45M
```

### Actual Profit

Hanya dihitung jika actual cost tersedia dan revenue basis jelas.

```text
Actual Profit
= Realized / Recognized Revenue - Actual Cost
```

CLARA tidak boleh menyebut RAB sebagai actual cost.

Jika data biaya aktual belum lengkap, sistem harus menampilkan:

> **Actual profitability unavailable — cost data incomplete.**

---

## 14. Insight Status

CLARA menggunakan status agar tidak overclaim.

### MATCH

Data sesuai baseline.

### WARNING / POSSIBLE DEVIATION

Ada indikasi perbedaan tetapi konteks belum cukup.

Contoh:

> Task baru tidak ditemukan dalam contracted scope.

### VERIFIED DEVIATION

Perbedaan dapat dibuktikan dari data dan rule yang jelas.

Contoh:

> 3 revisions included, actual 5 → 2 revisions beyond baseline.

### NEEDS HUMAN REVIEW

Kesimpulan bisnis membutuhkan konteks tambahan.

Contoh:

> Additional scope ditemukan tetapi tidak ada pricing rule di kontrak.

---

## 15. AI Contract Analyzer

CLARA tetap mempertahankan fungsi analisis kontrak existing.

### Data yang Diekstrak

- Parties.
- Contract value.
- Effective / expiry date.
- Payment terms.
- Milestones.
- Penalties.
- Liability clauses.
- Termination terms.
- Renewal terms.
- Obligations.
- Revision / scope limit.
- Hourly / service rate.

### Output

- contract summary,
- important clauses,
- risk severity,
- structured commercial terms,
- source evidence.

---

## 16. Risk & Business Impact

CLARA dapat menampilkan risiko dari kontrak sebelum signing.

Contoh:

```text
WARNING
Penalty Clause

Penalty: 10% of Contract Value
Maximum Exposure: Rp50M
```

### Guardrail

CLARA harus membedakan:

- **Maximum Exposure**,
- **Potential Exposure**,
- **Verified Difference**,
- **Actual Loss**.

Exposure tidak boleh otomatis dianggap sebagai kerugian aktual.

---

## 17. Recommendation System

CLARA tidak menentukan keputusan akhir.

### Possible Actions

- Sign.
- Review.
- Renegotiate.
- Follow-up.
- Create invoice.
- Review billing.
- Review scope.
- Add / approve change request.
- Mark as intentional exception.

### Human-in-the-Loop

CLARA tidak boleh otomatis:

- menandatangani kontrak,
- menolak kontrak,
- mengirim invoice,
- menagih client,
- mengubah agreement,
- mengubah baseline tanpa approval user.

---

## 18. MVP Scope — Hackathon

### Must Have

1. Upload contract PDF / image.
2. Contract OCR + commercial extraction.
3. Contract summary + risk analysis.
4. Upload / input RAB.
5. Draft Contract Baseline + Plan Baseline.
6. **User confirmation before baseline lock.**
7. Project workspace.
8. Event-based project update form / CSV.
9. Actual cost input / CSV.
10. Invoice input / CSV.
11. Reconciliation engine.
12. Budget Variance detector.
13. Scope / Revision Variance detector.
14. Billing Variance detector.
15. Evidence panel.
16. Human review action.
17. Approved Change Request → Baseline V2.

### Nice to Have

- Deadline / milestone variance.
- Portfolio dashboard.
- Renewal reminder.
- AI Legal Q&A.
- AI document drafting.
- Planned vs actual profitability card.

### Out of Scope for MVP

- Direct Jira integration.
- Direct accounting integration.
- Direct ERP integration.
- Full multi-role permission system.
- Mandatory daily reporting.
- Automatic invoice sending.
- Automatic negotiation.
- Universal profitability engine.
- Full enterprise CLM workflow.

---

## 19. MVP Screens

### Screen 1 — Create Project

```text
Create Project

[ Upload Contract.pdf ]
[ Upload RAB.csv / RAB.xlsx ]

[ Analyze ]
```

### Screen 2 — Baseline Confirmation

```text
CONTRACT BASELINE
Contract Value      Rp120M
Deadline            30 Nov
Included Revisions  3
UAT Trigger          25% billable

PLAN BASELINE
Planned Cost        Rp75M
Planned Profit      Rp45M

[ Edit ]   [ Confirm Baseline ]
```

### Screen 3 — Project Workspace

```text
PROJECT STATUS
Progress      60%
Current Milestone  UAT

[ Complete Milestone ]
[ Add Scope / Revision ]
[ Add Change Request ]
```

### Screen 4 — Finance Update

```text
FINANCE
Actual Cost   Rp64M
Billed        Rp48M
Paid          Rp48M

[ Add Cost ]
[ Add Invoice ]
```

### Screen 5 — Monitoring Dashboard

```text
PROJECT HEALTH

Contract Value       Rp120M
Planned Cost          Rp75M
Actual Cost           Rp64M
Progress              60%

ALERTS
Budget Used           85%
Billing Gap           Rp30M
Revision Variance     +2
```

### Screen 6 — Evidence Detail

```text
ALERT
Completed but Unbilled

Contract Evidence
"25% payable upon UAT acceptance"

Project Evidence
UAT accepted — 28 Sep 2026

Invoice Evidence
No corresponding invoice found

Business Value
Rp30M

[ Mark Reviewed ]
[ Create Follow-up ]
```

### Screen 7 — Change Request

```text
CHANGE REQUEST

+2 revisions
+Rp4M
+5 days

Status: APPROVED

[ Update Baseline ]

Baseline V1 → Baseline V2
```

---

## 20. Data Model — MVP

### Project

```json
{
  "projectId": "PRJ-001",
  "client": "PT Example",
  "baselineVersion": 1,
  "progressPercent": 60,
  "status": "active"
}
```

### Contract Baseline

```json
{
  "contractValue": 120000000,
  "deadline": "2026-11-30",
  "includedRevisions": 3,
  "milestones": [
    {
      "name": "UAT",
      "billingPercentage": 25,
      "trigger": "accepted"
    }
  ]
}
```

### Plan Baseline / RAB

```json
{
  "plannedCost": 75000000,
  "categories": {
    "design": 15000000,
    "development": 40000000,
    "infrastructure": 10000000,
    "other": 10000000
  }
}
```

### Project Event

```json
{
  "type": "milestone_completed",
  "milestone": "UAT",
  "occurredAt": "2026-09-28"
}
```

### Actual Cost

```json
{
  "projectId": "PRJ-001",
  "category": "development",
  "amount": 38000000
}
```

### Invoice

```json
{
  "invoiceId": "INV-001",
  "projectId": "PRJ-001",
  "milestone": "Development",
  "amount": 48000000,
  "status": "paid"
}
```

### Change Request

```json
{
  "changeRequestId": "CR-002",
  "status": "approved",
  "addedRevisions": 2,
  "addedContractValue": 4000000,
  "deadlineExtensionDays": 5
}
```

---

## 21. High-Level Architecture

CLARA memanfaatkan existing foundation dan menambahkan monitoring layer.

```text
React Frontend
      │
      ▼
Express / Node Backend
      │
      ├── OCR Service
      ├── Guardrail Service
      ├── Hybrid Retrieval
      ├── Reasoning Service
      ├── Contract Extraction
      ├── Baseline Service
      ├── Project Event Service
      ├── Finance Data Service
      ├── Change Request Service
      └── Reconciliation Engine
              │
              ├── Contract Baseline
              ├── Plan Baseline
              ├── Project Events
              ├── Actual Cost
              ├── Invoice
              └── Baseline Versions
```

### New Hackathon Layer

```text
Commercial Extraction
        ↓
Contract + Plan Baseline
        ↓
User Confirmation
        ↓
Event-Based Monitoring
        ↓
Reconciliation Engine
        ↓
Budget / Scope / Billing Variance
        ↓
Evidence + Business Impact
        ↓
Human Decision
```

---

## 22. AI vs Deterministic Engine

### AI / LLM Responsible For

- membaca bahasa kontrak,
- mengekstrak commercial terms,
- memahami semantic scope,
- menjelaskan klausul,
- legal RAG and citation,
- mapping unstructured data,
- menjelaskan alert.

### Deterministic Engine Responsible For

- percentage calculation,
- planned vs actual cost variance,
- billing difference,
- rate comparison,
- milestone trigger calculation,
- revision count comparison,
- deadline variance,
- financial totals.

### Principle

> **AI interprets. The engine calculates. Humans decide.**

---

## 23. Guardrails

CLARA harus:

- menampilkan evidence untuk insight penting,
- meminta user confirmation sebelum baseline aktif,
- tidak mengarang nominal finansial,
- tidak menyebut RAB sebagai actual cost,
- tidak menyebut exposure sebagai actual loss,
- tidak menyebut task baru sebagai pelanggaran kontrak tanpa bukti cukup,
- memperbarui baseline jika change request resmi disetujui,
- menyimpan baseline version history,
- memisahkan fact, inference, dan recommendation,
- meminta human review ketika data ambigu,
- tidak menggantikan professional legal advice.

---

## 24. Success Metrics

### Hackathon Success Metrics

- Contract + RAB dapat diubah menjadi baseline terstruktur.
- User dapat mengonfirmasi baseline sebelum monitoring.
- Minimal 3 detector berjalan end-to-end:
  - Budget Variance,
  - Scope / Revision Variance,
  - Billing Variance.
- Approved change request dapat menghasilkan baseline version baru.
- Setiap alert memiliki evidence.
- Perhitungan finansial deterministic dan reproducible.
- User dapat memahami kondisi project utama dalam kurang dari 1 menit saat demo.

### Future Product Metrics

- number of contracts monitored,
- number of actionable alerts,
- billable value identified,
- budget deviation identified,
- percentage of alerts resolved,
- time saved in contract / project reconciliation,
- missed billing incidents reduced.

---

## 25. Main Risks

### Contract / RAB Ambiguity

Dokumen bisa tidak lengkap atau tidak konsisten.

**Mitigation:** user confirmation sebelum baseline lock.

### Missing Context

Perubahan bisa disetujui lewat email, meeting, atau WhatsApp.

**Mitigation:** status `Needs Human Review` + Change Request input.

### Data Quality

Progress, actual cost, atau invoice bisa tidak lengkap.

**Mitigation:** missing-data warning; jangan menghitung metric yang datanya belum cukup.

### AI Hallucination

LLM dapat salah menafsirkan klausul atau scope.

**Mitigation:** evidence-based extraction + confidence + user confirmation.

### Stale Baseline

Project berubah secara resmi tetapi baseline tidak diperbarui.

**Mitigation:** baseline versioning melalui approved change request.

### Manual Input Fatigue

User dapat malas memperbarui data jika diwajibkan setiap hari.

**Mitigation:** event-based update; future integrations untuk otomatisasi.

### Financial Overclaim

Planned profit, actual profit, exposure, dan billing gap memiliki arti berbeda.

**Mitigation:** gunakan label finansial yang eksplisit dan jangan mencampur kategori.

---

## 26. Demo Scenario

Sebuah software house memiliki project dengan:

```text
Contract Value   Rp120M
RAB              Rp75M
Planned Profit   Rp45M
Deadline         30 Nov
Revisions        3 included
UAT Trigger      25% billable
```

Setelah baseline dikonfirmasi, project berjalan.

Data aktual:

```text
Progress         60%
Actual Cost      Rp64M
UAT              Completed
Actual Revisions 5
UAT Invoice      Not Found
```

CLARA menghasilkan:

```text
PROJECT REQUIRES ATTENTION

Budget
Rp64M / Rp75M used
85% budget used while project progress is 60%

Billing
UAT completed
Rp30M billable value not found in invoice data

Scope
5 revisions recorded
Current baseline allows 3
2 revisions require review
```

Kemudian user menambahkan approved change request:

```text
+2 revisions
+Rp4M contract value
+5 days deadline
```

CLARA membuat:

```text
Baseline V2
Contract Value   Rp124M
Revisions        5 included
Deadline         5 Dec
```

Revision alert tidak lagi dianggap deviation karena baseline sudah resmi berubah.

### Demo Closing

> **CLARA does not just read a contract. It turns the agreement and the project plan into a living baseline, then continuously checks whether execution, cost, and billing still match what the business agreed and planned.**

---

## 27. Future Roadmap

### Phase 1 — Hackathon MVP

- contract analysis,
- RAB baseline,
- baseline confirmation,
- event-based project tracking,
- actual cost + invoice input,
- 3 core variance detectors,
- change request versioning.

### Phase 2 — Integrations

- Jira / ClickUp / Trello,
- accounting software,
- invoice platform,
- contract storage.

### Phase 3 — Portfolio Intelligence

- multi-project dashboard,
- contract expiry monitoring,
- renewal prioritization,
- obligation tracking,
- client / project pattern analysis.

### Phase 4 — Profitability Intelligence

Jika data biaya aktual sudah lengkap:

```text
Recognized Revenue
       -
Actual Delivery Cost
       =
Actual Contract Profitability
```

---

## 28. Final Product Principles

1. **Contract is the agreement baseline.**  
   Kontrak menjadi acuan hak, kewajiban, scope, rate, milestone, payment terms, dan deadline.

2. **RAB is the plan baseline.**  
   RAB adalah rencana biaya, bukan actual cost.

3. **Actual data must stay separate from planned data.**  
   Progress, actual cost, dan invoice menunjukkan apa yang benar-benar terjadi.

4. **Baseline can evolve only through approved change.**  
   Perubahan resmi menghasilkan baseline version baru dan tetap memiliki audit trail.

5. **Event-based, not daily manual reporting.**  
   User hanya memperbarui CLARA ketika ada event penting.

6. **Evidence before recommendation.**  
   Setiap alert harus dapat ditelusuri ke data atau klausul yang mendasarinya.

7. **AI interprets, engine calculates, humans decide.**  
   AI memahami bahasa dan konteks; angka dihitung secara deterministic; keputusan akhir tetap pada user.

---

## Product Tagline

> **CLARA — Understand the agreement. Track the plan. Monitor the execution. Protect the value.**