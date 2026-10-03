'use client';

import React from 'react';
import { Bot, Check } from 'lucide-react';
import type { ChangeRequest, Project, UserPersonaId } from '@/types';
import { dataClient } from '@/services/dataClient';
import { useActivePersona } from '@/hooks/useClaraData';
import { formatDate, formatRupiah } from '@/lib/utils';
import { btn, EmptyState, inputClass, labelClass, Panel } from '@/components/shared/ui';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

export const crStatus: Record<ChangeRequest['status'], { label: string; className: string }> = {
  DRAFT: { label: 'Draf — menunggu pengajuan PIC', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  PENDING: { label: 'Menunggu tinjauan keuangan', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  FINANCE_REVIEWED: { label: 'Menunggu keputusan pimpinan', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  INTERNAL_APPROVED: { label: 'Disetujui internal · perlu persetujuan klien', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  APPROVED: { label: 'Resmi · acuan diperbarui', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Ditolak internal', className: 'bg-red-50 text-red-700 border-red-200' },
  CLIENT_REJECTED: { label: 'Ditolak klien', className: 'bg-red-50 text-red-700 border-red-200' },
};

const STEPS: { key: string; label: string; done: (cr: ChangeRequest) => boolean }[] = [
  { key: 'pic', label: 'PIC mengajukan', done: (cr) => cr.status !== 'DRAFT' },
  { key: 'finance', label: 'Keuangan meninjau', done: (cr) => Boolean(cr.financeReview) },
  { key: 'decision', label: 'Pimpinan memutuskan', done: (cr) => Boolean(cr.internalDecision?.approved) },
  { key: 'client', label: 'Bukti klien', done: (cr) => Boolean(cr.clientApproval?.approved) },
  { key: 'official', label: 'Acuan baru', done: (cr) => cr.status === 'APPROVED' },
];

const ROLE_HINT: Record<string, { roles: UserPersonaId[]; name: string }> = {
  pic: { roles: ['BUDI', 'ADMIN'], name: 'Budi (pengelola proyek)' },
  finance: { roles: ['SITI', 'ADMIN'], name: 'Siti (keuangan)' },
  decision: { roles: ['HENDRA', 'ADMIN'], name: 'Hendra (pimpinan)' },
};

function Stepper({ cr }: { cr: ChangeRequest }) {
  return (
    <ol aria-label="Alur persetujuan" className="mt-4 grid grid-cols-5 gap-1 text-[11px]">
      {STEPS.map((s) => {
        const done = s.done(cr);
        return (
          <li key={s.key} className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-center ${done ? 'bg-emerald-50 text-emerald-800' : 'bg-zinc-50 text-zinc-500'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? 'bg-emerald-600 text-white' : 'bg-zinc-200'}`}>{done ? <Check className="h-3 w-3" /> : null}</span>
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}

function RoleGate({ step, personaId, children }: { step: keyof typeof ROLE_HINT; personaId: UserPersonaId; children: React.ReactNode }) {
  const gate = ROLE_HINT[step];
  if (gate.roles.includes(personaId)) return <>{children}</>;
  return <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">Langkah berikutnya oleh <strong>{gate.name}</strong>. Ganti pengguna demo di kanan atas untuk melanjutkan.</p>;
}

export function ChangeRequestCard({ cr, project, run, showProject = false }: { cr: ChangeRequest; project: Project; run: Run; showProject?: boolean }) {
  const { personaId } = useActivePersona();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [rejecting, setRejecting] = React.useState(false);
  const [client, setClient] = React.useState({ reference: '', documentId: '' });
  const [form, setForm] = React.useState({ title: cr.title, reason: cr.reason, description: cr.description, scope: cr.additionalScope.join(', '), value: String(cr.additionalValue), revisions: String(cr.additionalRevisions), days: String(cr.deadlineExtensionDays) });
  const approvals = project.documents.filter((d) => d.kind === 'CLIENT_APPROVAL' && d.status !== 'REJECTED' && d.status !== 'PROCESSING');
  const draft = cr.draftId ? project.drafts.find((d) => d.id === cr.draftId) : undefined;

  const act = async (key: string, action: () => Promise<unknown>, text: string, after?: () => void) => {
    setBusy(key);
    const ok = await run(action, text);
    if (ok !== undefined) after?.();
    setBusy(null);
  };
  const editable = cr.status === 'DRAFT' || cr.status === 'REJECTED' || cr.status === 'CLIENT_REJECTED';
  const s = crStatus[cr.status];
  const base = project.metrics;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-red-700">
            {cr.crNumber}
            {showProject && <span className="ml-2 font-sans font-normal text-zinc-500">· {project.name}</span>}
            {cr.origin === 'AI_DRAFT' && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-sans text-[11px] font-semibold text-indigo-700"><Bot className="h-3 w-3" />Disiapkan CLARA</span>}
          </p>
          <h3 className="mt-1 text-base font-bold text-zinc-950">{cr.title}</h3>
          <p className="mt-1 text-xs text-zinc-500">Dibuat {formatDate(cr.createdAt)} · {cr.createdBy} · dari acuan {cr.baseVersion} · alasan: {cr.reason}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
      </div>

      <Stepper cr={cr} />

      {editing ? (
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); void act('edit', () => dataClient.updateChangeRequest(project.id, cr.id, { title: form.title, reason: form.reason, description: form.description, additionalScope: form.scope.split(',').map((x) => x.trim()).filter(Boolean), additionalValue: Number(form.value || 0), additionalRevisions: Number(form.revisions || 0), deadlineExtensionDays: Number(form.days || 0) }), 'Perubahan disimpan.', () => setEditing(false)); }}>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label htmlFor={`cr-t-${cr.id}`} className={labelClass}>Judul</label><input id={`cr-t-${cr.id}`} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
            <div><label htmlFor={`cr-r-${cr.id}`} className={labelClass}>Alasan</label><input id={`cr-r-${cr.id}`} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label htmlFor={`cr-s-${cr.id}`} className={labelClass}>Pekerjaan tambahan (pisahkan koma)</label><input id={`cr-s-${cr.id}`} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className={inputClass} /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><label htmlFor={`cr-v-${cr.id}`} className={labelClass}>Tambahan nilai (Rp)</label><input id={`cr-v-${cr.id}`} type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputClass} /></div>
            <div><label htmlFor={`cr-rv-${cr.id}`} className={labelClass}>Tambahan revisi</label><input id={`cr-rv-${cr.id}`} type="number" min="0" value={form.revisions} onChange={(e) => setForm({ ...form, revisions: e.target.value })} className={inputClass} /></div>
            <div><label htmlFor={`cr-d-${cr.id}`} className={labelClass}>Perpanjangan (hari)</label><input id={`cr-d-${cr.id}`} type="number" min="0" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className={btn.ghost}>Batal</button><button type="submit" disabled={busy !== null} className={btn.primary}>{busy === 'edit' ? 'Menyimpan…' : 'Simpan perubahan'}</button></div>
        </form>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-3 text-sm md:grid-cols-4">
            <div><dt className="text-xs text-zinc-500">Tambahan nilai</dt><dd className="font-semibold">+{formatRupiah(cr.additionalValue)}</dd>{cr.status !== 'APPROVED' && cr.additionalValue > 0 && <dd className="text-[11px] text-zinc-500">→ nilai kontrak {formatRupiah(base.contractValue + cr.additionalValue)}</dd>}</div>
            <div><dt className="text-xs text-zinc-500">Tambahan revisi</dt><dd className="font-semibold">+{cr.additionalRevisions}</dd></div>
            <div><dt className="text-xs text-zinc-500">Perpanjangan</dt><dd className="font-semibold">+{cr.deadlineExtensionDays} hari</dd></div>
            <div><dt className="text-xs text-zinc-500">Pekerjaan</dt><dd className="font-semibold">{cr.additionalScope.length ? cr.additionalScope.join(', ') : '-'}</dd></div>
          </dl>
          {cr.calculation.length > 0 && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900">
              <p className="font-semibold">Perhitungan terverifikasi (mesin rekonsiliasi)</p>
              <ul className="mt-1 space-y-0.5">{cr.calculation.map((c) => <li key={c}>• {c}</li>)}</ul>
            </div>
          )}
          {cr.description && !cr.calculation.length && <p className="mt-3 text-sm text-zinc-600">{cr.description}</p>}
          {draft && <p className="mt-2 text-xs text-zinc-600">Draf dokumen terkait: <strong>{draft.title}</strong> ({draft.status === 'READY_FOR_REVIEW' ? 'siap ditinjau' : draft.status === 'NEEDS_FIX' ? 'perlu perbaikan' : draft.status.toLowerCase()}) — lihat tab Dokumen.</p>}
        </>
      )}

      {cr.financeReview && <p className="mt-3 text-xs text-zinc-600">Keuangan: ditinjau {formatDate(cr.financeReview.at)} oleh {cr.financeReview.by}{cr.financeReview.note ? ` — ${cr.financeReview.note}` : ''}</p>}
      {cr.internalDecision && <p className="mt-1 text-xs text-zinc-600">Pimpinan: {cr.internalDecision.approved ? 'menyetujui internal' : 'menolak'} {formatDate(cr.internalDecision.at)} oleh {cr.internalDecision.by}{cr.internalDecision.note ? ` — ${cr.internalDecision.note}` : ''}</p>}
      {cr.clientApproval && <p className="mt-1 text-xs text-zinc-600">Klien: {cr.clientApproval.approved ? 'menyetujui' : 'menolak'} · bukti: {cr.clientApproval.reference} · dicatat {cr.clientApproval.by}</p>}
      {cr.status === 'APPROVED' && <p className="mt-2 text-sm font-semibold text-emerald-800">Perubahan resmi → acuan {cr.resultingBaselineVersion}. Seluruh metrik dan temuan dihitung ulang.</p>}

      {!editing && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          {editable && (
            <RoleGate step="pic" personaId={personaId}>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setEditing(true)} className={btn.secondary}>Ubah</button>
                <button type="button" disabled={busy !== null} onClick={() => void act('submit', () => dataClient.submitChangeRequest(project.id, cr.id), `${cr.crNumber} diajukan ke keuangan.`)} className={btn.primary}>{busy === 'submit' ? 'Mengajukan…' : cr.status === 'DRAFT' ? 'Ajukan untuk persetujuan internal' : 'Ajukan ulang'}</button>
              </div>
            </RoleGate>
          )}
          {cr.status === 'PENDING' && (
            <RoleGate step="finance" personaId={personaId}>
              <div className="flex flex-wrap items-end justify-end gap-2">
                <div className="min-w-0 flex-1"><label htmlFor={`fn-${cr.id}`} className={labelClass}>Catatan keuangan (opsional)</label><input id={`fn-${cr.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Nilai sesuai tarif Pasal 5." className={inputClass} /></div>
                <button type="button" disabled={busy !== null} onClick={() => void act('finance', () => dataClient.financeReviewChangeRequest(project.id, cr.id, note || undefined), 'Dampak keuangan dikonfirmasi. Diteruskan ke pimpinan.', () => setNote(''))} className={btn.primary}>{busy === 'finance' ? 'Menyimpan…' : 'Konfirmasi dampak & teruskan'}</button>
              </div>
            </RoleGate>
          )}
          {cr.status === 'FINANCE_REVIEWED' && (
            <RoleGate step="decision" personaId={personaId}>
              <div className="space-y-2">
                <div><label htmlFor={`dn-${cr.id}`} className={labelClass}>{rejecting ? 'Alasan penolakan (wajib)' : 'Catatan keputusan (opsional)'}</label><input id={`dn-${cr.id}`} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} /></div>
                <div className="flex flex-wrap justify-end gap-2">
                  {rejecting ? (
                    <>
                      <button type="button" onClick={() => setRejecting(false)} className={btn.ghost}>Batal</button>
                      <button type="button" disabled={busy !== null || !note.trim()} onClick={() => void act('reject', () => dataClient.decideChangeRequest(project.id, cr.id, 'REJECT', note), `${cr.crNumber} ditolak. Acuan tidak berubah.`, () => { setNote(''); setRejecting(false); })} className={btn.secondary}>{busy === 'reject' ? 'Menyimpan…' : 'Konfirmasi tolak'}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setRejecting(true)} className={btn.secondary}>Tolak</button>
                      <button type="button" disabled={busy !== null} onClick={() => void act('approve', () => dataClient.decideChangeRequest(project.id, cr.id, 'APPROVE', note || undefined), `${cr.crNumber} disetujui internal. Catat bukti persetujuan klien untuk meresmikan.`, () => setNote(''))} className={btn.success}>{busy === 'approve' ? 'Menyimpan…' : 'Setujui internal'}</button>
                    </>
                  )}
                </div>
              </div>
            </RoleGate>
          )}
          {cr.status === 'INTERNAL_APPROVED' && (
            <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (!window.confirm(`Catat persetujuan klien untuk ${cr.crNumber}? Acuan baru akan dibuat; acuan lama diarsipkan tanpa diubah.`)) return; void act('client', () => dataClient.recordClientApproval(project.id, cr.id, { decision: 'APPROVED', reference: client.reference || undefined, documentId: client.documentId || undefined }), `${cr.crNumber} resmi. Acuan proyek naik versi dan semua angka dihitung ulang.`); }}>
              <p className="text-sm font-semibold text-zinc-900">Bukti persetujuan klien</p>
              <p className="text-xs text-zinc-500">Persetujuan internal belum mengubah kontrak. Lampirkan dokumen persetujuan klien (unggah di tab Dokumen) atau tulis rujukannya.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor={`cd-${cr.id}`} className={labelClass}>Dokumen persetujuan</label>
                  <select id={`cd-${cr.id}`} value={client.documentId} onChange={(e) => setClient({ ...client, documentId: e.target.value })} className={inputClass}>
                    <option value="">{approvals.length ? 'Pilih dokumen…' : 'Belum ada dokumen persetujuan'}</option>
                    {approvals.map((d) => <option key={d.id} value={d.id}>{d.fileName}{d.analysis?.approval?.approved ? ' · terdeteksi menyetujui' : ''}</option>)}
                  </select>
                </div>
                <div><label htmlFor={`cref-${cr.id}`} className={labelClass}>Rujukan (no. surat / email)</label><input id={`cref-${cr.id}`} value={client.reference} onChange={(e) => setClient({ ...client, reference: e.target.value })} placeholder="Contoh: Surat 045/ASL-PROC/X/2026" className={inputClass} /></div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" disabled={busy !== null || (!client.documentId && client.reference.trim().length < 5)} onClick={() => void act('client-reject', () => dataClient.recordClientApproval(project.id, cr.id, { decision: 'REJECTED', reference: client.reference || undefined, documentId: client.documentId || undefined }), `Penolakan klien dicatat. Acuan tidak berubah.`)} className={btn.secondary}>Klien menolak</button>
                <button type="submit" disabled={busy !== null || (!client.documentId && client.reference.trim().length < 5)} className={btn.success}>{busy === 'client' ? 'Menyimpan…' : 'Catat persetujuan klien & resmikan'}</button>
              </div>
            </form>
          )}
        </div>
      )}

      {cr.history.length > 0 && (
        <details className="mt-3 text-xs text-zinc-600">
          <summary className="cursor-pointer font-semibold">Riwayat ({cr.history.length})</summary>
          <ol className="mt-2 space-y-1">{cr.history.map((h, i) => <li key={i}>{formatDate(h.at)} · {h.by} · {h.action.replace(/_/g, ' ').toLowerCase()}{h.note ? ` — ${h.note}` : ''}</li>)}</ol>
        </details>
      )}
    </article>
  );
}

export function ChangeRequestsTab({ project, run, prefillScope, onPrefillUsed }: { project: Project; run: Run; prefillScope?: string; onPrefillUsed: () => void }) {
  const empty = { title: '', reason: '', description: '', scope: '', value: '', revisions: '', days: '' };
  const [form, setForm] = React.useState(empty);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<'draft' | 'submit' | 'ai' | null>(null);

  React.useEffect(() => {
    if (!prefillScope) return;
    setForm({ ...empty, title: `Pekerjaan tambahan: ${prefillScope}`, scope: prefillScope, reason: 'Pekerjaan di luar ruang lingkup acuan' });
    setOpen(true);
    onPrefillUsed();
  }, [prefillScope]); // eslint-disable-line react-hooks/exhaustive-deps

  const revisionAlert = project.alerts.find((a) => a.type === 'REVISION_LIMIT' && (a.status === 'NEW' || a.status === 'ACKNOWLEDGED'));
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
      submit ? 'Permintaan perubahan diajukan ke keuangan. Acuan belum berubah.' : 'Draf permintaan perubahan disimpan.',
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
        description="Alur: PIC mengajukan → keuangan meninjau dampak → pimpinan memutuskan → bukti persetujuan klien → acuan versi baru. Sebelum itu acuan aktif tidak berubah."
        action={!open && <button type="button" onClick={() => setOpen(true)} className={btn.secondary}>Buat manual</button>}
      >
        {revisionAlert && !open && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
            <Bot className="h-4 w-4" />
            <span className="flex-1">CLARA menemukan: {revisionAlert.title}. CLARA dapat menyiapkan permintaan perubahan dengan nilai sesuai tarif kontrak.</span>
            <button type="button" disabled={busy !== null} onClick={async () => { setBusy('ai'); await run(() => dataClient.draftChangeRequestFromAlert(project.id, revisionAlert.id), 'Draf permintaan perubahan disiapkan CLARA. Tinjau, ubah bila perlu, lalu ajukan.'); setBusy(null); }} className={btn.primary}>
              {busy === 'ai' ? 'Menyiapkan…' : 'Buat permintaan perubahan (AI)'}
            </button>
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
        <EmptyState title="Belum ada permintaan perubahan">CLARA akan menyarankan perubahan saat menemukan revisi, pekerjaan, atau tenggat di luar acuan.</EmptyState>
      ) : (
        project.changeRequests.map((cr) => <ChangeRequestCard key={cr.id} cr={cr} project={project} run={run} />)
      )}
    </div>
  );
}
