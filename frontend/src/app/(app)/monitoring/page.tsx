'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useProjects } from '@/hooks/useClaraData';
import { Project } from '@/types';
import { StatusBadge, ScopeBadge } from '@/components/shared/Badge';

export default function MonitoringPage() {
  const { projects, loading, error } = useProjects();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-heading text-2xl font-bold text-zinc-950 tracking-tight">Pemantauan proyek</h1>
        <p className="text-sm text-slate-500 mt-1">
          Lihat progres pekerjaan, catatan revisi, dan ruang lingkup yang perlu ditinjau.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Gagal memuat proyek: {error}</p>}
      {loading ? <p className="rounded-xl bg-white p-6 text-sm text-zinc-500">Memuat pemantauan…</p> : projects.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Belum ada proyek</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Buat proyek demo untuk melihat progres dan ruang lingkup pekerjaan.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <span>Buat proyek</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((proj) => {
          const limit = proj.agreementBaseline?.revisionLimit ?? 3;
          const isOverLimit = proj.activeRevisionCount > limit;
          const deviationCount = (proj.agreementBaseline?.scopeItems || []).filter((s) => s.status === 'NEEDS_REVIEW').length;

          return (
            <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-slate-400 font-bold">{proj.id}</span>
                    <StatusBadge status={proj.status} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{proj.name}</h3>
                  <p className="text-xs text-slate-500">{proj.client}</p>
                </div>

                <Link
                  href={`/projects/${proj.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-xl self-start md:self-auto"
                >
                  <span>Buka rincian proyek</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Progress & Revision Metric Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold uppercase text-slate-500">Progres pekerjaan</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold text-slate-900">{proj.progress}%</span>
                    <span className="text-xs text-slate-500">Tahap selesai</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-red-600 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isOverLimit ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`text-xs font-bold uppercase ${isOverLimit ? 'text-rose-700' : 'text-slate-400'}`}>
                    Pemakaian revisi
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-xl font-bold ${isOverLimit ? 'text-rose-700' : 'text-slate-900'}`}>
                      {proj.activeRevisionCount} / {limit} Putaran
                    </span>
                    <span className={`text-xs font-medium ${isOverLimit ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
                      {isOverLimit ? 'Melebihi batas' : 'Dalam batas'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isOverLimit ? 'Periksa kesepakatan revisi dengan klien.' : 'Masih dalam batas revisi yang tersimpan.'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${deviationCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`text-xs font-bold uppercase ${deviationCount > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                    Ruang lingkup pekerjaan
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-xl font-bold ${deviationCount > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {deviationCount > 0 ? `${deviationCount} perlu ditinjau` : 'Tidak ada catatan'}
                    </span>
                    <span className="text-xs text-slate-500">Daftar pekerjaan</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {deviationCount > 0 ? 'Periksa pekerjaan yang ditandai sebelum mengambil tindakan.' : 'Belum ada pekerjaan yang ditandai perlu ditinjau.'}
                  </p>
                </div>
              </div>

              {/* Sample Scope Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-700">Ruang lingkup yang tersimpan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {proj.agreementBaseline?.scopeItems.slice(0, 4).map((s) => (
                    <div key={s.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-800 block truncate">{s.title}</span>
                        <span className="text-xs text-slate-400">{s.category}</span>
                      </div>
                      <ScopeBadge status={s.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
}
