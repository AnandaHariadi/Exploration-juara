'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Activity, AlertTriangle, Bot, FileText, FolderGit2, GitPullRequest, Receipt } from 'lucide-react';
import type { Alert } from '@/types';
import { useProject } from '@/hooks/useClaraData';
import { formatRupiah, isOpenAlert } from '@/lib/utils';
import { baselineAvailability } from '@/lib/baseline';
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
import { DocumentsTab } from '@/components/project/DocumentsTab';

const TABS = [
  { key: 'overview', label: 'Ringkasan', icon: FolderGit2 },
  { key: 'baseline', label: 'Acuan proyek', icon: FileText },
  { key: 'monitoring', label: 'Pemantauan', icon: Activity },
  { key: 'finance', label: 'Keuangan', icon: Receipt },
  { key: 'documents', label: 'Dokumen & AI', icon: Bot },
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
  const openAlerts = project.alerts.filter(isOpenAlert);
  const activeBaseline = project.baselines.find((version) => version.status === 'ACTIVE');
  const available = activeBaseline ? baselineAvailability(activeBaseline) : null;
  const missingSide = available && (!available.agreement || !available.budget) ? available.agreement ? 'RAB' : 'kesepakatan' : null;
  const hasProgressRecord = project.events.some((event) => event.type === 'PROGRESS_UPDATED');

  return (
    <div className="space-y-6 pb-16">
      <NoticeBar notice={notice} onClose={clear} />

      <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
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
          <dl className="grid gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><dt className="text-sm text-zinc-600">Nilai kesepakatan</dt><dd className="mt-1 text-lg font-bold text-zinc-950">{available?.contractValue ? formatRupiah(m.contractValue) : 'Belum ada acuan'}</dd></div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><dt className="text-sm text-zinc-600">Progres pekerjaan</dt><dd className="mt-1 text-lg font-bold text-zinc-950">{hasProgressRecord ? `${m.progress}%` : 'Belum dicatat'}</dd></div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><dt className="text-sm text-zinc-600">Belum dibuat tagihan</dt><dd className={`mt-1 text-lg font-bold ${m.unbilledValue > 0 ? 'text-amber-700' : 'text-zinc-950'}`}>{available?.billing ? formatRupiah(m.unbilledValue) : 'Syarat tagih belum ada'}</dd></div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><dt className="text-sm text-zinc-600">Peringatan terbuka</dt><dd className={`mt-1 text-lg font-bold ${openAlerts.length ? 'text-red-700' : 'text-zinc-950'}`}>{openAlerts.length}</dd></div>
          </dl>
        )}
      </div>

      {missingSide && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"><p><strong>Acuan {missingSide} belum ada.</strong> Pemantauan yang membutuhkan {missingSide} belum dapat dihitung. Acuan saat ini tetap aktif.</p><button type="button" onClick={() => setTab('baseline')} className={btn.secondary}>Lengkapi acuan</button></div>}

      {!m.hasBaseline ? (
        <BaselineSetup project={project} run={run} />
      ) : (
        <>
          <div role="tablist" aria-label="Bagian proyek" className="flex gap-1 overflow-x-auto border-b border-zinc-200 text-sm font-semibold">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.key;
              const badge =
                tab.key === 'alerts'
                  ? openAlerts.length
                  : tab.key === 'change-requests'
                    ? project.changeRequests.filter((c) => ['DRAFT', 'PENDING', 'FINANCE_REVIEWED', 'INTERNAL_APPROVED'].includes(c.status)).length
                    : tab.key === 'documents'
                      ? project.documents.filter((d) => d.status === 'PROCESSING' || d.status === 'NEEDS_REVIEW' || d.status === 'FAILED').length + project.drafts.filter((d) => d.status === 'READY_FOR_REVIEW' || d.status === 'NEEDS_FIX').length
                      : 0;
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
            {activeTab === 'baseline' && <div className="space-y-5">{missingSide && <BaselineSetup project={project} run={run} />}<BaselineTab project={project} /></div>}
            {activeTab === 'monitoring' && <MonitoringTab project={project} run={run} onProposeChange={(title) => { setPrefillScope(title); setTab('change-requests'); }} />}
            {activeTab === 'finance' && <FinanceTab project={project} run={run} />}
            {activeTab === 'documents' && <DocumentsTab project={project} run={run} onOpenAlert={setSelectedAlert} />}
            {activeTab === 'change-requests' && <ChangeRequestsTab project={project} run={run} prefillScope={prefillScope} onPrefillUsed={() => setPrefillScope(undefined)} />}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-zinc-600">{openAlerts.length} peringatan belum selesai. Buka bukti untuk memeriksa dasar temuan dan tindak lanjutnya.</p>
                  <label className="flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="accent-red-600" />Tampilkan yang selesai</label>
                </div>
                <AlertList alerts={showResolved ? project.alerts : openAlerts} onOpen={setSelectedAlert} emptyText={project.reconciliation.length ? 'Tidak ada peringatan terbuka pada pemeriksaan yang memiliki acuan.' : 'Belum ada parameter yang dapat diperiksa.'} />
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
