export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { ok, route } from '@/lib/api';
import { addDocument, randomId } from '@/lib/domain';
import { readSample, saveDocumentFile, SAMPLE_CONTRACT_FILE, SAMPLE_RAB_FILE } from '@/lib/files';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

/** Attach the labelled sample contract + RAB to a draft project. */
export const POST = route('POST /api/projects/[id]/documents/sample', async (_req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  const contract = readSample(SAMPLE_CONTRACT_FILE);
  const rab = readSample(SAMPLE_RAB_FILE);
  const mctx = makeCtx();
  const ids = { contract: randomId('DOC'), rab: randomId('DOC') };
  const { project } = claraDb.mutate(id, (p) => {
    addDocument(p, mctx, { kind: 'CONTRACT', fileName: SAMPLE_CONTRACT_FILE, mimeType: 'application/pdf', size: contract.length, isSample: true }, ids.contract);
    addDocument(p, mctx, { kind: 'RAB', fileName: SAMPLE_RAB_FILE, mimeType: 'text/csv', size: rab.length, isSample: true }, ids.rab);
  });
  saveDocumentFile(id, ids.contract, contract);
  saveDocumentFile(id, ids.rab, rab);
  return ok(project, 201);
});
