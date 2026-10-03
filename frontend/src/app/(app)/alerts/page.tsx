'use client';

import React from 'react';
import type { Alert, AlertSeverity, InsightStatus } from '@/types';
import { useAlerts } from '@/hooks/useClaraData';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';
import { AlertList, alertTypeLabels } from '@/components/alerts/AlertList';
import { btn } from '@/components/shared/ui';

const selectClass = 'mt-1 min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm';

export default function AlertsPage() {
  const { alerts, refreshAlerts, loading, error } = useAlerts();
  const [selected, setSelected] = React.useState<Alert | null>(null);
  const [severity, setSeverity] = React.useState<'ALL' | AlertSeverity>('ALL');
  const [status, setStatus] = React.useState<'OPEN' | 'ALL' | Alert['status']>('OPEN');
  const [type, setType] = React.useState<'ALL' | Alert['type']>('ALL');
  const [classification, setClassification] = React.useState<'ALL' | InsightStatus>('ALL');

  const filtered = alerts.filter(
    (a) =>
      (severity === 'ALL' || a.severity === severity) &&
      (status === 'ALL' || (status === 'OPEN' ? a.status !== 'RESOLVED' : a.status === status)) &&
      (type === 'ALL' || a.type === type) &&
      (classification === 'ALL' || a.classification === classification),
  );
  const openCount = alerts.filter((a) => a.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Rekonsiliasi</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Peringatan</h1>
        <p className="mt-2 text-sm text-zinc-600">Setiap peringatan menjelaskan apa yang terjadi, besar nilainya, alasannya, dan buktinya.</p>
      </div>
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
        {openCount} peringatan belum selesai. &ldquo;Indikasi&rdquo; dan &ldquo;perlu tinjauan&rdquo; bukan pelanggaran kontrak; &ldquo;belum ditagih&rdquo; bukan kerugian.
      </div>
      <div className="flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div><label htmlFor="alert-status" className="block text-xs font-semibold text-zinc-600">Status</label><select id="alert-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectClass}><option value="OPEN">Belum selesai</option><option value="ALL">Semua</option><option value="NEW">Baru</option><option value="ACKNOWLEDGED">Sudah dibaca</option><option value="RESOLVED">Selesai</option></select></div>
        <div><label htmlFor="alert-type" className="block text-xs font-semibold text-zinc-600">Jenis</label><select id="alert-type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={selectClass}><option value="ALL">Semua jenis</option>{Object.entries(alertTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="alert-class" className="block text-xs font-semibold text-zinc-600">Klasifikasi</label><select id="alert-class" value={classification} onChange={(e) => setClassification(e.target.value as typeof classification)} className={selectClass}><option value="ALL">Semua</option><option value="VERIFIED_DEVIATION">Selisih terverifikasi</option><option value="POSSIBLE_DEVIATION">Indikasi selisih</option><option value="NEEDS_REVIEW">Perlu tinjauan manusia</option></select></div>
        <div><label htmlFor="severity" className="block text-xs font-semibold text-zinc-600">Tingkat</label><select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)} className={selectClass}><option value="ALL">Semua tingkat</option><option value="CRITICAL">Kritis</option><option value="HIGH">Tinggi</option><option value="MEDIUM">Sedang</option><option value="LOW">Rendah</option></select></div>
      </div>
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><span>Gagal memuat peringatan: {error}</span><button type="button" onClick={() => void refreshAlerts()} className={btn.secondary}>Coba lagi</button></div>}
      {loading && alerts.length === 0 ? <p className="rounded-xl bg-white p-6 text-sm text-zinc-500">Memuat peringatan…</p> : <AlertList alerts={filtered} onOpen={setSelected} showProject emptyText="Tidak ada peringatan untuk filter ini." />}
      <EvidenceDrawer alert={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
