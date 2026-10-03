'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, FileText, X } from 'lucide-react';
import type { InsightStatus, SourceRef } from '@/types';
import { documentUrl } from '@/services/dataClient';

export const btn = {
  primary: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  secondary: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50',
  success: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  ghost: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50',
  dark: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
};

export const inputClass =
  'mt-1.5 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:bg-zinc-100';
export const labelClass = 'block text-sm font-semibold text-zinc-800';

/** Success/error feedback for mutations. Errors stay until dismissed; successes fade. */
export function useNotice() {
  const [notice, setNotice] = React.useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  React.useEffect(() => {
    if (notice?.kind !== 'success') return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const run = React.useCallback(async <T,>(action: () => Promise<T>, successText: string | ((result: T) => string)): Promise<T | undefined> => {
    try {
      const result = await action();
      setNotice({ kind: 'success', text: typeof successText === 'function' ? successText(result) : successText });
      return result;
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Tindakan gagal dilakukan.' });
      return undefined;
    }
  }, []);
  return { notice, setNotice, run, clear: () => setNotice(null) };
}

export function NoticeBar({ notice, onClose }: { notice: { kind: 'success' | 'error'; text: string } | null; onClose: () => void }) {
  if (!notice) return null;
  const error = notice.kind === 'error';
  return (
    <div role={error ? 'alert' : 'status'} className="fixed right-4 top-24 z-[70] w-[calc(100%-2rem)] max-w-md">
      <div className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg ${error ? 'border-red-300 bg-red-50 text-red-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}>
        {error ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />}
        <div className="flex-1 text-sm">
          <p className="font-semibold">{error ? 'Gagal' : 'Berhasil'}</p>
          <p className="mt-0.5">{notice.text}</p>
        </div>
        <button type="button" aria-label="Tutup pesan" onClick={onClose} className="rounded p-1 hover:bg-black/5">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Panel({ title, description, action, children, className = '' }: { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-heading text-base font-bold text-zinc-950">{title}</h2>}
            {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Metric({ label, value, detail, tone = 'default' }: { label: string; value: React.ReactNode; detail?: React.ReactNode; tone?: 'default' | 'warn' | 'good' | 'bad' }) {
  const tones = { default: 'border-zinc-200', warn: 'border-amber-300 bg-amber-50/40', good: 'border-emerald-200 bg-emerald-50/30', bad: 'border-red-300 bg-red-50/40' };
  return (
    <div className={`rounded-xl border bg-white p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1.5 font-heading text-xl font-bold text-zinc-950">{value}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{detail}</p>}
    </div>
  );
}

const insightStyles: Record<InsightStatus, { label: string; className: string }> = {
  MATCH: { label: 'Sesuai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  POSSIBLE_DEVIATION: { label: 'Indikasi selisih', className: 'bg-amber-50 text-amber-800 border-amber-300' },
  VERIFIED_DEVIATION: { label: 'Selisih terverifikasi', className: 'bg-red-50 text-red-700 border-red-200' },
  NEEDS_REVIEW: { label: 'Perlu tinjauan manusia', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export function InsightBadge({ status }: { status: InsightStatus }) {
  const s = insightStyles[status];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>;
}

export function SourceQuote({ projectId, source, label }: { projectId: string; source?: SourceRef; label?: string }) {
  if (!source) return <p className="mt-1 text-xs text-zinc-400">Sumber dokumen tidak tersedia — periksa manual.</p>;
  return (
    <div className="mt-1.5 rounded-lg border-l-2 border-orange-400 bg-orange-50/60 px-3 py-2 text-xs text-zinc-700">
      {label && <span className="mb-0.5 block font-semibold text-zinc-500">{label}</span>}
      <q className="italic">{source.snippet}</q>
      <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
        {source.verified ? (
          <span className="font-semibold text-emerald-700">Ditemukan di dokumen{source.page ? ` · hal. ${source.page}` : ''}</span>
        ) : (
          <span className="font-semibold text-amber-700">Kutipan belum cocok dengan teks dokumen — periksa manual</span>
        )}
        {source.documentId && (
          <a href={documentUrl(projectId, source.documentId, source.page)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline">
            <FileText className="h-3 w-3" />Buka sumber<ExternalLink className="h-3 w-3" />
          </a>
        )}
      </span>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      {children && <div className="mt-1 text-sm text-zinc-500">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function DemoBadge() {
  return <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800">Data demo</span>;
}
