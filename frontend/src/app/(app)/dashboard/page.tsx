'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FilePlus2, FolderKanban } from 'lucide-react';
import type { Alert, UserPersonaId } from '@/types';
import { dataClient } from '@/services/dataClient';
import { useActivePersona, useDashboardSummary, useProjects } from '@/hooks/useClaraData';
import { formatCompactRupiah, formatRupiah, isOpenAlert } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/Badge';
import { EvidenceDrawer, impactText } from '@/components/alerts/EvidenceDrawer';
import { btn, InsightBadge, Metric, NoticeBar, Panel, useNotice } from '@/components/shared/ui';

const roleIntro: Record<UserPersonaId, { title: string; description: string; action: string; href: string }> = {
  BUDI: { title: 'Eksekusi proyek', description: 'Proyek yang perlu disiapkan, progres, revisi, dan perubahan yang harus ditindaklanjuti.', action: 'Buat proyek', href: '/projects/new' },
  SITI: { title: 'Tagihan dan biaya', description: 'Hak tagih yang belum ditagih, biaya terhadap RAB, dan pembayaran masuk.', action: 'Buka keuangan', href: '/finance' },
  HENDRA: { title: 'Kondisi portofolio', description: 'Nilai yang dipertaruhkan, proyek yang perlu perhatian, dan bukti setiap peringatan.', action: 'Tinjau peringatan', href: '/alerts' },
  ADMIN: { title: 'Ringkasan seluruh sistem demo', description: 'Semua proyek, peringatan, dan data demo. Atur ulang data dari menu samping.', action: 'Lihat proyek', href: '/projects' },
};

