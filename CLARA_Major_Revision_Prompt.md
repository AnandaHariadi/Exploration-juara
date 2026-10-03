# CLARA Major Revision Prompt for Claude Code

## Mission

You are the lead product architect, full-stack engineer, backend engineer, and AI engineer for the **CLARA Exploration Hackathon** project.

This is a **major product-scope revision and integration task** immediately before the final hackathon pitch.

The existing repository already contains:

- the current Exploration frontend and business application,
- the current SQLite-backed project/finance/reconciliation layer,
- the previous CLARA AI backend with OCR, contract analysis, legal RAG, reasoning, evidence, and document drafting,
- PRD and system documentation defining the current business intelligence concept.

The goal of this task is **not** to throw away the current product.

The goal is to **merge the two concepts into one coherent product**:

> **CLARA = an AI-driven Contract & Business Intelligence platform that continuously monitors business documents and project data, detects contractual, financial, and operational anomalies, explains their business impact with evidence, proposes or prepares corrective actions and documents, and keeps the business baseline updated only after appropriate human approval.**

The central philosophy remains:

> **AI interprets. The deterministic engine calculates. Humans decide.**

But the AI role is expanded from a passive reviewer to an **active monitoring and remediation layer**.

---

# 1. SOURCE OF TRUTH

Before implementing anything, read and understand all of these files:

- `PRD (2).md`
- `system.md`
- `frontend-flow-contract.md`
- `task.md`
- `task-ai.md`
- `task-backend.md`
- `frontend/README.md`
- `AGENTS.md`

Also inspect the actual implementation under:

- `frontend/src`
- `frontend/data`
- `frontend/package.json`
- `backend/src`
- `backend/package.json`

Important:

- Documentation describes intended behavior.
- Existing code determines what is currently implemented.
- Do not blindly trust stale checkboxes in task files.
- Do not silently remove capabilities from either implementation.
- Where the new product direction conflicts with an older implementation detail, preserve the current product philosophy and adapt the implementation.

The current PRD defines CLARA as a platform that turns contracts into a living business baseline, comparing agreement, plan, actual execution, and realized financial value.

The previous CLARA implementation already provides AI capabilities such as OCR/document processing, contract risk analysis, legal RAG, evidence/citations, and document drafting.

This revision must connect those two layers.

---

# 2. FINAL PRODUCT DEFINITION

The final product is NOT merely:

- a legal chatbot,
- a contract repository,
- a project management dashboard,
- an invoice tracker,
- a static BI dashboard.

CLARA is:

> **An active AI Contract Intelligence and Business Value Monitoring platform.**

It treats every important business document and relevant project/finance record as a source of evidence.

The system continuously asks:

1. What did we agree?
2. What did we plan?
3. What is actually happening?
4. What has actually been billed/paid/realized?
5. Is there an anomaly?
6. How much business value is potentially affected?
7. What evidence supports the finding?
8. What should the user review or change?
9. Can CLARA prepare the corrective document or action?
10. What happens after the human approves it?

---

# 3. CORE PRODUCT LOOP

The product must work as this continuous loop:

```text
DOCUMENTS + PROJECT DATA
        ↓
AI UNDERSTANDING
        ↓
STRUCTURED DATA + EVIDENCE
        ↓
CONTINUOUS MONITORING
        ↓
ANOMALY DETECTION
        ↓
BUSINESS IMPACT CALCULATION
        ↓
AI EXPLANATION
        ↓
AI RECOMMENDATION / REMEDIATION
        ↓
HUMAN REVIEW / APPROVAL
        ↓
DOCUMENT / BASELINE / ACTION UPDATE
        ↓
RE-CALCULATE
        ↓
CONTINUE MONITORING
```

This must feel like **one system**, not a collection of independent pages.

---

# 4. MAJOR SCOPE REVISION

The previous flow was too human-driven:

```text
Human notices problem
↓
Human creates request
↓
AI helps review
↓
Human approves
```

The revised flow must become:

```text
Any relevant document/event is submitted
↓
CLARA automatically reviews it
↓
CLARA identifies anomalies / inconsistencies / risks
↓
CLARA explains why
↓
CLARA calculates deterministic business impact
↓
CLARA proposes the next action
↓
CLARA can prepare a corrected clause / document / change request
↓
Human reviews and approves
↓
Approved state becomes the new business truth
↓
CLARA monitors again
```

The human remains the final authority.

