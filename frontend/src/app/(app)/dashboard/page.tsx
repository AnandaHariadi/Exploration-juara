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
  Plus
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project, Alert } from '@/types';
import { formatCompactRupiah, formatRupiah } from '@/lib/utils';
import { StatusBadge, SeverityBadge } from '@/components/shared/Badge';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';

export default function DashboardPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);

  const loadData = React.useCallback(() => {
    setProjects(storageService.getProjects());
  }, []);

  React.useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('clara_data_updated', handleUpdate);
    return () => window.removeEventListener('clara_data_updated', handleUpdate);
  }, [loadData]);

  // Aggregate Metrics across all projects
  const totalContractValue = projects.reduce((acc, p) => acc + (p.contractValue || 0), 0);
  const totalPlannedCost = projects.reduce((acc, p) => acc + (p.plannedCost || 0), 0);
  const totalActualCost = projects.reduce((acc, p) => acc + (p.actualCost || 0), 0);
  const totalBillableValue = projects.reduce((acc, p) => acc + (p.billableValue || 0), 0);
  const totalBilledValue = projects.reduce((acc, p) => acc + (p.billedValue || 0), 0);
  const totalUnbilledValue = Math.max(0, totalBillableValue - totalBilledValue);

  const allAlerts: Alert[] = [];
  projects.forEach((p) => {
    if (p.alerts) allAlerts.push(...p.alerts);
  });
  const activeAlerts = allAlerts.filter((a) => a.status === 'NEW');
  const totalAtRiskImpact = activeAlerts.reduce((acc, a) => acc + a.rupiahImpact, 0);

  const costVariance = totalActualCost - totalPlannedCost;
  const costVariancePercent = totalPlannedCost > 0 ? (costVariance / totalPlannedCost) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
              Contract Intelligence Hub
            </span>
            <span className="text-xs text-slate-400">• Real-time Reconciliation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Business Value Overview</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            CLARA mencocokkan kontrak, RAB, progres teknis, dan arus tagihan secara otomatis untuk mencegah kebocoran margin project.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Kontrak Baru</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Nilai Kontrak</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{formatCompactRupiah(totalContractValue)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{projects.length} active portfolio</span>
            <span>projects</span>
          </div>
        </div>

        {/* Card 2: Planned vs Actual Cost */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Actual Cost vs RAB</span>
            <div className={`p-2 rounded-lg ${costVariance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{formatCompactRupiah(totalActualCost)}</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className={`font-semibold ${costVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {costVariance > 0 ? `+${costVariancePercent.toFixed(1)}% Over` : 'Within Budget'}
            </span>
            <span className="text-slate-400">RAB: {formatCompactRupiah(totalPlannedCost)}</span>
          </div>
        </div>

        {/* Card 3: Unbilled Realized Value */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold uppercase tracking-wider">
            <span>Hak Tagih Belum Ditagihkan</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-3">{formatCompactRupiah(totalUnbilledValue)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-amber-700 font-medium">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Milestone selesai, belum invoice!</span>
          </div>
        </div>

        {/* Card 4: Value at Risk / Active Alerts */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold uppercase tracking-wider">
            <span>Total Potensi Masalah</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-900 mt-3">{formatCompactRupiah(totalAtRiskImpact)}</p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="font-semibold text-rose-700">{activeAlerts.length} issues open</span>
            <Link href="/alerts" className="text-blue-600 hover:underline flex items-center font-medium">
              Audit bukti <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Alerts & Projects Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Priority Variance Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Priority Alerts & Evidence</h2>
              <p className="text-xs text-slate-500">Peringatan berbasis audit kontrak dan data aktual yang butuh tindakan segera.</p>
            </div>
            <Link
              href="/alerts"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Lihat Semua ({activeAlerts.length}) <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {activeAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs font-medium text-slate-500 truncate max-w-[220px]">
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
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Audit Bukti</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {activeAlerts.length === 0 && (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">Semua Project Sesuai Baseline</p>
                <p className="text-xs text-slate-500 mt-1">Tidak ada variance atau risiko finansial yang terdeteksi.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Projects Health List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Project Health</h2>
              <p className="text-xs text-slate-500">Status kepatuhan baseline.</p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {projects.map((proj) => (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
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
                  <span className="font-mono">Ver: {proj.baselineVersion}</span>
                  <span className="flex items-center text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                    Buka Detail <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </Link>
            ))}
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
