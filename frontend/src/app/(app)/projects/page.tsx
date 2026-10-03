'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Search, FolderGit2 } from 'lucide-react';
import { useProjects } from '@/hooks/useClaraData';
import { formatCompactRupiah, formatDate, isOpenAlert } from '@/lib/utils';
import { baselineAvailability } from '@/lib/baseline';
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
            Pilih proyek untuk membuka dokumen, pemantauan, keuangan, dan perubahan.
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
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <caption className="sr-only">Daftar proyek sesuai pencarian dan filter</caption>
            <thead className="bg-zinc-50"><tr>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Proyek</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Status dan acuan</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Progres</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Nilai kontrak</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Biaya tercatat</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Belum ditagih</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Peringatan</th>
              <th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Buka</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredProjects.map((project) => {
                const alertCount = project.alerts.filter(isOpenAlert).length;
                const hasBaseline = project.metrics.hasBaseline;
                const active = project.baselines.find((version) => version.status === 'ACTIVE');
                const available = active ? baselineAvailability(active) : null;
                const hasProgress = project.events.some((event) => event.type === 'PROGRESS_UPDATED');
                return (
                  <tr key={project.id} className="hover:bg-zinc-50">
                    <td className="border-r border-zinc-200 px-4 py-3">
                      <Link href={`/projects/${project.id}`} className="font-semibold text-zinc-900 hover:text-red-700 hover:underline">{project.name}</Link>
                      <span className="mt-1 block text-zinc-500">{project.client} / {project.id}</span>
                      {available?.deadline && <span className="mt-1 block text-zinc-500">Tenggat {formatDate(project.endDate)}</span>}
                    </td>
                    <td className="border-r border-zinc-200 px-4 py-3"><StatusBadge status={project.status} /><span className="mt-1 block text-zinc-600">{hasBaseline ? `Acuan ${project.baselineVersion}` : 'Acuan belum disetujui'}</span></td>
                    <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{hasProgress ? `${project.progress}%` : 'Belum dicatat'}</td>
                    <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{available?.contractValue ? formatCompactRupiah(project.contractValue) : 'Belum ada acuan'}</td>
                    <td className={`border-r border-zinc-200 px-4 py-3 text-right tabular-nums ${hasBaseline && project.plannedCost > 0 && project.actualCost > project.plannedCost ? 'font-semibold text-red-700' : ''}`}>{hasBaseline ? formatCompactRupiah(project.actualCost) : '-'}</td>
                    <td className={`border-r border-zinc-200 px-4 py-3 text-right tabular-nums ${hasBaseline && project.metrics.unbilledValue > 0 ? 'font-semibold text-amber-800' : ''}`}>{available?.billing ? formatCompactRupiah(project.metrics.unbilledValue) : 'Syarat tagih belum ada'}</td>
                    <td className={`border-r border-zinc-200 px-4 py-3 text-right tabular-nums ${alertCount > 0 ? 'font-semibold text-red-700' : ''}`}>{alertCount}</td>
                    <td className="px-4 py-3"><Link href={`/projects/${project.id}${hasBaseline && (!available?.agreement || !available?.budget) ? '?tab=baseline' : ''}`} className="font-semibold text-red-700 hover:underline">{hasBaseline ? available?.agreement && available?.budget ? 'Buka proyek' : 'Lengkapi acuan' : 'Siapkan acuan'}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