The AI becomes proactive.

---

# 5. AI ROLE: ACTIVE MONITORING, NOT PASSIVE REVIEW

This is the most important change.

The AI must automatically review relevant incoming data.

Relevant inputs include:

- contract
- PKS
- SPK
- SOW
- MoU
- LoI
- addendum
- RAB
- quotation
- invoice
- payment-related documents
- change request
- project event
- evidence of approval
- approved amendment
- supporting business documents

The exact document types supported by the current repository should be reused and expanded carefully.

When a document is uploaded, the user should NOT need to manually ask:

> "Please analyze this."

The system should automatically initiate the analysis workflow.

---

# 6. AI DOCUMENT GUARDIAN

Create a conceptually clear service/module called something like:

- Document Guardian
- Continuous Document Monitor
- Contract Intelligence Monitor

The exact code name is flexible.

Its responsibilities:

1. receive a document,
2. classify it,
3. parse/OCR it,
4. extract structured information,
5. compare it against the current baseline,
6. compare it against other related business records,
7. detect anomalies,
8. calculate or request deterministic calculations,
9. attach evidence,
10. create an alert/insight,
11. recommend a next action,
12. optionally prepare a remediation document.

The Document Guardian must work for both:

- initial project setup,
- project execution after baseline activation.

---

# 7. INITIAL PROJECT FLOW

## Step 1 — Upload

PIC uploads:

- contract
- RAB

Optional:

- supporting documents
- quotation
- SOW
- addendum

## Step 2 — AI analysis

CLARA automatically:

- identifies document type,
- extracts commercial terms,
- extracts milestones,
- extracts payment triggers,
- extracts deadlines,
- extracts revision limits,
- extracts scope,
- extracts obligations,
- extracts rates,
- extracts penalties,
- extracts liability/termination/renewal,
- finds potentially unusual clauses,
- maps each important field to evidence.

## Step 3 — Candidate baseline

AI proposes:

```text
CONTRACT BASELINE CANDIDATE

Contract Value
Deadline
Revision Limit
Milestones
Payment Triggers
Scope
Rates
Obligations
Penalties
```

and:

```text
PLAN BASELINE CANDIDATE

Planned Cost
Budget Categories
Planned Margin
```

## Step 4 — Human confirmation

PIC must review and confirm.

The candidate is NOT yet the business truth.

After confirmation:

> Baseline V1 becomes ACTIVE.

---

# 8. CONTINUOUS MONITORING FLOW

After V1 is active, every relevant input can trigger monitoring.

Examples:

- new invoice,
- new project event,
- new revision,
- new task,
- new scope item,
- actual cost,
- payment,
- addendum,
- new change request,
- updated contract,
- uploaded evidence,
- client approval document.

CLARA must compare new information against:

- active contract baseline,
- active plan baseline,
- project execution records,
- finance records,
- approved changes,
- historical baseline versions.

---

# 9. ANOMALY DETECTION CATEGORIES

At minimum support these categories.

## 9.1 Contractual anomaly

Examples:

- unusual clause,
- conflicting clause,
- vague commercial clause,
- high penalty exposure,
- unusual liability,
- inconsistent payment terms,
- unclear revision allowance,
- suspicious/ambiguous termination language,
- mismatch between main contract and addendum.

Output example:

> **Potential contractual anomaly**
>
> Penalty clause creates a potential exposure of Rp50M.
>
> Evidence: Contract, Clause 7.2, page 8.
>
> Recommendation: Review or revise the penalty clause before approval.

Do NOT automatically declare a clause illegal.

Use language such as:

- potential risk,
- unusual clause,
- requires review,
- potential exposure,
- possible inconsistency.

---

## 9.2 Financial anomaly

Examples:

- invoice rate differs from contract rate,
- invoice amount exceeds entitlement,
- cost exceeds budget,
- duplicate invoice pattern,
- unexpected vendor value,
- unexplained financial increase,
- suspicious repeated financial pattern,
- payment mismatch.

Example:

```text
Contract rate: Rp500,000/hour
Invoice rate: Rp650,000/hour
Hours: 40

Verified billing difference:
Rp6,000,000
```

CLARA should explain the arithmetic using deterministic business logic.

---

## 9.3 Scope anomaly

Examples:

```text
Contracted revisions: 3
Actual revisions: 5
```

Output:

