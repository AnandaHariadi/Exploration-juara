'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  AlertOctagon,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Plus,
  Activity,
  Layers,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project, Alert, UserPersonaId, USER_PERSONAS } from '@/types';
import { formatCompactRupiah, formatRupiah } from '@/lib/utils';
import { StatusBadge, SeverityBadge, ScopeBadge } from '@/components/shared/Badge';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';

export default function DashboardPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
  const [activePersonaId, setActivePersonaId] = React.useState<UserPersonaId>('BUDI');

  const loadData = React.useCallback(() => {
    setProjects(storageService.getProjects());
    setActivePersonaId(storageService.getActivePersona());
  }, []);

  React.useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    const handlePersona = () => setActivePersonaId(storageService.getActivePersona());

    window.addEventListener('clara_data_updated', handleUpdate);
    window.addEventListener('clara_persona_changed', handlePersona);
    return () => {
      window.removeEventListener('clara_data_updated', handleUpdate);
      window.removeEventListener('clara_persona_changed', handlePersona);
    };
  }, [loadData]);

  // Aggregate Metrics across all projects
  const totalContractValue = projects.reduce((acc, p) => acc + (p.contractValue || 0), 0);
  const totalPlannedCost = projects.reduce((acc, p) => acc + (p.plannedCost || 0), 0);
  const totalActualCost = projects.reduce((acc, p) => acc + (p.actualCost || 0), 0);
  const totalBillableValue = projects.reduce((acc, p) => acc + (p.billableValue || 0), 0);
  const totalBilledValue = projects.reduce((acc, p) => acc + (p.billedValue || 0), 0);
  const totalPaidValue = projects.reduce((acc, p) => acc + (p.paidValue || 0), 0);
  const totalUnbilledValue = Math.max(0, totalBillableValue - totalBilledValue);

  const allAlerts: Alert[] = [];
  projects.forEach((p) => {
    if (p.alerts) allAlerts.push(...p.alerts);
  });
  const activeAlerts = allAlerts.filter((a) => a.status === 'NEW');
  const totalAtRiskImpact = activeAlerts.reduce((acc, a) => acc + a.rupiahImpact, 0);

  const costVariance = totalActualCost - totalPlannedCost;
  const costVariancePercent = totalPlannedCost > 0 ? (costVariance / totalPlannedCost) * 100 : 0;

  const persona = USER_PERSONAS[activePersonaId] || USER_PERSONAS.BUDI;

  const handleInvoiceMilestone = (projectId: string, milestoneId: string) => {
    storageService.createInvoice(projectId, milestoneId);
    loadData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Clean Corporate Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-blue-400 px-2 py-0.5 rounded border border-slate-700">
              {persona.roleTitle}
            </span>
            <span className="text-xs text-slate-400">• {persona.department}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            {activePersonaId === 'BUDI' && 'Project Delivery & Scope Reconciliation'}
            {activePersonaId === 'SITI' && 'Finance Cash Flow & Value Realization'}
            {activePersonaId === 'HENDRA' && 'Executive Business Value & Portfolio Oversight'}
            {activePersonaId === 'ADMIN' && 'Enterprise System Administration'}
          </h1>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {persona.description}
          </p>
        </div>

        {/* Persona Specific Action Buttons */}
        <div className="flex items-center gap-3">
          {activePersonaId === 'BUDI' && (
            <Link
              href="/projects/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Kontrak & RAB</span>
            </Link>
          )}

          {activePersonaId === 'SITI' && (
            <Link
              href="/finance"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Proses Tagihan Termin</span>
            </Link>
          )}

          {activePersonaId === 'HENDRA' && (
            <Link
              href="/alerts"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Audit Risiko Finansial</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid Tailored to Persona */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio Value (Always visible) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Nilai Kontrak</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCompactRupiah(totalContractValue)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{projects.length} project</span>
            <span>dalam portofolio aktif</span>
          </div>
        </div>

        {/* Card 2: Persona-Specific Second Metric */}
        {activePersonaId === 'BUDI' ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <span>Status Delivery Progres</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1))}%
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{projects.filter((p) => p.status === 'AT_RISK').length} project</span>
              <span className="text-rose-600 font-semibold">butuh perhatian</span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <span>Actual Cost vs RAB</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatCompactRupiah(totalActualCost)}</p>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={`font-bold ${costVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {costVariance > 0 ? `+${costVariancePercent.toFixed(1)}% Over` : 'Within Budget'}
              </span>
              <span className="text-slate-400">RAB: {formatCompactRupiah(totalPlannedCost)}</span>
            </div>
          </div>
        )}

        {/* Card 3: Unbilled Gap / Hak Tagih */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-[10px] font-bold uppercase tracking-wider">
            <span>Uang Macet (Unbilled Gap)</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{formatCompactRupiah(totalUnbilledValue)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-amber-800 font-medium">
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
            <span>Milestone selesai, belum invoice</span>
          </div>
        </div>

        {/* Card 4: Value at Risk (Exposure) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 text-[10px] font-bold uppercase tracking-wider">
            <span>Financial Exposure Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-900 mt-2">{formatCompactRupiah(totalAtRiskImpact)}</p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="font-bold text-rose-700">{activeAlerts.length} deviasi aktif</span>
            <Link href="/alerts" className="text-blue-700 font-semibold hover:underline flex items-center">
              Audit bukti <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* SPECIALIZED WORKSPACE SECTION ACCORDING TO ROLE */}

      {/* 1. SITI RAHMA (FINANCE) WORKSPACE HIGHLIGHT */}
      {activePersonaId === 'SITI' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Finance Action Board: Termin Selesai Siap Ditagihkan</h2>
              <p className="text-xs text-slate-500">
                Pekerjaan di bawah ini telah selesai diverifikasi (BAST / UAT Sign-off) dan siap diterbitkan fakturnya oleh Finance.
              </p>
            </div>
            <Link href="/finance" className="text-xs font-bold text-blue-700 hover:underline">
              Kelola Seluruh Faktur &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {projects.flatMap((p) =>
              (p.agreementBaseline?.milestones || [])
                .filter((m) => m.status === 'COMPLETED' && m.billingStatus === 'UNBILLED')
                .map((m) => (
                  <div key={m.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                        {p.name}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{m.title}</h4>
                      <p className="text-slate-500 mt-0.5">Klien: {p.client}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-900">{formatRupiah(m.value)}</span>
                      <button
                        onClick={() => handleInvoiceMilestone(p.id, m.id)}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                      >
                        Terbitkan Invoice Sekarang
                      </button>
                    </div>
                  </div>
                ))
            )}

            {totalUnbilledValue === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                Seluruh termin yang selesai telah berhasil ditagihkan secara tepat waktu.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. BUDI SANTOSO (PM) WORKSPACE HIGHLIGHT */}
      {activePersonaId === 'BUDI' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">PM Action Board: Scope Compliance & Revisi Kontrak</h2>
              <p className="text-xs text-slate-500">
                Peringatan deviasi pekerjaan di luar SOW awal dan kontrol batas kuota revisi gratis klien.
              </p>
            </div>
            <Link href="/monitoring" className="text-xs font-bold text-blue-700 hover:underline">
              Buka Matriks Scope &rarr;
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              Belum ada project aktif untuk diaudit kepatuhan scope dan batas revisinya.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {projects.map((p) => {
                const limit = p.agreementBaseline?.revisionLimit || 3;
                const isOver = p.activeRevisionCount > limit;
                const deviations = (p.agreementBaseline?.scopeItems || []).filter((s) => s.status === 'NEEDS_REVIEW');

                return (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{p.name}</h4>
                        <p className="text-[11px] text-slate-500">{p.client}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOver ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                        Revisi: {p.activeRevisionCount} / {limit}
                      </span>
                    </div>

                    {deviations.length > 0 ? (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                        <span className="font-bold block text-[11px]">Ada Pekerjaan Non-SOW Terdeteksi:</span>
                        <p className="text-[11px] text-amber-800 leading-snug">{deviations[0].title}</p>
                        <Link
                          href={`/projects/${p.id}`}
                          className="inline-block mt-1 font-bold text-blue-700 hover:underline text-[11px]"
                        >
                          Ajukan Change Request untuk Legalkan &rarr;
                        </Link>
                      </div>
                    ) : (
                      <p className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> 100% Pekerjaan sesuai lampiran kontrak.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Priority Alerts & Projects Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Priority Variance Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Priority Alerts & Ground Truth Evidence</h2>
              <p className="text-xs text-slate-500">Peringatan otomatis berbasis audit kesepakatan kontrak.</p>
            </div>
            <Link
              href="/alerts"
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              Lihat Semua ({activeAlerts.length}) <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Tidak Ada Deviasi Kritis</h4>
                <p className="text-xs text-slate-500">
                  Seluruh project berjalan sesuai klausul kontrak, batasan revisi, dan alokasi anggaran RAB.
                </p>
              </div>
            ) : (
              activeAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">
                        {alert.projectName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-mono text-slate-400">{alert.type}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{alert.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-1">{alert.description}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <span className="text-sm font-bold text-rose-600">{formatRupiah(alert.rupiahImpact)}</span>
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Audit Bukti</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Projects Health List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Health</h2>
              <p className="text-xs text-slate-500">Status kepatuhan baseline.</p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <Layers className="w-7 h-7 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">Belum Ada Project</h4>
                <p className="text-[11px] text-slate-400">
                  Data kesehatan project akan tampil otomatis setelah baseline dikunci.
                </p>
                <div className="pt-2">
                  <Link
                    href="/projects/new"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Kontrak</span>
                  </Link>
                </div>
              </div>
            ) : (
              projects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {proj.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{proj.client}</p>
                    </div>
                    <StatusBadge status={proj.status} />
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Progress: {proj.progress}%</span>
                      <span className="font-semibold text-slate-800">{formatCompactRupiah(proj.contractValue)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          proj.status === 'AT_RISK' ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="font-mono">Baseline {proj.baselineVersion}</span>
                    <span className="flex items-center text-blue-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Buka Detail <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
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
