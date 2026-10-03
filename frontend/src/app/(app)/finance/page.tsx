'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, DollarSign, AlertCircle, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project, InvoiceItem } from '@/types';
import { formatCompactRupiah, formatRupiah, formatDate } from '@/lib/utils';
import { BillingBadge } from '@/components/shared/Badge';

export default function FinancePage() {
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

  const totalContract = projects.reduce((a, b) => a + (b.contractValue || 0), 0);
  const totalBillable = projects.reduce((a, b) => a + (b.billableValue || 0), 0);
  const totalBilled = projects.reduce((a, b) => a + (b.billedValue || 0), 0);
  const totalPaid = projects.reduce((a, b) => a + (b.paidValue || 0), 0);
  const totalUnbilled = Math.max(0, totalBillable - totalBilled);

  // Aggregate all invoices
  const allInvoices: (InvoiceItem & { projectName: string })[] = [];
  projects.forEach((p) => {
    (p.invoices || []).forEach((inv) => {
      allInvoices.push({ ...inv, projectName: p.name });
    });
  });

  const handleInvoiceMilestone = (projectId: string, milestoneId: string) => {
    storageService.createInvoice(projectId, milestoneId);
    loadData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance & Value Realization</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau gap antara hak tagih kontrak (billable) dengan realisasi invoice & pembayaran kas masuk.
        </p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Nilai Kontrak</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCompactRupiah(totalContract)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Seluruh portofolio</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20">
          <span className="text-[10px] font-bold uppercase text-blue-700">Hak Tagih (Billable)</span>
          <p className="text-xl font-bold text-blue-900 mt-1">{formatCompactRupiah(totalBillable)}</p>
          <span className="text-[11px] text-blue-600 mt-1 block">Milestone tervalidasi</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20">
          <span className="text-[10px] font-bold uppercase text-indigo-700">Sudah Ditagihkan</span>
          <p className="text-xl font-bold text-indigo-900 mt-1">{formatCompactRupiah(totalBilled)}</p>
          <span className="text-[11px] text-indigo-600 mt-1 block">Invoice terbit</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-300 bg-amber-50/40">
          <span className="text-[10px] font-bold uppercase text-amber-800">Uang Macet (Unbilled)</span>
          <p className="text-xl font-bold text-amber-900 mt-1">{formatCompactRupiah(totalUnbilled)}</p>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">Selesai tapi belum invoice!</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase text-emerald-700">Kas Diterima (Paid)</span>
          <p className="text-xl font-bold text-emerald-900 mt-1">{formatCompactRupiah(totalPaid)}</p>
          <span className="text-[11px] text-emerald-600 mt-1 block">Lunas masuk rekening</span>
        </div>
      </div>

      {/* Unbilled Milestones Action Board */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Termin Selesai Butuh Ditagihkan (Action Required)</h3>
            <p className="text-xs text-slate-500">Milestone teknis telah selesai diverifikasi, segera terbitkan invoice.</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Unbilled Gap: {formatRupiah(totalUnbilled)}
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
                  <Link href={`/projects/${proj.id}`} className="text-xs font-semibold text-blue-600 hover:underline">
                    Buka Project
                  </Link>
                </div>

                <div className="space-y-2">
                  {unbilledMilestones.map((m) => (
                    <div key={m.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-800">{m.title}</strong>
                        <p className="text-slate-400 text-[11px]">Selesai pada: {m.completionDate ? formatDate(m.completionDate) : 'Baru saja'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatRupiah(m.value)}</span>
                        <button
                          onClick={() => handleInvoiceMilestone(proj.id, m.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
                        >
                          Buat & Kirim Invoice
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
              Tidak ada termin selesai yang tertunda penagihannya. Realisasi billing optimal!
            </div>
          )}
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Riwayat Faktur / Invoice Penagihan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">No. Invoice</th>
                <th className="py-3 px-3">Project</th>
                <th className="py-3 px-3">Milestone</th>
                <th className="py-3 px-3">Nominal (Rp)</th>
                <th className="py-3 px-3">Tanggal Terbit</th>
                <th className="py-3 px-3">Jatuh Tempo</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Belum ada riwayat faktur / invoice yang diterbitkan.
                  </td>
                </tr>
              ) : (
                allInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{inv.projectName}</td>
                    <td className="py-3 px-3 text-slate-600">{inv.milestoneTitle || '-'}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{formatRupiah(inv.amount)}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {inv.status}
                      </span>
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