> **Possible scope variance**
>
> 2 revisions exceed the current active baseline.
>
> Please review whether there is an approved change supporting the additional work.

Do not immediately call this a contractual violation.

---

## 9.4 Billing anomaly

Example:

```text
UAT completed
Contract says 25% payable after UAT acceptance
Contract value = Rp120M
Expected billable value = Rp30M
No matching invoice found
```

Output:

> **Rp30M billable value may require follow-up.**

Do not call it a loss.

---

## 9.5 Deadline anomaly

Compare:

- contractual deadline,
- approved deadline,
- current/projected completion.

Example:

```text
Contract deadline: 30 Nov
Projected completion: 10 Dec
```

Output:

> **Projected completion exceeds the current contractual deadline by 10 days.**

The system may recommend a review or change request.

---

## 9.6 Cross-document inconsistency

CLARA must compare documents, not just analyze them individually.

Examples:

Contract:
> Revision limit = 3

Change Request:
> +2 revisions approved

Invoice:
> charges for 8 revisions

CLARA should identify that the invoice may be inconsistent with the updated/current contract state.

Another example:

Contract:
> Rate = Rp500k/hour

Invoice:
> Rp650k/hour

The anomaly exists across documents.

---

# 10. "FRAUD" HANDLING

CLARA MAY detect patterns that are potentially indicative of fraud or financial irregularity.

CLARA MUST NOT make unsupported definitive fraud accusations.

Use language such as:

> Potential financial anomaly

> Potential irregular transaction

> Pattern requiring investigation

> Potential duplicate billing

> Estimated exposure: RpXX

> Review recommended

Only verified arithmetic differences should be labeled:

> Verified billing difference

Only verified rule-based deviations should be labeled:

> Verified deviation

This distinction is mandatory.

---

# 11. BUSINESS IMPACT ENGINE

AI does NOT own final financial arithmetic.

Create or reuse deterministic calculations for:

- contract value,
- planned cost,
- actual cost,
- budget variance,
- budget utilization,
- eligible billing,
- billed value,
- paid value,
- unbilled value,
- revision variance,
- rate mismatch,
- deadline variance,
- approved change impact,
- planned profit.

Use explicit financial labels.

Never mix:

- potential exposure,
- verified difference,
- actual loss,
- planned profit,
- actual profit.

Example:

```text
Potential Exposure
Rp50M
```

must never automatically become:

```text
Actual Loss
Rp50M
```

---

# 12. AI-TO-ENGINE BOUNDARY

The AI may return:

```text
extracted values
evidence
confidence
semantic findings
recommendations
```

The deterministic engine returns:

```text
verified totals
financial differences
percentage calculations
baseline calculations
billing eligibility
variance
alert severity
```

AI may explain these results afterward.

Never ask an LLM to recalculate authoritative finance numbers that the backend can calculate deterministically.

---

# 13. AI REMEDIATION LAYER

This is a major new feature.

CLARA must not stop at:

> "There is a problem."

It should be able to prepare a solution.

Create a conceptual layer:

> **Remediation Copilot**

The Remediation Copilot may:

- suggest a corrected clause,
- create a change request,
- draft an addendum,
- draft a revised MoU,
- draft a PKS,
- draft a LoI,
- prepare a response to an anomaly,
- prepare a follow-up action,
- generate a document ready for human review.

Examples:

## Example A: vague revision clause

Current:

> "Client may request revisions as necessary."

CLARA:

```text
Detected issue:
Revision limit is not explicit.

Suggested revision:
Client is entitled to up to 3 revision rounds.
Additional revisions require written approval
and may incur additional charges.
```

Attach:

- original clause,
- proposed clause,
- reason,
- evidence.

User can:

- accept,
- edit,
- reject.

---

# 14. DOCUMENT DRAFTING

Reuse the capabilities from the previous CLARA AI implementation.

Supported document generation may include:

- MoU
- LoI
- PKS
- Change Request
- Addendum
- revised clause
- other project-related documents if already supported

The AI should be able to create a draft from:

- detected issue,
- affected clause,
- approved business change,
- project context,
- financial impact,
- existing baseline.

---

# 15. AUTOMATIC DOCUMENT PREPARATION

When a meaningful issue is detected, CLARA may prepare the relevant document automatically.

Example:

```text
Scope variance detected
+
No approved change request found
```

CLARA:

> A potential scope deviation was detected.

Then:

> Recommended action:
> Create a Change Request.

Button:

