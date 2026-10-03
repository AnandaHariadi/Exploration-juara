'use client';

import React from 'react';
import Link from 'next/link';
import { useAlerts } from '@/hooks/useClaraData';
import { Alert, AlertSeverity } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { SeverityBadge } from '@/components/shared/Badge';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';

const typeLabels: Record<Alert['type'], string> = {
  BILLING_VARIANCE: 'Tagihan', BUDGET_VARIANCE: 'Biaya', SCOPE_VARIANCE: 'Ruang lingkup', REVISION_LIMIT: 'Batas revisi', DEADLINE_RISK: 'Tenggat',
};
const statusLabels: Record<Alert['status'], string> = { NEW: 'Baru', ACKNOWLEDGED: 'Sudah dibaca · belum selesai', RESOLVED: 'Selesai' };

export default function AlertsPage() {
  const { alerts, refreshAlerts, loading, error } = useAlerts();
  const [selected, setSelected] = React.useState<Alert | null>(null);
  const [severity, setSeverity] = React.useState<'ALL' | AlertSeverity>('ALL');
  const [status, setStatus] = React.useState<'ALL' | Alert['status']>('ALL');
  const filtered = alerts.filter((item) => (severity === 'ALL' || item.severity === severity) && (status === 'ALL' || item.status === status));
  const openCount = alerts.filter((item) => item.status !== 'RESOLVED').length;

  return <div className="space-y-6 pb-12">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-red-700">Pemantauan proyek</p><h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Peringatan</h1><p className="mt-2 text-sm text-zinc-600">Periksa masalah, catatan sumber, dan proyek yang perlu ditindaklanjuti.</p></div>
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">{openCount} peringatan belum selesai. Menandai sebagai sudah dibaca tidak menyelesaikan masalah. Nilai terkait peringatan bukan otomatis kerugian.</div>
    <div className="flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><div><label htmlFor="severity" className="block text-xs font-semibold text-zinc-600">Tingkat</label><select id="severity" value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="mt-1 min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm"><option value="ALL">Semua tingkat</option><option value="CRITICAL">Kritis</option><option value="HIGH">Tinggi</option><option value="MEDIUM">Sedang</option><option value="LOW">Rendah</option></select></div><div><label htmlFor="alert-status" className="block text-xs font-semibold text-zinc-600">Status</label><select id="alert-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-1 min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm"><option value="ALL">Semua status</option><option value="NEW">Baru</option><option value="ACKNOWLEDGED">Sudah dibaca</option><option value="RESOLVED">Selesai</option></select></div></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Gagal memuat peringatan: {error}</p>}
    {loading ? <p className="rounded-xl bg-white p-6 text-sm text-zinc-500">Memuat peringatan…</p> : filtered.length === 0 ? <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center"><p className="font-semibold text-zinc-900">Tidak ada peringatan untuk filter ini.</p><p className="mt-1 text-sm text-zinc-500">Ubah filter atau lanjutkan memantau proyek.</p></div> : <div className="space-y-3">{filtered.map((item) => <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={item.severity} /><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{typeLabels[item.type]}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === 'NEW' ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-700'}`}>{statusLabels[item.status]}</span></div><h2 className="mt-3 text-base font-semibold text-zinc-950">{item.title}</h2><p className="mt-1 text-sm leading-relaxed text-zinc-600">{item.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4"><div><p className="text-xs text-zinc-500">{item.projectName}</p><p className="mt-1 text-sm font-semibold text-zinc-900">Nilai terkait: {formatRupiah(item.rupiahImpact)}</p></div><div className="flex gap-3"><Link href={`/projects/${item.projectId}`} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">Buka proyek</Link><button type="button" onClick={() => setSelected(item)} className="min-h-10 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700">Lihat rincian</button></div></div></article>)}</div>}
    <EvidenceDrawer alert={selected} onClose={() => setSelected(null)} onActionComplete={() => { void refreshAlerts(); }} />
  </div>;
}
