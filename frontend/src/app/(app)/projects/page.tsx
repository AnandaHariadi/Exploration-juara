'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Search, FolderGit2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useProjects } from '@/hooks/useClaraData';
import { formatCompactRupiah, formatDate, isOpenAlert } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/Badge';

export default function ProjectsPage() {
  const { projects, loading, error, refreshProjects } = useProjects();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

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
          <h1 className="font-heading text-2xl font-bold text-zinc-950 tracking-tight">Daftar proyek</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lihat nilai kontrak, biaya, progres, dan tagihan setiap proyek.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat proyek</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            aria-label="Cari proyek"
            placeholder="Cari nama proyek atau klien…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'ACTIVE', 'AT_RISK', 'BASELINE_PENDING', 'DRAFT', 'COMPLETED'].map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Semua' : status === 'ACTIVE' ? 'Berjalan' : status === 'AT_RISK' ? 'Perlu perhatian' : status === 'BASELINE_PENDING' ? 'Menunggu persetujuan' : status === 'DRAFT' ? 'Draf' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid / Table or Empty State */}
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><span>Gagal memuat proyek: {error}</span><button type="button" onClick={() => void refreshProjects()} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold">Coba lagi</button></div>}
      {loading ? <p className="rounded-xl bg-white p-6 text-sm text-zinc-500">Memuat proyek…</p> : filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Belum ada proyek yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Coba kata kunci atau status lain.'
                : 'Buat proyek demo untuk mulai memantau pekerjaan.'}
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat proyek</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const activeAlerts = (project.alerts || []).filter(isOpenAlert);
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
                    <span className="text-xs font-mono text-slate-400 font-semibold">{project.id}</span>
                    <h3 className="text-base font-bold text-slate-900 truncate mt-0.5" title={project.name}>
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{project.client}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {!project.metrics.hasBaseline ? (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
                    Acuan proyek belum disetujui. {project.documents.length} dokumen terlampir{project.extraction?.status === 'READY' ? ' · hasil analisis menunggu tinjauan' : ''}.
                  </div>
                ) : (<>
                {/* Financial Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-xs uppercase font-semibold">Nilai Kontrak</span>
                    <p className="font-bold text-slate-800">{formatCompactRupiah(project.contractValue)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-semibold">Biaya tercatat</span>
                    <p className={`font-bold ${project.actualCost > project.plannedCost ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatCompactRupiah(project.actualCost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-semibold">Belum ditagih</span>
                    <p className={`font-semibold ${project.metrics.unbilledValue ? 'text-amber-700' : 'text-slate-800'}`}>{formatCompactRupiah(project.metrics.unbilledValue)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-semibold">Versi acuan</span>
                    <p className="font-semibold text-red-600 font-mono">{project.baselineVersion}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Progres pekerjaan</span>
                    <span className="font-bold text-slate-800">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hasRisk ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-red-600'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                </>)}

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
                <span className="text-xs text-slate-400">
                  {project.metrics.hasBaseline ? `Tenggat: ${formatDate(project.endDate)}` : 'Draf'}
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 group transition-colors"
                >
                  <span>{project.metrics.hasBaseline ? 'Buka proyek' : 'Siapkan acuan'}</span>
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
