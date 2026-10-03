export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { assertId, badRequest, ok, readJson, route, str } from '@/lib/api';
import { aiAsk } from '@/lib/ai';
import { formatDay, idr } from '@/lib/engine';
import type { Project } from '@/types';

/** Plain-text summary of confirmed project data, sent as grounding context. */
function projectContext(p: Project): string {
  const a = p.agreementBaseline;
  if (!p.metrics.hasBaseline) return `Proyek ${p.name} (${p.client}) belum memiliki acuan yang disetujui.`;
  const contractDoc = p.documents.find((d) => d.kind === 'CONTRACT');
  return [
    `Proyek: ${p.name} · Klien: ${p.client} · Nomor kontrak: ${a.contractNumber || '-'} · Acuan aktif: ${p.baselineVersion}`,
    `Nilai kontrak: ${idr(a.contractValue)} · Mulai: ${formatDay(a.startDate)} · Tenggat: ${formatDay(a.deadline)} · Batas revisi: ${a.revisionLimit}`,
    `Ketentuan pembayaran: ${a.paymentTerms || '-'}`,
    `Termin: ${a.milestones.map((m) => `${m.title} ${m.percentage}% (${idr(m.value)}) syarat: ${m.trigger ?? '-'}; status ${m.status}`).join(' | ')}`,
    `Ruang lingkup: ${a.scopeItems.map((s) => `${s.title}${s.status !== 'MATCH' ? ` [${s.status}]` : ''}`).join('; ')}`,
    `Klausul lain: ${a.clausesSummary.map((c) => c.description).join(' ') || '-'}`,
    ...Object.entries(a.sources ?? {}).map(([field, s]) => `Kutipan ${field}${s.page ? ` (hal. ${s.page})` : ''}: "${s.snippet}"`),
    `Kondisi saat ini: progres ${p.metrics.progress}%, biaya aktual ${idr(p.metrics.actualCost)} dari RAB ${idr(p.metrics.plannedCost)}, revisi ${p.metrics.actualRevisions}/${p.metrics.includedRevisions}, belum ditagih ${idr(p.metrics.unbilledValue)}.`,
    contractDoc ? `Dokumen sumber: ${contractDoc.fileName}` : '',
  ].filter(Boolean).join('\n');
}

export const POST = route('POST /api/ai/query', async (req: NextRequest) => {
  const body = await readJson(req);
  const question = str(body, 'question', { required: true, max: 2000, label: 'Pertanyaan' });
  if (question.length < 3) throw badRequest('Pertanyaan minimal 3 karakter.');
  const projectId = str(body, 'projectId');
  const project = projectId ? claraDb.requireProject(assertId(projectId, 'ID proyek')) : undefined;
  const history = Array.isArray(body.history)
    ? body.history
        .filter((h): h is { role: 'user' | 'assistant'; content: string } => !!h && typeof h === 'object' && ((h as { role?: string }).role === 'user' || (h as { role?: string }).role === 'assistant') && typeof (h as { content?: unknown }).content === 'string')
        .slice(-6)
        .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }))
    : [];
  const answer = await aiAsk(question, project ? projectContext(project) : undefined, history);
  return ok({ ...answer, projectId: project?.id ?? null });
});
