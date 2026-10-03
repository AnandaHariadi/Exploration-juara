'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowUpRight, CheckCircle2, Filter } from 'lucide-react';
import { storageService } from '@/services/storage';
import { Alert, AlertSeverity, AlertType } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { SeverityBadge } from '@/components/shared/Badge';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';

export default function AlertsPage() {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = React.useState<string>('ALL');
  const [typeFilter, setTypeFilter] = React.useState<string>('ALL');

  const loadData = React.useCallback(() => {
    setAlerts(storageService.getAllAlerts());
  }, []);

  React.useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('clara_data_updated', handleUpdate);
    return () => window.removeEventListener('clara_data_updated', handleUpdate);
  }, [loadData]);

  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    return matchesSev && matchesType;
  });

  const totalImpact = filteredAlerts.reduce((sum, a) => sum + (a.status === 'NEW' ? a.rupiahImpact : 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alerts & Evidence Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Setiap peringatan CLARA didasari perbandingan objektif antara klausul kontrak, RAB, dan progres keuangan.
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-right self-start sm:self-auto">
          <span className="text-[10px] font-bold uppercase text-rose-700">Total Potensi Kerugian</span>
          <p className="text-lg font-black text-rose-900">{formatRupiah(totalImpact)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 shadow-sm text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
        >
          <option value="ALL">Semua Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
        >
          <option value="ALL">Semua Kategori</option>
          <option value="BILLING_VARIANCE">Billing Variance (Tagihan)</option>
          <option value="BUDGET_VARIANCE">Budget Variance (Biaya)</option>
          <option value="SCOPE_VARIANCE">Scope Variance (Ruang Lingkup)</option>
          <option value="REVISION_LIMIT">Revision Limit (Batas Revisi)</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all ${
              alert.status === 'NEW' ? 'border-rose-200' : 'border-slate-200 opacity-80'
            }`}
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={alert.severity} />
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {alert.projectName}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {alert.type}
                </span>
                {alert.status === 'ACKNOWLEDGED' && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Telah Dipahami
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{alert.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{alert.description}</p>

              <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                <span>Sumber Bukti:</span>
                <span className="font-semibold text-slate-600 font-mono">{alert.evidence.sourceDocument}</span>
                <span>({alert.evidence.pageOrSection})</span>
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
              <div className="text-left md:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dampak Finansial</span>
                <span className="text-lg font-black text-rose-600">{formatRupiah(alert.rupiahImpact)}</span>
              </div>

              <button
                onClick={() => setSelectedAlert(alert)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>Lihat Bukti Dokumen</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Alert</h3>
            <p className="text-xs text-slate-500 mt-1">Seluruh baseline, scope, dan penagihan berstatus valid.</p>
          </div>
        )}
      </div>

      {/* Evidence Drawer Modal */}
      <EvidenceDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onActionComplete={loadData}
      />
    </div>
  );
}
