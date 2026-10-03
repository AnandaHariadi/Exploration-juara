'use client';

import React from 'react';
import { X, ShieldAlert, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { Alert } from '@/types';
import { SeverityBadge } from '@/components/shared/Badge';
import { formatRupiah } from '@/lib/utils';
import { dataClient } from '@/services/dataClient';

interface EvidenceDrawerProps {
  alert: Alert | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ alert, onClose, onActionComplete }) => {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const closeButton = React.useRef<HTMLButtonElement>(null);
  const dialog = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useEffect(() => {
    if (!alert) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab' || !dialog.current) return;
      const controls = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls[controls.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) { event.preventDefault(); controls[0].focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, [alert?.id]);

  if (!alert) return null;

  const handleAcknowledge = async () => {
    setBusy(true);
    setError(null);
    try {
      await dataClient.acknowledgeAlert(alert.id);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui status alert.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-zinc-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-zinc-200">
        {/* Drawer Header */}
        <div>
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 mt-1">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs font-semibold text-slate-500">{alert.type.replace('_', ' ')}</span>
                </div>
                <h3 id="evidence-title" className="text-lg font-bold text-slate-900 leading-snug">{alert.title}</h3>
                <p className="text-sm text-slate-500 mt-1">Proyek: <span className="font-semibold text-slate-700">{alert.projectName}</span></p>
              </div>
            </div>
            <button
              ref={closeButton}
              aria-label="Tutup rincian peringatan"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Impact Banner */}
          <div className="p-6 bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Nilai terkait peringatan</p>
              <p className="text-2xl font-black text-rose-900 mt-0.5">{formatRupiah(alert.rupiahImpact)}</p>
            </div>
          </div>

          {/* Description & Cause */}
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Penjelasan Masalah</h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {alert.description}
              </p>
            </div>

            {/* Evidence & Ground Truth */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Catatan sumber demo</h4>
                <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {alert.evidence.sourceDocument}
                </span>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-inner space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Kutipan: <strong className="text-slate-200">{alert.evidence.pageOrSection}</strong></span>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-orange-300">Belum diverifikasi</span>
                </div>
                <blockquote className="text-sm leading-relaxed text-zinc-100 bg-slate-950/60 p-3 rounded-lg border-l-2 border-orange-500">
                  &ldquo;{alert.evidence.snippet}&rdquo;
                </blockquote>
                <p className="text-[11px] text-slate-400">
                  Teks ini berasal dari data demo. Cocokkan dengan berkas kontrak asli sebelum mengambil keputusan.
                </p>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="border border-orange-200 bg-orange-50 p-4 rounded-xl">
              <h5 className="text-sm font-bold text-orange-950 mb-1">Langkah berikutnya</h5>
              <p className="text-sm text-orange-900 leading-relaxed">
                {alert.type === 'BILLING_VARIANCE' && 'Periksa tahap pekerjaan dan tagihannya pada halaman keuangan.'}
                {alert.type === 'BUDGET_VARIANCE' && 'Periksa biaya aktual dan rencana biaya proyek.'}
                {alert.type === 'SCOPE_VARIANCE' && 'Periksa ruang lingkup proyek dan ajukan perubahan bila diperlukan.'}
                {alert.type === 'REVISION_LIMIT' && 'Periksa catatan revisi dan batas yang disepakati.'}
                {alert.type === 'DEADLINE_RISK' && 'Periksa jadwal dan progres pekerjaan proyek.'}
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            {error && <span className="text-xs text-rose-600 font-medium mr-2">{error}</span>}
            <button
              type="button"
              disabled={busy}
              onClick={handleAcknowledge}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{busy ? 'Menyimpan…' : 'Tandai sudah dibaca'}</span>
            </button>
            <a
              href={`/projects/${alert.projectId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <span>Buka proyek</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
