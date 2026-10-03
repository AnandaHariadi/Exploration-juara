'use client';

import React from 'react';
import type { Project } from '@/types';
import { dataClient } from '@/services/dataClient';
import { formatDate, formatRupiah } from '@/lib/utils';
import { btn, EmptyState, inputClass, labelClass, Metric, Panel } from '@/components/shared/ui';
import { BillingBadge } from '@/components/shared/Badge';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

const categoryLabel: Record<string, string> = { DEVELOPMENT: 'Pengembangan & tenaga kerja', INFRASTRUCTURE: 'Infrastruktur', DESIGN: 'Desain & pengujian', THIRD_PARTY_API: 'Layanan pihak ketiga', OTHER: 'Lainnya' };

export function invoiceStatus(inv: { status: string; dueDate: string }, paid: number, amount: number) {
  if (inv.status === 'PAID') return { label: 'Lunas', className: 'bg-emerald-50 text-emerald-700' };
  if (paid > 0) return { label: `Dibayar sebagian (${formatRupiah(paid)})`, className: 'bg-blue-50 text-blue-700' };
  if (inv.dueDate < new Date().toISOString().slice(0, 10)) return { label: 'Lewat jatuh tempo', className: 'bg-red-50 text-red-700' };
  return { label: amount > 0 ? 'Terkirim' : 'Draf', className: 'bg-orange-50 text-orange-800' };
}

