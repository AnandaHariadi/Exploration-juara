import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'clara.db');

const supabaseUrl = process.env.SUPABASE_URL || 'https://igublmncvmpkrgnzxgtu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndWJsbW5jdm1wa3Jnbnp4Z3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTA0NzQ5MSwiZXhwIjoyMTA2NjIzNDkxfQ.RbiHVms7ieTnMDY965C9PlZdl-1U7-pEq_k_l7v7hM4';

const client = createClient(supabaseUrl, supabaseKey);
const db = new Database(dbPath);

async function main() {
  console.log('Connecting to Supabase:', supabaseUrl);

  // 1. Sync Demo Users
  const users = db.prepare('SELECT * FROM demo_users').all();
  const { error: uErr } = await client.from('demo_users').upsert(users, { onConflict: 'id' });
  if (uErr) {
    console.error('Failed to sync demo_users:', uErr.message);
    console.log('Make sure you have executed the schema in Supabase SQL Editor first!');
    return;
  }
  console.log(`✓ Synced ${users.length} demo users`);

  // 2. Sync Demo Session
  const session = db.prepare('SELECT * FROM demo_session WHERE id = 1').get();
  if (session) {
    await client.from('demo_session').upsert(session, { onConflict: 'id' });
    console.log('✓ Synced active demo session');
  }

  // 3. Sync Projects
  const projectRows = db.prepare('SELECT * FROM projects').all();
  for (const row of projectRows) {
    const project = JSON.parse(row.data_json);
    const { error: pErr } = await client.from('projects').upsert({
      id: row.id,
      name: row.name,
      client: row.client,
      status: row.status,
      contract_value: row.contract_value,
      planned_cost: row.planned_cost,
      actual_cost: row.actual_cost,
      billable_value: row.billable_value,
      billed_value: row.billed_value,
      paid_value: row.paid_value,
      progress: row.progress,
      baseline_version: row.baseline_version,
      start_date: row.start_date,
      end_date: row.end_date,
      revision_limit: row.revision_limit,
      active_revision_count: row.active_revision_count,
      data_json: project,
    }, { onConflict: 'id' });
    if (pErr) console.error(`Failed to sync project ${row.id}:`, pErr.message);
    else console.log(`✓ Synced project: ${row.name} (${row.id})`);
  }

  console.log('\nAll data synced successfully to Supabase cloud!');
}

main().catch(console.error);
