'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Activity, AlertTriangle, FileText, FolderGit2, GitPullRequest, Receipt } from 'lucide-react';
import type { Alert } from '@/types';
import { useProject } from '@/hooks/useClaraData';
import { formatRupiah } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/Badge';
import { btn, DemoBadge, NoticeBar, useNotice } from '@/components/shared/ui';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';
import { AlertList } from '@/components/alerts/AlertList';
import { BaselineSetup } from '@/components/project/BaselineSetup';
import { OverviewTab } from '@/components/project/OverviewTab';
import { BaselineTab } from '@/components/project/BaselineTab';
import { MonitoringTab } from '@/components/project/MonitoringTab';
import { FinanceTab } from '@/components/project/FinanceTab';
import { ChangeRequestsTab } from '@/components/project/ChangeRequestsTab';

const TABS = [
  { key: 'overview', label: 'Ringkasan', icon: FolderGit2 },
  { key: 'baseline', label: 'Acuan proyek', icon: FileText },
  { key: 'monitoring', label: 'Pemantauan', icon: Activity },
  { key: 'finance', label: 'Keuangan', icon: Receipt },
  { key: 'change-requests', label: 'Perubahan', icon: GitPullRequest },
  { key: 'alerts', label: 'Peringatan', icon: AlertTriangle },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const projectId = params.id as string;
  const { project, loading, error, refreshProject } = useProject(projectId);
  const { notice, run, clear } = useNotice();
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
  const [prefillScope, setPrefillScope] = React.useState<string | undefined>();
  const [showResolved, setShowResolved] = React.useState(false);

  const requested = search.get('tab');
  const activeTab: TabKey = TABS.some((t) => t.key === requested) ? (requested as TabKey) : 'overview';
  const setTab = (key: TabKey) => router.replace(`/projects/${projectId}?tab=${key}`, { scroll: false });

  if (loading && !project) return <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">Memuat proyek…</div>;

  if (error && !project) {
    return (
      <div role="alert" className="space-y-4 rounded-2xl border border-red-200 bg-white p-12 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="text-lg font-bold text-zinc-900">Gagal memuat proyek</h1>
        <p className="text-sm text-red-700">{error}</p>
        <button type="button" onClick={() => void refreshProject()} className={btn.primary}>Coba lagi</button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-12 text-center">
        <FolderGit2 className="mx-auto h-10 w-10 text-zinc-400" />
        <h1 className="text-lg font-bold text-zinc-900">Proyek tidak ditemukan</h1>
        <p className="text-xs text-zinc-500">ID: {projectId}</p>
        <Link href="/projects" className={btn.primary}>Kembali ke daftar proyek</Link>
      </div>
    );
  }

  const m = project.metrics;
  const openAlerts = project.alerts.filter((a) => a.status !== 'RESOLVED');

  return (
    <div className="space-y-6 pb-16">
      <NoticeBar notice={notice} onClose={clear} />

      <div className="flex flex-col justify-between gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-500">{project.id}</span>
            <StatusBadge status={project.status} />
            {m.hasBaseline && <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-xs font-semibold text-red-700">Acuan {m.baselineVersion}</span>}
            {project.isDemo && <DemoBadge />}
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950">{project.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">Klien: <strong className="text-zinc-700">{project.client}</strong>{project.agreementBaseline.contractNumber ? ` · ${project.agreementBaseline.contractNumber}` : ''}</p>
        </div>
        {m.hasBaseline && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-zinc-100 pt-4 sm:grid-cols-4 lg:border-t-0 lg:pt-0">
            <div><dt className="text-xs font-semibold uppercase text-zinc-500">Nilai kontrak</dt><dd className="text-lg font-bold text-zinc-950">{formatRupiah(m.contractValue)}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-zinc-500">Progres</dt><dd className="text-lg font-bold text-zinc-950">{m.progress}%</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-zinc-500">Belum ditagih</dt><dd className={`text-lg font-bold ${m.unbilledValue > 0 ? 'text-amber-700' : 'text-zinc-950'}`}>{formatRupiah(m.unbilledValue)}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-zinc-500">Peringatan</dt><dd className={`text-lg font-bold ${openAlerts.length ? 'text-red-700' : 'text-zinc-950'}`}>{openAlerts.length}</dd></div>
          </dl>
        )}
      </div>

      {!m.hasBaseline ? (
        <BaselineSetup project={project} run={run} />
      ) : (
        <>
          <div role="tablist" aria-label="Bagian proyek" className="flex gap-1 overflow-x-auto border-b border-zinc-200 text-sm font-semibold">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.key;
              const badge = tab.key === 'alerts' ? openAlerts.length : tab.key === 'change-requests' ? project.changeRequests.filter((c) => c.status === 'PENDING').length : 0;
              return (
                <button key={tab.key} type="button" role="tab" aria-selected={selected} onClick={() => setTab(tab.key)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 transition-colors ${selected ? 'border-red-600 bg-red-50/50 text-red-700' : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'}`}>
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {badge > 0 && <span className="rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{badge}</span>}
                </button>
              );
            })}
          </div>

          <div role="tabpanel">
            {activeTab === 'overview' && <OverviewTab project={project} onOpenAlert={setSelectedAlert} />}
            {activeTab === 'baseline' && <BaselineTab project={project} />}
            {activeTab === 'monitoring' && <MonitoringTab project={project} run={run} onProposeChange={(title) => { setPrefillScope(title); setTab('change-requests'); }} />}
            {activeTab === 'finance' && <FinanceTab project={project} run={run} />}
            {activeTab === 'change-requests' && <ChangeRequestsTab project={project} run={run} prefillScope={prefillScope} onPrefillUsed={() => setPrefillScope(undefined)} />}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-zinc-600">{openAlerts.length} peringatan belum selesai. Membaca peringatan tidak menyelesaikan masalah.</p>
                  <label className="flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="accent-red-600" />Tampilkan yang selesai</label>
                </div>
                <AlertList alerts={showResolved ? project.alerts : openAlerts} onOpen={setSelectedAlert} emptyText={m.hasBaseline ? 'Tidak ada peringatan terbuka. Semua pemeriksaan sesuai acuan.' : 'Belum ada data untuk diperiksa.'} />
              </div>
            )}
          </div>
        </>
      )}

      <EvidenceDrawer alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <React.Suspense fallback={<div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">Memuat proyek…</div>}>
      <ProjectDetail />
    </React.Suspense>
  );
}
