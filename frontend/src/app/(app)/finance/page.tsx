'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, DollarSign, AlertCircle, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { useProjects } from '@/hooks/useClaraData';
import { Project, InvoiceItem } from '@/types';
import { formatCompactRupiah, formatRupiah, formatDate } from '@/lib/utils';
import { BillingBadge } from '@/components/shared/Badge';

export default function FinancePage() {
  const { projects, refreshProjects, loading, error } = useProjects();
  const [busyMilestoneId, setBusyMilestoneId] = React.useState<string | null>(null);
  const [busyPaymentId, setBusyPaymentId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  const totalContract = projects.reduce((a, b) => a + (b.contractValue || 0), 0);
  const totalBillable = projects.reduce((a, b) => a + (b.billableValue || 0), 0);
  const totalBilled = projects.reduce((a, b) => a + (b.billedValue || 0), 0);
  const totalPaid = projects.reduce((a, b) => a + (b.paidValue || 0), 0);
  const totalUnbilled = Math.max(0, totalBillable - totalBilled);

  // Aggregate all invoices
  const allInvoices: (InvoiceItem & { projectName: string; projectId: string })[] = [];
  projects.forEach((p) => {
    (p.invoices || []).forEach((inv) => {
      allInvoices.push({ ...inv, projectName: p.name, projectId: p.id });
    });
  });

  const handleInvoiceMilestone = async (projectId: string, milestoneId: string) => {
    setBusyMilestoneId(milestoneId);
    setActionError(null);
    setActionNotice(null);
    try {
      await dataClient.createInvoice(projectId, milestoneId);
      await refreshProjects();
      setActionNotice('Tagihan berhasil dicatat untuk tahap pekerjaan ini.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal membuat tagihan.');
    } finally {
      setBusyMilestoneId(null);
    }
  };

  const handleRecordPayment = async (projectId: string, invoiceId: string) => {
    if (confirm('Catat tagihan ini sebagai lunas dalam data demo?')) {
      setBusyPaymentId(invoiceId);
      setActionError(null);
      setActionNotice(null);
      try {
        await dataClient.recordPayment(projectId, invoiceId);
        await refreshProjects();
        setActionNotice('Pembayaran berhasil dicatat lunas.');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Gagal mencatat pembayaran.');
      } finally {
        setBusyPaymentId(null);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16 relative">
      {(actionError || actionNotice) && (
        <div className="fixed top-4 right-4 z-[70] max-w-md w-full shadow-lg rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {actionError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Gagal Melakukan Aksi</p>
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
      <div>
        <h1 className="font-heading text-2xl font-bold text-zinc-950 tracking-tight">Keuangan proyek</h1>
        <p className="text-sm text-slate-500 mt-1">
          Lihat nilai pekerjaan yang siap ditagih, tagihan tercatat, dan pembayaran dalam data demo.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Gagal memuat data keuangan: {error}</p>}
      {loading && <p className="rounded-xl bg-white p-4 text-sm text-zinc-500">Memuat data keuangan…</p>}

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-400">Total Nilai Kontrak</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCompactRupiah(totalContract)}</p>
          <span className="text-xs text-slate-400 mt-1 block">Seluruh portofolio</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-200 bg-red-50/20">
          <span className="text-xs font-bold uppercase text-red-700">Siap ditagih</span>
          <p className="text-xl font-bold text-zinc-900 mt-1">{formatCompactRupiah(totalBillable)}</p>
          <span className="text-xs text-red-600 mt-1 block">Tahap pekerjaan selesai</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-orange-200">
          <span className="text-xs font-bold uppercase text-orange-800">Sudah ditagih</span>
          <p className="text-xl font-bold text-zinc-900 mt-1">{formatCompactRupiah(totalBilled)}</p>
          <span className="text-xs text-orange-700 mt-1 block">Tagihan tercatat</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-300 bg-amber-50/40">
          <span className="text-xs font-bold uppercase text-amber-800">Siap, belum ditagih</span>
          <p className="text-xl font-bold text-amber-900 mt-1">{formatCompactRupiah(totalUnbilled)}</p>
          <span className="text-xs text-amber-700 font-semibold mt-1 block">Tahap selesai tanpa tagihan</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20">
          <span className="text-xs font-bold uppercase text-emerald-700">Sudah dibayar</span>
          <p className="text-xl font-bold text-emerald-900 mt-1">{formatCompactRupiah(totalPaid)}</p>
          <span className="text-xs text-emerald-600 mt-1 block">Pembayaran dicatat dalam demo</span>
        </div>
      </div>

      {/* Unbilled Milestones Action Board */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tahap siap ditagih</h3>
            <p className="text-sm text-slate-500">Tahap pekerjaan selesai yang belum memiliki tagihan.</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Belum ditagih: {formatRupiah(totalUnbilled)}
          </span>
        </div>

        <div className="space-y-3">
          {projects.map((proj) => {
            const unbilledMilestones = (proj.agreementBaseline?.milestones || []).filter(
              (m) => m.status === 'COMPLETED' && m.billingStatus === 'UNBILLED'
            );

            if (unbilledMilestones.length === 0) return null;

            return (
              <div key={proj.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{proj.name}</h4>
                    <p className="text-xs text-slate-500">{proj.client}</p>
                  </div>
                  <Link href={`/projects/${proj.id}`} className="text-xs font-semibold text-red-600 hover:underline">
                    Buka proyek
                  </Link>
                </div>

                <div className="space-y-2">
                  {unbilledMilestones.map((m) => (
                    <div key={m.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-800">{m.title}</strong>
                        <p className="text-slate-400 text-xs">Selesai pada: {m.completionDate ? formatDate(m.completionDate) : 'Baru saja'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatRupiah(m.value)}</span>
                        <button
                          disabled={busyMilestoneId === m.id}
                          onClick={() => handleInvoiceMilestone(proj.id, m.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs shadow-sm transition-all"
                        >
                          {busyMilestoneId === m.id ? 'Menyimpan…' : 'Buat tagihan'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {totalUnbilled === 0 && (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              Belum ada tahap selesai yang menunggu tagihan.
            </div>
          )}
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Riwayat tagihan</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-xs tracking-wider">
                <th className="py-3 px-3">No. tagihan</th>
                <th className="py-3 px-3">Proyek</th>
                <th className="py-3 px-3">Tahap pekerjaan</th>
                <th className="py-3 px-3">Nominal (Rp)</th>
                <th className="py-3 px-3">Tanggal Terbit</th>
                <th className="py-3 px-3">Jatuh Tempo</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Belum ada tagihan tercatat.
                  </td>
                </tr>
              ) : (
                allInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-red-600">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{inv.projectName}</td>
                    <td className="py-3 px-3 text-slate-600">{inv.milestoneTitle || '-'}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{formatRupiah(inv.amount)}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-800'
                      }`}>
                        {inv.status === 'PAID' ? 'Lunas' : inv.status === 'OVERDUE' || (inv.status === 'SENT' && inv.dueDate < new Date().toISOString().slice(0, 10)) ? 'Lewat jatuh tempo' : inv.status === 'DRAFT' ? 'Draf' : 'Tercatat'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {inv.status !== 'PAID' ? (
                        <button
                          disabled={busyPaymentId === inv.id}
                          onClick={() => handleRecordPayment(inv.projectId, inv.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-md text-xs shadow-xs transition-colors whitespace-nowrap"
                        >
                          {busyPaymentId === inv.id ? 'Mencatat...' : 'Catat Lunas'}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">Tuntas</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
