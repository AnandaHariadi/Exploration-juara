'use client';

import React from 'react';
import Link from 'next/link';
import { GitPullRequest, Plus, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project, ChangeRequest } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';

export default function ChangeRequestsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);

  const loadData = React.useCallback(() => {
    setProjects(storageService.getProjects());
  }, []);

  React.useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('clara_data_updated', handleUpdate);
    return () => window.removeEventListener('clara_data_updated', handleUpdate);
  }, [loadData]);

  const allCRs: (ChangeRequest & { project: Project })[] = [];
  projects.forEach((p) => {
    (p.changeRequests || []).forEach((cr) => {
      allCRs.push({ ...cr, project: p });
    });
  });

  const handleApprove = (projectId: string, crId: string) => {
    if (confirm('Setujui Change Request ini? Kontrak baseline akan diperbarui.')) {
      storageService.approveChangeRequest(projectId, crId);
      loadData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Change Requests & Baseline Versioning</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen adendum kontrak legal. Setiap perubahan scope dan penambahan budget memicu kenaikan versi baseline (V1 &rarr; V2 &rarr; V3).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {allCRs.map((cr) => (
          <div key={cr.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {cr.crNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Project: {cr.project.name}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{cr.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{cr.description}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold self-start ${
                  cr.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {cr.status}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Nilai Tambahan</span>
                <p className="font-bold text-slate-900 text-sm">+{formatRupiah(cr.additionalValue)}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Perpanjangan Waktu</span>
                <p className="font-bold text-slate-900 text-sm">+{cr.deadlineExtensionDays} Hari</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Alasan Deviasi</span>
                <p className="font-medium text-slate-700 truncate">{cr.reason}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Versi Baseline</span>
                <p className="font-bold text-blue-600 text-sm">{cr.resultingBaselineVersion || 'Target V2.0'}</p>
              </div>
            </div>

            {cr.status === 'PENDING' && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleApprove(cr.project.id, cr.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Approve CR & Kunci Versi Baru
                </button>
              </div>
            )}
          </div>
        ))}

        {allCRs.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
            <GitPullRequest className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Change Request</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Change Request dapat diajukan dari halaman detail project untuk meresmikan penambahan scope, kompensasi anggaran, atau adendum kontrak.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