> Generate Change Request

AI generates:

```text
Current scope
Additional scope
Reason
Additional value
Deadline impact
Revision impact
Evidence
```

The user edits if necessary.

Then:

> Submit for internal approval.

---

# 16. HUMAN APPROVAL GATE

AI may prepare.

AI may recommend.

AI may draft.

AI may identify.

AI may calculate via deterministic tools.

But final irreversible actions remain human-controlled.

Do NOT allow the AI to silently:

- sign a contract,
- approve a change,
- change baseline,
- send an externally binding document,
- send an invoice,
- reject a contract,
- declare fraud,
- declare a legal violation as fact.

The user must approve before these actions happen.

---

# 17. "READY TO SEND" EXPERIENCE

The user wanted AI to be able to revise and send documents.

Implement this as a safe agentic flow:

```text
Detect
↓
Recommend
↓
Generate
↓
Self-review
↓
Human review
↓
Approve
↓
Ready to send
↓
Send / Export
```

For the hackathon, external sending may be mocked or represented as an explicit final action, but the UI must clearly show:

- draft created,
- validation complete,
- human approval required,
- ready to send.

Do not pretend an external email/WhatsApp/API message was actually delivered if no delivery integration exists.

---

# 18. AI SELF-REVIEW

Before a generated document is shown as ready:

run a second AI/guardrail pass.

Check:

- required fields present,
- values consistent with approved baseline,
- no contradiction with existing contract terms,
- no accidental removal of important clauses,
- financial values consistent,
- requested changes represented,
- references/evidence attached,
- document type appropriate.

Output:

```text
Draft Validation

✓ Required fields complete
✓ Contract value consistent
✓ Deadline consistent with approved change
✓ Revision allowance consistent
✓ No unresolved placeholder
✓ Evidence attached

Status:
READY FOR HUMAN REVIEW
```

---

# 19. MULTI-PERSONA WORKFLOW

The team proposal is useful, but it must become a **governance layer on top of proactive AI**.

Roles:

## Budi — Project / PIC

Dashboard should show:

- issues needing project clarification,
- extraction fields needing confirmation,
- proposed scope changes,
- project events needing input,
- change requests to complete,
- missing evidence.

Budi should not have to manually discover anomalies.

CLARA should surface them.

---

## Siti — Finance

Dashboard should show:

- financial anomalies,
- billing mismatches,
- budget variance,
- unbilled value,
- payment discrepancies,
- change requests with monetary impact,
- missing financial evidence.

---

## Hendra — Decision Maker

Dashboard should show:

- items awaiting decision,
- proposed changes,
- financial impact,
- evidence,
- previous decisions,
- approval history.

Hendra approves or rejects.

---

# 20. IMPORTANT DISTINCTION: INTERNAL APPROVAL VS CLIENT APPROVAL

A project change may require two levels:

1. internal approval,
2. external/client approval.

Hendra approving internally does NOT automatically mean the client approved it.

Therefore the system must distinguish:

```text
Internal Status
```

and:

```text
External / Client Approval Status
```

Possible states:

```text
INTERNAL_DRAFT
INTERNAL_PENDING
INTERNAL_APPROVED
CLIENT_APPROVAL_REQUIRED
CLIENT_APPROVED
CLIENT_REJECTED
```

Only the appropriate externally confirmed state should cause the contract baseline to be considered officially changed, depending on the product workflow.

At minimum, the system must store evidence that the relevant external approval happened.

---

# 21. CHANGE REQUEST FLOW

The new flow:

```text
Anomaly / project event
        ↓
CLARA proposes change
        ↓
PIC reviews
        ↓
AI checks against contract
        ↓
Deterministic engine calculates impact
        ↓
Siti reviews financial impact
        ↓
Hendra approves/rejects internally
        ↓
External/client approval evidence
        ↓
Approved official change
        ↓
Baseline V2
        ↓
Recalculate all metrics
        ↓
Re-run anomaly checks
```

If rejected:

```text
V1 remains active
↓
Reason stored
↓
PIC may revise and resubmit
```

---

# 22. BASELINE VERSIONING

Initial:

```text
V1
```

After approved official change:

```text
V2
```

Old version remains immutable.

Example:

```text
V1
Contract Value: Rp120M
Revision Limit: 3
Deadline: 30 Nov
```

Approved change:

```text
+2 revisions
+Rp4M
+5 days
```

V2:

