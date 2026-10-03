'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  FolderGit2,
  FileText,
  Activity,
  Receipt,
  GitPullRequest,
  AlertTriangle,
  Plus,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { Project, Alert, ScopeItem, Milestone, ProjectEvent, ActualCostItem } from '@/types';
import { formatCompactRupiah, formatRupiah, formatDate } from '@/lib/utils';
import { StatusBadge, ScopeBadge, BillingBadge, SeverityBadge } from '@/components/shared/Badge';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';
import { AccessibleDialog } from '@/components/shared/AccessibleDialog';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'baseline' | 'monitoring' | 'finance' | 'change-requests' | 'alerts'>('overview');
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);

  // Modal states for interactive actions
  const [showAddEventModal, setShowAddEventModal] = React.useState(false);
  const [newEventTitle, setNewEventTitle] = React.useState('');
  const [newEventType, setNewEventType] = React.useState<ProjectEvent['type']>('REVISION_LOGGED');
  const [newEventDesc, setNewEventDesc] = React.useState('');

  const [showAddCostModal, setShowAddCostModal] = React.useState(false);
  const [costCategory, setCostCategory] = React.useState<ActualCostItem['category']>('DEVELOPMENT');
  const [costAmount, setCostAmount] = React.useState<number>(0);
  const [costDesc, setCostDesc] = React.useState('');

  const [showAddCRModal, setShowAddCRModal] = React.useState(false);
  const [crTitle, setCrTitle] = React.useState('');
  const [crDesc, setCrDesc] = React.useState('');
  const [crScope, setCrScope] = React.useState('');
  const [crValue, setCrValue] = React.useState<number>(0);
  const [crDays, setCrDays] = React.useState<number>(0);

  // Status aksi, error, dan feedback interaktif
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [newEventMilestoneId, setNewEventMilestoneId] = React.useState<string>('');

  const loadProject = React.useCallback(async () => {
    try {
      setLoadError(null);
      const next = await dataClient.getProject(projectId);
      setProject(next ? { ...next } : null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat data proyek.');
    } finally {
      setProjectLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    setProjectLoading(true);
    void loadProject();
    return dataClient.subscribeData(() => { void loadProject(); });
  }, [loadProject]);

  React.useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  if (projectLoading) {
    return <div className="p-12 text-center text-sm text-slate-500">Memuat proyek...</div>;
  }

  if (loadError) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-rose-200 space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">Gagal Memuat Proyek</h2>
          <p className="text-xs text-rose-600 mt-1">{loadError}</p>
        </div>
        <div>
          <button
            onClick={() => { setProjectLoading(true); void loadProject(); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
        <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">Proyek tidak ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">ID: {projectId}</p>
        </div>
        <div>
          <a
            href="/projects"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Kembali ke daftar proyek
          </a>
        </div>
      </div>
    );
  }

  // Jalankan tindakan tulis; tampilkan hasilnya dan jangan menelan kegagalan.
  const runAction = async (action: () => Promise<unknown>, successText: string): Promise<boolean> => {
    setBusy(true);
    setActionError(null);
    setActionNotice(null);
    try {
      await action();
      await loadProject();
      setActionNotice(successText);
      return true;
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Tindakan gagal dilakukan.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const pendingMilestones = (project.agreementBaseline?.milestones || []).filter((m) => m.status !== 'COMPLETED');

  // Quick Action Handlers
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await runAction(
      () =>
        dataClient.addProjectEvent(projectId, {
          type: newEventType,
          title: newEventTitle,
          description: newEventDesc,
          date: new Date().toISOString().split('T')[0],
          author: 'Business Owner (You)',
          milestoneId: newEventType === 'MILESTONE_COMPLETED' ? newEventMilestoneId : undefined,
        }),
      newEventType === 'MILESTONE_COMPLETED'
        ? 'Tahap pekerjaan selesai. Nilai siap ditagih diperbarui.'
        : 'Kegiatan proyek berhasil dicatat.',
    );
    if (ok) {
      setShowAddEventModal(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventMilestoneId('');
    }
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await runAction(
      () =>
        dataClient.addActualCost(projectId, {
          date: new Date().toISOString().split('T')[0],
          category: costCategory,
          description: costDesc || 'Pengeluaran sprint operasional',
          amount: costAmount,
          submittedBy: 'Finance Ops',
        }),
      'Biaya aktual berhasil dicatat.',
    );
    if (ok) {
      setShowAddCostModal(false);
      setCostDesc('');
    }
  };

  const handleCreateCR = async (e: React.FormEvent) => {
    e.preventDefault();
    const crCount = (project.changeRequests || []).length + 1;
    const ok = await runAction(
      () =>
        dataClient.addChangeRequest(projectId, {
          crNumber: `CR/${project.id}/${crCount.toString().padStart(3, '0')}`,
          title: crTitle,
          description: crDesc,
          reason: 'Penyesuaian kebutuhan baru dari stakeholder klien',
          additionalScope: crScope.split(',').map((s) => s.trim()).filter(Boolean),
          additionalValue: crValue,
          deadlineExtensionDays: crDays,
        }),
      'Permintaan perubahan berhasil diajukan dan menunggu persetujuan.',
    );
    if (ok) {
      setShowAddCRModal(false);
      setCrTitle('');
      setCrDesc('');
      setCrScope('');
    }
  };

  const handleApproveCR = async (crId: string) => {
    if (confirm('Setujui permintaan perubahan ini? Acuan proyek akan diperbarui.')) {
      await runAction(
        () => dataClient.approveChangeRequest(projectId, crId),
        'Permintaan perubahan disetujui. Acuan proyek naik versi.',
      );
    }
  };

  const handleCreateInvoice = async (milestoneId: string) => {
    await runAction(() => dataClient.createInvoice(projectId, milestoneId), 'Tagihan berhasil dicatat.');
  };

  const handleRecordPayment = async (invoiceId: string) => {
    if (confirm('Catat pembayaran lunas untuk invoice ini?')) {
      await runAction(() => dataClient.recordPayment(projectId, invoiceId), 'Pembayaran berhasil dicatat.');
    }
  };

  const unbilledAmount = Math.max(0, project.billableValue - project.billedValue);
  const costVariance = project.actualCost - project.plannedCost;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 relative">
      {/* Toast / Banner notifikasi aksi */}
      {(actionError || actionNotice) && (
        <div className="fixed top-4 right-4 z-[70] max-w-md w-full shadow-lg rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {actionError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Gagal Mengeksekusi Aksi</p>
                  <p className="text-xs text-rose-700 mt-0.5">{actionError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-rose-500 hover:text-rose-700 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}
          {actionNotice && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Berhasil</p>
                  <p className="text-xs text-emerald-700 mt-0.5">{actionNotice}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="text-emerald-500 hover:text-emerald-700 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Project Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              {project.id}
            </span>
            <StatusBadge status={project.status} />
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-mono">
              Acuan {project.baselineVersion}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Klien: <strong className="text-slate-700">{project.client}</strong> · Nomor kesepakatan: {project.agreementBaseline?.contractNumber || '-'}
          </p>
        </div>

        {/* Header Key Metrics */}
        <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 sm:gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nilai Kontrak</span>
            <p className="text-lg font-extrabold text-slate-900">{formatRupiah(project.contractValue)}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Biaya tercatat</span>
            <p className={`text-lg font-extrabold ${costVariance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatRupiah(project.actualCost)}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Revisi Aktif</span>
            <p className={`text-lg font-extrabold ${project.activeRevisionCount > (project.agreementBaseline?.revisionLimit ?? 3) ? 'text-rose-600' : 'text-slate-900'}`}>
              {project.activeRevisionCount} / {project.agreementBaseline?.revisionLimit ?? 3}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-px overflow-x-auto text-xs font-semibold">
        {[
          { key: 'overview', label: 'Ringkasan', icon: FolderGit2 },
          { key: 'baseline', label: 'Kesepakatan awal', icon: FileText },
          { key: 'monitoring', label: 'Pemantauan', icon: Activity },
          { key: 'finance', label: 'Keuangan', icon: Receipt },
          { key: 'change-requests', label: 'Perubahan', icon: GitPullRequest, badge: project.changeRequests?.length },
          { key: 'alerts', label: 'Peringatan', icon: AlertTriangle, badge: project.alerts?.filter((a) => a.status !== 'RESOLVED').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-red-600 text-red-600 bg-red-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-rose-500 text-white font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Kondisi proyek</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Siap, belum ditagih</span>
                  <span className="font-bold text-amber-700">{formatRupiah(unbilledAmount)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Selisih biaya dari rencana</span>
                  <span className={`font-bold ${costVariance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {costVariance > 0 ? `+${formatRupiah(costVariance)} di atas rencana` : 'Belum melebihi rencana'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Progres pekerjaan</span>
                  <span className="font-bold text-red-600">{project.progress}% Selesai</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">Riwayat kegiatan</h3>
                <button
                  onClick={() => setShowAddEventModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat kegiatan</span>
                </button>
              </div>

              <div className="space-y-3">
                {project.events?.map((evt) => (
                  <div key={evt.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3 text-xs">
                    <Clock className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-semibold">{evt.title}</strong>
                        <span className="text-xs text-slate-400">{formatDate(evt.date)}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{evt.description}</p>
                      <span className="text-xs text-slate-500 mt-1 inline-block">Dicatat oleh: {evt.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: BASELINE (CONTRACT & RAB) */}
      {activeTab === 'baseline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agreement Baseline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kesepakatan proyek</h3>
                <p className="text-xs text-slate-500">Data kesepakatan yang tersimpan. Periksa dokumen asli untuk rujukan hukum.</p>
              </div>
              <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {project.baselineVersion}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-400">Ketentuan Pembayaran</span>
                <p className="text-slate-800 font-medium">{project.agreementBaseline?.paymentTerms}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-400">Batas Revisi Maksimal</span>
                <p className="text-slate-800 font-medium">{project.agreementBaseline?.revisionLimit} putaran revisi resmi</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Tahap pembayaran</h4>
                <div className="space-y-2">
                  {project.agreementBaseline?.milestones.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{m.title}</p>
                        <p className="text-xs text-slate-500">Target: {formatDate(m.targetDate)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{formatRupiah(m.value)}</span>
                        <div><BillingBadge status={m.billingStatus} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Plan Baseline (RAB) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rencana biaya (RAB)</h3>
                <p className="text-xs text-slate-500">Alokasi anggaran biaya rencana.</p>
              </div>
              <span className="text-xs font-bold text-slate-800">
                Total: {formatRupiah(project.plannedCost)}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {project.planBaseline?.items.map((rab) => (
                <div key={rab.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{rab.category}</span>
                    <p className="text-xs text-slate-500">{rab.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">{formatRupiah(rab.plannedAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MONITORING & SCOPE COMPARISON */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ruang lingkup pekerjaan</h3>
                <p className="text-xs text-slate-500">
                  Daftar pekerjaan dalam acuan proyek dan catatan yang perlu diperiksa.
                </p>
              </div>
              <button
                onClick={() => setShowAddEventModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-600 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat kegiatan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-xs tracking-wider">
                    <th className="py-3 px-3">Pekerjaan</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Rujukan</th>
                    <th className="py-3 px-3">Status Kesesuaian</th>
                    <th className="py-3 px-3">Catatan Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {project.agreementBaseline?.scopeItems.map((scope) => (
                    <tr key={scope.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-slate-400 block">{scope.id}</span>
                        <strong className="text-slate-900 font-semibold">{scope.title}</strong>
                        <p className="text-xs text-slate-500">{scope.description}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-600">{scope.category === 'CORE_FEATURE' ? 'Pekerjaan utama' : scope.category === 'INTEGRATION' ? 'Integrasi' : scope.category === 'INFRASTRUCTURE' ? 'Infrastruktur' : 'Pemeliharaan'}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-xs">
                        {scope.contractClauseRef || 'Rujukan dokumen belum tersedia'}
                      </td>
                      <td className="py-3 px-3">
                        <ScopeBadge status={scope.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {scope.deviationNotes ? (
                          <span className="text-rose-600 font-medium">{scope.deviationNotes}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: FINANCE & VALUE REALIZATION */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Realization Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold uppercase text-slate-500">Nilai kontrak</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCompactRupiah(project.contractValue)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-red-200 bg-red-50/20">
              <span className="text-xs font-bold uppercase text-red-700">Siap ditagih</span>
              <p className="text-xl font-bold text-zinc-900 mt-1">{formatCompactRupiah(project.billableValue)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20">
              <span className="text-xs font-bold uppercase text-amber-700">Siap, belum ditagih</span>
              <p className="text-xl font-bold text-amber-900 mt-1">{formatCompactRupiah(unbilledAmount)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20">
              <span className="text-xs font-bold uppercase text-emerald-700">Sudah dibayar</span>
              <p className="text-xl font-bold text-emerald-900 mt-1">{formatCompactRupiah(project.paidValue)}</p>
            </div>
          </div>

          {/* Milestone Billing Actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Tagihan per tahap pekerjaan</h3>
            <div className="space-y-3 text-xs">
              {project.agreementBaseline?.milestones.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{m.title}</h4>
                    <p className="text-slate-500">Nilai tahap: {formatRupiah(m.value)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <BillingBadge status={m.billingStatus} />
                    {m.status !== 'COMPLETED' && m.billingStatus === 'UNBILLED' && (
                      <span className="text-xs text-slate-500">Menunggu tahap selesai</span>
                    )}
                    {m.status === 'COMPLETED' && m.billingStatus === 'UNBILLED' && (
                      <button
                        onClick={() => handleCreateInvoice(m.id)}
                        disabled={busy}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-600 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all"
                      >
                        Buat tagihan
                      </button>
                    )}
                    {m.billingStatus === 'INVOICED' && m.invoiceId && (
                      <button
                        onClick={() => handleRecordPayment(m.invoiceId as string)}
                        disabled={busy}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all"
                      >
                        Catat lunas
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actual Cost List & Add Cost */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Biaya yang tercatat</h3>
                <p className="text-xs text-slate-500">Total riil: {formatRupiah(project.actualCost)}</p>
              </div>
              <button
                onClick={() => setShowAddCostModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat biaya</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {project.actualCosts?.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900">{c.description}</strong>
                    <p className="text-slate-400 text-xs">{c.category} • {formatDate(c.date)} by {c.submittedBy}</p>
                  </div>
                  <span className="font-bold text-slate-800">{formatRupiah(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: CHANGE REQUESTS */}
      {activeTab === 'change-requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Permintaan perubahan</h3>
              <p className="text-xs text-slate-500">
                Catat pekerjaan tambahan agar nilai, ruang lingkup, dan tenggat baru dapat ditinjau sebelum disetujui.
              </p>
            </div>
            <button
              onClick={() => setShowAddCRModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan perubahan</span>
            </button>
          </div>

          <div className="space-y-4">
            {project.changeRequests?.map((cr) => (
              <div key={cr.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                      {cr.crNumber}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{cr.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{cr.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      cr.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {cr.status === 'APPROVED' ? 'Disetujui' : cr.status === 'PENDING' ? 'Menunggu persetujuan' : cr.status === 'REJECTED' ? 'Ditolak' : 'Draf'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-xs uppercase font-semibold">Tambahan Nilai</span>
                    <p className="font-bold text-slate-800">+{formatRupiah(cr.additionalValue)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase font-semibold">Perpanjangan Waktu</span>
                    <p className="font-bold text-slate-800">+{cr.deadlineExtensionDays} Hari</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase font-semibold">Alasan</span>
                    <p className="font-medium text-slate-700 truncate">{cr.reason}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-semibold">Versi acuan</span>
                    <p className="font-bold text-red-600">{cr.resultingBaselineVersion || 'Belum disetujui'}</p>
                  </div>
                </div>

                {cr.status === 'APPROVED' && <p className="text-sm text-zinc-600">Disetujui {cr.approvedAt ? formatDate(cr.approvedAt) : ''} oleh {project.events.find((event) => event.type === 'CHANGE_REQUEST_APPROVED' && event.title.includes(cr.crNumber))?.author ?? 'pengguna demo'}.</p>}

                {cr.status === 'PENDING' && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleApproveCR(cr.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Setujui perubahan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: ALERTS & EVIDENCE */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Peringatan proyek</h3>
            <p className="text-xs text-slate-500">Daftar potensi deviasi yang terdeteksi pada project ini.</p>
          </div>

          <div className="space-y-3">
            {project.alerts?.map((alert) => (
              <div key={alert.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs text-slate-500">{alert.type === 'BILLING_VARIANCE' ? 'Tagihan' : alert.type === 'BUDGET_VARIANCE' ? 'Biaya' : alert.type === 'SCOPE_VARIANCE' ? 'Ruang lingkup' : alert.type === 'REVISION_LIMIT' ? 'Batas revisi' : 'Tenggat'}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                  <p className="text-xs text-slate-600">{alert.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-rose-600 block mb-1">{formatRupiah(alert.rupiahImpact)}</span>
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg"
                  >
                    Buka Bukti
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Project Event */}
      {showAddEventModal && (
        <AccessibleDialog titleId="add-event-title" onClose={() => setShowAddEventModal(false)}>
          <form onSubmit={handleAddEvent} className="bg-white rounded-2xl max-w-md w-full mx-auto p-6 space-y-4 shadow-xl">
            <h3 id="add-event-title" className="text-base font-bold text-slate-900">Catat kegiatan proyek</h3>
            <div>
              <label htmlFor="event-type" className="block text-xs font-bold text-slate-700 uppercase mb-1">Jenis kegiatan</label>
              <select
                id="event-type"
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              >
                <option value="REVISION_LOGGED">Catat revisi</option>
                <option value="MILESTONE_COMPLETED">Tahap pekerjaan selesai</option>
                <option value="SCOPE_ADDED">Pekerjaan tambahan</option>
              </select>
            </div>
            {newEventType === 'MILESTONE_COMPLETED' && (
              <div>
                <label htmlFor="event-milestone" className="block text-xs font-bold text-slate-700 uppercase mb-1">Tahap yang diselesaikan</label>
                {pendingMilestones.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2">
                    Semua milestone pada acuan proyek ini sudah selesai.
                  </p>
                ) : (
                  <select
                    id="event-milestone"
                    required
                    value={newEventMilestoneId}
                    onChange={(e) => setNewEventMilestoneId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="">Pilih tahap pekerjaan</option>
                    {pendingMilestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({formatRupiah(m.value)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            <div>
              <label htmlFor="event-title" className="block text-xs font-bold text-slate-700 uppercase mb-1">Judul kegiatan</label>
              <input
                id="event-title"
                type="text"
                required
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Contoh: Revisi Tampilan UI Form Checkout"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="event-description" className="block text-xs font-bold text-slate-700 uppercase mb-1">Keterangan tambahan</label>
              <textarea
                id="event-description"
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                rows={3}
                placeholder="Rincian permintaan atau alasan..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
              >
                Simpan kegiatan
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {/* Modal: Add Cost */}
      {showAddCostModal && (
        <AccessibleDialog titleId="add-cost-title" onClose={() => setShowAddCostModal(false)}>
          <form onSubmit={handleAddCost} className="bg-white rounded-2xl max-w-md w-full mx-auto p-6 space-y-4 shadow-xl">
            <h3 id="add-cost-title" className="text-base font-bold text-slate-900">Catat biaya proyek</h3>
            <div>
              <label htmlFor="cost-category" className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategori</label>
              <select
                id="cost-category"
                value={costCategory}
                onChange={(e) => setCostCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              >
                <option value="DEVELOPMENT">Pengembangan dan tenaga kerja</option>
                <option value="INFRASTRUCTURE">Infrastruktur</option>
                <option value="THIRD_PARTY_API">Layanan pihak ketiga</option>
                <option value="DESIGN">Desain dan pengujian</option>
              </select>
            </div>
            <div>
              <label htmlFor="cost-amount" className="block text-xs font-bold text-slate-700 uppercase mb-1">Jumlah biaya (Rp)</label>
              <input
                id="cost-amount"
                type="number"
                required
                value={costAmount}
                onChange={(e) => setCostAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label htmlFor="cost-description" className="block text-xs font-bold text-slate-700 uppercase mb-1">Keterangan</label>
              <input
                id="cost-description"
                type="text"
                required
                value={costDesc}
                onChange={(e) => setCostDesc(e.target.value)}
                placeholder="Contoh: AWS Overages September"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCostModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
              >
                Simpan Biaya
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {/* Modal: Create Change Request */}
      {showAddCRModal && (
        <AccessibleDialog titleId="add-change-title" onClose={() => setShowAddCRModal(false)}>
          <form onSubmit={handleCreateCR} className="bg-white rounded-2xl max-w-lg w-full mx-auto p-6 space-y-4 shadow-xl">
            <h3 id="add-change-title" className="text-base font-bold text-slate-900">Ajukan perubahan</h3>
            <div>
              <label htmlFor="change-title" className="block text-xs font-bold text-slate-700 uppercase mb-1">Judul perubahan</label>
              <input
                id="change-title"
                type="text"
                required
                value={crTitle}
                onChange={(e) => setCrTitle(e.target.value)}
                placeholder="Contoh: Integrasi Modul Eksternal BI-FAST"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="change-scope" className="block text-xs font-bold text-slate-700 uppercase mb-1">Pekerjaan tambahan (pisahkan dengan koma)</label>
              <input
                id="change-scope"
                type="text"
                required
                value={crScope}
                onChange={(e) => setCrScope(e.target.value)}
                placeholder="Contoh: API Switching Proxy, Webhook Handler"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="change-value" className="block text-xs font-bold text-slate-700 uppercase mb-1">Tambahan nilai (Rp)</label>
                <input
                  id="change-value"
                  type="number"
                  required
                  value={crValue}
                  onChange={(e) => setCrValue(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
                />
              </div>
              <div>
                <label htmlFor="change-days" className="block text-xs font-bold text-slate-700 uppercase mb-1">Perpanjangan (hari)</label>
                <input
                  id="change-days"
                  type="number"
                  required
                  value={crDays}
                  onChange={(e) => setCrDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCRModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
              >
                Simpan permintaan
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onActionComplete={loadProject}
      />
    </div>
  );
}
