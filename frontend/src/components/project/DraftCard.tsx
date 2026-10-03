'use client';

import React from 'react';
import { Bot, CheckCircle2, Download, XCircle } from 'lucide-react';
import type { GeneratedDocument } from '@/types';
import { dataClient } from '@/services/dataClient';
import { formatDate } from '@/lib/utils';
import { btn, inputClass } from '@/components/shared/ui';
import { draftStatus, draftTypeLabel } from '@/components/shared/labels';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

/** Detect → Generate → Self-review → Human review → Approve → Ready to send → Export. */
export function DraftCard({ draft, run, projectName, defaultOpen = false }: { draft: GeneratedDocument; run: Run; projectName?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [editing, setEditing] = React.useState(false);
  const [content, setContent] = React.useState(draft.content);
  const [instruction, setInstruction] = React.useState('');
  const [busy, setBusy] = React.useState<string | null>(null);
  React.useEffect(() => setContent(draft.content), [draft.content]);

  const act = async (key: string, action: () => Promise<unknown>, text: string, after?: () => void) => {
    setBusy(key);
    const ok = await run(action, text);
    if (ok !== undefined) after?.();
    setBusy(null);
  };
  const s = draftStatus[draft.status];
  const locked = draft.status === 'EXPORTED' || draft.status === 'REJECTED';
  const passed = draft.validation.checks.filter((c) => c.ok).length;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-700">{draftTypeLabel[draft.type]}</span>
            {projectName && <span>· {projectName}</span>}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${draft.source === 'AI' ? 'bg-indigo-50 text-indigo-700' : 'bg-zinc-100 text-zinc-700'}`}>
              <Bot className="h-3 w-3" />{draft.source === 'AI' ? 'Dibuat AI' : 'Templat (AI tidak tersedia)'}
            </span>
          </p>
          <h3 className="mt-1 text-base font-bold text-zinc-950">{draft.title}</h3>
          <p className="text-xs text-zinc-500">{formatDate(draft.createdAt)} · {draft.engine}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
      </div>

      <div className="mt-3 rounded-xl bg-zinc-50 p-3">
        <p className="text-xs font-semibold text-zinc-700">Validasi draf · {passed}/{draft.validation.checks.length} lolos · {draft.status === 'NEEDS_FIX' ? 'PERLU PERBAIKAN' : 'SIAP DITINJAU MANUSIA'}</p>
        <ul className="mt-1.5 grid gap-1 text-xs sm:grid-cols-2">
          {draft.validation.checks.map((c) => (
            <li key={c.label} className={`flex items-start gap-1.5 ${c.ok ? 'text-emerald-800' : 'text-red-700'}`} title={c.detail}>
              {c.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              <span>{c.label}{!c.ok && c.detail ? ` — ${c.detail}` : ''}</span>
            </li>
          ))}
        </ul>
        {draft.validation.checks.find((c) => c.origin === 'AI')?.detail && <p className="mt-1.5 text-[11px] text-zinc-500">{draft.validation.checks.find((c) => c.origin === 'AI')!.detail}</p>}
      </div>

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-3 text-sm font-semibold text-red-700 hover:underline">{open ? 'Sembunyikan isi draf' : 'Tinjau isi draf'}</button>

      {open && (
        <div className="mt-3 space-y-3">
          {editing ? (
            <>
              <textarea id={`draft-${draft.id}`} aria-label="Isi draf" rows={16} value={content} onChange={(e) => setContent(e.target.value)} className={`${inputClass} font-mono text-xs`} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setEditing(false); setContent(draft.content); }} className={btn.ghost}>Batal</button>
                <button type="button" disabled={busy !== null} onClick={() => void act('save', () => dataClient.reviseDocument(draft.projectId, draft.id, { content }), 'Draf disimpan dan divalidasi ulang.', () => setEditing(false))} className={btn.primary}>{busy === 'save' ? 'Memvalidasi…' : 'Simpan & validasi ulang'}</button>
              </div>
            </>
          ) : (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white p-4 font-sans text-sm leading-relaxed text-zinc-800">{draft.content}</pre>
          )}
          {!locked && !editing && (
            <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); void act('revise', () => dataClient.reviseDocument(draft.projectId, draft.id, { instruction }), 'Draf direvisi AI dan divalidasi ulang.', () => setInstruction('')); }}>
              <div className="min-w-0 flex-1">
                <label htmlFor={`rev-${draft.id}`} className="text-xs font-semibold text-zinc-600">Minta AI merevisi</label>
                <input id={`rev-${draft.id}`} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Contoh: Tambahkan klausul pembayaran 14 hari" className={inputClass} />
              </div>
              <button type="submit" disabled={busy !== null || instruction.trim().length < 3} className={btn.secondary}>{busy === 'revise' ? 'Merevisi…' : 'Revisi (AI)'}</button>
              <button type="button" onClick={() => setEditing(true)} className={btn.ghost}>Edit manual</button>
            </form>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 pt-4">
        {(draft.status === 'READY_FOR_REVIEW' || draft.status === 'NEEDS_FIX') && (
          <>
            <button type="button" disabled={busy !== null} onClick={() => void act('reject', () => dataClient.rejectDraft(draft.projectId, draft.id), 'Draf ditolak dan disimpan di riwayat.')} className={btn.ghost}>Tolak</button>
            <button type="button" disabled={busy !== null || draft.status === 'NEEDS_FIX'} title={draft.status === 'NEEDS_FIX' ? 'Perbaiki draf hingga validasi lolos' : undefined} onClick={() => { if (window.confirm('Setujui draf ini? Status menjadi siap dikirim. CLARA tidak mengirim dokumen secara otomatis.')) void act('approve', () => dataClient.approveDraft(draft.projectId, draft.id), 'Draf disetujui — siap dikirim.'); }} className={btn.success}>
              {busy === 'approve' ? 'Menyimpan…' : 'Setujui draf'}
            </button>
          </>
        )}
        {(draft.status === 'APPROVED' || draft.status === 'EXPORTED') && (
          <button type="button" disabled={busy !== null} onClick={async () => { setBusy('export'); await run(() => dataClient.exportDraft(draft.projectId, draft.id), (name: string) => `Diekspor: ${name}. Kirim dokumen ini melalui saluran resmi Anda — CLARA tidak mengirimkannya.`); setBusy(null); }} className={btn.primary}>
            <Download className="h-4 w-4" />{busy === 'export' ? 'Mengekspor…' : 'Ekspor PDF untuk dikirim'}
          </button>
        )}
        {draft.status === 'REJECTED' && <span className="text-xs text-zinc-500">Draf ditolak.</span>}
      </div>
      {draft.status === 'APPROVED' && <p className="mt-2 text-right text-xs text-emerald-800">Disetujui {draft.approvedBy} · siap dikirim. Pengiriman eksternal dilakukan pengguna.</p>}
      {draft.history.length > 0 && (
        <details className="mt-2 text-xs text-zinc-600">
          <summary className="cursor-pointer font-semibold">Riwayat ({draft.history.length})</summary>
          <ol className="mt-1 space-y-0.5">{draft.history.map((h, i) => <li key={i}>{formatDate(h.at)} · {h.by} · {h.action}{h.note ? ` — ${h.note}` : ''}</li>)}</ol>
        </details>
      )}
    </article>
  );
}
