'use client';

import React from 'react';
import type { Project } from '@/types';
import { dataClient } from '@/services/dataClient';
import { formatDate, formatRupiah } from '@/lib/utils';
import { baselineAvailability } from '@/lib/baseline';
import { btn, EmptyState, inputClass, labelClass, Panel } from '@/components/shared/ui';
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
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const available = active ? baselineAvailability(active) : null;
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
      <Panel title="Posisi keuangan proyek" description="Bandingkan rencana, catatan, dan jumlah yang masih perlu ditindaklanjuti.">
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Yang diperiksa</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Dasar</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Tercatat</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 text-right font-semibold">Perlu perhatian</th></tr></thead>
            <tbody className="divide-y divide-zinc-200">
              <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Biaya proyek<span className="mt-1 block text-xs font-normal text-zinc-500">RAB dibanding pengeluaran</span></th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{available?.budget ? formatRupiah(m.plannedCost) : 'RAB belum ada'}</td><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{project.actualCosts.length ? formatRupiah(m.actualCost) : 'Belum dicatat'}</td><td className={`px-4 py-3 text-right font-semibold tabular-nums ${m.budgetVariance > 0 && available?.budget ? 'text-red-700' : ''}`}>{!available?.budget ? 'Belum dapat dibandingkan' : !project.actualCosts.length ? 'Menunggu catatan biaya' : m.budgetVariance > 0 ? `Melebihi RAB ${formatRupiah(m.budgetVariance)}` : `Sisa RAB ${formatRupiah(-m.budgetVariance)}`}</td></tr>
              <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Hak tagih<span className="mt-1 block text-xs font-normal text-zinc-500">Tahap selesai dibanding tagihan</span></th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{available?.billing ? formatRupiah(m.billableValue) : 'Syarat tagih belum ada'}</td><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{project.invoices.length ? formatRupiah(m.billedValue) : 'Belum dicatat'}</td><td className={`px-4 py-3 text-right font-semibold tabular-nums ${m.unbilledValue > 0 ? 'text-amber-800' : ''}`}>{!available?.billing ? 'Belum dapat dihitung' : m.unbilledValue > 0 ? `Belum ditagih ${formatRupiah(m.unbilledValue)}` : m.billableValue > 0 ? 'Tidak ada hak tagih tertunda' : 'Belum ada tahap siap tagih'}</td></tr>
              <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-semibold">Pembayaran<span className="mt-1 block text-xs font-normal text-zinc-500">Tagihan dibanding uang masuk</span></th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(m.billedValue)}</td><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(m.paidValue)}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{m.outstandingReceivable > 0 ? `Belum dibayar ${formatRupiah(m.outstandingReceivable)}` : 'Tidak ada tagihan belum dibayar'}</td></tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Tagihan per tahap" description="Tagihan baru dapat dibuat setelah tahap pekerjaan selesai. Pencatatan di sini tidak mengirim tagihan ke klien.">
        {!available?.billing ? <p className="text-sm text-zinc-600">Nilai dan syarat pembayaran belum menjadi acuan. Tambahkan kesepakatan di tab Acuan proyek sebelum menghitung hak tagih.</p> :
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Tahap dan syarat</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Nilai tahap</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Ditagih</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Dibayar</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Belum ditagih</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Status</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Tindakan</th></tr></thead>
            <tbody className="divide-y divide-zinc-200">{project.agreementBaseline.milestones.map((x) => {
              const remaining = Math.max(0, x.value - (x.billedAmount ?? 0));
              const amount = invoiceAmounts[x.id] ?? String(remaining);
              return <tr key={x.id}>
                <td className="border-r border-zinc-200 px-4 py-3"><strong className="text-zinc-900">{x.title}</strong><span className="mt-1 block text-xs text-zinc-500">{x.trigger || 'Syarat belum dicatat'}</span></td>
                <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(x.value)}</td>
                <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(x.billedAmount ?? 0)}</td>
                <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(x.paidAmount ?? 0)}</td>
                <td className="border-r border-zinc-200 px-4 py-3 text-right font-semibold tabular-nums">{x.status === 'COMPLETED' ? formatRupiah(remaining) : 'Belum memenuhi syarat'}</td>
                <td className="border-r border-zinc-200 px-4 py-3"><BillingBadge status={x.billingStatus} /></td>
                <td className="px-4 py-3">{x.status !== 'COMPLETED' ? <span className="text-zinc-500">Tunggu tahap selesai</span> : remaining > 0 ? (
                  <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void act(`inv-${x.id}`, () => dataClient.createInvoice(project.id, x.id, Number(amount)), `Tagihan ${formatRupiah(Number(amount))} untuk ${x.title} dicatat.`, () => setInvoiceAmounts((current) => { const next = { ...current }; delete next[x.id]; return next; })); }}>
                    <div><label htmlFor={`inv-amount-${x.id}`} className="block text-xs font-semibold text-zinc-600">Jumlah tagihan (Rp)</label><input id={`inv-amount-${x.id}`} type="number" min="1" max={remaining} required value={amount} onChange={(e) => setInvoiceAmounts((current) => ({ ...current, [x.id]: e.target.value }))} className={`${inputClass} w-40`} /></div>
                    <button type="submit" disabled={busy !== null} className={btn.primary}>{busy === `inv-${x.id}` ? 'Menyimpan…' : 'Buat tagihan'}</button>
                  </form>
                ) : <span className="font-semibold text-emerald-700">Ditagih penuh</span>}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      </Panel>

      <Panel title="Daftar tagihan & pembayaran">
        {project.invoices.length === 0 ? (
          <EmptyState title="Belum ada tagihan">Buat tagihan dari tahap yang sudah selesai di atas.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">No. tagihan</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Tahap</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Nominal</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Dibayar</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Belum dibayar</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Tanggal</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Status</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Tindakan</th></tr></thead>
              <tbody className="divide-y divide-zinc-200">
                {project.invoices.map((inv) => {
                  const paid = paidFor(inv.id);
                  const status = invoiceStatus(inv, paid, inv.amount);
                  return (
                    <tr key={inv.id}>
                      <td className="border-r border-zinc-200 px-4 py-3 font-mono text-xs font-semibold text-red-700">{inv.invoiceNumber}</td>
                      <td className="border-r border-zinc-200 px-4 py-3">{inv.milestoneTitle ?? '-'}</td>
                      <td className="border-r border-zinc-200 px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(inv.amount)}</td>
                      <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(paid)}</td>
                      <td className="border-r border-zinc-200 px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(Math.max(0, inv.amount - paid))}</td>
                      <td className="border-r border-zinc-200 px-4 py-3 text-xs text-zinc-600">Terbit {formatDate(inv.issueDate)}<span className="block">Jatuh tempo {formatDate(inv.dueDate)}</span></td>
                      <td className="border-r border-zinc-200 px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span></td>
                      <td className="px-4 py-3">
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
          <div className="mt-5">
            <h3 className="text-sm font-bold text-zinc-900">Pembayaran tercatat</h3>
            <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Tanggal</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">No. tagihan</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Dicatat oleh</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 text-right">Jumlah</th></tr></thead><tbody className="divide-y divide-zinc-200">{project.payments.map((p) => <tr key={p.id}><td className="border-r border-zinc-200 px-4 py-3">{formatDate(p.date)}</td><td className="border-r border-zinc-200 px-4 py-3">{p.invoiceNumber}</td><td className="border-r border-zinc-200 px-4 py-3">{p.recordedBy}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(p.amount)}</td></tr>)}</tbody></table></div>
          </div>
        )}
      </Panel>

      <Panel title="Biaya aktual" description="Hanya biaya yang benar-benar dikeluarkan. RAB tidak dihitung sebagai biaya aktual.">
        <form onSubmit={(e) => { e.preventDefault(); void act('cost', () => dataClient.addCost(project.id, { amount: Number(cost.amount), category: cost.category, description: cost.description, date: cost.date || undefined }), `Biaya ${formatRupiah(Number(cost.amount))} dicatat.`, () => setCost({ amount: '', category: cost.category, description: '', date: '' })); }} className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-2">
          <div><label htmlFor="cost-amount" className={labelClass}>Jumlah (Rp)</label><input id="cost-amount" type="number" min="1" required value={cost.amount} onChange={(e) => setCost({ ...cost, amount: e.target.value })} className={inputClass} /></div>
          <div><label htmlFor="cost-category" className={labelClass}>Kategori</label><select id="cost-category" value={cost.category} onChange={(e) => setCost({ ...cost, category: e.target.value })} className={inputClass}>{Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label htmlFor="cost-description" className={labelClass}>Keterangan</label><input id="cost-description" required value={cost.description} onChange={(e) => setCost({ ...cost, description: e.target.value })} placeholder="Contoh: Gaji tim Oktober" className={inputClass} /></div>
          <div><label htmlFor="cost-date" className={labelClass}>Tanggal</label><input id="cost-date" type="date" value={cost.date} onChange={(e) => setCost({ ...cost, date: e.target.value })} className={inputClass} /></div>
          <div className="flex justify-end md:col-span-2"><button type="submit" disabled={busy !== null} className={btn.dark}>{busy === 'cost' ? 'Menyimpan…' : 'Catat biaya'}</button></div>
        </form>
        {cost.amount && Number(cost.amount) > 0 && <p className="mt-2 text-xs text-zinc-500">{formatRupiah(Number(cost.amount))}</p>}
        {project.actualCosts.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Belum ada pengeluaran yang dicatat untuk proyek ini.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[700px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Biaya</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Kategori</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Tanggal dan pencatat</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 text-right">Jumlah</th></tr></thead><tbody className="divide-y divide-zinc-200">{project.actualCosts.map((c) => <tr key={c.id}><td className="border-r border-zinc-200 px-4 py-3 font-semibold text-zinc-900">{c.description}</td><td className="border-r border-zinc-200 px-4 py-3">{categoryLabel[c.category] ?? c.category}</td><td className="border-r border-zinc-200 px-4 py-3">{formatDate(c.date)}<span className="block text-xs text-zinc-500">{c.submittedBy}</span></td><td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(c.amount)}</td></tr>)}</tbody></table></div>
        )}
      </Panel>
    </div>
  );
}
