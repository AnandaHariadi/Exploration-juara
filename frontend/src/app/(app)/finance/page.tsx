'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Receipt, DollarSign, AlertCircle, ArrowUpRight, CheckCircle2, Clock, FileSpreadsheet, Printer, Download, Eye, X, FileText } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { useProjects } from '@/hooks/useClaraData';
import { Project, InvoiceItem } from '@/types';
import { formatCompactRupiah, formatRupiah, formatDate } from '@/lib/utils';
import { BillingBadge } from '@/components/shared/Badge';
import * as XLSX from 'xlsx';

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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportExcel = () => {
    const today = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });
    const isoDate = new Date().toISOString().slice(0, 10);

    // Create a native Excel workbook using SheetJS (.xlsx)
    const wb = XLSX.utils.book_new();

    // Sheet 1: Master Posisi Keuangan & Rekonsiliasi
    const sheetData: (string | number)[][] = [
      ['LAPORAN POSISI KEUANGAN & REKONSILIASI KONTRAK'],
      ['CLARA CONTRACT INTELLIGENCE & VALUE ASSURANCE'],
      [`Tanggal Laporan: ${today} | Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} | Proyek: ${projects.length}`],
      [],
      ['NAMA AKUN / INDIKATOR', 'TARGET / BASELINE (IDR)', 'REALISASI SAAT INI (IDR)', 'SELISIH / MARGIN (IDR)'],
      ['I. PENDAPATAN & ARUS KAS KONTRAK', '', '', ''],
      ['Total Nilai Kontrak Kesepakatan (PKS)', totalContract, totalContract, 0],
      ['Pekerjaan Selesai Siap Ditagih', totalContract, totalBillable, totalContract - totalBillable],
      ['Tagihan Diterbitkan (Invoiced)', totalBillable, totalBilled, totalBillable - totalBilled],
      ['Pendapatan Belum Ditagih (Unbilled)', 0, totalUnbilled, totalUnbilled],
      ['Penerimaan Kas Lunas (Cash Inflow)', totalBilled, totalPaid, totalBilled - totalPaid],
      ['TOTAL PENDAPATAN & KONTRAK', totalContract, totalBillable, totalPaid],
      [],
      ['II. RINCIAN BIAYA PELAKSANAAN & MARGIN PROYEK', '', '', ''],
      ['No', 'Nama Proyek', 'Klien', 'Nilai Kontrak (IDR)', 'Rencana Biaya (IDR)', 'Biaya Aktual (IDR)', 'Margin Biaya (IDR)', 'Progres (%)', 'Status'],
      ...projects.map((p, idx) => [
        idx + 1,
        p.name,
        p.client,
        p.contractValue || 0,
        p.plannedCost || 0,
        p.actualCost || 0,
        (p.plannedCost || 0) - (p.actualCost || 0),
        `${p.progress}%`,
        p.status
      ]),
      ['TOTAL BIAYA PORTOFOLIO', '', '', totalContract, projects.reduce((s, p) => s + (p.plannedCost || 0), 0), projects.reduce((s, p) => s + (p.actualCost || 0), 0), projects.reduce((s, p) => s + ((p.plannedCost || 0) - (p.actualCost || 0)), 0), '', ''],
      [],
      ['III. BUKU PEMBANTU PIUTANG & INVOICE', '', '', ''],
      ['No. Invoice', 'Nama Proyek', 'Milestone / Tahap', 'Nominal Tagihan (IDR)', 'Tanggal Terbit', 'Jatuh Tempo', 'Status Pembayaran'],
      ...allInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.projectName,
        inv.milestoneTitle || '-',
        inv.amount || 0,
        inv.issueDate,
        inv.dueDate,
        inv.status === 'PAID' ? 'LUNAS' : 'TERCATAT'
      ]),
      ['TOTAL BUKU TAGIHAN (AR)', '', '', totalBilled, '', '', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 42 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 14 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Posisi Keuangan');

    // Trigger direct download of genuine .xlsx file
    XLSX.writeFile(wb, `Rekap_Keuangan_CLARA_${isoDate}.xlsx`);
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
    <div className="space-y-8 pb-16 relative">
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
          <span className="text-xs font-bold uppercase text-amber-800">Belum ditagih</span>
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

      {/* Pre-Download Financial Report Live Preview Modal via Portal to cover full viewport */}
      {mounted && showPreviewModal && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-900/10 backdrop-blur-[3px] transition-all animate-in fade-in duration-200">
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
              {/* Official Corporate Letterhead (Kop Surat Resmi) */}
              <div className="border-b-2 border-zinc-900 pb-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                  {/* Brand & Corporate Entity */}
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/clara_logo_full.png"
                      alt="CLARA"
                      width={130}
                      height={30}
                      className="h-7 w-auto object-contain"
                    />
                    <div className="border-l-2 border-zinc-300 pl-3 hidden sm:block">
                      <p className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider leading-none">Contract Intelligence</p>
                      <p className="text-[10px] text-zinc-500 font-medium mt-1 leading-none">&amp; Value Assurance Platform</p>
                    </div>
                  </div>

                  {/* Metadata & Classification */}
                  <div className="text-center sm:text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                      Dokumen Resmi Perusahaan
                    </span>
                    <p className="text-[11px] text-zinc-600 font-medium mt-1">
                      Periode: <span className="font-bold text-zinc-900">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                    </p>
                    <p className="text-[10px] text-zinc-400">Portofolio {projects.length} Proyek Aktif</p>
                  </div>
                </div>

                {/* Document Title Header */}
                <div className="mt-3 pt-3 border-t border-zinc-200 text-center">
                  <h2 className="font-heading font-black text-lg sm:text-xl text-zinc-950 uppercase tracking-tight">
                    LAPORAN POSISI KEUANGAN &amp; REKONSILIASI KONTRAK
                  </h2>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mt-0.5">
                    Konsolidasi Hak Tagih, Realisasi Biaya, dan Pengelolaan Piutang Proyek
                  </p>
                </div>
              </div>

              {/* Master Accounting Table (Matching Official Financial Statement Reference) */}
              <div className="border-2 border-zinc-900 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  {/* Table Header with Red to Orange Gradient */}
                  <thead>
                    <tr className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white font-heading font-bold text-xs uppercase tracking-wider">
                      <th className="py-3 px-3.5 border-r border-red-500/50 w-2/5">NAMA AKUN / INDIKATOR</th>
                      <th className="py-3 px-3.5 border-r border-red-500/50 text-right w-1/5">TARGET / BASELINE</th>
                      <th className="py-3 px-3.5 border-r border-red-500/50 text-right w-1/5">REALISASI SAAT INI</th>
                      <th className="py-3 px-3.5 text-right w-1/5">SELISIH / MARGIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {/* SECTION 1: POSISI PENDAPATAN & ARUS KAS (AKTIVA STYLE) */}
                    <tr className="bg-orange-100/90 text-orange-950 font-bold uppercase text-[11px] tracking-wide border-t-2 border-zinc-900">
                      <td colSpan={4} className="py-2 px-3.5">I. PENDAPATAN &amp; ARUS KAS KONTRAK</td>
                    </tr>
                    <tr className="bg-orange-50/40 font-semibold text-zinc-800 text-[11px]">
                      <td colSpan={4} className="py-1 px-3.5">Realisasi Hak Tagih &amp; Nilai Portofolio</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/80">
                      <td className="py-2.5 px-3.5 pl-6 font-medium text-zinc-900">Total Nilai Kontrak Kesepakatan (PKS)</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-semibold text-zinc-900">{formatRupiah(totalContract)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-semibold text-zinc-800">{formatRupiah(totalContract)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-400 font-normal">Rp 0</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/80">
                      <td className="py-2.5 px-3.5 pl-6 font-medium text-zinc-900">Pekerjaan Selesai Siap Ditagih</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-600">{formatRupiah(totalContract)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-red-600">{formatRupiah(totalBillable)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-medium text-red-700">{formatRupiah(totalContract - totalBillable)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/80">
                      <td className="py-2.5 px-3.5 pl-6 font-medium text-zinc-900">Tagihan Diterbitkan (Invoiced)</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-600">{formatRupiah(totalBillable)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-zinc-900">{formatRupiah(totalBilled)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-600">{formatRupiah(totalBillable - totalBilled)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/80">
                      <td className="py-2.5 px-3.5 pl-6 font-medium text-zinc-900">Pendapatan Belum Ditagih (Unbilled Revenue)</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-400 font-normal">Rp 0</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-semibold text-amber-800">{formatRupiah(totalUnbilled)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-semibold text-amber-800">{formatRupiah(totalUnbilled)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/80">
                      <td className="py-2.5 px-3.5 pl-6 font-medium text-zinc-900">Penerimaan Kas Lunas (Cash Inflow)</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-600">{formatRupiah(totalBilled)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-emerald-700">{formatRupiah(totalPaid)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-medium text-emerald-800">{formatRupiah(totalBilled - totalPaid)}</td>
                    </tr>
                    {/* Subtotal Section 1 with Accounting Double Bottom Line */}
                    <tr className="bg-zinc-100/90 font-bold border-t-2 border-zinc-800 border-b-4 border-double border-zinc-900 text-zinc-950">
                      <td className="py-2.5 px-3.5 uppercase font-heading text-xs tracking-tight">TOTAL PENDAPATAN &amp; KONTRAK</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold">{formatRupiah(totalContract)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-red-600">{formatRupiah(totalBillable)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-emerald-700">{formatRupiah(totalPaid)}</td>
                    </tr>

                    {/* SECTION 2: BIAYA & MARGIN PELAKSANAAN PROYEK */}
                    <tr className="bg-orange-100/90 text-orange-950 font-bold uppercase text-[11px] tracking-wide border-t-2 border-zinc-900">
                      <td colSpan={4} className="py-2 px-3.5">II. RINCIAN BIAYA PELAKSANAAN &amp; MARGIN PROYEK</td>
                    </tr>
                    {projects.map((p, idx) => {
                      const planned = p.plannedCost || 0;
                      const actual = p.actualCost || 0;
                      const marginDiff = planned - actual;
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/80">
                          <td className="py-2.5 px-3.5 pl-6">
                            <span className="font-semibold text-zinc-900">{idx + 1}. {p.name}</span>
                            <span className="block text-[11px] text-zinc-500 font-normal">Klien: {p.client} &bull; Progres: {p.progress}%</span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-700">{formatRupiah(planned)}</td>
                          <td className="py-2.5 px-3.5 text-right tabular-nums font-semibold text-zinc-900">{formatRupiah(actual)}</td>
                          <td className={`py-2.5 px-3.5 text-right tabular-nums font-semibold ${marginDiff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {marginDiff >= 0 ? `+${formatRupiah(marginDiff)}` : formatRupiah(marginDiff)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Subtotal Section 2 with Double Bottom Line */}
                    <tr className="bg-zinc-100/90 font-bold border-t-2 border-zinc-800 border-b-4 border-double border-zinc-900 text-zinc-950">
                      <td className="py-2.5 px-3.5 uppercase font-heading text-xs tracking-tight">TOTAL RENCANA &amp; REALISASI BIAYA</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold">{formatRupiah(projects.reduce((s, p) => s + (p.plannedCost || 0), 0))}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-zinc-950">{formatRupiah(projects.reduce((s, p) => s + (p.actualCost || 0), 0))}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-emerald-700">
                        {formatRupiah(projects.reduce((s, p) => s + ((p.plannedCost || 0) - (p.actualCost || 0)), 0))}
                      </td>
                    </tr>

                    {/* SECTION 3: BUKU PIUTANG & DAFTAR TAGIHAN */}
                    <tr className="bg-orange-100/90 text-orange-950 font-bold uppercase text-[11px] tracking-wide border-t-2 border-zinc-900">
                      <td colSpan={4} className="py-2 px-3.5">III. BUKU PEMBANTU PIUTANG &amp; INVOICE</td>
                    </tr>
                    {allInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50/80">
                        <td className="py-2.5 px-3.5 pl-6">
                          <span className="font-semibold text-red-600 mr-2">{inv.invoiceNumber}</span>
                          <span className="text-zinc-900 font-medium">{inv.projectName}</span>
                          <span className="block text-[11px] text-zinc-500 font-normal">Tahap: {inv.milestoneTitle || '-'} &bull; JT: {inv.dueDate}</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-600">{formatRupiah(inv.amount)}</td>
                        <td className="py-2.5 px-3.5 text-right tabular-nums font-semibold text-zinc-900">
                          {inv.status === 'PAID' ? formatRupiah(inv.amount) : <span className="text-zinc-400 font-normal">Rp 0</span>}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {inv.status === 'PAID' ? 'LUNAS' : 'TERCATAT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Final Grand Total Row */}
                    <tr className="bg-orange-50 font-bold border-t-2 border-zinc-900 border-b-4 border-double border-zinc-950 text-zinc-950">
                      <td className="py-2.5 px-3.5 uppercase font-heading text-xs tracking-tight text-red-700">TOTAL BUKU TAGIHAN (ACCOUNTS RECEIVABLE)</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold">{formatRupiah(totalBilled)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-emerald-700">{formatRupiah(totalPaid)}</td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold text-amber-700">{formatRupiah(totalBilled - totalPaid)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-zinc-500">
                Ukuran file optimal &amp; ringan: Excel (.xlsx) &plusmn; 12 KB | PDF Vektor &plusmn; 50 KB
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh Excel (.xlsx)</span>
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
        </div>,
        document.body
      )}
    </div>
  );
}