```text
Contract Value: Rp124M
Revision Limit: 5
Deadline: 5 Dec
```

After V2 is active:

- recalculate dashboards,
- recalculate alert states,
- recalculate scope/revision variance,
- recalculate billing entitlement,
- update available actions.

---

# 23. CONTINUOUS RE-EVALUATION

This is critical.

When a new approved document or baseline version arrives:

CLARA must re-run relevant checks.

Example:

Before CR approval:

```text
Revision variance +2
```

After CR approval:

```text
Revision allowance increases from 3 → 5
Actual revisions = 5

Revision variance = 0
```

The previous alert should be:

- resolved automatically if the discrepancy is now explained,
- or marked as superseded by an approved change.

Do not delete history.

---

# 24. DOCUMENT RELATIONSHIP GRAPH

Use the existing CLARA knowledge graph capabilities where helpful.

The business system should conceptually connect:

```text
Project
 ├── Contract
 ├── RAB
 ├── Baseline V1
 │    ├── Scope
 │    ├── Milestones
 │    ├── Rates
 │    └── Payment Rules
 │
 ├── Events
 ├── Actual Costs
 ├── Invoices
 ├── Payments
 ├── Change Requests
 ├── Baseline V2
 └── Alerts
```

Documents should be traceable.

An alert should be able to explain:

```text
Alert
↓
Why?
↓
Which clause?
↓
Which project event?
↓
Which invoice?
↓
Which financial calculation?
```

---

# 25. EVIDENCE FIRST

Every high-value insight must support evidence.

Evidence types:

- document page,
- clause,
- text snippet,
- project event,
- invoice,
- cost record,
- payment,
- approved change,
- baseline version.

UI should expose:

> What happened?

> Why did CLARA flag it?

> Which source supports it?

> How was the business impact calculated?

> What action is recommended?

---

# 26. ALERT MODEL

Create or reuse alert states:

```text
MATCH
WARNING
POSSIBLE_DEVIATION
VERIFIED_DEVIATION
NEEDS_HUMAN_REVIEW
RESOLVED
SUPERSEDED
```

Alert categories:

```text
CONTRACT_RISK
FINANCIAL_ANOMALY
BUDGET_VARIANCE
BILLING_VARIANCE
SCOPE_VARIANCE
REVISION_VARIANCE
DEADLINE_RISK
DOCUMENT_INCONSISTENCY
POTENTIAL_IRREGULARITY
```

Do not make every anomaly "critical".

Severity must be explainable.

---

# 27. ALERT EXPERIENCE

Dashboard should NOT be overloaded.

Dashboard:

- show summary,
- show high-priority alerts,
- show actions.

Detail project:

- show complete evidence,
- full analysis,
- related documents,
- calculation,
- remediation proposal,
- history.

This preserves the team's idea that dashboards should be concise while full evidence lives in project detail.

---

# 28. NEW CORE UI MODULES

If they do not already exist, add appropriate UI for:

## A. AI Monitoring Center

Shows:

- latest analyzed documents,
- detected issues,
- anomaly count,
- processing state,
- confidence,
- action required.

---

## B. Document Intelligence

For each document:

```text
Document
Status
Type
Analyzed at
Confidence
Findings
Evidence
Related project
```

Actions:

- view,
- inspect,
- generate correction,
- create change request,
- regenerate analysis.

---

## C. Remediation / AI Action Center

Shows:

```text
Issue
Impact
Recommendation
Proposed action
Generated document
Approval state
```

Actions:

- Review
- Edit
- Approve
- Reject
- Regenerate

---

## D. Document Studio

Reuse the old CLARA drafting capabilities.

Allow:

- MoU
- LoI
- PKS
- Change Request
- Addendum
- clause revision

AI should use project context when available.

---

# 29. OLD CLARA AI CAPABILITIES TO PRESERVE

Do NOT remove the useful legacy capabilities.

Preserve/adapt:

- OCR
- contract review
- clause analysis
- legal RAG
- hybrid retrieval
- citations
- confidence
- knowledge graph where valuable
- legal Q&A
- document drafting
- guardrails

But make them serve the new business intelligence workflow.

The old Legal AI should become a **supporting intelligence layer**, not the whole product.

---

# 30. API ARCHITECTURE

Keep business state in the current Exploration application.

Use the legacy backend as the AI service.

Preferred logical topology:

