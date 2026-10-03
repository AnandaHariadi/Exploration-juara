'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project } from '@/types';
import { StatusBadge, ScopeBadge } from '@/components/shared/Badge';

export default function MonitoringPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);

  React.useEffect(() => {
    setProjects(storageService.getProjects());
    const handleUpdate = () => setProjects(storageService.getProjects());
    window.addEventListener('clara_data_updated', handleUpdate);
    return () => window.removeEventListener('clara_data_updated', handleUpdate);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Monitoring & Scope Control</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau progres teknis, batas revisi kontrak, dan deviasi scope secara berkala tanpa input harian manual.
        </p>
      </div>

      <div className="space-y-6">
        {projects.map((proj) => {
          const limit = proj.agreementBaseline?.revisionLimit || 3;
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
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl self-start md:self-auto"
                >
                  <span>Buka Scope & Event Log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Progress & Revision Metric Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Penyelesaian Teknis</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold text-slate-900">{proj.progress}%</span>
                    <span className="text-xs text-slate-500">Target Go-Live</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isOverLimit ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`text-[10px] font-bold uppercase ${isOverLimit ? 'text-rose-700' : 'text-slate-400'}`}>
                    Status Jatah Revisi Kontrak
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-xl font-bold ${isOverLimit ? 'text-rose-700' : 'text-slate-900'}`}>
                      {proj.activeRevisionCount} / {limit} Putaran
                    </span>
                    <span className={`text-xs font-medium ${isOverLimit ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
                      {isOverLimit ? 'Over Limit!' : 'Terkontrol'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isOverLimit ? 'Revisi melebihi klausul kontrak. Wajib tagih add-on.' : 'Masih dalam batas gratis kontrak.'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${deviationCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`text-[10px] font-bold uppercase ${deviationCount > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                    Kepatuhan Scope Kontrak
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-xl font-bold ${deviationCount > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {deviationCount > 0 ? `${deviationCount} Deviasi` : '100% Match'}
                    </span>
                    <span className="text-xs text-slate-500">SOW Check</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {deviationCount > 0 ? 'Terdapat pekerjaan tanpa klausul pendukung.' : 'Semua task sesuai dengan lampiran kontrak.'}
                  </p>
                </div>
              </div>

              {/* Sample Scope Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Item Pekerjaan Terkini:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {proj.agreementBaseline?.scopeItems.slice(0, 4).map((s) => (
                    <div key={s.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-800 block truncate">{s.title}</span>
                        <span className="text-[10px] text-slate-400">{s.category}</span>
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
    </div>
  );
}
