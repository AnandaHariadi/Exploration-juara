'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FilePlus2, FolderKanban } from 'lucide-react';
import type { UserPersonaId } from '@/types';
import { dataClient } from '@/services/dataClient';
import { useActivePersona, useDashboardSummary, useProjects } from '@/hooks/useClaraData';
import { formatCompactRupiah, formatRupiah, isOpenAlert } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/Badge';
import { impactText } from '@/components/alerts/EvidenceDrawer';
import { btn, Metric, NoticeBar, Panel, useNotice } from '@/components/shared/ui';

const roleIntro: Record<UserPersonaId, { title: string; description: string; action: string; href: string }> = {
  BUDI: { title: 'Pekerjaan proyek', description: 'Lihat proyek yang menunggu acuan dan tugas yang perlu Anda kerjakan.', action: 'Buat proyek', href: '/projects/new' },
  SITI: { title: 'Keuangan proyek', description: 'Periksa biaya, tagihan, pembayaran, dan perubahan yang menunggu tinjauan.', action: 'Buka keuangan', href: '/finance' },
  HENDRA: { title: 'Keputusan proyek', description: 'Tinjau permintaan perubahan dan peringatan sebelum mengambil keputusan.', action: 'Tinjau peringatan', href: '/alerts' },
  ADMIN: { title: 'Semua proyek', description: 'Lihat tugas, angka, dan kondisi setiap proyek dalam data demo.', action: 'Lihat proyek', href: '/projects' },
};

