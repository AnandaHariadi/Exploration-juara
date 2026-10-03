'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Search, FolderGit2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project } from '@/types';
import { formatCompactRupiah, formatRupiah, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/Badge';

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  React.useEffect(() => {
    setProjects(storageService.getProjects());
    const handleUpdate = () => setProjects(storageService.getProjects());
    window.addEventListener('clara_data_updated', handleUpdate);
    return () => window.removeEventListener('clara_data_updated', handleUpdate);
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Project Portofolio</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring kontrak, baseline RAB, progres pekerjaan, dan penagihan per project.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Project Baru</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama project, klien, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'ACTIVE', 'AT_RISK', 'BASELINE_PENDING'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Semua Status' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid / Table or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Belum Ada Project Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Tidak ada project yang cocok dengan kriteria pencarian atau filter Anda.'
                : 'Mulai dengan mengunggah dokumen kontrak PKS dan RAB pertama Anda.'}
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Kontrak Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const activeAlerts = (project.alerts || []).filter((a) => a.status === 'NEW');
          const hasRisk = project.status === 'AT_RISK' || activeAlerts.length > 0;

          return (
            <div
              key={project.id}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between hover:shadow-lg ${
                hasRisk ? 'border-rose-200 shadow-sm' : 'border-slate-200 shadow-sm'
              }`}
            >
              <div className="p-6 space-y-4">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="truncate">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">{project.id}</span>
                    <h3 className="text-base font-bold text-slate-900 truncate mt-0.5" title={project.name}>
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{project.client}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {/* Financial Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Nilai Kontrak</span>
                    <p className="font-bold text-slate-800">{formatCompactRupiah(project.contractValue)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Actual Cost</span>
                    <p className={`font-bold ${project.actualCost > project.plannedCost ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatCompactRupiah(project.actualCost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Billed</span>
                    <p className="font-semibold text-emerald-700">{formatCompactRupiah(project.billedValue || 0)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Baseline</span>
                    <p className="font-semibold text-blue-600 font-mono">{project.baselineVersion}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Penyelesaian Teknis</span>
                    <span className="font-bold text-slate-800">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hasRisk ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Alerts indicator if any */}
                {activeAlerts.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 flex items-center gap-2 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="truncate font-medium">
                      {activeAlerts.length} Peringatan: {activeAlerts[0].title}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-4 px-6 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Deadline: {formatDate(project.endDate)}
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group transition-colors"
                >
                  <span>Open Project</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
