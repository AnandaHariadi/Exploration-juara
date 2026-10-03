# CLARA — AI / Document Intelligence Task List

> Role: AI / Document Intelligence Engineer  
> Scope: Hackathon MVP  
> Total: 15 tasks

---

## TASK 01 — Define AI Input & Output Schema

**Goal:** Menentukan format data yang masuk dan keluar dari AI agar frontend dan backend punya kontrak data yang jelas.

### Checklist
- [ ] Define schema untuk Contract Extraction
- [ ] Define schema untuk RAB Extraction
- [ ] Define schema untuk Scope Matching
- [ ] Define schema untuk Evidence/Citation
- [ ] Define confidence/status field
- [ ] Pastikan output selalu structured JSON
- [ ] Validasi field wajib dan optional

### Example Output

```json
{
  "contract_value": 120000000,
  "deadline": "2026-12-20",
  "revision_limit": 3,
  "milestones": [],
  "scope": []
}
```

### Done When
Backend dapat menerima output AI tanpa parsing teks bebas.

---

## TASK 02 — Build Document Classification

**Goal:** Mengenali jenis dokumen sebelum diproses.

### Supported Documents
- Contract / PKS
- SPK
- SOW
- MoU
- RAB
- Quotation / Proposal Cost
- Invoice
- Change Request / Addendum

### Checklist
- [ ] Detect document type
- [ ] Return confidence
- [ ] Handle unknown document
- [ ] Prevent RAB diproses sebagai kontrak
- [ ] Prevent invoice diproses sebagai RAB

### Done When
Setiap dokumen masuk ke pipeline extraction yang sesuai.

---

## TASK 03 — Integrate OCR / Document Parsing

**Goal:** Mengubah PDF/image menjadi teks yang dapat diproses AI.

### Checklist
- [ ] Reuse OCR pipeline CLARA jika tersedia
- [ ] Support PDF text
- [ ] Support scanned PDF/image
- [ ] Preserve page number
- [ ] Preserve paragraph/section context
- [ ] Handle OCR failure
- [ ] Return clean normalized text

### Done When
Dokumen kontrak dan RAB dapat dibaca secara konsisten.

---

## TASK 04 — Build Contract Extraction Prompt

**Goal:** Mengekstrak informasi komersial dan operasional dari kontrak.

### Fields Minimum
- project_name
- client
- contract_value
- start_date
- deadline
- scope
- milestones
- payment_terms
- billing_trigger
- revision_limit
- hourly_rate jika ada
- penalties jika ada
- obligations

### Checklist
- [ ] Prompt extraction
- [ ] Structured JSON output
- [ ] Handle missing values
- [ ] Jangan mengarang field yang tidak ditemukan
- [ ] Return source/evidence per field

### Done When
Kontrak dapat diubah menjadi Agreement Baseline candidate.

---

## TASK 05 — Build RAB Extraction Prompt

**Goal:** Mengubah RAB / budget plan menjadi Plan Baseline candidate.

### Fields Minimum
- category
- item
- quantity
- unit
- unit_price
- planned_cost
- total_planned_cost

### Checklist
- [ ] Extract table / line items
- [ ] Normalize currency
- [ ] Preserve original item names
- [ ] Detect total planned cost
- [ ] Return evidence/source
- [ ] Handle missing or inconsistent totals

### Important Rule
RAB adalah **planned cost**, bukan actual cost.

### Done When
RAB dapat dipakai backend sebagai Plan Baseline.

---

## TASK 06 — Build Extraction Validation Layer

**Goal:** Mengurangi risiko AI extraction salah sebelum data ditampilkan ke user.

### Checklist
- [ ] Validate JSON schema
- [ ] Validate numeric fields
- [ ] Validate dates
- [ ] Detect suspicious values
- [ ] Detect duplicate fields
- [ ] Compare extracted total dengan line-item total jika memungkinkan
- [ ] Mark low-confidence fields

### Example
Jika:

```text
Line items total = Rp75M
Extracted total = Rp750M
```

AI harus menandai data sebagai suspicious.

### Done When
Data yang jelas bermasalah tidak langsung dianggap valid.

---

## TASK 07 — Build Evidence Mapping

**Goal:** Setiap data penting hasil extraction harus bisa ditelusuri ke sumber dokumen.

