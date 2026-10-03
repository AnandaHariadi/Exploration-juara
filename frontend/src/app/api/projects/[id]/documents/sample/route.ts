export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { badRequest, ok, readJson, route } from '@/lib/api';
import { addDocument, randomId } from '@/lib/domain';
import { readSample, saveDocumentFile, SAMPLE_FILES, type SampleKey } from '@/lib/files';
import { analyzeInBackground } from '@/lib/guardian';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';
import type { DocumentKind } from '@/types';

const KIND_OF: Record<SampleKey, DocumentKind> = { contract: 'CONTRACT', rab: 'RAB', 'invoice-uat': 'INVOICE', 'invoice-tambahan': 'INVOICE', 'persetujuan-klien': 'CLIENT_APPROVAL' };

/** Attach labelled sample documents (default: contract + RAB). Each one is analyzed automatically. */
export const POST = route('POST /api/projects/[id]/documents/sample', async (req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  const body = await readJson(req);
  const keys = (Array.isArray(body.samples) ? body.samples : ['contract', 'rab']) as SampleKey[];
  if (!keys.length || keys.some((k) => !(k in SAMPLE_FILES))) throw badRequest(`samples harus berisi: ${Object.keys(SAMPLE_FILES).join(', ')}.`);
  const mctx = makeCtx();
  const files = keys.map((k) => ({ key: k, id: randomId('DOC'), data: readSample(SAMPLE_FILES[k].name) }));
  for (const f of files) saveDocumentFile(id, f.id, f.data);
  const { project } = claraDb.mutate(id, (p) => {
    for (const f of files) addDocument(p, mctx, { kind: KIND_OF[f.key], fileName: SAMPLE_FILES[f.key].name, mimeType: SAMPLE_FILES[f.key].type, size: f.data.length, isSample: true }, f.id);
  });
  for (const f of files) analyzeInBackground(id, f.id);
  return ok(project, 201, 'Berkas contoh dilampirkan dan sedang dianalisis.');
});
