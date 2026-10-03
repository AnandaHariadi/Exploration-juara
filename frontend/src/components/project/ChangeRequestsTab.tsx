'use client';

import React from 'react';
import type { ChangeRequest, Project } from '@/types';
import { dataClient } from '@/services/dataClient';
import { formatDate, formatRupiah } from '@/lib/utils';
import { btn, EmptyState, inputClass, labelClass, Panel } from '@/components/shared/ui';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

export const crStatus: Record<ChangeRequest['status'], { label: string; className: string }> = {
  DRAFT: { label: 'Draf', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  PENDING: { label: 'Menunggu persetujuan', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Disetujui', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Ditolak', className: 'bg-red-50 text-red-700 border-red-200' },
};

export function ChangeRequestCard({ cr, projectId, projectName, run }: { cr: ChangeRequest; projectId: string; projectName?: string; run: Run }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState(false);
  const [note, setNote] = React.useState('');
  const act = async (key: string, action: () => Promise<unknown>, text: string) => {
    setBusy(key);
    await run(action, text);
    setBusy(null);
  };
  const s = crStatus[cr.status];
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold text-red-700">{cr.crNumber}{projectName ? <span className="ml-2 font-sans font-normal text-zinc-500">· {projectName}</span> : null}</p>
          <h3 className="mt-1 text-base font-bold text-zinc-950">{cr.title}</h3>
          {cr.description && <p className="mt-1 text-sm text-zinc-600">{cr.description}</p>}
          <p className="mt-1 text-xs text-zinc-500">Diajukan {formatDate(cr.createdAt)} oleh {cr.createdBy} · dari acuan {cr.baseVersion} · alasan: {cr.reason}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-3 text-sm md:grid-cols-4">
        <div><dt className="text-xs text-zinc-500">Tambahan nilai</dt><dd className="font-semibold">+{formatRupiah(cr.additionalValue)}</dd></div>
        <div><dt className="text-xs text-zinc-500">Tambahan revisi</dt><dd className="font-semibold">+{cr.additionalRevisions}</dd></div>
        <div><dt className="text-xs text-zinc-500">Perpanjangan</dt><dd className="font-semibold">+{cr.deadlineExtensionDays} hari</dd></div>
        <div><dt className="text-xs text-zinc-500">Pekerjaan</dt><dd className="font-semibold">{cr.additionalScope.length ? cr.additionalScope.join(', ') : '-'}</dd></div>
      </dl>
      {cr.status === 'APPROVED' && <p className="mt-3 text-sm text-emerald-800">Disetujui {formatDate(cr.approvedAt ?? '')} oleh {cr.decidedBy} → acuan <strong>{cr.resultingBaselineVersion}</strong>.</p>}
      {cr.status === 'REJECTED' && <p className="mt-3 text-sm text-red-800">Ditolak {formatDate(cr.rejectedAt ?? '')} oleh {cr.decidedBy}{cr.decisionNote ? `: ${cr.decisionNote}` : ''}. Acuan tidak berubah.</p>}
      {cr.status === 'DRAFT' && (
        <div className="mt-4 flex justify-end">
          <button type="button" disabled={busy !== null} onClick={() => void act('submit', () => dataClient.submitChangeRequest(projectId, cr.id), `${cr.crNumber} diajukan untuk persetujuan.`)} className={btn.primary}>{busy === 'submit' ? 'Mengajukan…' : 'Ajukan untuk persetujuan'}</button>
        </div>
      )}
      {cr.status === 'PENDING' && (
        <div className="mt-4 space-y-3">
          {rejecting && (
            <div>
              <label htmlFor={`reject-${cr.id}`} className={labelClass}>Alasan penolakan (opsional)</label>
              <input id={`reject-${cr.id}`} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {rejecting ? (
              <>
                <button type="button" onClick={() => setRejecting(false)} className={btn.ghost}>Batal</button>
                <button type="button" disabled={busy !== null} onClick={() => void act('reject', () => dataClient.rejectChangeRequest(projectId, cr.id, note || undefined), `${cr.crNumber} ditolak. Acuan tidak berubah.`)} className={btn.secondary}>{busy === 'reject' ? 'Menyimpan…' : 'Konfirmasi tolak'}</button>
              </>
            ) : (
              <button type="button" disabled={busy !== null} onClick={() => setRejecting(true)} className={btn.secondary}>Tolak</button>
            )}
            {!rejecting && (
              <button type="button" disabled={busy !== null} onClick={() => { if (window.confirm(`Setujui ${cr.crNumber}? Acuan baru akan dibuat; versi lama diarsipkan tanpa diubah.`)) void act('approve', () => dataClient.approveChangeRequest(projectId, cr.id), `${cr.crNumber} disetujui. Acuan proyek naik versi dan dihitung ulang.`); }} className={btn.success}>
                {busy === 'approve' ? 'Menyetujui…' : 'Setujui perubahan'}
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export function ChangeRequestsTab({ project, run, prefillScope, onPrefillUsed }: { project: Project; run: Run; prefillScope?: string; onPrefillUsed: () => void }) {
  const empty = { title: '', reason: '', description: '', scope: '', value: '', revisions: '', days: '' };
  const [form, setForm] = React.useState(empty);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<'draft' | 'submit' | null>(null);

  React.useEffect(() => {
    if (!prefillScope) return;
    setForm({ ...empty, title: `Pekerjaan tambahan: ${prefillScope}`, scope: prefillScope, reason: 'Pekerjaan di luar ruang lingkup acuan' });
    setOpen(true);
    onPrefillUsed();
  }, [prefillScope]); // eslint-disable-line react-hooks/exhaustive-deps

  const revisionGap = project.metrics.revisionVariance;
  const save = async (submit: boolean) => {
    setBusy(submit ? 'submit' : 'draft');
    const ok = await run(
      () => dataClient.createChangeRequest(project.id, {
        title: form.title,
        reason: form.reason || undefined,
        description: form.description || undefined,
        additionalScope: form.scope.split(',').map((s) => s.trim()).filter(Boolean),
        additionalValue: Number(form.value || 0),
        additionalRevisions: Number(form.revisions || 0),
        deadlineExtensionDays: Number(form.days || 0),
        submit,
      }),
      submit ? 'Permintaan perubahan diajukan. Acuan belum berubah sampai disetujui.' : 'Draf permintaan perubahan disimpan.',
    );
    if (ok) {
      setForm(empty);
      setOpen(false);
    }
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Permintaan perubahan"
        description="Hanya permintaan yang DISETUJUI membuat versi acuan baru. Draf, menunggu, dan ditolak tidak mengubah apa pun."
        action={!open && <button type="button" onClick={() => setOpen(true)} className={btn.primary}>Ajukan perubahan</button>}
      >
        {revisionGap > 0 && !open && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <span className="flex-1">{revisionGap} revisi di luar acuan {project.baselineVersion}. Ajukan adendum revisi?</span>
            <button type="button" onClick={() => { setForm({ ...empty, title: `Tambahan ${revisionGap} revisi`, revisions: String(revisionGap), reason: 'Revisi melebihi batas acuan' }); setOpen(true); }} className={btn.secondary}>Isi otomatis</button>
          </div>
        )}
        {open && (
          <form onSubmit={(e) => { e.preventDefault(); void save(true); }} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><label htmlFor="cr-title" className={labelClass}>Judul perubahan</label><input id="cr-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
              <div><label htmlFor="cr-reason" className={labelClass}>Alasan</label><input id="cr-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Contoh: Permintaan klien" className={inputClass} /></div>
            </div>
            <div><label htmlFor="cr-desc" className={labelClass}>Keterangan</label><textarea id="cr-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} /></div>
            <div><label htmlFor="cr-scope" className={labelClass}>Pekerjaan tambahan (pisahkan dengan koma, opsional)</label><input id="cr-scope" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className={inputClass} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label htmlFor="cr-value" className={labelClass}>Tambahan nilai (Rp)</label><input id="cr-value" type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputClass} />{Number(form.value) > 0 && <p className="mt-1 text-xs text-zinc-500">{formatRupiah(Number(form.value))} → nilai kontrak {formatRupiah(project.metrics.contractValue + Number(form.value))}</p>}</div>
              <div><label htmlFor="cr-revisions" className={labelClass}>Tambahan revisi</label><input id="cr-revisions" type="number" min="0" value={form.revisions} onChange={(e) => setForm({ ...form, revisions: e.target.value })} className={inputClass} /></div>
              <div><label htmlFor="cr-days" className={labelClass}>Perpanjangan (hari)</label><input id="cr-days" type="number" min="0" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className={inputClass} /></div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => { setOpen(false); setForm(empty); }} className={btn.ghost}>Batal</button>
              <button type="button" disabled={busy !== null || !form.title.trim()} onClick={() => void save(false)} className={btn.secondary}>{busy === 'draft' ? 'Menyimpan…' : 'Simpan draf'}</button>
              <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === 'submit' ? 'Mengajukan…' : 'Ajukan'}</button>
            </div>
          </form>
        )}
      </Panel>
      {project.changeRequests.length === 0 ? (
        <EmptyState title="Belum ada permintaan perubahan">Ajukan perubahan untuk pekerjaan tambahan, revisi di luar batas, atau perpanjangan waktu.</EmptyState>
      ) : (
        project.changeRequests.map((cr) => <ChangeRequestCard key={cr.id} cr={cr} projectId={project.id} run={run} />)
      )}
    </div>
  );
}
