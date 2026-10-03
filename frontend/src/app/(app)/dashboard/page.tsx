'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, FilePlus2, FolderKanban, ReceiptText, TrendingUp } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { useActivePersona, useProjects } from '@/hooks/useClaraData';
import { formatCompactRupiah, formatRupiah } from '@/lib/utils';
import { Alert, Project, UserPersonaId } from '@/types';
import { StatusBadge } from '@/components/shared/Badge';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';

const roleIntro: Record<UserPersonaId, { title: string; description: string; action: string; href: string }> = {
  BUDI: { title: 'Pantau pekerjaan proyek', description: 'Lihat progres, tahap pekerjaan, dan perubahan yang perlu ditindaklanjuti.', action: 'Buat proyek', href: '/projects/new' },
  SITI: { title: 'Kelola tagihan dan biaya', description: 'Periksa pekerjaan yang siap ditagih, biaya yang tercatat, dan pembayaran.', action: 'Buka keuangan', href: '/finance' },
  HENDRA: { title: 'Tinjau kondisi portofolio', description: 'Lihat proyek yang perlu perhatian dan periksa dasar setiap peringatan.', action: 'Lihat peringatan', href: '/alerts' },
  ADMIN: { title: 'Ringkasan seluruh proyek', description: 'Periksa data demo, aktivitas proyek, dan pekerjaan yang perlu diselesaikan.', action: 'Lihat proyek', href: '/projects' },
};

function MetricCard({ label, value, detail, href }: { label: string; value: string; detail: string; href: string }) {
  return <Link href={href} className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
    <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-zinc-600">{label}</p><ArrowRight size={16} aria-hidden="true" className="text-zinc-400 group-hover:text-red-600" /></div>
    <p className="mt-3 font-heading text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{value}</p>
    <p className="mt-2 text-xs leading-relaxed text-zinc-500">{detail}</p>
  </Link>;
}