```text
Browser
   ↓
Next.js frontend
   ↓
Next.js API / server integration
   ├── SQLite/business APIs
   └── CLARA AI backend
          ├── OCR
          ├── extraction
          ├── RAG
          ├── reasoning
          ├── evidence
          └── drafting
```

Do not expose AI service secrets to the browser.

---

# 31. AI API CAPABILITIES

Expose a normalized AI interface.

At minimum:

```text
POST /api/ai/documents/analyze
POST /api/ai/documents/review
POST /api/ai/documents/generate
POST /api/ai/documents/revise
POST /api/ai/anomalies/explain
POST /api/ai/change-requests/draft
POST /api/ai/legal/query
GET  /api/ai/health
```

Exact routing may follow the current repo conventions.

Do not create duplicate versions of the same capability.

---

# 32. NORMALIZED ANALYSIS RESPONSE

Use a stable application-level schema.

Example:

```json
{
  "success": true,
  "data": {
    "documentType": "CONTRACT",
    "confidence": 0.94,
    "structuredData": {
      "contractValue": 120000000,
      "deadline": "2026-11-30",
      "revisionLimit": 3,
      "milestones": [],
      "paymentTerms": [],
      "scope": [],
      "rates": [],
      "obligations": [],
      "penalties": []
    },
    "findings": [],
    "evidence": [],
    "recommendations": [],
    "remediationOptions": []
  }
}
```

The actual TypeScript structure may be adapted to the current domain model.

The important rule:

> Frontend must not depend directly on legacy internal CLARA response structures.

---

# 33. ANALYSIS TRIGGERS

Automatic AI analysis should occur when:

1. a new contract is uploaded,
2. a new RAB is uploaded,
3. a new invoice is uploaded,
4. a change request is uploaded,
5. an addendum is uploaded,
6. new supporting evidence is uploaded,
7. project event creates a meaningful scope/finance/deadline change,
8. a baseline version changes,
9. user explicitly requests re-analysis.

Do not create infinite loops.

Example:

AI-generated document should not automatically trigger endless self-analysis.

Use explicit pipeline states.

---

# 34. DOCUMENT PROCESSING STATES

Implement explicit states such as:

```text
UPLOADED
PROCESSING
ANALYZED
NEEDS_REVIEW
APPROVED
REJECTED
FAILED
```

No ambiguous "loading forever".

---

# 35. AI FAILURE SAFETY

If AI service fails:

- preserve uploaded document,
- preserve current baseline,
- preserve business data,
- show failure,
- allow retry,
- never create fake extraction,
- never auto-confirm baseline.

If AI is unavailable, core existing business dashboard should remain usable.

---

# 36. RECOMMENDATION SYSTEM

Recommendations should be action-oriented.

Examples:

```text
Review clause
Review invoice
Review scope
Create change request
Generate addendum
Create follow-up
Request approval
Review financial impact
Investigate anomaly
```

Do not produce vague recommendations such as:

> "Consider checking this."

Instead:

> "Review Invoice INV-002 because its hourly rate is Rp150,000 above the confirmed contract rate."

---

# 37. AI ACTION CONFIDENCE

Every AI-originated finding should have enough metadata to distinguish:

- AI inference,
- deterministic fact,
- user-confirmed fact.

Use labels such as:

```text
AI Finding
Verified Calculation
User Confirmed
Pending Review
```

Do not blur them.

---

# 38. FRONTEND INTEGRATION

Audit every currently visible UI element.

No dead buttons.

No blank routes.

No placeholder actions.

If a backend capability exists without a frontend:

BUILD THE FRONTEND.

If a frontend action exists without a backend:

BUILD OR FIX THE BACKEND.

If a feature is not appropriate for the final scope:

remove the misleading CTA rather than leaving it broken.

---

# 39. DEMO FLOW FOR FINAL PITCH

The product demo should tell one coherent story.

## Phase A — Project start

1. Open CLARA.
2. Select Budi/PIC.
3. Create project.
4. Upload contract.
5. Upload RAB.
6. AI automatically analyzes.
7. Show extracted baseline.
8. Show evidence.
9. Confirm V1.

## Phase B — Continuous monitoring

10. Add project progress.
11. Add actual cost.
12. Mark UAT completed.
13. AI/business engine detects that Rp30M is eligible for billing.
14. No matching invoice exists.
15. CLARA raises a billing/value alert.

## Phase C — Scope anomaly

