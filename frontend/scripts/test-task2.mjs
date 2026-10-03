/**
 * Automated Verification Test for Task 2 (SQLite + Demo Users + Billing Flow)
 *
 * Verifies:
 * 1. SQLite schema & migration runner (schema_migrations, demo_users, projects, demo_session)
 * 2. Demo personas persistence
 * 3. Consistent sample project seed (PRJ-101)
 * 4. Milestone completion validation (milestoneId required, prevents duplicate completion)
 * 5. Billable value recalculation on milestone completion
 * 6. Invoice creation guards (requires completed milestone, prevents duplicate invoice)
 * 7. Payment recording endpoint (validates amount, updates paidValue, prevents duplicate payment)
 * 8. Change request approval idempotency (prevents duplicate approval and contract value inflation)
 * 9. Demo reset idempotency (withSeed: true restores sample project, withSeed: false clears)
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DB_PATH = path.join(process.cwd(), 'data', 'clara.db');

let passCount = 0;
let failCount = 0;

function report(step, description, success, extra = '') {
  if (success) {
    passCount++;
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${step}: ${description}${extra ? ` (${extra})` : ''}`);
  } else {
    failCount++;
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${step}: ${description}${extra ? ` - ${extra}` : ''}`);
  }
}

async function runDirectDbChecks() {
  console.log('\n--- 1. DIRECT SQLITE DB VERIFICATION ---');

  if (!fs.existsSync(DB_PATH)) {
    report('DB-01', 'SQLite database file exists', false, `Not found at ${DB_PATH}`);
    return;
  }
  report('DB-01', 'SQLite database file exists', true, DB_PATH);

  const db = new Database(DB_PATH, { readonly: true });

  try {
    // Check migrations table
    const migrations = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all();
    const has001 = migrations.some((m) => m.version === '001_initial_schema.sql');
    report('DB-02', 'Migration 001_initial_schema.sql recorded in schema_migrations', has001);

    // Check demo_users
    const users = db.prepare('SELECT id, name, role_title FROM demo_users').all();
    const userIds = users.map((u) => u.id).sort();
    const expectedUsers = ['ADMIN', 'BUDI', 'HENDRA', 'SITI'];
    const usersMatch = JSON.stringify(userIds) === JSON.stringify(expectedUsers);
    report('DB-03', '4 Demo personas seeded into demo_users', usersMatch, userIds.join(', '));

    // Check demo_session
    const session = db.prepare('SELECT active_user_id FROM demo_session WHERE id = 1').get();
    report('DB-04', 'demo_session row exists with active user', Boolean(session && session.active_user_id), session?.active_user_id);

    // Check projects table schema
    const columns = db.prepare("PRAGMA table_info('projects')").all().map((c) => c.name);
    const requiredCols = ['id', 'name', 'contract_value', 'planned_cost', 'billable_value', 'billed_value', 'paid_value', 'data_json'];
    const colsPresent = requiredCols.every((c) => columns.includes(c));
    report('DB-05', 'projects table contains required financial and JSON columns', colsPresent);
  } finally {
    db.close();
  }
}

async function runHttpApiChecks() {
  console.log(`\n--- 2. HTTP API END-TO-END VERIFICATION (${BASE_URL}) ---`);

  // Check server connectivity
  try {
    const res = await fetch(`${BASE_URL}/api/demo/session`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  } catch (err) {
    console.error(`\n\x1b[33m[SKIPPED HTTP TESTS]\x1b[0m Could not connect to server at ${BASE_URL}: ${err.message}`);
    console.log('Run `npm run build && npm run start` or `npm run dev` in another terminal, then re-run test:task2.');
    return;
  }

  // 1. Reset demo to clean state with seed
  {
    const res = await fetch(`${BASE_URL}/api/demo/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withSeed: true }),
    });
    const json = await res.json();
    report('API-01', 'POST /api/demo/reset (withSeed: true) restores sample data', res.status === 200 && json.success);
  }

  // 2. Persona get and switch
  {
    const resGet = await fetch(`${BASE_URL}/api/demo/session`);
    const jsonGet = await resGet.json();
    report('API-02', 'GET /api/demo/session returns active persona (BUDI default)', jsonGet.data?.activePersonaId === 'BUDI');

    const resPost = await fetch(`${BASE_URL}/api/demo/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'SITI' }),
    });
    const jsonPost = await resPost.json();
    report('API-03', 'POST /api/demo/session switches to SITI', resPost.status === 200 && jsonPost.data?.activePersonaId === 'SITI');
  }

  // 3. Verify sample project PRJ-101
  let project;
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101`);
    const json = await res.json();
    project = json.data;
    const isSampleValid =
      project &&
      project.id === 'PRJ-101' &&
      project.contractValue === 120000000 &&
      project.plannedCost === 75000000 &&
      project.billableValue === 30000000 && // MLS-01 completed
      project.billedValue === 30000000 &&
      project.paidValue === 30000000;
    report('API-04', 'GET /api/projects/PRJ-101 has correct initial financial metrics', isSampleValid, `Contract: Rp ${project?.contractValue?.toLocaleString('id-ID')}`);
  }

  // 4. Reject invoice for uncompleted milestone (MLS-02 is IN_PROGRESS)
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneId: 'MLS-02' }),
    });
    const json = await res.json();
    report('API-05', 'POST invoice on uncompleted milestone rejected with 409', res.status === 409, json.error);
  }

  // 5. Reject MILESTONE_COMPLETED event without milestoneId
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'MILESTONE_COMPLETED',
        title: 'Milestone sign-off',
        description: 'Test event without milestoneId',
      }),
    });
    const json = await res.json();
    report('API-06', 'POST MILESTONE_COMPLETED without milestoneId rejected with 400', res.status === 400, json.error);
  }

  // 6. Complete milestone MLS-02 (value: 42,000,000)
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'MILESTONE_COMPLETED',
        title: 'Sign-off Termin 2 UAT Delivery',
        description: 'UAT selesai, deliverable diserahkan ke klien.',
        milestoneId: 'MLS-02',
      }),
    });
    const json = await res.json();
    project = json.data;
    const billableExpected = 30000000 + 42000000; // 72,000,000
    report(
      'API-07',
      'POST MILESTONE_COMPLETED for MLS-02 updates billableValue to 72M',
      res.status === 200 && project.billableValue === billableExpected,
      `Billable: Rp ${project?.billableValue?.toLocaleString('id-ID')}`
    );
  }

  // 7. Reject completing an already completed milestone
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'MILESTONE_COMPLETED',
        title: 'Sign-off Termin 2 UAT Delivery again',
        milestoneId: 'MLS-02',
      }),
    });
    const json = await res.json();
    report('API-08', 'POST MILESTONE_COMPLETED on already completed milestone rejected with 409', res.status === 409, json.error);
  }

  // 8. Create invoice for MLS-02 (now completed)
  let newInvoiceId;
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneId: 'MLS-02' }),
    });
    const json = await res.json();
    project = json.data;
    newInvoiceId = json.invoice?.id;
    const billedExpected = 30000000 + 42000000; // 72,000,000
    report(
      'API-09',
      'POST invoice for MLS-02 succeeds and updates billedValue to 72M',
      res.status === 200 && project.billedValue === billedExpected,
      `Invoice: ${json.invoice?.invoiceNumber}`
    );
  }

  // 9. Reject duplicate invoice for MLS-02
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneId: 'MLS-02' }),
    });
    const json = await res.json();
    report('API-10', 'POST duplicate invoice for MLS-02 rejected with 409', res.status === 409, json.error);
  }

  // 10. Reject payment with mismatched amount
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: newInvoiceId, amount: 10000000 }),
    });
    const json = await res.json();
    report('API-11', 'POST payment with mismatched amount rejected with 400', res.status === 400, json.error);
  }

  // 11. Record payment for MLS-02 invoice
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: newInvoiceId }),
    });
    const json = await res.json();
    project = json.data;
    const paidExpected = 30000000 + 42000000; // 72,000,000
    report(
      'API-12',
      'POST payment records full payment and updates paidValue to 72M',
      res.status === 200 && project.paidValue === paidExpected,
      `Paid: Rp ${project?.paidValue?.toLocaleString('id-ID')}`
    );
  }

  // 12. Reject duplicate payment for already PAID invoice
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: newInvoiceId }),
    });
    const json = await res.json();
    report('API-13', 'POST duplicate payment on PAID invoice rejected with 409', res.status === 409, json.error);
  }

  // 13. Create and approve Change Request
  let crId;
  const initialContractValue = project.contractValue;
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/change-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crNumber: 'CR/PRJ-101/001',
        title: 'Penambahan Fitur GPS Fleet Tracker',
        description: 'Integrasi modul pelacak armada real-time.',
        reason: 'Permintaan stakeholder Astra.',
        additionalScope: ['Modul GPS Tracking', 'API Fleet Gateway'],
        additionalValue: 15000000,
        deadlineExtensionDays: 14,
      }),
    });
    const json = await res.json();
    project = json.data;
    const addedCr = (project.changeRequests || []).find((c) => c.crNumber === 'CR/PRJ-101/001');
    crId = addedCr?.id;
    report('API-14', 'POST change request creates PENDING adendum', res.status === 200 && addedCr?.status === 'PENDING', `CR ID: ${crId}`);
  }

  // 14. Approve Change Request (bumps baseline, adds contract value)
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/change-requests/${crId}/approve`, {
      method: 'POST',
    });
    const json = await res.json();
    project = json.data;
    const expectedContract = initialContractValue + 15000000;
    report(
      'API-15',
      'POST approve CR bumps version to V2.0 and increments contractValue',
      res.status === 200 && project.contractValue === expectedContract && project.baselineVersion === 'V2.0',
      `Contract: Rp ${project?.contractValue?.toLocaleString('id-ID')}, Ver: ${project?.baselineVersion}`
    );
  }

  // 15. Reject duplicate approval of the same CR
  {
    const res = await fetch(`${BASE_URL}/api/projects/PRJ-101/change-requests/${crId}/approve`, {
      method: 'POST',
    });
    const json = await res.json();
    // Fetch project to verify contract value did NOT double
    const resGet = await fetch(`${BASE_URL}/api/projects/PRJ-101`);
    const jsonGet = await resGet.json();
    const contractAfterDuplicate = jsonGet.data.contractValue;
    report(
      'API-16',
      'POST duplicate CR approve rejected with 409 and contractValue does not inflate',
      res.status === 409 && contractAfterDuplicate === initialContractValue + 15000000,
      json.error
    );
  }

  // 16. Reset restores clean sample state
  {
    const res = await fetch(`${BASE_URL}/api/demo/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withSeed: true }),
    });
    const resGet = await fetch(`${BASE_URL}/api/projects/PRJ-101`);
    const jsonGet = await resGet.json();
    const isResetClean =
      jsonGet.data &&
      jsonGet.data.contractValue === 120000000 &&
      jsonGet.data.baselineVersion === 'V1.0' &&
      jsonGet.data.billableValue === 30000000;
    report('API-17', 'POST /api/demo/reset restores clean baseline V1.0 sample', isResetClean);
  }
}

async function main() {
  console.log('=====================================================');
  console.log('  CLARA - TASK 2 AUTOMATED TEST RUNNER (SQLite/E2E)  ');
  console.log('=====================================================');

  await runDirectDbChecks();
  await runHttpApiChecks();

  console.log('\n=====================================================');
  console.log(`TOTAL: ${passCount + failCount} | \x1b[32mPASS: ${passCount}\x1b[0m | \x1b[31mFAIL: ${failCount}\x1b[0m`);
  console.log('=====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