export default function DashboardPage() {
  const { projects, loading, error, refreshProjects } = useProjects();
  const { personaId } = useActivePersona();
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
  const [busyMilestone, setBusyMilestone] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const role = roleIntro[personaId];
  const total = (key: 'contractValue' | 'plannedCost' | 'actualCost' | 'billableValue' | 'billedValue' | 'paidValue') => projects.reduce((sum, project) => sum + project[key], 0);
  const billable = total('billableValue');
  const billed = total('billedValue');
  const unbilled = Math.max(0, billable - billed);
  const actualCost = total('actualCost');
  const plannedCost = total('plannedCost');
  const allAlerts = projects.flatMap((project) => project.alerts);
  const outstandingAlerts = allAlerts.filter((alert) => alert.status !== 'RESOLVED');
  const readyMilestones = projects.flatMap((project) => project.agreementBaseline.milestones.filter((milestone) => milestone.status === 'COMPLETED' && milestone.billingStatus === 'UNBILLED').map((milestone) => ({ project, milestone })));
  const riskProjects = projects.filter((project) => project.status === 'AT_RISK');

  async function issueInvoice(project: Project, milestoneId: string) {
    setBusyMilestone(milestoneId);
    setNotice(null);
    try { await dataClient.createInvoice(project.id, milestoneId); await refreshProjects(); setNotice('Tagihan berhasil dibuat. Periksa rinciannya di halaman keuangan.'); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Gagal membuat tagihan.'); }
    finally { setBusyMilestone(null); }
  }

  return <div className="space-y-6 pb-12">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-700">Ringkasan · Mode demo</p><h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{role.title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{role.description}</p></div>
      <Link href={role.href} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"><FilePlus2 size={17} />{role.action}</Link>
    </div>

    {notice && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900"><span>{notice}</span><button type="button" aria-label="Tutup pesan" onClick={() => setNotice(null)}>×</button></div>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Gagal memuat data: {error}</div>}
    {loading ? <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-sm text-zinc-500">Memuat ringkasan proyek…</div> : <>
      <section aria-label="Angka seluruh proyek" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Nilai kontrak" value={formatCompactRupiah(total('contractValue'))} detail={`Total dari ${projects.length} proyek dalam data demo`} href="/projects" />
        <MetricCard label="Biaya tercatat" value={formatCompactRupiah(actualCost)} detail={`Rencana biaya ${formatCompactRupiah(plannedCost)} · selisih ${formatCompactRupiah(actualCost - plannedCost)}`} href="/finance" />
        <MetricCard label="Siap, belum ditagih" value={formatCompactRupiah(unbilled)} detail="Nilai tahap selesai yang belum dibuatkan tagihan" href="/finance" />
        <MetricCard label="Sudah dibayar" value={formatCompactRupiah(total('paidValue'))} detail={`Dari tagihan ${formatCompactRupiah(billed)} yang telah dibuat`} href="/finance" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-heading text-lg font-bold text-zinc-950">Proyek</h2><p className="mt-1 text-sm text-zinc-500">Progres dan nilai kontrak tiap proyek</p></div><Link href="/projects" className="text-sm font-semibold text-red-700 hover:underline">Semua proyek →</Link></div>
          {projects.length === 0 ? <div className="mt-6 rounded-xl bg-zinc-50 p-8 text-center"><FolderKanban className="mx-auto mb-3 text-zinc-400" /><p className="text-sm font-semibold text-zinc-800">Belum ada proyek</p><p className="mt-1 text-sm text-zinc-500">Mulai dengan membuat proyek demo.</p><Link href="/projects/new" className="mt-4 inline-block text-sm font-semibold text-red-700">Buat proyek →</Link></div> : <div className="mt-5 divide-y divide-zinc-100">{projects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="group block py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-zinc-900 group-hover:text-red-700">{project.name}</h3><p className="mt-1 text-xs text-zinc-500">{project.client}</p></div><StatusBadge status={project.status} /></div><div className="mt-3 flex justify-between text-xs text-zinc-600"><span>Progres {project.progress}%</span><span className="font-semibold text-zinc-900">{formatCompactRupiah(project.contractValue)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full ${project.status === 'AT_RISK' ? 'bg-red-600' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} /></div></Link>)}</div>}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-2"><div><h2 className="font-heading text-lg font-bold text-zinc-950">Perlu perhatian</h2><p className="mt-1 text-sm text-zinc-500">Masalah yang belum dinyatakan selesai</p></div><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{outstandingAlerts.length}</span></div>
          {outstandingAlerts.length === 0 ? <p className="mt-6 rounded-xl bg-zinc-50 p-5 text-sm text-zinc-600">Belum ada peringatan yang perlu ditangani.</p> : <div className="mt-5 space-y-3">{outstandingAlerts.slice(0, 4).map((alert) => <button key={alert.id} type="button" onClick={() => setSelectedAlert(alert)} className="w-full rounded-xl border border-zinc-200 p-3 text-left hover:border-red-300"><span className="text-xs font-semibold text-red-700">{alert.status === 'NEW' ? 'Baru' : 'Sudah dibaca · belum selesai'}</span><strong className="mt-1 block text-sm text-zinc-900">{alert.title}</strong><span className="mt-1 block text-xs text-zinc-500">{alert.projectName}</span></button>)}<Link href="/alerts" className="inline-block pt-2 text-sm font-semibold text-red-700 hover:underline">Lihat semua peringatan →</Link></div>}
          {riskProjects.length > 0 && <p className="mt-5 border-t border-zinc-100 pt-4 text-xs text-zinc-600">{riskProjects.length} proyek berstatus perlu perhatian.</p>}
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-heading text-lg font-bold text-zinc-950">Tahap siap ditagih</h2><p className="mt-1 text-sm text-zinc-500">Pekerjaan selesai yang belum memiliki tagihan</p></div><Link href="/finance" className="text-sm font-semibold text-red-700 hover:underline">Buka keuangan →</Link></div>
        {readyMilestones.length === 0 ? <p className="mt-5 rounded-xl bg-zinc-50 p-5 text-sm text-zinc-600">Belum ada tahap selesai yang menunggu tagihan.</p> : <div className="mt-5 grid gap-3 md:grid-cols-2">{readyMilestones.map(({ project, milestone }) => <div key={`${project.id}-${milestone.id}`} className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center"><div><p className="text-xs text-zinc-500">{project.name}</p><h3 className="mt-1 text-sm font-semibold text-zinc-900">{milestone.title}</h3><p className="mt-1 text-sm font-bold text-zinc-950">{formatRupiah(milestone.value)}</p></div>{personaId === 'SITI' || personaId === 'ADMIN' ? <button type="button" disabled={busyMilestone === milestone.id} onClick={() => void issueInvoice(project, milestone.id)} className="min-h-10 shrink-0 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">{busyMilestone === milestone.id ? 'Menyimpan…' : 'Buat tagihan'}</button> : <Link href={`/projects/${project.id}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-red-700">Lihat proyek <ArrowRight size={15} className="ml-1" /></Link>}</div>)}</div>}
      </section>
    </>}
    <EvidenceDrawer alert={selectedAlert} onClose={() => setSelectedAlert(null)} onActionComplete={() => { void refreshProjects(); }} />
  </div>;
}
