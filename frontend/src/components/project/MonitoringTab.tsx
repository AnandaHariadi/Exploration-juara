'use client';

import React from 'react';
import type { Project } from '@/types';
import { dataClient } from '@/services/dataClient';
import { formatDate, formatRupiah } from '@/lib/utils';
import { baselineAvailability } from '@/lib/baseline';
import { btn, inputClass, labelClass, Panel } from '@/components/shared/ui';
import { BillingBadge, ScopeBadge } from '@/components/shared/Badge';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

export function MonitoringTab({ project, run, onProposeChange }: { project: Project; run: Run; onProposeChange: (scopeTitle: string) => void }) {
  const m = project.metrics;
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const available = active ? baselineAvailability(active) : null;
  const canRequestChange = Boolean(available?.contractValue && available.deadline && available.revisionLimit);
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
      <Panel title="Yang dipantau di proyek ini" description="Catat kejadian saat pekerjaan berlangsung. Sistem membandingkannya dengan acuan proyek dan memperbarui peringatan atau hak tagih yang terkait.">
        <div className="overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Catatan</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Kondisi sekarang</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Gunanya</th></tr></thead><tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr>td]:border-zinc-200">
          <tr><td className="border-r px-4 py-3 font-semibold">Progres pekerjaan</td><td className="border-r px-4 py-3">{m.progress}%</td><td className="px-4 py-3">Melihat kemajuan pekerjaan; tidak otomatis membuat tagihan.</td></tr>
          <tr><td className="border-r px-4 py-3 font-semibold">Tahap selesai</td><td className="border-r px-4 py-3">{available?.billing ? `${project.agreementBaseline.milestones.length - pending.length} dari ${project.agreementBaseline.milestones.length} tahap` : 'Syarat tagih belum ada'}</td><td className="px-4 py-3">{available?.billing ? 'Jika syarat tahap terpenuhi, nilainya masuk hak tagih.' : 'Tambahkan nilai dan syarat pembayaran ke acuan.'}</td></tr>
          <tr><td className="border-r px-4 py-3 font-semibold">Revisi</td><td className="border-r px-4 py-3">{available?.revisionLimit ? `${m.actualRevisions} dari ${m.includedRevisions} revisi` : `${m.actualRevisions} tercatat; batas belum ada`}</td><td className="px-4 py-3">{available?.revisionLimit ? 'Kelebihan revisi ditandai untuk ditinjau.' : 'Belum dapat dibandingkan dengan kesepakatan.'}</td></tr>
          <tr><td className="border-r px-4 py-3 font-semibold">Perkiraan selesai</td><td className="border-r px-4 py-3">{m.projectedFinish ? formatDate(m.projectedFinish) : 'Belum dicatat'}</td><td className="px-4 py-3">{m.deadline ? `Dibandingkan dengan tenggat ${formatDate(m.deadline)}.` : 'Tenggat belum dicatat di acuan.'}</td></tr>
          <tr><td className="border-r px-4 py-3 font-semibold">Pekerjaan tambahan</td><td className="border-r px-4 py-3">{available?.scope ? `${project.agreementBaseline.scopeItems.filter((s) => s.status === 'NEEDS_REVIEW').length} perlu ditinjau` : 'Ruang lingkup belum ada'}</td><td className="px-4 py-3">{available?.scope ? 'Tentukan apakah termasuk kesepakatan atau perlu perubahan.' : 'Belum dapat dibandingkan dengan kesepakatan.'}</td></tr>
        </tbody></table></div>
      </Panel>

      <div className="space-y-5">
        <Panel title="Perbarui progres" description="Isi perkiraan kemajuan pekerjaan keseluruhan. Tagihan baru dapat dicatat setelah tahap terkait selesai.">
          <form onSubmit={(e) => { e.preventDefault(); void submit('progress', () => dataClient.addEvent(project.id, { type: 'PROGRESS_UPDATED', progress: Number(progress), projectedFinishDate: projected || undefined }), `Progres diperbarui ke ${progress}%.`, () => setProjected('')); }} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div><label htmlFor="mon-progress" className={labelClass}>Progres (%)</label><input id="mon-progress" type="number" min="0" max="100" required value={progress} onChange={(e) => setProgress(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="mon-projected" className={labelClass}>Perkiraan selesai (opsional)</label><input id="mon-projected" type="date" value={projected} onChange={(e) => setProjected(e.target.value)} className={inputClass} /></div>
            <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === 'progress' ? 'Menyimpan…' : 'Simpan'}</button>
          </form>
        </Panel>

        {available?.billing && <Panel title="Tahap pekerjaan selesai" description="Pilih tahap hanya setelah syaratnya benar-benar terpenuhi. Nilainya akan masuk hak tagih proyek.">
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
        </Panel>}

        <Panel title="Catat revisi" description={available?.revisionLimit ? `Acuan ${m.baselineVersion} mencakup ${m.includedRevisions} revisi.` : 'Revisi dapat dicatat, tetapi batas kesepakatan belum tersedia untuk dibandingkan.'}>
          <form onSubmit={(e) => { e.preventDefault(); void submit('revision', () => dataClient.addEvent(project.id, { type: 'REVISION_LOGGED', revisionCount: Number(revisionCount), title: revisionTitle || undefined }), `${revisionCount} revisi dicatat.`, () => { setRevisionCount('1'); setRevisionTitle(''); }); }} className="grid gap-3 sm:grid-cols-[0.6fr_1.4fr_auto] sm:items-end">
            <div><label htmlFor="mon-rev-count" className={labelClass}>Jumlah</label><input id="mon-rev-count" type="number" min="1" max="50" required value={revisionCount} onChange={(e) => setRevisionCount(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="mon-rev-title" className={labelClass}>Keterangan</label><input id="mon-rev-title" value={revisionTitle} onChange={(e) => setRevisionTitle(e.target.value)} placeholder="Contoh: Revisi tata letak dashboard" className={inputClass} /></div>
            <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === 'revision' ? 'Menyimpan…' : 'Catat'}</button>
          </form>
        </Panel>

        {available?.scope && <Panel title="Catat pekerjaan tambahan" description="Pekerjaan yang belum ada dalam acuan masuk daftar tinjauan. Setelah diperiksa, nyatakan termasuk kesepakatan atau ajukan perubahan.">
          <form onSubmit={(e) => { e.preventDefault(); void submit('scope', () => dataClient.addEvent(project.id, { type: 'SCOPE_ADDED', title: scopeTitle, description: scopeDesc || undefined }), 'Pekerjaan dicatat untuk ditinjau.', () => { setScopeTitle(''); setScopeDesc(''); }); }} className="space-y-3">
            <div><label htmlFor="mon-scope-title" className={labelClass}>Nama pekerjaan</label><input id="mon-scope-title" required value={scopeTitle} onChange={(e) => setScopeTitle(e.target.value)} placeholder="Contoh: Integrasi notifikasi WhatsApp" className={inputClass} /></div>
            <div><label htmlFor="mon-scope-desc" className={labelClass}>Keterangan (opsional)</label><input id="mon-scope-desc" value={scopeDesc} onChange={(e) => setScopeDesc(e.target.value)} className={inputClass} /></div>
            <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === 'scope' ? 'Menyimpan…' : 'Catat pekerjaan'}</button>
          </form>
        </Panel>}
      </div>

      {available?.billing && <Panel title="Tahap pembayaran">
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Tahap</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Syarat tagih</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Nilai</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Pekerjaan</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Tagihan</th></tr></thead>
            <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr>td]:border-zinc-200">
              {project.agreementBaseline.milestones.map((x) => (
                <tr key={x.id}>
                  <td className="border-r px-4 py-3 font-semibold text-zinc-900">{x.title}</td>
                  <td className="border-r px-4 py-3 text-zinc-600">{x.trigger}</td>
                  <td className="border-r px-4 py-3 text-right tabular-nums">{formatRupiah(x.value)}</td>
                  <td className="border-r px-4 py-3">{x.status === 'COMPLETED' ? <span className="font-semibold text-emerald-700">Selesai {x.completionDate ? formatDate(x.completionDate) : ''}</span> : <span className="text-zinc-500">Belum selesai</span>}</td>
                  <td className="px-4 py-3"><BillingBadge status={x.billingStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>}

      {available?.scope && <Panel title="Ruang lingkup pekerjaan" description="Pekerjaan yang perlu ditinjau dapat dinyatakan termasuk kesepakatan atau diajukan sebagai perubahan.">
        <div className="overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Pekerjaan</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Status</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Tindakan</th></tr></thead><tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr>td]:border-zinc-200">{project.agreementBaseline.scopeItems.map((s) => <tr key={s.id}><td className="border-r px-4 py-3"><strong className="text-zinc-900">{s.title}</strong><span className="mt-1 block text-sm text-zinc-600">{s.deviationNotes ?? s.description}</span></td><td className="border-r px-4 py-3"><ScopeBadge status={s.status} /></td><td className="px-4 py-3">{s.status === 'NEEDS_REVIEW' ? <div className="flex flex-wrap gap-2"><button type="button" disabled={busy !== null} onClick={() => { if (window.confirm(`Nyatakan "${s.title}" termasuk ruang lingkup kontrak?`)) void submit(`scope-${s.id}`, () => dataClient.reviewScope(project.id, s.id), `"${s.title}" dinyatakan termasuk kontrak.`); }} className={btn.secondary}>Termasuk kontrak</button>{canRequestChange ? <button type="button" onClick={() => onProposeChange(s.title)} className={btn.primary}>Ajukan perubahan</button> : <span className="self-center text-xs text-amber-800">Lengkapi nilai, tenggat, dan batas revisi untuk mengajukan perubahan.</span>}</div> : 'Tidak perlu tindakan'}</td></tr>)}</tbody></table></div>
      </Panel>}
    </div>
  );
}
