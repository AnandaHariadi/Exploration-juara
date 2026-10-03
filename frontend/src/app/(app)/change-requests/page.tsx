'use client';

import React from 'react';
import Link from 'next/link';
import { GitPullRequest, Plus, CheckCircle2, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { useProjects } from '@/hooks/useClaraData';
import { Project, ChangeRequest } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';

export default function ChangeRequestsPage() {
  const { projects, refreshProjects, loading, error } = useProjects();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  const allCRs: (ChangeRequest & { project: Project })[] = [];
  projects.forEach((p) => {
    (p.changeRequests || []).forEach((cr) => {
      allCRs.push({ ...cr, project: p });
    });
  });

  const handleApprove = async (projectId: string, crId: string) => {
    if (confirm('Setujui permintaan perubahan ini? Nilai dan acuan proyek akan diperbarui.')) {
      setBusyId(crId);
      setActionError(null);
      setActionNotice(null);
      try {
        await dataClient.approveChangeRequest(projectId, crId);
        await refreshProjects();
        setActionNotice('Permintaan perubahan disetujui. Acuan proyek diperbarui.');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Gagal menyetujui permintaan perubahan.');
      } finally {
        setBusyId(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 relative">
      {(actionError || actionNotice) && (
        <div className="fixed top-4 right-4 z-[70] max-w-md w-full shadow-lg rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {actionError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Gagal Menyetujui CR</p>
                  <p className="text-xs text-rose-700 mt-0.5">{actionError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-rose-500 hover:text-rose-700 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}
          {actionNotice && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Berhasil</p>
                  <p className="text-xs text-emerald-700 mt-0.5">{actionNotice}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="text-emerald-500 hover:text-emerald-700 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-zinc-950 tracking-tight">Permintaan perubahan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tinjau perubahan nilai, ruang lingkup, dan tenggat proyek sebelum menyetujui acuan baru.
          </p>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Gagal memuat permintaan perubahan: {error}</p>}
      {loading && <p className="rounded-xl bg-white p-4 text-sm text-zinc-500">Memuat permintaan perubahan…</p>}

      <div className="space-y-4">
        {allCRs.map((cr) => (
          <div key={cr.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    {cr.crNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Proyek: {cr.project.name}</span>
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
                {cr.status === 'APPROVED' ? 'Disetujui' : cr.status === 'PENDING' ? 'Menunggu persetujuan' : cr.status === 'REJECTED' ? 'Ditolak' : 'Draf'}
              </span>
            </div>

            {cr.status === 'APPROVED' && <p className="text-sm text-zinc-600">Disetujui {cr.approvedAt ? formatDate(cr.approvedAt) : ''} oleh {cr.project.events.find((event) => event.type === 'CHANGE_REQUEST_APPROVED' && event.title.includes(cr.crNumber))?.author ?? 'pengguna demo'}.</p>}

            <div className="p-4 bg-slate-50 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-xs uppercase font-semibold">Nilai Tambahan</span>
                <p className="font-bold text-slate-900 text-sm">+{formatRupiah(cr.additionalValue)}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-semibold">Perpanjangan Waktu</span>
                <p className="font-bold text-slate-900 text-sm">+{cr.deadlineExtensionDays} Hari</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase font-semibold">Alasan perubahan</span>
                <p className="font-medium text-slate-700 truncate">{cr.reason}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase font-semibold">Versi acuan</span>
                <p className="font-bold text-red-600 text-sm">{cr.resultingBaselineVersion || 'Belum disetujui'}</p>
              </div>
            </div>

            {cr.status === 'PENDING' && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  disabled={busyId === cr.id}
                  onClick={() => handleApprove(cr.project.id, cr.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {busyId === cr.id ? 'Menyimpan…' : 'Setujui perubahan'}
                </button>
              </div>
            )}
          </div>
        ))}

        {allCRs.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
            <GitPullRequest className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum ada permintaan perubahan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Ajukan perubahan dari rincian proyek untuk mencatat pekerjaan tambahan, perubahan nilai, atau tenggat baru.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
