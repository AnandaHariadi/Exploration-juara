'use client';

import React from 'react';
import type { Project } from '@/types';
import { dataClient } from '@/services/dataClient';
import { formatDate, formatRupiah } from '@/lib/utils';
import { btn, inputClass, labelClass, Metric, Panel } from '@/components/shared/ui';
import { BillingBadge, ScopeBadge } from '@/components/shared/Badge';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

export function MonitoringTab({ project, run, onProposeChange }: { project: Project; run: Run; onProposeChange: (scopeTitle: string) => void }) {
  const m = project.metrics;
  const pending = project.agreementBaseline.milestones.filter((x) => x.status !== 'COMPLETED');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(String(m.progress));
  const [projected, setProjected] = React.useState('');
  const [milestoneId, setMilestoneId] = React.useState('');
  const [revisionCount, setRevisionCount] = React.useState('1');
  const [revisionTitle, setRevisionTitle] = React.useState('');
  const [scopeTitle, setScopeTitle] = React.useState('');
  const [scopeDesc, setScopeDesc] = React.useState('');

  const submit = async (key: string, action: () => Promise<unknown>, text: string, reset?: () => void) => {
    setBusy(key);
    const ok = await run(action, text);
    if (ok !== undefined) reset?.();
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Progres" value={`${m.progress}%`} detail={m.projectedFinish ? `Perkiraan selesai ${formatDate(m.projectedFinish)}` : 'Perkiraan selesai belum dicatat'} />
        <Metric label="Revisi" value={`${m.actualRevisions} / ${m.includedRevisions}`} detail={m.revisionVariance > 0 ? `+${m.revisionVariance} di luar acuan ${m.baselineVersion}` : 'Dalam batas acuan'} tone={m.revisionVariance > 0 ? 'bad' : 'default'} />
        <Metric label="Tenggat" value={formatDate(m.deadline ?? '')} detail={m.deadlineVarianceDays === null ? 'Belum ada perkiraan' : m.deadlineVarianceDays > 0 ? `+${m.deadlineVarianceDays} hari dari tenggat` : 'Masih dalam tenggat'} tone={m.deadlineVarianceDays && m.deadlineVarianceDays > 0 ? 'warn' : 'default'} />
        <Metric label="Ruang lingkup" value={`${project.agreementBaseline.scopeItems.filter((s) => s.status === 'NEEDS_REVIEW').length} perlu ditinjau`} detail={`${project.agreementBaseline.scopeItems.length} pekerjaan tercatat`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Perbarui progres" description="Progres pekerjaan tidak sama dengan persentase termin.">
          <form onSubmit={(e) => { e.preventDefault(); void submit('progress', () => dataClient.addEvent(project.id, { type: 'PROGRESS_UPDATED', progress: Number(progress), projectedFinishDate: projected || undefined }), `Progres diperbarui ke ${progress}%.`, () => setProjected('')); }} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div><label htmlFor="mon-progress" className={labelClass}>Progres (%)</label><input id="mon-progress" type="number" min="0" max="100" required value={progress} onChange={(e) => setProgress(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="mon-projected" className={labelClass}>Perkiraan selesai (opsional)</label><input id="mon-projected" type="date" value={projected} onChange={(e) => setProjected(e.target.value)} className={inputClass} /></div>
            <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === 'progress' ? 'Menyimpan…' : 'Simpan'}</button>
          </form>
        </Panel>

        <Panel title="Tahap pekerjaan selesai" description="Menandai syarat tagih terpenuhi. Nilai siap ditagih dihitung dari acuan aktif.">
          {pending.length === 0 ? (
            <p className="text-sm text-zinc-500">Semua tahap sudah selesai.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); const target = pending.find((x) => x.id === milestoneId); if (!target || !window.confirm(`Tandai "${target.title}" selesai? Syarat tagih: ${target.trigger ?? target.title}.`)) return; void submit('milestone', () => dataClient.addEvent(project.id, { type: 'MILESTONE_COMPLETED', milestoneId }), `${target.title} ditandai selesai.`, () => setMilestoneId('')); }} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="mon-milestone" className={labelClass}>Tahap</label>
                <select id="mon-milestone" required value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} className={inputClass}>
                  <option value="">Pilih tahap…</option>
                  {pending.map((x) => <option key={x.id} value={x.id}>{x.title} — {x.percentage}% ({formatRupiah(x.value)})</option>)}
                </select>
              </div>
              <button type="submit" disabled={busy !== null || !milestoneId} className={btn.primary}>{busy === 'milestone' ? 'Menyimpan…' : 'Tandai selesai'}</button>
            </form>
          )}
        </Panel>

        <Panel title="Catat revisi" description={`Acuan ${m.baselineVersion} mencakup ${m.includedRevisions} revisi.`}>
          <form onSubmit={(e) => { e.preventDefault(); void submit('revision', () => dataClient.addEvent(project.id, { type: 'REVISION_LOGGED', revisionCount: Number(revisionCount), title: revisionTitle || undefined }), `${revisionCount} revisi dicatat.`, () => { setRevisionCount('1'); setRevisionTitle(''); }); }} className="grid gap-3 sm:grid-cols-[0.6fr_1.4fr_auto] sm:items-end">
            <div><label htmlFor="mon-rev-count" className={labelClass}>Jumlah</label><input id="mon-rev-count" type="number" min="1" max="50" required value={revisionCount} onChange={(e) => setRevisionCount(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="mon-rev-title" className={labelClass}>Keterangan</label><input id="mon-rev-title" value={revisionTitle} onChange={(e) => setRevisionTitle(e.target.value)} placeholder="Contoh: Revisi tata letak dashboard" className={inputClass} /></div>
            <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === 'revision' ? 'Menyimpan…' : 'Catat'}</button>
          </form>
        </Panel>

        <Panel title="Pekerjaan baru di luar daftar" description="Dicatat sebagai kemungkinan selisih ruang lingkup — perlu tinjauan, bukan pelanggaran.">
          <form onSubmit={(e) => { e.preventDefault(); void submit('scope', () => dataClient.addEvent(project.id, { type: 'SCOPE_ADDED', title: scopeTitle, description: scopeDesc || undefined }), 'Pekerjaan dicatat untuk ditinjau.', () => { setScopeTitle(''); setScopeDesc(''); }); }} className="space-y-3">
            <div><label htmlFor="mon-scope-title" className={labelClass}>Nama pekerjaan</label><input id="mon-scope-title" required value={scopeTitle} onChange={(e) => setScopeTitle(e.target.value)} placeholder="Contoh: Integrasi notifikasi WhatsApp" className={inputClass} /></div>
            <div><label htmlFor="mon-scope-desc" className={labelClass}>Keterangan (opsional)</label><input id="mon-scope-desc" value={scopeDesc} onChange={(e) => setScopeDesc(e.target.value)} className={inputClass} /></div>
            <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === 'scope' ? 'Menyimpan…' : 'Catat pekerjaan'}</button>
          </form>
        </Panel>
      </div>

      <Panel title="Tahap pembayaran">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500"><th className="py-2 pr-3">Tahap</th><th className="py-2 pr-3">Syarat tagih</th><th className="py-2 pr-3">Nilai</th><th className="py-2 pr-3">Status</th><th className="py-2">Tagihan</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {project.agreementBaseline.milestones.map((x) => (
                <tr key={x.id}>
                  <td className="py-2.5 pr-3 font-semibold text-zinc-900">{x.title}</td>
                  <td className="py-2.5 pr-3 text-zinc-600">{x.trigger}</td>
                  <td className="py-2.5 pr-3">{formatRupiah(x.value)}</td>
                  <td className="py-2.5 pr-3">{x.status === 'COMPLETED' ? <span className="font-semibold text-emerald-700">Selesai {x.completionDate ? formatDate(x.completionDate) : ''}</span> : <span className="text-zinc-500">Belum selesai</span>}</td>
                  <td className="py-2.5"><BillingBadge status={x.billingStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Ruang lingkup pekerjaan" description="Pekerjaan yang perlu ditinjau dapat dinyatakan termasuk kontrak atau diajukan sebagai perubahan.">
        <ul className="space-y-2">
          {project.agreementBaseline.scopeItems.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900">{s.title}</p>
                <p className="text-xs text-zinc-500">{s.deviationNotes ?? s.description}</p>
              </div>
              <ScopeBadge status={s.status} />
              {s.status === 'NEEDS_REVIEW' && (
                <div className="flex gap-2">
                  <button type="button" disabled={busy !== null} onClick={() => { if (window.confirm(`Nyatakan "${s.title}" termasuk ruang lingkup kontrak?`)) void submit(`scope-${s.id}`, () => dataClient.reviewScope(project.id, s.id), `"${s.title}" dinyatakan termasuk kontrak.`); }} className={btn.secondary}>Termasuk kontrak</button>
                  <button type="button" onClick={() => onProposeChange(s.title)} className={btn.primary}>Ajukan perubahan</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
