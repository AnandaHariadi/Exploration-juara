'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, CheckCircle2, ExternalLink, FileText, Flag, GitPullRequest, Receipt, ShieldAlert, Wallet, X } from 'lucide-react';
import type { Alert, EvidenceItem } from '@/types';
import { SeverityBadge } from '@/components/shared/Badge';
import { InsightBadge, btn, inputClass } from '@/components/shared/ui';
import { formatDate, formatRupiah, isOpenAlert } from '@/lib/utils';
import { dataClient, documentUrl } from '@/services/dataClient';

interface EvidenceDrawerProps {
  alert: Alert | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

const kindIcon: Record<EvidenceItem['kind'], React.ElementType> = {
  CONTRACT: FileText,
  BASELINE: Flag,
  EVENT: CheckCircle2,
  INVOICE: Receipt,
  COST: Wallet,
  MILESTONE: Flag,
  CHANGE_REQUEST: GitPullRequest,
  CALCULATION: Calculator,
};

const kindLabel: Record<EvidenceItem['kind'], string> = {
  CONTRACT: 'Kontrak',
  BASELINE: 'Acuan proyek',
  EVENT: 'Kegiatan proyek',
  INVOICE: 'Tagihan',
  COST: 'Biaya',
  MILESTONE: 'Tahap',
  CHANGE_REQUEST: 'Perubahan',
  CALCULATION: 'Perhitungan',
};

export function impactText(alert: Alert) {
  if (alert.impactKind === 'UNPRICED' || alert.impactKind === 'SCHEDULE' || alert.impactKind === 'NONE' || alert.rupiahImpact === 0) return alert.impactLabel;
  return formatRupiah(alert.rupiahImpact);
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ alert, onClose, onActionComplete }) => {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resolving, setResolving] = React.useState(false);
  const [note, setNote] = React.useState('');
  const closeButton = React.useRef<HTMLButtonElement>(null);
  const dialog = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useEffect(() => {
    setError(null);
    setResolving(false);
    setNote('');
    setBusy(false);
  }, [alert?.id]);

  React.useEffect(() => {
    if (!alert) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab' || !dialog.current) return;
      const controls = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], textarea')];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
        event.preventDefault();
        controls[0].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [alert?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!alert) return null;

  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onActionComplete?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui peringatan.');
      setBusy(false);
    }
  };

  const statusLabel = alert.status === 'NEW' ? 'Baru' : alert.status === 'ACKNOWLEDGED' ? 'Sudah dibaca · belum selesai' : 'Selesai';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 bg-zinc-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-xl bg-red-100 p-2.5 text-red-600"><ShieldAlert className="h-5 w-5" /></div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <InsightBadge status={alert.classification} />
                <SeverityBadge severity={alert.severity} />
                <span className="text-xs text-zinc-500">{statusLabel}</span>
              </div>
              <h3 id="evidence-title" className="text-lg font-bold leading-snug text-zinc-950">{alert.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{alert.projectName} · acuan {alert.baselineVersion}</p>
            </div>
          </div>
          <button ref={closeButton} type="button" aria-label="Tutup rincian peringatan" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Nilai terkait</p>
              <p className="mt-1 text-2xl font-black text-red-900">{impactText(alert)}</p>
              <p className="mt-1 text-xs text-red-800">{alert.impactLabel}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Dicatat</p>
              <p className="mt-1">{formatDate(alert.createdAt)}</p>
              {alert.updatedAt !== alert.createdAt && <p className="mt-1 text-xs text-zinc-500">Diperbarui {formatDate(alert.updatedAt)}</p>}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Apa yang terjadi</h4>
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800">{alert.description}</p>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Mengapa CLARA menyatakan ini · bukti</h4>
            <ol className="space-y-3">
              {alert.evidence.map((item, index) => {
                const Icon = kindIcon[item.kind];
                return (
                  <li key={`${item.kind}-${index}`} className="rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{kindLabel[item.kind]}</p>
                        <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                        <p className={`mt-1 text-sm leading-relaxed text-zinc-700 ${item.kind === 'CONTRACT' && item.documentId ? 'border-l-2 border-orange-400 pl-3 italic' : ''}`}>{item.detail}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          {item.source && <span>{item.source}</span>}
                          {item.kind === 'CONTRACT' && (
                            <span className={item.verified ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                              {item.verified ? 'Kutipan cocok dengan dokumen' : 'Tanpa kutipan terverifikasi'}
                            </span>
                          )}
                          {item.documentId && (
                            <a href={documentUrl(alert.projectId, item.documentId, item.page)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline">
                              Buka dokumen{item.page ? ` hal. ${item.page}` : ''}<ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <h5 className="mb-1 text-sm font-bold text-orange-950">Yang perlu ditinjau</h5>
            <p className="text-sm leading-relaxed text-orange-900">{alert.recommendedAction}</p>
            <p className="mt-2 text-xs text-orange-800">CLARA tidak mengambil keputusan atau mengirim tagihan otomatis. Keputusan tetap di tangan Anda.</p>
          </div>

          {alert.resolution && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">{alert.resolution.auto ? 'Selesai otomatis' : 'Diselesaikan'} · {formatDate(alert.resolution.at)}</p>
              <p className="mt-1">{alert.resolution.note}</p>
              <p className="mt-1 text-xs">Oleh {alert.resolution.by}</p>
            </div>
          )}

          {resolving && isOpenAlert(alert) && (
            <div>
              <label htmlFor="resolve-note" className="block text-sm font-semibold text-zinc-800">Catatan penyelesaian</label>
              <textarea id="resolve-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Disepakati sebagai pengecualian dengan klien pada rapat 12 Okt." className={inputClass} />
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 p-5">
          <button type="button" onClick={onClose} className={btn.ghost}>Tutup</button>
          <div className="flex flex-wrap items-center gap-2">
            {error && <span role="alert" className="w-full text-xs font-medium text-red-700 sm:w-auto">{error}</span>}
            {alert.status === 'NEW' && !resolving && (
              <button type="button" disabled={busy} onClick={() => void act(() => dataClient.acknowledgeAlert(alert.id))} className={btn.secondary}>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />{busy ? 'Menyimpan…' : 'Tandai sudah dibaca'}
              </button>
            )}
            {isOpenAlert(alert) && (resolving ? (
              <button type="button" disabled={busy || !note.trim()} onClick={() => void act(() => dataClient.resolveAlert(alert.id, note.trim()))} className={btn.success}>
                {busy ? 'Menyimpan…' : 'Simpan & selesaikan'}
              </button>
            ) : (
              <button type="button" onClick={() => setResolving(true)} className={btn.secondary}>Selesaikan…</button>
            ))}
            <Link href={`/projects/${alert.projectId}?tab=${alert.actionTab ?? 'alerts'}`} onClick={onClose} className={btn.primary}>
              Tindak lanjut <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
