export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { ok, oneOf, readJson, route } from '@/lib/api';
import { runExtraction } from '@/lib/guardian';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

/** Baseline candidate: AI (re)analysis of the contract, SAMPLE (labelled sample data) or MANUAL. Never activates a baseline. */
export const POST = route('POST /api/projects/[id]/extract', async (req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  const body = await readJson(req);
  const mode = oneOf(body, 'mode', ['AI', 'SAMPLE', 'MANUAL'] as const, 'AI');
  return ok(await runExtraction(id, mode));
});