16. Add revisions beyond current baseline.
17. CLARA detects possible scope variance.
18. CLARA shows evidence.
19. CLARA calculates deterministic impact.

## Phase D — AI remediation

20. CLARA recommends creating a Change Request.
21. Click "Generate Change Request".
22. AI creates the draft.
23. User reviews/edits.
24. Submit.

## Phase E — Finance review

25. Switch to Siti.
26. Review financial impact.
27. Confirm values/evidence.
28. Pass to Hendra.

## Phase F — Decision

29. Switch to Hendra.
30. Review summary and evidence.
31. Approve or reject.

## Phase G — Official change

32. Capture external/client approval evidence if required.
33. Mark official approval.
34. Baseline V2 is created.
35. Recompute:
    - contract value,
    - revision allowance,
    - deadline,
    - billing entitlement,
    - alerts.

## Phase H — Close the loop

36. Return to dashboard.
37. Show that the previous anomaly is now resolved/superseded.
38. Show the new active baseline.
39. Show the audit trail.

This tells a clear story:

> **CLARA found the problem before the user had to discover it, quantified its impact, prepared the remedy, and updated the business baseline only after human approval.**

---

# 40. DEMO RESET

A deterministic reset must exist.

Reset must restore:

- users/personas,
- seed project,
- baseline V1,
- project events,
- finance records,
- invoices,
- payments,
- alerts,
- change requests,
- document states.

Running reset multiple times must produce the same state.

The pitch flow must always start from a known state.

---

# 41. REQUIRED DEMO NUMBERS

Use the existing demo numbers from the PRD where appropriate:

```text
Contract Value: Rp120M
RAB: Rp75M
Planned Profit: Rp45M
Deadline: 30 Nov
Revision Limit: 3
UAT Billing Trigger: 25%
Progress: 60%
Actual Cost: Rp64M
Actual Revisions: 5
UAT Completed: Yes
UAT Invoice: Missing
```

Expected:

```text
Budget utilization ≈ 85.3%

UAT billable value:
25% × Rp120M = Rp30M

Unbilled eligible value:
Rp30M

Revision variance:
5 - 3 = +2
```

Then approved change:

```text
+2 revisions
+Rp4M
+5 days
```

Expected V2:

```text
Contract Value: Rp124M
Revision Limit: 5
Deadline: 5 Dec
```

Make sure all calculations are deterministic.

---

# 42. TESTING REQUIREMENTS

Do not stop at successful build.

Run:

## Build

- frontend build
- backend build

## Type safety

No TypeScript errors.

## API smoke tests

Test:

- upload
- extraction
- baseline
- cost
- invoice
- payment
- alerts
- change request
- approval
- AI analysis
- AI drafting

## AI smoke tests

Verify:

- OCR
- extraction
- evidence
- confidence
- anomaly
- remediation draft
- legal query
- generated document

## End-to-end flow

Reset:

```text
upload
→ analyze
→ review
→ baseline
→ event
→ finance
→ anomaly
→ recommendation
→ draft
→ approval
→ V2
→ recompute
```

## Browser interaction audit

Click every main CTA.

No:

- 404
- blank page
- dead button
- silent API failure
- uncaught promise
- hydration error
- undefined data crash.

---

# 43. ROUTE COMPLETENESS

Audit all frontend routes.

At minimum:

```text
/dashboard
/projects
/projects/new
/projects/[id]
/monitoring
/finance
/change-requests
/alerts
/legal-ai
```

Every route must either:

- work,
- redirect intentionally,
- or be removed from navigation.

No accidentally exposed unfinished route.

---

# 44. SECURITY

Never commit or copy into the final project:

- private SSH keys,
- service account credentials,
- Gemini keys,
- database passwords,
- JWT secrets.

Use:

```text
.env
```

and:

```text
.env.example
```

The browser must never receive server secrets.

---

# 45. OBSERVABILITY

Add useful logs.

AI:

```text
[AI] document received
[AI] OCR started
[AI] extraction started
[AI] extraction normalized
[AI] anomaly analysis completed
[AI] draft generated
```

Business engine:

```text
[BASELINE] V1 confirmed
[RECON] project reconciled
[ALERT] billing variance generated
[CR] request approved
[BASELINE] V2 activated
```

Do not log confidential full-document contents unnecessarily.

---

# 46. CODE QUALITY RULES

Reuse existing implementation where stable.

Do not rebuild working capabilities from scratch.

