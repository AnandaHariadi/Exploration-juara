'use client';

import React from 'react';
import { X, ShieldAlert, FileText, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { Alert } from '@/types';
import { SeverityBadge } from '@/components/shared/Badge';
import { formatRupiah } from '@/lib/utils';
import { storageService } from '@/services/storage';

interface EvidenceDrawerProps {
  alert: Alert | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ alert, onClose, onActionComplete }) => {
  if (!alert) return null;

  const handleAcknowledge = () => {
    storageService.acknowledgeAlert(alert.id);
    if (onActionComplete) onActionComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200">
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
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{alert.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Project: <span className="font-semibold text-slate-700">{alert.projectName}</span></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Impact Banner */}
          <div className="p-6 bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Estimasi Kerugian / Nilai Tertahan</p>
              <p className="text-2xl font-black text-rose-900 mt-0.5">{formatRupiah(alert.rupiahImpact)}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-white/80 rounded-md border border-rose-200 text-xs font-medium text-rose-800 shadow-sm">
                Confidence: {Math.round((alert.evidence.confidenceScore || 0.95) * 100)}%
              </span>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bukti Dokumen & Ground Truth</h4>
                <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {alert.evidence.sourceDocument}
                </span>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-inner space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Kutipan: <strong className="text-slate-200">{alert.evidence.pageOrSection}</strong></span>
                  <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-mono">VERIFIED BY AI</span>
                </div>
                <blockquote className="text-xs leading-relaxed font-mono text-emerald-300 bg-slate-950/60 p-3 rounded-lg border-l-2 border-emerald-500">
                  &ldquo;{alert.evidence.snippet}&rdquo;
                </blockquote>
                <p className="text-[11px] text-slate-400">
                  CLARA mendeteksi ketidaksesuaian ini secara otomatis dengan membandingkan baseline kontrak terhadap event log project dan catatan keuangan terkini.
                </p>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="border border-blue-100 bg-blue-50/60 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-blue-900 mb-1">Rekomendasi Tindakan CLARA:</h5>
              <p className="text-xs text-blue-700 leading-relaxed">
                {alert.type === 'BILLING_VARIANCE' && 'Segera buat dan kirimkan Invoice untuk termin ini agar cash flow tidak terganggu.'}
                {alert.type === 'BUDGET_VARIANCE' && 'Tinjau cost breakdown engineer dan lakukan evaluasi alokasi cloud infrastructure.'}
                {alert.type === 'SCOPE_VARIANCE' && 'Ajukan Change Request resmi (CR) ke klien untuk melegalkan penambahan scope berbayar.'}
                {alert.type === 'REVISION_LIMIT' && 'Informasikan ke klien bahwa jatah revisi gratis sudah habis, terapkan tarif add-on.'}
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
            <button
              type="button"
              onClick={handleAcknowledge}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tandai Dipahami</span>
            </button>
            <a
              href={`/projects/${alert.projectId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <span>Buka Project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