export function FinanceTab({ project, run }: { project: Project; run: Run }) {
  const m = project.metrics;
  const [busy, setBusy] = React.useState<string | null>(null);
  const [invoiceAmounts, setInvoiceAmounts] = React.useState<Record<string, string>>({});
  const [cost, setCost] = React.useState({ amount: '', category: 'DEVELOPMENT', description: '', date: '' });

  const act = async (key: string, action: () => Promise<unknown>, text: string, after?: () => void) => {
    setBusy(key);
    const ok = await run(action, text);
    if (ok !== undefined) after?.();
    setBusy(null);
  };

  const paidFor = (invoiceId: string) => project.payments.filter((p) => p.invoiceId === invoiceId).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Biaya aktual / RAB" value={`${formatRupiah(m.actualCost)}`} detail={m.budgetUtilization === null ? 'RAB 0 — pemakaian tidak tersedia' : `${m.budgetUtilization.toLocaleString('id-ID')}% dari ${formatRupiah(m.plannedCost)} · selisih ${m.budgetVariance >= 0 ? '+' : ''}${formatRupiah(m.budgetVariance)}`} tone={m.budgetVariance > 0 ? 'bad' : 'default'} />
        <Metric label="Siap ditagih" value={formatRupiah(m.billableValue)} detail="Tahap dengan syarat tagih terpenuhi" />
        <Metric label="Belum ditagih" value={formatRupiah(m.unbilledValue)} detail="Hak tagih tanpa invoice — bukan kerugian" tone={m.unbilledValue > 0 ? 'warn' : 'default'} />
        <Metric label="Ditagih / dibayar" value={`${formatRupiah(m.billedValue)}`} detail={`Dibayar ${formatRupiah(m.paidValue)} · piutang ${formatRupiah(m.outstandingReceivable)}`} tone="good" />
      </div>

      <Panel title="Tagihan per tahap" description="Tagihan hanya bisa dibuat untuk tahap yang syaratnya terpenuhi. CLARA tidak mengirim tagihan ke klien.">
        <div className="space-y-3">
          {project.agreementBaseline.milestones.map((x) => {
            const remaining = Math.max(0, x.value - (x.billedAmount ?? 0));
            const amount = invoiceAmounts[x.id] ?? String(remaining);
            return (
              <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900">{x.title}</p>
                  <p className="text-xs text-zinc-500">Hak tagih {formatRupiah(x.value)} · ditagih {formatRupiah(x.billedAmount ?? 0)} · dibayar {formatRupiah(x.paidAmount ?? 0)}</p>
                </div>
                <BillingBadge status={x.billingStatus} />
                {x.status !== 'COMPLETED' ? (
                  <span className="text-xs text-zinc-500">Menunggu tahap selesai</span>
                ) : remaining > 0 ? (
                  <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void act(`inv-${x.id}`, () => dataClient.createInvoice(project.id, x.id, Number(amount)), `Tagihan ${formatRupiah(Number(amount))} untuk ${x.title} dicatat.`, () => setInvoiceAmounts({ ...invoiceAmounts, [x.id]: '' })); }}>
                    <div>
                      <label htmlFor={`inv-amount-${x.id}`} className="text-xs font-semibold text-zinc-600">Nominal</label>
                      <input id={`inv-amount-${x.id}`} type="number" min="1" max={remaining} required value={amount} onChange={(e) => setInvoiceAmounts({ ...invoiceAmounts, [x.id]: e.target.value })} className={`${inputClass} w-40`} />
                    </div>
                    <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === `inv-${x.id}` ? 'Menyimpan…' : 'Buat tagihan'}</button>
                  </form>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700">Sudah ditagih penuh</span>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Daftar tagihan & pembayaran">
        {project.invoices.length === 0 ? (
          <EmptyState title="Belum ada tagihan">Buat tagihan dari tahap yang sudah selesai di atas.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500"><th className="py-2 pr-3">No. tagihan</th><th className="py-2 pr-3">Tahap</th><th className="py-2 pr-3">Nominal</th><th className="py-2 pr-3">Terbit / jatuh tempo</th><th className="py-2 pr-3">Status</th><th className="py-2">Aksi</th></tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {project.invoices.map((inv) => {
                  const paid = paidFor(inv.id);
                  const status = invoiceStatus(inv, paid, inv.amount);
                  return (
                    <tr key={inv.id}>
                      <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-red-700">{inv.invoiceNumber}</td>
                      <td className="py-2.5 pr-3">{inv.milestoneTitle ?? '-'}</td>
                      <td className="py-2.5 pr-3 font-semibold">{formatRupiah(inv.amount)}</td>
                      <td className="py-2.5 pr-3 text-xs text-zinc-600">{formatDate(inv.issueDate)} / {formatDate(inv.dueDate)}</td>
                      <td className="py-2.5 pr-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span></td>
                      <td className="py-2.5">
                        {inv.status !== 'PAID' ? (
                          <button type="button" disabled={busy !== null} onClick={() => { if (window.confirm(`Catat pembayaran ${formatRupiah(inv.amount - paid)} untuk ${inv.invoiceNumber}?`)) void act(`pay-${inv.id}`, () => dataClient.recordPayment(project.id, inv.id), `Pembayaran ${inv.invoiceNumber} dicatat.`); }} className={btn.success}>
                            {busy === `pay-${inv.id}` ? 'Mencatat…' : 'Catat pembayaran'}
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700">Lunas {inv.paymentDate ? formatDate(inv.paymentDate) : ''}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {project.payments.length > 0 && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <h3 className="text-sm font-bold text-zinc-900">Pembayaran tercatat</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {project.payments.map((p) => <li key={p.id} className="flex justify-between gap-3"><span>{formatDate(p.date)} · {p.invoiceNumber} · {p.recordedBy}</span><span className="font-semibold">{formatRupiah(p.amount)}</span></li>)}
            </ul>
          </div>
        )}
      </Panel>

      <Panel title="Biaya aktual" description="Hanya biaya yang benar-benar dikeluarkan. RAB tidak dihitung sebagai biaya aktual.">
        <form onSubmit={(e) => { e.preventDefault(); void act('cost', () => dataClient.addCost(project.id, { amount: Number(cost.amount), category: cost.category, description: cost.description, date: cost.date || undefined }), `Biaya ${formatRupiah(Number(cost.amount))} dicatat.`, () => setCost({ amount: '', category: cost.category, description: '', date: '' })); }} className="grid gap-3 rounded-xl bg-zinc-50 p-4 md:grid-cols-[1fr_1fr_1.5fr_1fr_auto] md:items-end">
          <div><label htmlFor="cost-amount" className={labelClass}>Jumlah (Rp)</label><input id="cost-amount" type="number" min="1" required value={cost.amount} onChange={(e) => setCost({ ...cost, amount: e.target.value })} className={inputClass} /></div>
          <div><label htmlFor="cost-category" className={labelClass}>Kategori</label><select id="cost-category" value={cost.category} onChange={(e) => setCost({ ...cost, category: e.target.value })} className={inputClass}>{Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label htmlFor="cost-description" className={labelClass}>Keterangan</label><input id="cost-description" required value={cost.description} onChange={(e) => setCost({ ...cost, description: e.target.value })} placeholder="Contoh: Gaji tim Oktober" className={inputClass} /></div>
          <div><label htmlFor="cost-date" className={labelClass}>Tanggal</label><input id="cost-date" type="date" value={cost.date} onChange={(e) => setCost({ ...cost, date: e.target.value })} className={inputClass} /></div>
          <button type="submit" disabled={busy !== null} className={btn.dark}>{busy === 'cost' ? 'Menyimpan…' : 'Catat biaya'}</button>
        </form>
        {cost.amount && Number(cost.amount) > 0 && <p className="mt-2 text-xs text-zinc-500">{formatRupiah(Number(cost.amount))}</p>}
        {project.actualCosts.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Belum ada biaya aktual. Profit aktual belum dapat dihitung.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100 text-sm">
            {project.actualCosts.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 py-2.5">
                <span><span className="font-semibold text-zinc-900">{c.description}</span><span className="block text-xs text-zinc-500">{categoryLabel[c.category] ?? c.category} · {formatDate(c.date)} · {c.submittedBy}</span></span>
                <span className="font-semibold">{formatRupiah(c.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