Do not create:

- duplicate service classes,
- duplicate API clients,
- duplicate database models,
- duplicate alert logic,
- duplicate financial calculation logic.

Have one clear owner for every business calculation.

Have one clear owner for AI orchestration.

---

# 47. PRIORITY ORDER

Because this is a hackathon release, use this implementation priority.

## P0 — MUST WORK

1. Existing frontend starts.
2. Existing SQLite/business API works.
3. Legacy AI backend starts.
4. AI health works.
5. Contract upload works.
6. Automatic AI analysis works.
7. Structured extraction works.
8. Evidence works.
9. Baseline confirmation works.
10. Monitoring works.
11. Actual cost works.
12. Invoice works.
13. Billing anomaly works.
14. Scope/revision anomaly works.
15. Evidence drawer works.
16. Change request generation works.
17. Human approval works.
18. Baseline V2 works.
19. Recalculation works.
20. Reset works.

## P1 — SHOULD WORK

21. AI clause remediation.
22. Addendum generation.
23. MoU/PKS/LoI drafting.
24. Financial anomaly review.
25. Cross-document consistency checking.
26. Client approval evidence tracking.
27. AI monitoring center.

## P2 — POLISH

28. Better animations.
29. Advanced charts.
30. Extra filters.
31. Advanced portfolio analytics.
32. External integrations.

Never sacrifice P0 for P2.

---

# 48. DESIGN PRINCIPLE

The UI should communicate:

```text
INSIGHT
↓
IMPACT
↓
EVIDENCE
↓
ACTION
```

Avoid:

- excessive gradients,
- neon AI visuals,
- decorative AI elements,
- giant dashboards full of irrelevant cards,
- excessive charts.

This is a trustworthy business intelligence product.

---

# 49. SUCCESS CRITERIA

The revision is successful only if a judge can see:

1. Upload document.
2. AI automatically understands it.
3. AI shows evidence.
4. AI detects an anomaly.
5. System calculates the business impact.
6. AI explains why it matters.
7. AI proposes a remedy.
8. AI can generate a corrective document.
9. Human reviews and approves.
10. The business baseline changes only after approval.
11. The dashboard recalculates.
12. The system continues monitoring.

The judge should understand the value without needing a technical explanation.

---

# 50. FINAL PRODUCT MESSAGE

The final product message should be:

> **CLARA doesn't just read contracts. It watches what happens after the contract is signed.**

And:

> **Detect → Explain → Quantify → Resolve → Approve → Monitor**

The product should demonstrate that CLARA transforms business documents from passive files into an active source of business intelligence.

---

# 51. IMPORTANT DEVELOPMENT RULE

Before implementation:

1. Audit.
2. Identify impacted files.
3. Identify integration boundaries.
4. Identify missing capabilities.
5. Identify database changes.
6. Identify API changes.
7. Identify frontend changes.
8. Identify AI changes.
9. Produce a concise implementation plan.

Then implement.

The repository workflow in `AGENTS.md` requires:

> AUDIT → GAS → IMPLEMENT

For this task, this prompt itself is the explicit authorization to proceed after the audit.

---

# 52. FINAL EXECUTION INSTRUCTION

Do not only tell me what should be changed.

Implement it.

Do not leave the product in a partially integrated state.

Do not create a beautiful UI with disconnected logic.

Do not create an AI service that is never called.

Do not create backend endpoints that the frontend cannot reach.

Do not create frontend buttons with no backend action.

Do not let AI-generated numbers become authoritative financial numbers without deterministic verification.

Do not let AI silently modify baseline state.

Do not remove useful legacy CLARA capabilities.

Do not allow the product to become only a project dashboard.

The final architecture must preserve:

- contract intelligence,
- legal intelligence,
- document drafting,
- evidence,
- business monitoring,
- financial reconciliation,
- anomaly detection,
- remediation,
- human governance.

The final product must feel like ONE CLARA.

Run the complete release flow repeatedly from a clean reset.

Fix all issues found.

Only declare the work complete after:

- build passes,
- type checks pass,
- core API smoke tests pass,
- AI smoke tests pass,
- browser interaction audit passes,
- end-to-end demo passes,
- reset/replay passes,
- and the pitch scenario is reproducible.

Final target:

> **CLARA continuously monitors business data, detects what may go wrong, explains why, quantifies the impact, prepares what should happen next, and lets humans approve the decision.**

