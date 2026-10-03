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
        </div>,
        document.body
      )}
    </div>
  );
}
