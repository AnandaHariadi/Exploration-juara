'use client';

import React from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';
import type { DraftType } from '@/types';
import { dataClient } from '@/services/dataClient';
import { useAiHealth, useProjects } from '@/hooks/useClaraData';
import { btn, EmptyState, inputClass, labelClass, NoticeBar, Panel, useNotice } from '@/components/shared/ui';
import { draftTypeLabel } from '@/components/shared/labels';
import { DraftCard } from '@/components/project/DraftCard';

const TYPES: DraftType[] = ['ADDENDUM', 'CHANGE_REQUEST', 'CLAUSE_REVISION', 'MOU', 'LOI', 'PKS', 'ANOMALY_RESPONSE'];
const NEEDS_BASELINE: DraftType[] = ['ADDENDUM', 'CHANGE_REQUEST'];

/** Document Studio: AI drafting with project context, verified facts, self-review and human approval. */
export default function StudioPage() {
  const { projects, loading } = useProjects();
  const { health } = useAiHealth();
  const { notice, run, clear } = useNotice();
  const [projectId, setProjectId] = React.useState('');
  const [type, setType] = React.useState<DraftType>('ADDENDUM');
  const [title, setTitle] = React.useState('');
  const [instructions, setInstructions] = React.useState('');
  const [crId, setCrId] = React.useState('');
  const [clause, setClause] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [filter, setFilter] = React.useState('ALL');

  React.useEffect(() => {
    setProjectId((current) => (projects.some((p) => p.id === current) ? current : projects.find((p) => p.metrics.hasBaseline)?.id ?? projects[0]?.id ?? ''));
  }, [projects]);
  const project = projects.find((p) => p.id === projectId);
  const needsBaseline = NEEDS_BASELINE.includes(type) && !project?.metrics.hasBaseline;
  const crs = project?.changeRequests.filter((c) => c.status !== 'REJECTED' && c.status !== 'CLIENT_REJECTED') ?? [];
  const drafts = projects.flatMap((p) => p.drafts.map((d) => ({ p, d }))).filter(({ p }) => filter === 'ALL' || p.id === filter);

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    setBusy(true);
    const ok = await run(
      () => dataClient.generateDocument({ projectId: project.id, type, title: title || undefined, instructions: instructions || undefined, changeRequestId: crId || undefined, originalClause: type === 'CLAUSE_REVISION' && clause ? clause : undefined }),
      'Draf disiapkan dan divalidasi. Tinjau sebelum menyetujui.',
    );
    if (ok) {
      setTitle('');
      setInstructions('');
      setClause('');
      setFilter(project.id);
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <NoticeBar notice={notice} onClose={clear} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">CLARA Remediation Copilot</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Studio dokumen</h1>
        <p className="mt-2 text-sm text-zinc-600">Susun dokumen dari data proyek. Angka diambil dari acuan dan perhitungan terverifikasi. Draf adendum atau permintaan perubahan harus terhubung ke permintaan perubahan dan melewati tinjauan keuangan serta persetujuan pimpinan sebelum bisa dikirim.</p>
      </div>

      {health && !health.available && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{health.message} Draf akan dibuat dari templat CLARA dan diberi label “Templat”.</p>}

      <Panel title="Buat draf baru">
        <form onSubmit={generate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="studio-project" className={labelClass}>Proyek (konteks)</label>
              <select id="studio-project" value={projectId} onChange={(e) => { setProjectId(e.target.value); setCrId(''); }} className={inputClass}>
                {loading && <option value="">Memuat proyek…</option>}
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.metrics.hasBaseline ? ` · acuan ${p.metrics.baselineVersion}` : ' · belum ada acuan'}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="studio-type" className={labelClass}>Jenis dokumen</label>
              <select id="studio-type" value={type} onChange={(e) => { setType(e.target.value as DraftType); setCrId(''); }} className={inputClass}>
                {TYPES.map((t) => <option key={t} value={t}>{draftTypeLabel[t]}</option>)}
              </select>
            </div>
          </div>
          {(type === 'ADDENDUM' || type === 'CHANGE_REQUEST') && crs.length > 0 && (
            <div>
              <label htmlFor="studio-cr" className={labelClass}>Hubungkan ke permintaan perubahan</label>
              <select id="studio-cr" value={crId} onChange={(e) => setCrId(e.target.value)} className={inputClass}>
                <option value="">Tidak ada</option>
                {crs.map((c) => <option key={c.id} value={c.id}>{c.crNumber} · {c.title}</option>)}
              </select>
              <p className="mt-1 text-xs text-zinc-600">Tanpa tautan, draf dapat disusun tetapi belum bisa disetujui atau diekspor.</p>
            </div>
          )}
          {(type === 'ADDENDUM' || type === 'CHANGE_REQUEST') && project?.metrics.hasBaseline && crs.length === 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Belum ada permintaan perubahan untuk proyek ini. <Link href={`/projects/${project.id}?tab=change-requests`} className="font-semibold underline">Buat permintaan perubahan</Link> agar draf bisa masuk alur keuangan dan pimpinan.</p>
          )}
          {type === 'CLAUSE_REVISION' && (
            <div>
              <label htmlFor="studio-clause" className={labelClass}>Klausul asli</label>
              <textarea id="studio-clause" rows={3} value={clause} onChange={(e) => setClause(e.target.value)} placeholder="Contoh: Klien dapat meminta revisi sesuai kebutuhan." className={inputClass} />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div><label htmlFor="studio-title" className={labelClass}>Judul (opsional)</label><input id="studio-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="studio-instructions" className={labelClass}>Instruksi tambahan (opsional)</label><input id="studio-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Contoh: Gunakan bahasa formal, sertakan tempo bayar 14 hari" className={inputClass} /></div>
          </div>
          {needsBaseline && <p role="alert" className="text-sm text-amber-800">{draftTypeLabel[type]} memerlukan acuan proyek yang disetujui. Pilih proyek lain atau jenis dokumen lain.</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={busy || !project || needsBaseline || (type === 'CLAUSE_REVISION' && clause.trim().length < 10)} className={btn.primary}>
              <Bot className="h-4 w-4" />{busy ? 'Menyusun & memvalidasi…' : 'Buat draf'}
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Draf"
        action={
          <select aria-label="Filter proyek" value={filter} onChange={(e) => setFilter(e.target.value)} className="min-h-9 rounded-lg border border-zinc-300 bg-white px-2 text-sm">
            <option value="ALL">Semua proyek</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        }
      >
        {drafts.length === 0 ? <EmptyState title="Belum ada draf." /> : <div className="space-y-3">{drafts.map(({ p, d }) => <DraftCard key={d.id} draft={d} run={run} projectName={p.name} changeRequest={p.changeRequests.find((cr) => cr.id === d.relatedChangeRequestId)} />)}</div>}
      </Panel>
    </div>
  );
}