### Checklist
- [ ] Store page number
- [ ] Store clause/section title
- [ ] Store source text snippet
- [ ] Map evidence ke extracted field
- [ ] Support multiple evidence sources
- [ ] Return evidence object ke backend

### Example

```json
{
  "field": "revision_limit",
  "value": 3,
  "evidence": {
    "page": 7,
    "section": "Scope of Work",
    "text": "Penyedia memberikan maksimal 3 kali revisi."
  }
}
```

### Done When
Frontend dapat menampilkan `Show Evidence`.

---

## TASK 08 — Build Semantic Scope Matching

**Goal:** Membandingkan actual task/project activity dengan scope kontrak.

### Example

Contract Scope:
- Dashboard
- Payment Integration
- Landing Page

Actual Task:
- WhatsApp Integration

### Output
- MATCH
- POSSIBLE_MATCH
- NEEDS_REVIEW

### Checklist
- [ ] Compare task vs contract scope
- [ ] Use embedding / semantic similarity
- [ ] Add LLM explanation
- [ ] Return confidence
- [ ] Jangan menyebut mismatch sebagai pelanggaran kontrak
- [ ] Handle synonyms / wording berbeda

### Done When
Task aktual dapat dibandingkan dengan scope baseline secara semantik.

---

## TASK 09 — Build Scope Matching Guardrail

**Goal:** Mencegah AI terlalu percaya diri saat menentukan scope deviation.

### Rules
AI tidak boleh langsung mengatakan:
- `Contract Violation`
- `Illegal`
- `Client breach`

Untuk semantic mismatch gunakan:
- `Possible Scope Deviation`
- `Needs Review`

### Checklist
- [ ] Add threshold
- [ ] Low confidence → human review
- [ ] Check approved Change Request
- [ ] Check active baseline version
- [ ] Return reasoning singkat

### Done When
Scope matching bersifat assistive, bukan autonomous judgment.

---

## TASK 10 — Build Business Alert Explanation

**Goal:** Mengubah output reconciliation engine menjadi penjelasan yang mudah dipahami.

### Input Example

```json
{
  "type": "BILLING_VARIANCE",
  "expected": 30000000,
  "actual": 20000000,
  "difference": 10000000
}
```

### AI Output Example

```text
UAT sudah selesai dan berdasarkan baseline aktif,
milestone tersebut memiliki nilai tagih Rp30 juta.
Invoice yang ditemukan baru Rp20 juta.

Terdapat billing difference sebesar Rp10 juta.
```

### Checklist
- [ ] Explain deterministic result
- [ ] No recalculation by LLM
- [ ] Include evidence reference
- [ ] Use simple business language
- [ ] Avoid causal overclaim

### Done When
Alert dapat dipahami non-technical user.

---

## TASK 11 — Build Contract Risk Analysis Integration

**Goal:** Reuse kemampuan legal CLARA lama sebagai supporting feature.

### Checklist
- [ ] Reuse contract review pipeline
- [ ] Clause risk detection
- [ ] Severity mapping
- [ ] Statutory citation
- [ ] Risk explanation
- [ ] Connect risk result to project detail

### Important
Contract Risk Analysis adalah fitur pendukung.

Core hackathon tetap:
`Contract → Baseline → Monitoring → Reconciliation`

### Done When
Risk review lama tetap tersedia tanpa mengganggu core flow baru.

---

## TASK 12 — Build AI Legal Q&A Context

**Goal:** User dapat bertanya tentang kontrak/project dengan evidence dari dokumen.

### Example Questions
- "Berapa maksimal revisi project ini?"
- "Kapan pembayaran milestone UAT bisa ditagihkan?"
- "Apa penalty kalau deadline terlambat?"
- "Apakah WhatsApp Integration ada di scope awal?"

### Checklist
- [ ] Retrieve relevant contract context
- [ ] Retrieve baseline data
- [ ] Answer with citation/evidence
- [ ] Show uncertainty jika data tidak ditemukan
- [ ] Jangan mengarang clause

### Done When
Jawaban selalu grounded pada dokumen/project data yang tersedia.

---

## TASK 13 — Build Change Request / Addendum Extraction