export default function DashboardPage() {
  const { summary, loading, error, refreshSummary } = useDashboardSummary();
  const { projects } = useProjects();
  const { personaId } = useActivePersona();
  const { notice, run, clear } = useNotice();
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
    for (const { p, c } of crs.filter(({ c }) => ['DRAFT', 'REJECTED', 'CLIENT_REJECTED'].includes(c.status))) tasks.push({ key: `cr-${c.id}`, title: `${c.status === 'DRAFT' ? 'Lengkapi dan ajukan' : 'Perbaiki dan ajukan ulang'} ${c.crNumber}`, detail: `${p.name} · ${c.title}${c.origin === 'AI_DRAFT' ? ' · disiapkan CLARA' : ''}`, href: `/projects/${p.id}?tab=change-requests` });
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
    <section aria-label="Angka seluruh proyek" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Proyek" value={String(s.projectCount)} detail={`${s.activeProjectCount} berjalan · ${needsSetup.length} menunggu acuan`} />
      <Metric label="Nilai kontrak" value={formatCompactRupiah(s.contractValue)} detail="Total proyek dengan acuan aktif" />
      <Metric label="Biaya tercatat" value={formatCompactRupiah(s.actualCost)} detail={s.plannedCost > 0 ? `Dari rencana biaya ${formatCompactRupiah(s.plannedCost)}` : 'Rencana biaya belum ada'} tone={s.plannedCost > 0 && s.actualCost > s.plannedCost ? 'bad' : 'default'} />
      <Metric label="Belum dibuat tagihan" value={formatCompactRupiah(s.unbilledValue)} detail={`Dari hak tagih ${formatCompactRupiah(s.billableValue)}; ${formatCompactRupiah(s.billedValue)} sudah ditagih`} tone={s.unbilledValue ? 'warn' : 'default'} />
    </section>
  );

  const billingPanel = (
    <Panel title="Tahap selesai yang belum ditagih" description="Nilai tahap yang memenuhi syarat dan belum dibuat tagihannya." action={<Link href="/finance" className="text-sm font-semibold text-red-700 hover:underline">Keuangan →</Link>}>
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
    <Panel title="Daftar proyek" description="Pilih nama proyek untuk membuka rincian dan mencatat kegiatan." action={<Link href="/projects" className="text-sm font-semibold text-red-700 hover:underline">Semua proyek →</Link>}>
      {s && s.projects.length === 0 ? (
        <div className="rounded-xl bg-zinc-50 p-8 text-center"><FolderKanban className="mx-auto mb-3 text-zinc-400" /><p className="text-sm font-semibold text-zinc-800">Belum ada proyek</p><Link href="/projects/new" className="mt-3 inline-block text-sm font-semibold text-red-700">Buat proyek →</Link></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50"><tr className="text-zinc-700"><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Proyek</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Status dan acuan</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Progres</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Nilai kontrak</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Belum ditagih</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 text-right font-semibold">Peringatan</th></tr></thead>
            <tbody>
              {s?.projects.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 [&:not(:last-child)>td]:border-b [&>td]:border-zinc-200">
                  <td className="border-r px-4 py-3"><Link href={`/projects/${p.id}`} className="font-semibold text-zinc-900 underline-offset-2 hover:text-red-700 hover:underline">{p.name}</Link><p className="mt-1 text-sm text-zinc-500">{p.client}</p></td>
                  <td className="border-r px-4 py-3"><StatusBadge status={p.status} /><span className="ml-2 text-sm text-zinc-600">{p.baselineVersion === '-' ? 'Acuan belum disetujui' : `Acuan ${p.baselineVersion}`}</span></td>
                  <td className="border-r px-4 py-3 text-right tabular-nums">{p.baselineVersion === '-' ? '—' : `${p.progress}%`}</td>
                  <td className="border-r px-4 py-3 text-right tabular-nums">{p.baselineVersion === '-' ? <Link href={`/projects/${p.id}`} className="font-semibold text-red-700 hover:underline">Siapkan acuan</Link> : formatCompactRupiah(p.contractValue)}</td>
                  <td className={`border-r px-4 py-3 text-right tabular-nums ${p.unbilledValue ? 'font-semibold text-amber-800' : ''}`}>{formatCompactRupiah(p.unbilledValue)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${p.openAlerts ? 'font-semibold text-red-700' : ''}`}>{p.openAlerts}</td>
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
      {!s ? (loading ? <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-sm text-zinc-500">Memuat ringkasan…</div> : null) : (
        <>
          {personaId === 'BUDI' && needsSetup.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
              <span><strong>{needsSetup.length} proyek</strong> menunggu acuan: {needsSetup.map((p) => p.name).join(', ')}.</span>
              <Link href={`/projects/${needsSetup[0].id}`} className={btn.primary}>Siapkan acuan <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
          {metrics}
          <Panel title="Tugas yang menunggu Anda" description={tasks.length ? 'Buka tugas untuk melihat data dan menentukan tindakan berikutnya.' : 'Belum ada tugas yang perlu Anda kerjakan.'} action={<Link href="/alerts" className="text-sm font-semibold text-red-700 hover:underline">{s?.openAlerts ?? 0} peringatan terbuka →</Link>}>
            {tasks.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Tugas</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Keterangan</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Buka</th></tr></thead>
                  <tbody>{tasks.slice(0, 8).map((t) => <tr key={t.key} className="hover:bg-zinc-50 [&:not(:last-child)>td]:border-b [&>td]:border-zinc-200"><td className="border-r px-4 py-3 font-semibold text-zinc-900">{t.title}</td><td className="border-r px-4 py-3 text-zinc-600">{t.detail}</td><td className="px-4 py-3"><Link href={t.href} className="font-semibold text-red-700 hover:underline">Lihat tugas →</Link></td></tr>)}</tbody>
                </table>
              </div>
            )}
            {personaId === 'HENDRA' && decisions.length > 0 && (
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Riwayat keputusan</p>
                <ul className="mt-1.5 space-y-1 text-sm">{decisions.map(({ p, c }) => <li key={c.id}>{c.crNumber} · {c.internalDecision!.approved ? 'disetujui' : 'ditolak'} · {p.name}{c.status === 'APPROVED' ? ` · resmi ${c.resultingBaselineVersion}` : c.status === 'INTERNAL_APPROVED' ? ' · menunggu klien' : ''}</li>)}</ul>
              </div>
            )}
          </Panel>
          {projectsPanel}
          {readyToBill.length > 0 && billingPanel}
        </>
      )}
    </div>
  );
}
