'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Receipt, DollarSign, AlertCircle, ArrowUpRight, CheckCircle2, Clock, FileSpreadsheet, Printer, Download, Eye, X, FileText } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { useProjects } from '@/hooks/useClaraData';
import { Project, InvoiceItem } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { baselineAvailability } from '@/lib/baseline';
import { BillingBadge } from '@/components/shared/Badge';
import * as XLSX from 'xlsx-js-style';

export default function FinancePage() {
  const { projects, refreshProjects, loading, error } = useProjects();
  const [busyMilestoneId, setBusyMilestoneId] = React.useState<string | null>(null);
  const [busyPaymentId, setBusyPaymentId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const availableFor = (project: Project) => {
    const active = project.baselines.find((version) => version.status === 'ACTIVE');
    return active ? baselineAvailability(active) : null;
  };

  React.useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  const totalContract = projects.reduce((a, b) => a + (b.contractValue || 0), 0);
  const totalPlannedCost = projects.reduce((total, project) => total + (project.plannedCost || 0), 0);
  const totalActualCost = projects.reduce((total, project) => total + (project.actualCost || 0), 0);
  const actualCostWithRab = projects.filter((project) => availableFor(project)?.budget).reduce((total, project) => total + project.actualCost, 0);
  const budgetCostRecords = projects.filter((project) => availableFor(project)?.budget).reduce((count, project) => count + project.actualCosts.length, 0);
  const totalBillable = projects.reduce((a, b) => a + (b.billableValue || 0), 0);
  const totalBilled = projects.reduce((a, b) => a + (b.billedValue || 0), 0);
  const totalPaid = projects.reduce((a, b) => a + (b.paidValue || 0), 0);
  const totalUnbilled = projects.reduce((total, project) => total + project.metrics.unbilledValue, 0);
  const unbilledStages = projects.flatMap((project) => (availableFor(project)?.billing ? project.agreementBaseline.milestones : [])
    .filter((milestone) => milestone.status === 'COMPLETED' && (milestone.billedAmount ?? 0) < milestone.value)
    .map((milestone) => ({ project, milestone, remaining: milestone.value - (milestone.billedAmount ?? 0) })));

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

    const wb = XLSX.utils.book_new();

    // Palette & Styles
    const borderThin = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    };

    const borderDoubleBottom = {
      top: { style: 'thin', color: { rgb: '0F172A' } },
      bottom: { style: 'double', color: { rgb: '0F172A' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    };

    const ws: any = {};
    const merges: any[] = [];
    let rowIdx = 0;

    const addCell = (r: number, c: number, val: any, style: any, isCurrency = false) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (typeof val === 'number') {
        ws[ref] = {
          t: 'n',
          v: val,
          z: isCurrency ? '"Rp"#,##0;("Rp"#,##0);"-"' : undefined,
          s: style
        };
      } else {
        ws[ref] = {
          t: 's',
          v: String(val ?? ''),
          s: style
        };
      }
    };

    // Row 0: Document Title
    for (let c = 0; c < 4; c++) {
      addCell(rowIdx, c, c === 0 ? 'LAPORAN POSISI KEUANGAN' : '', {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'DC2626' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
    }
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 3 } });
    rowIdx++;

    // Row 1: Company Entity Subtitle
    for (let c = 0; c < 4; c++) {
      addCell(rowIdx, c, c === 0 ? 'CLARA CONTRACT INTELLIGENCE & VALUE ASSURANCE' : '', {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'EA580C' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
    }
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 3 } });
    rowIdx++;

    // Row 2: Metadata
    for (let c = 0; c < 4; c++) {
      addCell(rowIdx, c, c === 0 ? `Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}  |  Portofolio: ${projects.length} Proyek Aktif  |  Dicetak: ${today}` : '', {
        font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '64748B' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
    }
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 3 } });
    rowIdx += 2; // Blank row

    // ==========================================
    // MAIN TABLE HEADERS (Matching Reference Layout)
    // ==========================================
    const headerRowStart = rowIdx;
    // Row 4: Top Group Header
    addCell(headerRowStart, 0, 'NAMA AKUN / INDIKATOR', {
      fill: { fgColor: { rgb: 'DC2626' } }, // Brand Red
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: borderThin
    });
    for (let c = 1; c < 4; c++) {
      addCell(headerRowStart, c, c === 1 ? 'NOMINAL & REALISASI (IDR)' : '', {
        fill: { fgColor: { rgb: 'EA580C' } }, // Brand Orange
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
    }
    merges.push({ s: { r: headerRowStart, c: 0 }, e: { r: headerRowStart + 1, c: 0 } }); // Merge Col A down 2 rows
    merges.push({ s: { r: headerRowStart, c: 1 }, e: { r: headerRowStart, c: 3 } }); // Merge Cols B-D across
    rowIdx++;

    // Row 5: Sub-headers
    addCell(rowIdx, 0, '', {
      fill: { fgColor: { rgb: 'DC2626' } },
      border: borderThin
    });
    const subHeaders = ['ACUAN', 'TERCATAT SAAT INI', 'SELISIH BIAYA / TAGIHAN'];
    subHeaders.forEach((sh, idx) => {
      addCell(rowIdx, idx + 1, sh, {
        fill: { fgColor: { rgb: idx === 0 ? 'E11D48' : idx === 1 ? 'EA580C' : 'F97316' } },
        font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
    });
    rowIdx++;

    // ==========================================
    // SECTION I: PENDAPATAN & ARUS KAS (AKTIVA STYLE)
    // ==========================================
    const sec1BannerRow = rowIdx;
    for (let c = 0; c < 4; c++) {
      addCell(sec1BannerRow, c, c === 0 ? 'I. PENDAPATAN & ARUS KAS KONTRAK' : '', {
        fill: { fgColor: { rgb: 'FFEDD5' } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '7C2D12' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: borderThin
      });
    }
    merges.push({ s: { r: sec1BannerRow, c: 0 }, e: { r: sec1BannerRow, c: 3 } });
    rowIdx++;

    const sec1Items = [
      ['Total Nilai Kontrak Kesepakatan (PKS)', totalContract, totalContract, 0],
      ['Pekerjaan Selesai Siap Ditagih', totalContract, totalBillable, totalContract - totalBillable],
      ['Tagihan Diterbitkan (Invoiced)', totalBillable, totalBilled, totalBillable - totalBilled],
      ['Pendapatan Belum Ditagih (Unbilled Revenue)', 0, totalUnbilled, totalUnbilled],
      ['Penerimaan Kas Lunas (Cash Inflow)', totalBilled, totalPaid, totalBilled - totalPaid]
    ];

    sec1Items.forEach((item, idx) => {
      const isAlt = idx % 2 === 1;
      const rowFill = isAlt ? { fgColor: { rgb: 'F8FAFC' } } : undefined;
      addCell(rowIdx, 0, `  ${item[0]}`, {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, color: { rgb: '1E293B' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: borderThin
      });
      addCell(rowIdx, 1, item[1], {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      addCell(rowIdx, 2, item[2], {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      addCell(rowIdx, 3, item[3], {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, color: item[3] === 0 ? { rgb: '94A3B8' } : { rgb: '0F172A' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      rowIdx++;
    });

    // Subtotal Section 1
    addCell(rowIdx, 0, 'TOTAL PENDAPATAN & KONTRAK', {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderDoubleBottom
    });
    addCell(rowIdx, 1, totalContract, {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);
    addCell(rowIdx, 2, totalBillable, {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'DC2626' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);
    addCell(rowIdx, 3, totalPaid, {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '15803D' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);
    rowIdx += 2;

    // ==========================================
    // SECTION II: BIAYA & MARGIN PROYEK (PASIVA STYLE)
    // ==========================================
    const sec2BannerRow = rowIdx;
    for (let c = 0; c < 4; c++) {
      addCell(sec2BannerRow, c, c === 0 ? 'II. RINCIAN BIAYA PELAKSANAAN PROYEK' : '', {
        fill: { fgColor: { rgb: 'FFEDD5' } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '7C2D12' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: borderThin
      });
    }
    merges.push({ s: { r: sec2BannerRow, c: 0 }, e: { r: sec2BannerRow, c: 3 } });
    rowIdx++;

    projects.forEach((p, idx) => {
      const isAlt = idx % 2 === 1;
      const rowFill = isAlt ? { fgColor: { rgb: 'F8FAFC' } } : undefined;
      const hasRab = Boolean(availableFor(p)?.budget);
      const planned = hasRab ? p.plannedCost : null;
      const actual = p.actualCost || 0;
      const difference = planned !== null && p.actualCosts.length ? planned - actual : null;

      addCell(rowIdx, 0, `  ${idx + 1}. ${p.name} (${p.client}) - Progres: ${p.progress}%`, {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, color: { rgb: '1E293B' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: borderThin
      });
      addCell(rowIdx, 1, planned ?? 'RAB belum ada', {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      addCell(rowIdx, 2, actual, {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      addCell(rowIdx, 3, difference ?? 'Belum dapat dibandingkan', {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, bold: true, color: difference === null || difference >= 0 ? { rgb: '15803D' } : { rgb: 'DC2626' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      rowIdx++;
    });

    // Subtotal Section 2
    const totalPlanned = projects.reduce((s, p) => s + (p.plannedCost || 0), 0);
    const totalActual = projects.reduce((s, p) => s + (p.actualCost || 0), 0);
    addCell(rowIdx, 0, 'TOTAL RENCANA & REALISASI BIAYA', {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderDoubleBottom
    });
    addCell(rowIdx, 1, totalPlanned, {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);
    addCell(rowIdx, 2, totalActual, {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);
    addCell(rowIdx, 3, budgetCostRecords ? totalPlanned - actualCostWithRab : 'Belum dapat dibandingkan', {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '15803D' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);
    rowIdx += 2;

    // ==========================================
    // SECTION III: BUKU PEMBANTU PIUTANG & INVOICE
    // ==========================================
    const sec3BannerRow = rowIdx;
    for (let c = 0; c < 4; c++) {
      addCell(sec3BannerRow, c, c === 0 ? 'III. BUKU PEMBANTU PIUTANG & INVOICE' : '', {
        fill: { fgColor: { rgb: 'FFEDD5' } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '7C2D12' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: borderThin
      });
    }
    merges.push({ s: { r: sec3BannerRow, c: 0 }, e: { r: sec3BannerRow, c: 3 } });
    rowIdx++;

    allInvoices.forEach((inv, idx) => {
      const isAlt = idx % 2 === 1;
      const rowFill = isAlt ? { fgColor: { rgb: 'F8FAFC' } } : undefined;
      const isPaid = inv.status === 'PAID';
      const paidVal = isPaid ? inv.amount : 0;
      const unpaidVal = isPaid ? 0 : inv.amount;

      addCell(rowIdx, 0, `  ${inv.invoiceNumber} - ${inv.projectName} (${inv.milestoneTitle || '-'})`, {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, color: { rgb: '1E293B' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: borderThin
      });
      addCell(rowIdx, 1, inv.amount, {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      addCell(rowIdx, 2, paidVal, {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, bold: isPaid, color: isPaid ? { rgb: '15803D' } : { rgb: '94A3B8' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      addCell(rowIdx, 3, unpaidVal, {
        fill: rowFill,
        font: { name: 'Calibri', sz: 10, bold: !isPaid, color: !isPaid ? { rgb: 'C2410C' } : { rgb: '94A3B8' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, true);
      rowIdx++;
    });

    // Final Grand Total Row
    addCell(rowIdx, 0, 'TOTAL BUKU TAGIHAN (ACCOUNTS RECEIVABLE)', {
      fill: { fgColor: { rgb: 'FFEDD5' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '991B1B' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderDoubleBottom
    });
    addCell(rowIdx, 1, totalBilled, {
      fill: { fgColor: { rgb: 'FFEDD5' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);
    addCell(rowIdx, 2, totalPaid, {
      fill: { fgColor: { rgb: 'FFEDD5' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '15803D' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);
    addCell(rowIdx, 3, totalBilled - totalPaid, {
      fill: { fgColor: { rgb: 'FFEDD5' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'C2410C' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: borderDoubleBottom
    }, true);

    // Apply Range, Merges, and 4-Column Widths
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowIdx, c: 3 } });
    ws['!merges'] = merges;
    ws['!cols'] = [
      { wch: 48 }, // Col A: Nama Akun / Indikator (Lebar ideal)
      { wch: 26 }, // Col B: Target / Baseline
      { wch: 26 }, // Col C: Realisasi Saat Ini
      { wch: 26 }  // Col D: Selisih / Margin
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Posisi Keuangan');

    // Trigger direct download of genuine, fully styled .xlsx file
    XLSX.writeFile(wb, `Rekap_Keuangan_CLARA_${isoDate}.xlsx`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleInvoiceMilestone = async (projectId: string, milestoneId: string) => {
    setBusyMilestoneId(`${projectId}:${milestoneId}`);
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

      <section aria-label="Ringkasan keuangan semua proyek" className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Posisi</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Jumlah</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Arti angka</th></tr></thead>
          <tbody className="divide-y divide-zinc-200">
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Nilai kontrak</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(totalContract)}</td><td className="px-4 py-3 text-zinc-600">Total nilai proyek dengan acuan aktif.</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Rencana biaya (RAB)</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(totalPlannedCost)}</td><td className="px-4 py-3 text-zinc-600">Anggaran proyek pada acuan aktif.</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Biaya tercatat</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(totalActualCost)}</td><td className="px-4 py-3 text-zinc-600">{!totalPlannedCost ? 'RAB belum tersedia untuk dibandingkan.' : !budgetCostRecords ? 'Biaya pada proyek ber-RAB belum dicatat.' : `Selisih terhadap RAB dihitung hanya untuk proyek yang punya RAB: ${formatRupiah(actualCostWithRab - totalPlannedCost)}.`}</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Hak tagih</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(totalBillable)}</td><td className="px-4 py-3 text-zinc-600">Tahap pekerjaan yang memenuhi syarat tagih.</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Sudah ditagih</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(totalBilled)}</td><td className="px-4 py-3 text-zinc-600">Tagihan yang tercatat dalam sistem.</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold text-amber-800">Belum ditagih</th><td className="border-r border-zinc-200 px-4 py-3 text-right font-semibold tabular-nums text-amber-800">{formatRupiah(totalUnbilled)}</td><td className="px-4 py-3 text-zinc-600">Hak tagih tanpa tagihan; tindak lanjuti tahap di bawah.</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Sudah dibayar</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(totalPaid)}</td><td className="px-4 py-3 text-zinc-600">Pembayaran yang sudah dicatat.</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Belum dibayar</th><td className="border-r border-zinc-200 px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(Math.max(0, totalBilled - totalPaid))}</td><td className="px-4 py-3 text-zinc-600">Sisa tagihan yang belum dibayar.</td></tr>
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-base font-bold text-zinc-950">Tahap yang belum ditagih</h2><p className="mt-1 text-sm text-zinc-600">Tahap selesai dengan sisa hak tagih. Buat tagihan dari baris terkait.</p></div>
          <span className="text-sm font-semibold text-amber-800">{formatRupiah(totalUnbilled)} belum ditagih</span>
        </div>
        {unbilledStages.length === 0 ? <p className="rounded-xl bg-zinc-50 p-5 text-sm text-zinc-600">Tidak ada tahap selesai yang menunggu tagihan.</p> : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[830px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Proyek</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Tahap selesai</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right">Sisa hak tagih</th><th scope="col" className="border-b border-zinc-200 px-4 py-3">Tindakan</th></tr></thead>
            <tbody className="divide-y divide-zinc-200">{unbilledStages.map(({ project, milestone, remaining }) => (
              <tr key={project.id + '-' + milestone.id}>
                <td className="border-r border-zinc-200 px-4 py-3"><Link href={'/projects/' + project.id + '?tab=finance'} className="font-semibold text-zinc-900 hover:text-red-700 hover:underline">{project.name}</Link><span className="mt-1 block text-xs text-zinc-500">{project.client}</span></td>
                <td className="border-r border-zinc-200 px-4 py-3"><strong>{milestone.title}</strong><span className="mt-1 block text-xs text-zinc-500">Selesai {milestone.completionDate ? formatDate(milestone.completionDate) : 'tanggal belum dicatat'}</span></td>
                <td className="border-r border-zinc-200 px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(remaining)}</td>
                <td className="px-4 py-3"><button type="button" disabled={busyMilestoneId !== null} onClick={() => void handleInvoiceMilestone(project.id, milestone.id)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">{busyMilestoneId === project.id + ':' + milestone.id ? 'Menyimpan...' : 'Buat tagihan'}</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      {/* Invoices History Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Riwayat tagihan</h3>
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">No. tagihan</th>
                <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Proyek</th>
                <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Tahap pekerjaan</th>
                <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right">Nominal</th>
                <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Tanggal terbit</th>
                <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Jatuh tempo</th>
                <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Status</th>
                <th scope="col" className="border-b border-zinc-200 px-4 py-3">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {allInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Belum ada tagihan tercatat.
                  </td>
                </tr>
              ) : (
                allInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="border-r border-zinc-200 px-4 py-3 font-mono font-bold text-red-600">{inv.invoiceNumber}</td>
                    <td className="border-r border-zinc-200 px-4 py-3 font-semibold text-slate-800">{inv.projectName}</td>
                    <td className="border-r border-zinc-200 px-4 py-3 text-slate-600">{inv.milestoneTitle || '-'}</td>
                    <td className="border-r border-zinc-200 px-4 py-3 text-right font-bold tabular-nums text-slate-900">{formatRupiah(inv.amount)}</td>
                    <td className="border-r border-zinc-200 px-4 py-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                    <td className="border-r border-zinc-200 px-4 py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="border-r border-zinc-200 px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-800'
                      }`}>
                        {inv.status === 'PAID' ? 'Lunas' : inv.status === 'OVERDUE' || (inv.status === 'SENT' && inv.dueDate < new Date().toISOString().slice(0, 10)) ? 'Lewat jatuh tempo' : inv.status === 'DRAFT' ? 'Draf' : 'Tercatat'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80 shrink-0 print:hidden">
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
                      <th className="py-3 px-3.5 text-right w-1/5">SELISIH BIAYA / TAGIHAN</th>
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
                      <td colSpan={4} className="py-2 px-3.5">II. RINCIAN BIAYA PELAKSANAAN PROYEK</td>
                    </tr>
                    {projects.map((p, idx) => {
                      const hasRab = Boolean(availableFor(p)?.budget);
                      const planned = hasRab ? p.plannedCost : null;
                      const actual = p.actualCost || 0;
                      const difference = planned !== null && p.actualCosts.length ? planned - actual : null;
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/80">
                          <td className="py-2.5 px-3.5 pl-6">
                            <span className="font-semibold text-zinc-900">{idx + 1}. {p.name}</span>
                            <span className="block text-[11px] text-zinc-500 font-normal">Klien: {p.client} &bull; Progres: {p.progress}%</span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right tabular-nums text-zinc-700">{planned === null ? 'RAB belum ada' : formatRupiah(planned)}</td>
                          <td className="py-2.5 px-3.5 text-right tabular-nums font-semibold text-zinc-900">{formatRupiah(actual)}</td>
                          <td className={`py-2.5 px-3.5 text-right tabular-nums font-semibold ${difference === null || difference >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {difference === null ? 'Belum dapat dibandingkan' : difference >= 0 ? `+${formatRupiah(difference)}` : formatRupiah(difference)}
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
                        {budgetCostRecords ? formatRupiah(totalPlannedCost - actualCostWithRab) : 'Belum dapat dibandingkan'}
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
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
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