**Goal:** Membaca Change Request atau Addendum untuk membantu baseline versioning.

### Fields
- additional_scope
- additional_value
- deadline_extension
- additional_revision
- approval_status
- effective_date

### Checklist
- [ ] Extract structured changes
- [ ] Compare dengan baseline aktif
- [ ] Return proposed baseline changes
- [ ] Jangan otomatis update baseline
- [ ] Require user approval

### Done When
Dokumen perubahan dapat menjadi candidate Baseline V2/V3.

---

## TASK 14 — Build AI Failure, Confidence & Fallback Handling

**Goal:** Memastikan aplikasi tetap aman saat AI gagal atau tidak yakin.

### Checklist
- [ ] Confidence per extraction
- [ ] Mark missing fields
- [ ] Retry strategy
- [ ] Invalid JSON recovery
- [ ] Timeout handling
- [ ] Manual entry fallback
- [ ] Human confirmation fallback
- [ ] Log AI errors

### Example
Jika AI tidak menemukan `contract_value`:

```text
Contract Value: Not Found
Action: Manual confirmation required
```

Bukan:

```text
Contract Value: Rp0
```

### Done When
AI failure tidak merusak baseline project.

---

## TASK 15 — End-to-End AI Pipeline Testing & Demo Scenario

**Goal:** Menguji seluruh alur AI dengan satu scenario demo yang konsisten.

### Demo Dataset
- `contract.pdf`
- `rab.pdf`
- `invoice.pdf`
- `change-request.pdf`
- sample actual task/progress

### Test Flow

```text
Contract + RAB
↓
OCR
↓
Document Classification
↓
AI Extraction
↓
Evidence Mapping
↓
User Confirmation
↓
Baseline
↓
Actual Project Task
↓
Semantic Scope Matching
↓
Reconciliation Result
↓
AI Explanation
↓
Evidence
```

### Checklist
- [ ] Test normal extraction
- [ ] Test missing field
- [ ] Test incorrect OCR
- [ ] Test scope match
- [ ] Test out-of-scope task
- [ ] Test approved change request
- [ ] Test billing alert explanation
- [ ] Prepare fallback JSON for demo

### Done When
AI flow dapat didemokan dari upload dokumen sampai insight tanpa output ngawur.

---

# AI MVP Priority

## P0 — Wajib Jadi

1. AI Input/Output Schema
2. OCR / Document Parsing
3. Contract Extraction
4. RAB Extraction
5. Extraction Validation
6. Evidence Mapping
7. Semantic Scope Matching
8. Business Alert Explanation
9. Failure & Confidence Handling

## P1 — Sangat Penting

10. Document Classification
11. Scope Matching Guardrail
12. Change Request Extraction
13. Legal Q&A Context

## P2 — Reuse / Polish

14. Existing Contract Risk Integration
15. Prompt optimization & demo testing

---

# Main AI Flow

```text
DOCUMENT
Contract / RAB / Invoice / Change Request
          ↓
   OCR / Parsing
          ↓
Document Classification
          ↓
   AI Extraction
          ↓
 Schema Validation
          ↓
 Evidence Mapping
          ↓
 User Confirmation
          ↓
 Confirmed Baseline
          │
          │
Actual Project Task
          ↓
 Semantic Matching
          ↓
Needs Review / Match
          │
          ▼
Reconciliation Engine Result
          ↓
 AI Explanation
          ↓
 Evidence + Human Decision
```

---

# AI Responsibility

AI digunakan untuk:

- memahami dokumen,
- mengekstrak informasi,
- semantic matching,
- retrieval,
- explanation,
- evidence retrieval.

AI **tidak** digunakan sebagai mesin kebenaran angka.

---

# AI Must Not

AI tidak boleh:

- mengarang contract value,
- mengarang planned cost,
- mengarang actual cost,
- mengarang clause,
- menghitung ulang financial result yang sudah dihitung engine,
- otomatis mengubah baseline,
- menyebut semantic mismatch sebagai pelanggaran kontrak,
- mengambil keputusan bisnis final.

---

# Core Principle

> AI understands the language.  
> The engine calculates the numbers.  
> The user confirms the truth.

Prioritaskan:
- structured output,
- evidence,
- confidence,
- human confirmation,
- predictable behavior.
