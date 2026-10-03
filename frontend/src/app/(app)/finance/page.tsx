'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Receipt, DollarSign, AlertCircle, ArrowUpRight, CheckCircle2, Clock, FileSpreadsheet, Printer, Download, Eye, X, FileText } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { useDashboardSummary, useProjects } from '@/hooks/useClaraData';
import { formatCompactRupiah, formatDate, formatRupiah } from '@/lib/utils';
import { btn, EmptyState, Metric, NoticeBar, Panel, useNotice } from '@/components/shared/ui';
import { invoiceStatus } from '@/components/project/FinanceTab';

export default function FinancePage() {
  const { projects, loading, error, refreshProjects } = useProjects();
  const { summary } = useDashboardSummary();
  const { notice, run, clear } = useNotice();
  const [busy, setBusy] = React.useState<string | null>(null);
  const active = projects.filter((p) => p.metrics.hasBaseline);

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

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Rekapitulasi Keuangan CLARA</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; }
  table { border-collapse: collapse; }
  .title-main { font-size: 14pt; font-weight: bold; color: #dc2626; padding: 10px 0; }
  .meta-info { font-size: 9pt; color: #475569; padding-bottom: 12px; }
  .section-header { background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 8px 12px; border: 1px solid #0f172a; }
  .th-sub { background-color: #f1f5f9; color: #1e293b; font-weight: bold; font-size: 9.5pt; border: 1px solid #cbd5e1; padding: 6px 10px; }
  .th-brand { background-color: #dc2626; color: #ffffff; font-weight: bold; font-size: 9.5pt; border: 1px solid #b91c1c; padding: 6px 10px; }
  td { border: 1px solid #e2e8f0; padding: 6px 10px; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: bold; }
  .bg-alt { background-color: #f8fafc; }
  .status-paid { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
  .status-unpaid { background-color: #ffedd5; color: #c2410c; font-weight: bold; text-align: center; }
</style>
</head>
<body>
<table>
  <tr><td colspan="8" class="title-main">REKAPITULASI LAPORAN KEUANGAN PORTOFOLIO - CLARA CONTRACT INTELLIGENCE</td></tr>
  <tr><td colspan="8" class="meta-info">Tanggal Laporan: ${today} &nbsp;|&nbsp; Entitas: CLARA Value Assurance &amp; Contract Intelligence Platform</td></tr>
  <tr></tr>

  <tr><th colspan="4" class="section-header">RINGKASAN METRIK KEUANGAN PORTOFOLIO</th></tr>
  <tr class="bg-alt"><td class="font-bold" colspan="2">Total Nilai Kontrak Seluruh Proyek</td><td class="text-right font-bold" colspan="2">Rp ${totalContract.toLocaleString('id-ID')}</td></tr>
  <tr><td class="font-bold" colspan="2">Total Nilai Pekerjaan Siap Ditagih</td><td class="text-right font-bold" colspan="2">Rp ${totalBillable.toLocaleString('id-ID')}</td></tr>
  <tr class="bg-alt"><td class="font-bold" colspan="2">Total Tagihan Tercatat (Invoiced)</td><td class="text-right font-bold" colspan="2">Rp ${totalBilled.toLocaleString('id-ID')}</td></tr>
  <tr><td class="font-bold" colspan="2">Total Belum Ditagih (Unbilled)</td><td class="text-right font-bold" colspan="2">Rp ${totalUnbilled.toLocaleString('id-ID')}</td></tr>
  <tr class="bg-alt"><td class="font-bold" colspan="2">Total Realisasi Pembayaran Diterima</td><td class="text-right font-bold" colspan="2">Rp ${totalPaid.toLocaleString('id-ID')}</td></tr>
  <tr></tr>

  <tr><th colspan="8" class="section-header">RINCIAN KEUANGAN PER PROYEK</th></tr>
  <tr>
    <th class="th-brand text-center">No</th>
    <th class="th-brand">Nama Proyek</th>
    <th class="th-brand">Klien</th>
    <th class="th-brand text-right">Nilai Kontrak</th>
    <th class="th-brand text-right">Rencana Biaya</th>
    <th class="th-brand text-right">Biaya Aktual</th>
    <th class="th-brand text-center">Progres</th>
    <th class="th-brand text-center">Status</th>
  </tr>
  ${projects.map((p, idx) => `
  <tr class="${idx % 2 === 1 ? 'bg-alt' : ''}">
    <td class="text-center">${idx + 1}</td>
    <td class="font-bold">${p.name}</td>
    <td>${p.client}</td>
    <td class="text-right font-bold">Rp ${p.contractValue.toLocaleString('id-ID')}</td>
    <td class="text-right">Rp ${p.plannedCost.toLocaleString('id-ID')}</td>
    <td class="text-right">Rp ${p.actualCost.toLocaleString('id-ID')}</td>
    <td class="text-center font-bold">${p.progress}%</td>
    <td class="text-center">${p.status}</td>
  </tr>
  `).join('')}
  <tr></tr>

  <tr><th colspan="7" class="section-header">DAFTAR TAGIHAN &amp; PENERIMAAN (INVOICES)</th></tr>
  <tr>
    <th class="th-brand text-center">No. Invoice</th>
    <th class="th-brand">Nama Proyek</th>
    <th class="th-brand">Milestone / Tahap</th>
    <th class="th-brand text-right">Nominal Tagihan</th>
    <th class="th-brand text-center">Tanggal Terbit</th>
    <th class="th-brand text-center">Jatuh Tempo</th>
    <th class="th-brand text-center">Status Pembayaran</th>
  </tr>
  ${allInvoices.map((inv, idx) => `
  <tr class="${idx % 2 === 1 ? 'bg-alt' : ''}">
    <td class="font-bold text-center">${inv.invoiceNumber}</td>
    <td class="font-bold">${inv.projectName}</td>
    <td>${inv.milestoneTitle || '-'}</td>
    <td class="text-right font-bold">Rp ${inv.amount.toLocaleString('id-ID')}</td>
    <td class="text-center">${inv.issueDate}</td>
    <td class="text-center">${inv.dueDate}</td>
    <td class="${inv.status === 'PAID' ? 'status-paid' : 'status-unpaid'}">${inv.status === 'PAID' ? 'LUNAS' : 'TERCATAT'}</td>
  </tr>
  `).join('')}
</table>
</body>
</html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Keuangan_CLARA_${isoDate}.xls`);
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

  const ready = active.flatMap((p) => p.agreementBaseline.milestones.filter((m) => m.status === 'COMPLETED' && (m.billedAmount ?? 0) < m.value).map((m) => ({ p, m, remaining: m.value - (m.billedAmount ?? 0) })));
  const invoices = active.flatMap((p) => p.invoices.map((inv) => ({ p, inv, paid: p.payments.filter((x) => x.invoiceId === inv.id).reduce((s, x) => s + x.amount, 0) })));

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

      <Panel title="Tahap siap ditagih" description="Tahap selesai yang belum ditagih penuh. CLARA hanya mencatat tagihan; pengiriman ke klien tetap keputusan Anda.">
        {ready.length === 0 ? (
          <EmptyState title="Tidak ada tahap yang menunggu tagihan" />
        ) : (
          <ul className="space-y-2">
            {ready.map(({ p, m, remaining }) => (
              <li key={`${p.id}-${m.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-sm">
                <div>
                  <Link href={`/projects/${p.id}?tab=finance`} className="text-xs font-semibold text-zinc-500 hover:text-red-700">{p.name}</Link>
                  <p className="font-semibold text-zinc-900">{m.title}</p>
                  <p className="text-xs text-zinc-500">Selesai {m.completionDate ? formatDate(m.completionDate) : '-'} · syarat: {m.trigger}</p>
                </div>
                <span className="font-bold text-amber-900">{formatRupiah(remaining)}</span>
                <button type="button" disabled={busy !== null} onClick={() => { if (window.confirm(`Catat tagihan ${formatRupiah(remaining)} untuk ${m.title}?`)) void act(m.id, () => dataClient.createInvoice(p.id, m.id), `Tagihan ${m.title} dicatat.`); }} className={btn.primary}>
                  {busy === m.id ? 'Menyimpan…' : 'Buat tagihan'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

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
        )}
      </Panel>

      <Panel title="Biaya aktual vs RAB" description="Selisih biaya = aktual − rencana. Positif berarti di atas rencana.">
        {active.length === 0 ? (
          <EmptyState title="Belum ada proyek dengan acuan aktif" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500"><th className="py-2 pr-3">Proyek</th><th className="py-2 pr-3">RAB</th><th className="py-2 pr-3">Aktual</th><th className="py-2 pr-3">Pemakaian</th><th className="py-2 pr-3">Progres</th><th className="py-2">Selisih</th></tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {active.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3"><Link href={`/projects/${p.id}?tab=finance`} className="font-semibold hover:text-red-700">{p.name}</Link></td>
                    <td className="py-2.5 pr-3">{formatRupiah(p.metrics.plannedCost)}</td>
                    <td className="py-2.5 pr-3">{formatRupiah(p.metrics.actualCost)}</td>
                    <td className="py-2.5 pr-3">{p.metrics.budgetUtilization === null ? 'Tidak tersedia' : `${p.metrics.budgetUtilization.toLocaleString('id-ID')}%`}</td>
                    <td className="py-2.5 pr-3">{p.metrics.progress}%</td>
                    <td className={`py-2.5 font-semibold ${p.metrics.budgetVariance > 0 ? 'text-red-700' : 'text-zinc-900'}`}>{p.metrics.budgetVariance >= 0 ? '+' : ''}{formatRupiah(p.metrics.budgetVariance)}</td>
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
                  onClick={handleExportExcel}
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
        </div>,
        document.body
      )}
    </div>
  );
}