export default function DashboardPage() {
  const { summary, loading, error, refreshSummary } = useDashboardSummary();
  const { projects } = useProjects();
  const { personaId } = useActivePersona();
  const { notice, run, clear } = useNotice();
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const role = roleIntro[personaId];

  const openAlerts = projects.flatMap((p) => p.alerts.filter(isOpenAlert));
  const readyToBill = projects.flatMap((p) =>
    p.agreementBaseline.milestones
      .filter((m) => m.status === 'COMPLETED' && (m.billedAmount ?? 0) < m.value)
      .map((m) => ({ project: p, milestone: m, remaining: m.value - (m.billedAmount ?? 0) })),
  );
  const needsSetup = projects.filter((p) => !p.metrics.hasBaseline);

  // Persona work queue: CLARA surfaces what each role must act on.
  type Task = { key: string; title: string; detail: string; href: string };
  const tasks: Task[] = [];
  const crs = projects.flatMap((p) => p.changeRequests.map((c) => ({ p, c })));
  const finAlerts = openAlerts.filter((a) => ['FINANCIAL_ANOMALY', 'BILLING_VARIANCE', 'BUDGET_VARIANCE', 'POTENTIAL_IRREGULARITY'].includes(a.type));
  if (personaId === 'BUDI' || personaId === 'ADMIN') {
    for (const { p, c } of crs.filter(({ c }) => ['DRAFT', 'REJECTED', 'CLIENT_REJECTED'].includes(c.status))) tasks.push({ key: `cr-${c.id}`, title: `${c.status === 'DRAFT' ? 'Lengkapi & ajukan' : 'Revisi & ajukan ulang'} ${c.crNumber}`, detail: `${p.name} · ${c.title}${c.origin === 'AI_DRAFT' ? ' · disiapkan CLARA' : ''}`, href: `/projects/${p.id}?tab=change-requests` });
    for (const { p, c } of crs.filter(({ c }) => c.status === 'INTERNAL_APPROVED')) tasks.push({ key: `cl-${c.id}`, title: `Catat bukti persetujuan klien ${c.crNumber}`, detail: `${p.name} · sudah disetujui internal`, href: `/projects/${p.id}?tab=change-requests` });
    for (const p of projects) for (const d of p.documents.filter((d) => d.status === 'NEEDS_REVIEW' || d.status === 'FAILED')) if (p.metrics.hasBaseline) tasks.push({ key: `doc-${d.id}`, title: `${d.status === 'FAILED' ? 'Analisis gagal' : 'Tinjau hasil analisis'}: ${d.fileName}`, detail: p.name, href: `/projects/${p.id}?tab=documents` });
    for (const a of openAlerts.filter((a) => ['REVISION_LIMIT', 'SCOPE_VARIANCE', 'DEADLINE_RISK'].includes(a.type))) tasks.push({ key: `al-${a.id}`, title: a.title, detail: `${a.projectName} · CLARA dapat menyiapkan permintaan perubahan`, href: `/projects/${a.projectId}?tab=alerts` });
  }
  if (personaId === 'SITI' || personaId === 'ADMIN') {
    for (const { p, c } of crs.filter(({ c }) => c.status === 'PENDING')) tasks.push({ key: `fin-${c.id}`, title: `Tinjau dampak keuangan ${c.crNumber}`, detail: `${p.name} · +${formatRupiah(c.additionalValue)}`, href: `/projects/${p.id}?tab=change-requests` });
    for (const a of finAlerts) tasks.push({ key: `fa-${a.id}`, title: a.title, detail: `${a.projectName} · ${impactText(a)}`, href: `/projects/${a.projectId}?tab=alerts` });
  }
  if (personaId === 'HENDRA' || personaId === 'ADMIN') {
    for (const { p, c } of crs.filter(({ c }) => c.status === 'FINANCE_REVIEWED')) tasks.push({ key: `dec-${c.id}`, title: `Putuskan ${c.crNumber}: ${c.title}`, detail: `${p.name} · +${formatRupiah(c.additionalValue)} · +${c.additionalRevisions} revisi · +${c.deadlineExtensionDays} hari · sudah ditinjau keuangan`, href: `/projects/${p.id}?tab=change-requests` });
  }
  const decisions = crs.filter(({ c }) => c.internalDecision).sort((a, b) => (b.c.internalDecision!.at).localeCompare(a.c.internalDecision!.at)).slice(0, 5);

  const s = summary;
  const metrics = s && (
    <section aria-label="Angka portofolio" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Metric label="Nilai kontrak" value={formatCompactRupiah(s.contractValue)} detail={`${s.activeProjectCount} proyek dengan acuan aktif`} />
      <Metric label="Rencana biaya (RAB)" value={formatCompactRupiah(s.plannedCost)} detail={`Laba rencana ${formatCompactRupiah(s.contractValue - s.plannedCost)}`} />
      <Metric label="Biaya aktual" value={formatCompactRupiah(s.actualCost)} detail={s.budgetUtilization === null ? 'RAB belum ada' : `${s.budgetUtilization.toLocaleString('id-ID')}% dari RAB`} tone={s.actualCost > s.plannedCost ? 'bad' : 'default'} />
      <Metric label="Progres rata-rata" value={s.averageProgress === null ? '-' : `${s.averageProgress}%`} detail="Dari proyek dengan acuan aktif" />
      <Metric label="Peringatan terbuka" value={String(s.openAlerts)} detail={`${s.newAlerts} baru belum dibaca`} tone={s.openAlerts ? 'bad' : 'good'} />
      <Metric label="Siap ditagih" value={formatCompactRupiah(s.billableValue)} detail="Syarat tagih terpenuhi" />
      <Metric label="Sudah ditagih" value={formatCompactRupiah(s.billedValue)} detail="Invoice tercatat" />
      <Metric label="Sudah dibayar" value={formatCompactRupiah(s.paidValue)} detail={`Piutang ${formatCompactRupiah(s.billedValue - s.paidValue)}`} tone="good" />
      <Metric label="Belum ditagih" value={formatCompactRupiah(s.unbilledValue)} detail="Hak tagih tanpa invoice — bukan kerugian" tone={s.unbilledValue ? 'warn' : 'default'} />
      <Metric label="Proyek" value={String(s.projectCount)} detail={`${needsSetup.length} menunggu acuan`} />
    </section>
  );

  const alertsPanel = (
    <Panel title="Perlu perhatian" description="Peringatan yang belum selesai, dengan bukti" action={<Link href="/alerts" className="text-sm font-semibold text-red-700 hover:underline">Semua →</Link>}>
      {openAlerts.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 p-5 text-sm text-zinc-600">{s && s.activeProjectCount === 0 ? 'Belum ada proyek aktif untuk diperiksa.' : 'Tidak ada peringatan terbuka.'}</p>
      ) : (
        <ul className="space-y-2">
          {openAlerts.slice(0, 6).map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setSelectedAlert(a)} className="w-full rounded-xl border border-zinc-200 p-3 text-left hover:border-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                <span className="flex flex-wrap items-center gap-2"><InsightBadge status={a.classification} /><span className="text-xs text-zinc-500">{a.status === 'NEW' ? 'Baru' : 'Sudah dibaca'}</span></span>
                <strong className="mt-1 block text-sm text-zinc-900">{a.title}</strong>
                <span className="mt-0.5 block text-xs text-zinc-500">{a.projectName} · {impactText(a)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );

  const billingPanel = (
    <Panel title="Siap ditagih, belum ada tagihan" description="Tahap selesai yang belum ditagih penuh" action={<Link href="/finance" className="text-sm font-semibold text-red-700 hover:underline">Keuangan →</Link>}>
      {readyToBill.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 p-5 text-sm text-zinc-600">Tidak ada tahap selesai yang menunggu tagihan.</p>
      ) : (
        <ul className="space-y-2">
          {readyToBill.map(({ project, milestone, remaining }) => (
            <li key={`${project.id}-${milestone.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
              <div>
                <p className="text-xs text-zinc-500">{project.name}</p>
                <p className="text-sm font-semibold text-zinc-900">{milestone.title}</p>
                <p className="text-sm font-bold text-amber-800">{formatRupiah(remaining)}</p>
              </div>
              {personaId === 'SITI' || personaId === 'ADMIN' ? (
                <button type="button" disabled={busy !== null} onClick={async () => { if (!window.confirm(`Catat tagihan ${formatRupiah(remaining)} untuk ${milestone.title}?`)) return; setBusy(milestone.id); await run(() => dataClient.createInvoice(project.id, milestone.id), 'Tagihan dicatat. Dashboard diperbarui.'); setBusy(null); }} className={btn.primary}>
                  {busy === milestone.id ? 'Menyimpan…' : 'Buat tagihan'}
                </button>
              ) : (
                <Link href={`/projects/${project.id}?tab=finance`} className={btn.ghost}>Lihat <ArrowRight className="h-4 w-4" /></Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );

  const projectsPanel = (
    <Panel title="Proyek" description="Status, versi acuan, dan nilai yang perlu ditindaklanjuti" action={<Link href="/projects" className="text-sm font-semibold text-red-700 hover:underline">Semua proyek →</Link>}>
      {s && s.projects.length === 0 ? (
        <div className="rounded-xl bg-zinc-50 p-8 text-center"><FolderKanban className="mx-auto mb-3 text-zinc-400" /><p className="text-sm font-semibold text-zinc-800">Belum ada proyek</p><Link href="/projects/new" className="mt-3 inline-block text-sm font-semibold text-red-700">Buat proyek →</Link></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500"><th className="py-2 pr-3">Proyek</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Acuan</th><th className="py-2 pr-3">Progres</th><th className="py-2 pr-3">Nilai kontrak</th><th className="py-2 pr-3">Belum ditagih</th><th className="py-2">Peringatan</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {s?.projects.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="py-2.5 pr-3"><Link href={`/projects/${p.id}`} className="font-semibold text-zinc-900 hover:text-red-700">{p.name}</Link><p className="text-xs text-zinc-500">{p.client}</p></td>
                  <td className="py-2.5 pr-3"><StatusBadge status={p.status} /></td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{p.baselineVersion}</td>
                  <td className="py-2.5 pr-3">{p.baselineVersion === '-' ? '-' : `${p.progress}%`}</td>
                  <td className="py-2.5 pr-3">{p.baselineVersion === '-' ? <Link href={`/projects/${p.id}`} className="text-xs font-semibold text-red-700">Siapkan acuan →</Link> : formatCompactRupiah(p.contractValue)}</td>
                  <td className={`py-2.5 pr-3 ${p.unbilledValue ? 'font-semibold text-amber-800' : ''}`}>{formatCompactRupiah(p.unbilledValue)}</td>
                  <td className={`py-2.5 ${p.openAlerts ? 'font-semibold text-red-700' : ''}`}>{p.openAlerts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );

  return (
    <div className="space-y-6 pb-12">
      <NoticeBar notice={notice} onClose={clear} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-700">Dashboard · Mode demo</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{role.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{role.description}</p>
        </div>
        <Link href={role.href} className={`${btn.primary} self-start`}><FilePlus2 className="h-4 w-4" />{role.action}</Link>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>Gagal memuat ringkasan: {error}</span>
          <button type="button" onClick={() => void refreshSummary()} className={btn.secondary}>Coba lagi</button>
        </div>
      )}
      {loading && !s ? <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-sm text-zinc-500">Memuat ringkasan…</div> : (
        <>
          {personaId === 'BUDI' && needsSetup.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
              <span><strong>{needsSetup.length} proyek</strong> menunggu acuan: {needsSetup.map((p) => p.name).join(', ')}.</span>
              <Link href={`/projects/${needsSetup[0].id}`} className={btn.primary}>Siapkan acuan <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
          <Panel title="Perlu tindakan Anda" description={`Disusun CLARA untuk ${personaId === 'BUDI' ? 'pengelola proyek' : personaId === 'SITI' ? 'keuangan' : personaId === 'HENDRA' ? 'pimpinan' : 'admin'} — Anda tidak perlu mencari masalahnya sendiri.`}>
            {tasks.length === 0 ? <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">Tidak ada tindakan yang menunggu Anda.</p> : (
              <ul className="space-y-2">
                {tasks.slice(0, 8).map((t) => (
                  <li key={t.key}><Link href={t.href} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 hover:border-red-300"><span><strong className="block text-sm text-zinc-900">{t.title}</strong><span className="text-xs text-zinc-500">{t.detail}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" /></Link></li>
                ))}
              </ul>
            )}
            {personaId === 'HENDRA' && decisions.length > 0 && (
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Riwayat keputusan</p>
                <ul className="mt-1.5 space-y-1 text-sm">{decisions.map(({ p, c }) => <li key={c.id}>{c.crNumber} · {c.internalDecision!.approved ? 'disetujui' : 'ditolak'} · {p.name}{c.status === 'APPROVED' ? ` · resmi ${c.resultingBaselineVersion}` : c.status === 'INTERNAL_APPROVED' ? ' · menunggu klien' : ''}</li>)}</ul>
              </div>
            )}
          </Panel>
          {metrics}
          {personaId === 'SITI' ? (
            <div className="grid gap-5 xl:grid-cols-2">{billingPanel}{alertsPanel}</div>
          ) : personaId === 'HENDRA' ? (
            <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">{alertsPanel}{billingPanel}</div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">{projectsPanel}{alertsPanel}</div>
          )}
          {personaId === 'BUDI' || personaId === 'ADMIN' ? billingPanel : projectsPanel}
        </>
      )}
      <EvidenceDrawer alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}
