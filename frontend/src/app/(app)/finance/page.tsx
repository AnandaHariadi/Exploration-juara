'use client';

import React from 'react';
import Link from 'next/link';
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

  const act = async (key: string, action: () => Promise<unknown>, text: string) => {
    setBusy(key);
    await run(action, text);
    setBusy(null);
  };

  const ready = active.flatMap((p) => p.agreementBaseline.milestones.filter((m) => m.status === 'COMPLETED' && (m.billedAmount ?? 0) < m.value).map((m) => ({ p, m, remaining: m.value - (m.billedAmount ?? 0) })));
  const invoices = active.flatMap((p) => p.invoices.map((inv) => ({ p, inv, paid: p.payments.filter((x) => x.invoiceId === inv.id).reduce((s, x) => s + x.amount, 0) })));

  return (
    <div className="space-y-6 pb-16">
      <NoticeBar notice={notice} onClose={clear} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Keuangan portofolio</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Keuangan proyek</h1>
        <p className="mt-2 text-sm text-zinc-600">Hak tagih, tagihan, pembayaran, dan biaya aktual terhadap RAB — dihitung dari data tersimpan.</p>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><span>Gagal memuat data keuangan: {error}</span><button type="button" onClick={() => void refreshProjects()} className={btn.secondary}>Coba lagi</button></div>}
      {loading && projects.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-zinc-500">Memuat data keuangan…</p>}

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Nilai kontrak" value={formatCompactRupiah(summary.contractValue)} detail={`${summary.activeProjectCount} proyek aktif`} />
          <Metric label="Siap ditagih" value={formatCompactRupiah(summary.billableValue)} detail="Syarat tagih terpenuhi" />
          <Metric label="Sudah ditagih" value={formatCompactRupiah(summary.billedValue)} />
          <Metric label="Belum ditagih" value={formatCompactRupiah(summary.unbilledValue)} detail="Bukan kerugian" tone={summary.unbilledValue ? 'warn' : 'default'} />
          <Metric label="Sudah dibayar" value={formatCompactRupiah(summary.paidValue)} tone="good" />
        </div>
      )}

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

      <Panel title="Riwayat tagihan">
        {invoices.length === 0 ? (
          <EmptyState title="Belum ada tagihan tercatat" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500"><th className="py-2 pr-3">No. tagihan</th><th className="py-2 pr-3">Proyek</th><th className="py-2 pr-3">Tahap</th><th className="py-2 pr-3">Nominal</th><th className="py-2 pr-3">Jatuh tempo</th><th className="py-2 pr-3">Status</th><th className="py-2">Aksi</th></tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {invoices.map(({ p, inv, paid }) => {
                  const st = invoiceStatus(inv, paid, inv.amount);
                  return (
                    <tr key={inv.id}>
                      <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-red-700">{inv.invoiceNumber}</td>
                      <td className="py-2.5 pr-3"><Link href={`/projects/${p.id}?tab=finance`} className="hover:text-red-700">{p.name}</Link></td>
                      <td className="py-2.5 pr-3">{inv.milestoneTitle ?? '-'}</td>
                      <td className="py-2.5 pr-3 font-semibold">{formatRupiah(inv.amount)}</td>
                      <td className="py-2.5 pr-3 text-xs">{formatDate(inv.dueDate)}</td>
                      <td className="py-2.5 pr-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.className}`}>{st.label}</span></td>
                      <td className="py-2.5">
                        {inv.status !== 'PAID' ? (
                          <button type="button" disabled={busy !== null} onClick={() => { if (window.confirm(`Catat pembayaran ${formatRupiah(inv.amount - paid)} untuk ${inv.invoiceNumber}?`)) void act(inv.id, () => dataClient.recordPayment(p.id, inv.id), `Pembayaran ${inv.invoiceNumber} dicatat.`); }} className={btn.success}>{busy === inv.id ? 'Mencatat…' : 'Catat pembayaran'}</button>
                        ) : <span className="text-xs text-emerald-700">Lunas</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
