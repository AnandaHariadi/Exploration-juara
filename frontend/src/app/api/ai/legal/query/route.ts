export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { assertId, badRequest, ok, readJson, route, str } from '@/lib/api';
import { aiAsk } from '@/lib/ai';
import { projectContext } from '@/lib/context';

/** Legal / contract Q&A (legacy CLARA RAG + reasoning), grounded in the project's confirmed baseline when given. */
export const POST = route('POST /api/ai/legal/query', async (req: NextRequest) => {
  const body = await readJson(req);
  const question = str(body, 'question', { required: true, max: 2000, label: 'Pertanyaan' });
  if (question.length < 3) throw badRequest('Pertanyaan minimal 3 karakter.');
  const projectId = str(body, 'projectId');
  const project = projectId && projectId !== '__none' ? claraDb.requireProject(assertId(projectId, 'ID proyek')) : undefined;
  const history = Array.isArray(body.history)
    ? body.history
        .filter((h): h is { role: 'user' | 'assistant'; content: string } => !!h && typeof h === 'object' && ((h as { role?: string }).role === 'user' || (h as { role?: string }).role === 'assistant') && typeof (h as { content?: unknown }).content === 'string')
        .slice(-6)
        .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }))
    : [];
  const answer = await aiAsk(question, project ? projectContext(project) : undefined, history);
  return ok({ ...answer, projectId: project?.id ?? null });
});
