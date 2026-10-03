'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Receipt, DollarSign, AlertCircle, ArrowUpRight, CheckCircle2, Clock, FileSpreadsheet, Printer, Download, Eye, X, FileText } from 'lucide-react';
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

  const [showPreviewModal, setShowPreviewModal] = React.useState(false);

  const handleExportCsv = () => {
    const rows: string[][] = [];
    rows.push(['REKAPITULASI LAPORAN KEUANGAN PORTOFOLIO - CLARA CONTRACT INTELLIGENCE']);
    rows.push([`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`]);
    rows.push([]);
    rows.push(['RINGKASAN METRIK KEUANGAN']);
    rows.push(['Total Nilai Kontrak', `Rp ${totalContract.toLocaleString('id-ID')}`]);
    rows.push(['Total Siap Ditagih', `Rp ${totalBillable.toLocaleString('id-ID')}`]);
    rows.push(['Total Tagihan Tercatat', `Rp ${totalBilled.toLocaleString('id-ID')}`]);
    rows.push(['Total Belum Ditagih (Unbilled)', `Rp ${totalUnbilled.toLocaleString('id-ID')}`]);
    rows.push(['Total Pembayaran Lunas', `Rp ${totalPaid.toLocaleString('id-ID')}`]);
    rows.push([]);
    rows.push(['RINCIAN KEUANGAN PROYEK']);
    rows.push(['No', 'Nama Proyek', 'Klien', 'Nilai Kontrak', 'Rencana Biaya', 'Biaya Aktual', 'Progres', 'Status']);
    projects.forEach((p, idx) => {
      rows.push([
        String(idx + 1),
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.client.replace(/"/g, '""')}"`,
        `Rp ${p.contractValue.toLocaleString('id-ID')}`,
        `Rp ${p.plannedCost.toLocaleString('id-ID')}`,
        `Rp ${p.actualCost.toLocaleString('id-ID')}`,
        `${p.progress}%`,
        p.status
      ]);
    });
    rows.push([]);
    rows.push(['RINCIAN INVOICE / TAGIHAN']);
    rows.push(['No Invoice', 'Nama Proyek', 'Milestone', 'Nominal Tagihan', 'Tanggal Terbit', 'Jatuh Tempo', 'Status']);
    allInvoices.forEach((inv) => {
      rows.push([
        inv.invoiceNumber,
        `"${inv.projectName.replace(/"/g, '""')}"`,
        `"${(inv.milestoneTitle || '-').replace(/"/g, '""')}"`,
        `Rp ${inv.amount.toLocaleString('id-ID')}`,
        inv.issueDate,
        inv.dueDate,
        inv.status === 'PAID' ? 'Lunas' : 'Belum Lunas'
      ]);
    });

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Keuangan_CLARA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-zinc-950 tracking-tight">Keuangan proyek</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lihat nilai pekerjaan yang siap ditagih, tagihan tercatat, dan pembayaran dalam data demo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm shadow-xs transition-all shrink-0 hover:shadow"
        >
          <FileSpreadsheet className="w-4 h-4 text-white" />
          <span>Pratinjau &amp; Ekspor Rekap</span>
        </button>
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

      {/* Pre-Download Financial Report Live Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-transparent animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-zinc-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/clara_logo_full.png"
                  alt="CLARA"
                  width={120}
                  height={28}
                  className="h-6 w-auto object-contain"
                />
                <span className="text-zinc-300">|</span>
                <div>
                  <h2 className="font-heading font-bold text-base text-zinc-950">Pratinjau Rekapitulasi Keuangan</h2>
                  <p className="text-xs text-zinc-500">Periksa ringkasan sebelum mengunduh berkas resmi perusahaan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors"
                aria-label="Tutup pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Printable Document Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-900 text-sm" id="printable-financial-report">
              {/* Report Meta Card */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 block uppercase font-mono tracking-wider">Entitas Perusahaan</span>
                  <strong className="text-zinc-900 text-sm font-semibold">CLARA Contract Intelligence &amp; Value Assurance</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block uppercase font-mono tracking-wider">Tanggal Laporan</span>
                  <span className="text-zinc-800 font-medium">{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block uppercase font-mono tracking-wider">Cakupan Data</span>
                  <span className="text-zinc-800 font-medium">{projects.length} Proyek Portofolio</span>
                </div>
              </div>

              {/* 4 KPIs Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-zinc-200">
                  <span className="text-[11px] font-bold uppercase text-zinc-400 block">Total Kontrak</span>
                  <p className="text-base font-bold text-zinc-950 mt-1">{formatCompactRupiah(totalContract)}</p>
                </div>
                <div className="p-3.5 bg-red-50/40 rounded-xl border border-red-200">
                  <span className="text-[11px] font-bold uppercase text-red-700 block">Siap Ditagih</span>
                  <p className="text-base font-bold text-red-950 mt-1">{formatCompactRupiah(totalBillable)}</p>
                </div>
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold uppercase text-amber-800 block">Belum Ditagih</span>
                  <p className="text-base font-bold text-amber-950 mt-1">{formatCompactRupiah(totalUnbilled)}</p>
                </div>
                <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold uppercase text-emerald-700 block">Sudah Dibayar</span>
                  <p className="text-base font-bold text-emerald-950 mt-1">{formatCompactRupiah(totalPaid)}</p>
                </div>
              </div>

              {/* Table Projects */}
              <div>
                <h3 className="font-heading font-bold text-sm text-zinc-900 mb-2">Rincian Finansial per Proyek</h3>
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-100/80 text-zinc-600 font-semibold border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-3">Nama Proyek</th>
                        <th className="py-2.5 px-3">Klien</th>
                        <th className="py-2.5 px-3">Nilai Kontrak</th>
                        <th className="py-2.5 px-3">Biaya Aktual</th>
                        <th className="py-2.5 px-3 text-center">Progres</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/60">
                          <td className="py-2 px-3 font-semibold text-zinc-900">{p.name}</td>
                          <td className="py-2 px-3 text-zinc-600">{p.client}</td>
                          <td className="py-2 px-3 font-bold text-zinc-950">{formatRupiah(p.contractValue)}</td>
                          <td className="py-2 px-3 text-zinc-700">{formatRupiah(p.actualCost)}</td>
                          <td className="py-2 px-3 text-center font-semibold text-red-600">{p.progress}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Invoices */}
              <div>
                <h3 className="font-heading font-bold text-sm text-zinc-900 mb-2">Daftar Tagihan &amp; Penerimaan</h3>
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-100/80 text-zinc-600 font-semibold border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-3">No. Invoice</th>
                        <th className="py-2.5 px-3">Proyek</th>
                        <th className="py-2.5 px-3">Milestone</th>
                        <th className="py-2.5 px-3">Nominal</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {allInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-zinc-50/60">
                          <td className="py-2 px-3 font-mono font-bold text-red-600">{inv.invoiceNumber}</td>
                          <td className="py-2 px-3 text-zinc-800">{inv.projectName}</td>
                          <td className="py-2 px-3 text-zinc-600">{inv.milestoneTitle || '-'}</td>
                          <td className="py-2 px-3 font-bold text-zinc-950">{formatRupiah(inv.amount)}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {inv.status === 'PAID' ? 'Lunas' : 'Tercatat'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-zinc-500">
                Ukuran file optimal &amp; ringan: Excel &plusmn; 8 KB | PDF Vektor &plusmn; 50 KB
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-3.5 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-200/60 text-zinc-700 font-semibold text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
