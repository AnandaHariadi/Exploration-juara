export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { ok, readJson, route, str } from '@/lib/api';
import { addDocument, newProject, randomId } from '@/lib/domain';
import { readSample, saveDocumentFile, SAMPLE_CONTRACT_FILE, SAMPLE_RAB_FILE } from '@/lib/files';
import { analyzeInBackground } from '@/lib/guardian';

export const GET = route('GET /api/projects', async () => {
  await claraDb.pullFromSupabase();
  return ok(claraDb.getProjects());
});

/** Create a DRAFT project. Baseline values never come from the client; they come from a confirmed candidate. */
export const POST = route('POST /api/projects', async (req: NextRequest) => {
  const body = await readJson(req);
  const name = str(body, 'name', { required: true, max: 160, label: 'Nama proyek' });
  const client = str(body, 'client', { required: true, max: 160, label: 'Nama klien' });
  const ctx = makeCtx();
  const project = newProject(randomId('PRJ'), name, client, ctx);
  if (body.useSample === true) {
    const contract = readSample(SAMPLE_CONTRACT_FILE);
    const rab = readSample(SAMPLE_RAB_FILE);
    const c = addDocument(project, ctx, { kind: 'CONTRACT', fileName: SAMPLE_CONTRACT_FILE, mimeType: 'application/pdf', size: contract.length, isSample: true });
    const r = addDocument(project, ctx, { kind: 'RAB', fileName: SAMPLE_RAB_FILE, mimeType: 'text/csv', size: rab.length, isSample: true });
    saveDocumentFile(project.id, c.id, contract);
    saveDocumentFile(project.id, r.id, rab);
  }
  const created = claraDb.createProject(project);
  console.log(`[PROJECT] created ${created.id} by ${ctx.actor.name}`);
  // Document Guardian: analysis starts automatically for attached documents.
  for (const doc of created.documents) analyzeInBackground(created.id, doc.id);
  return ok(created, 201, 'Proyek dibuat sebagai draf.');
});
