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
import { storageService } from '@/services/storage';
import { Project, Alert, ScopeItem, Milestone, ProjectEvent, ActualCostItem } from '@/types';
import { formatCompactRupiah, formatRupiah, formatDate } from '@/lib/utils';
import { StatusBadge, ScopeBadge, BillingBadge, SeverityBadge } from '@/components/shared/Badge';
import { EvidenceDrawer } from '@/components/alerts/EvidenceDrawer';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<Project | null>(null);
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

  const loadProject = React.useCallback(() => {
    const p = storageService.getProject(projectId);
    if (p) setProject({ ...p });
  }, [projectId]);

  React.useEffect(() => {
    loadProject();
    const handleUpdate = () => loadProject();
    window.addEventListener('clara_data_updated', handleUpdate);
    return () => window.removeEventListener('clara_data_updated', handleUpdate);
  }, [loadProject]);

  if (!project) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
        <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">Project Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">ID: {projectId}</p>
        </div>
        <div>
          <a
            href="/projects"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Kembali ke Daftar Project
          </a>
        </div>
      </div>
    );
  }

  // Quick Action Handlers
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.addProjectEvent(projectId, {
      type: newEventType,
      title: newEventTitle,
      description: newEventDesc,
      date: new Date().toISOString().split('T')[0],
      author: 'Business Owner (You)',
    });
    setShowAddEventModal(false);
    setNewEventTitle('');
    setNewEventDesc('');
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.addActualCost(projectId, {
      date: new Date().toISOString().split('T')[0],
      category: costCategory,
      description: costDesc || 'Pengeluaran sprint operasional',
      amount: costAmount,
      submittedBy: 'Finance Ops',
    });
    setShowAddCostModal(false);
    setCostDesc('');
  };

  const handleCreateCR = (e: React.FormEvent) => {
    e.preventDefault();
    const crCount = (project.changeRequests || []).length + 1;
    storageService.addChangeRequest(projectId, {
      crNumber: `CR/${project.id}/${crCount.toString().padStart(3, '0')}`,
      title: crTitle,
      description: crDesc,
      reason: 'Penyesuaian kebutuhan baru dari stakeholder klien',
      additionalScope: crScope.split(',').map((s) => s.trim()).filter(Boolean),
      additionalValue: crValue,
      deadlineExtensionDays: crDays,
    });
    setShowAddCRModal(false);
    setCrTitle('');
    setCrDesc('');
    setCrScope('');
  };

  const handleApproveCR = (crId: string) => {
    if (confirm('Setujui Change Request ini? Kontrak baseline akan dinaikkan versinya secara resmi.')) {
      storageService.approveChangeRequest(projectId, crId);
    }
  };

  const handleCreateInvoice = (milestoneId: string) => {
    storageService.createInvoice(projectId, milestoneId);
  };

  const unbilledAmount = Math.max(0, project.billableValue - project.billedValue);
  const costVariance = project.actualCost - project.plannedCost;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Project Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              {project.id}
            </span>
            <StatusBadge status={project.status} />
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              Baseline {project.baselineVersion}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Klien: <strong className="text-slate-700">{project.client}</strong> • No. Kontrak: {project.agreementBaseline?.contractNumber || 'PKS-SAMPLE-01'}
          </p>
        </div>

        {/* Header Key Metrics */}
        <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nilai Kontrak</span>
            <p className="text-lg font-extrabold text-slate-900">{formatRupiah(project.contractValue)}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actual Cost</span>
            <p className={`text-lg font-extrabold ${costVariance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatRupiah(project.actualCost)}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revisi Aktif</span>
            <p className={`text-lg font-extrabold ${project.activeRevisionCount > (project.agreementBaseline?.revisionLimit || 3) ? 'text-rose-600' : 'text-slate-900'}`}>
              {project.activeRevisionCount} / {project.agreementBaseline?.revisionLimit || 3}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-px overflow-x-auto text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview', icon: FolderGit2 },
          { key: 'baseline', label: 'Baseline (Kontrak & RAB)', icon: FileText },
          { key: 'monitoring', label: 'Monitoring & Scope', icon: Activity },
          { key: 'finance', label: 'Finance & Realization', icon: Receipt },
          { key: 'change-requests', label: 'Change Requests', icon: GitPullRequest, badge: project.changeRequests?.length },
          { key: 'alerts', label: 'Alerts & Evidence', icon: AlertTriangle, badge: project.alerts?.filter((a) => a.status === 'NEW').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Rekonsiliasi CLARA</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Hak Tagih Terbuka (Unbilled)</span>
                  <span className="font-bold text-amber-700">{formatRupiah(unbilledAmount)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Selisih RAB (Variance)</span>
                  <span className={`font-bold ${costVariance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {costVariance > 0 ? `+${formatRupiah(costVariance)} (Over)` : 'Sesuai Budget'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Penyelesaian Teknis</span>
                  <span className="font-bold text-blue-600">{project.progress}% Selesai</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline Event & Audit Trail</h3>
                <button
                  onClick={() => setShowAddEventModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Event Baru</span>
                </button>
              </div>

              <div className="space-y-3">
                {project.events?.map((evt) => (
                  <div key={evt.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3 text-xs">
                    <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-semibold">{evt.title}</strong>
                        <span className="text-[11px] text-slate-400">{formatDate(evt.date)}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{evt.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 inline-block">Author: {evt.author}</span>
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
                <h3 className="text-sm font-bold text-slate-900">Agreement Baseline (Kontrak)</h3>
                <p className="text-xs text-slate-500">Klausul sah yang disepakati dengan klien.</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {project.baselineVersion}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Ketentuan Pembayaran</span>
                <p className="text-slate-800 font-medium">{project.agreementBaseline?.paymentTerms}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Batas Revisi Maksimal</span>
                <p className="text-slate-800 font-medium">{project.agreementBaseline?.revisionLimit} putaran revisi resmi</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Termin Milestone Kontrak</h4>
                <div className="space-y-2">
                  {project.agreementBaseline?.milestones.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{m.title}</p>
                        <p className="text-[11px] text-slate-500">Target: {formatDate(m.targetDate)}</p>
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
                <h3 className="text-sm font-bold text-slate-900">Plan Baseline (RAB)</h3>
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
                    <p className="text-[11px] text-slate-500">{rab.description}</p>
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
                <h3 className="text-sm font-bold text-slate-900">Scope Reconciliation Table</h3>
                <p className="text-xs text-slate-500">
                  Perbandingan scope kontrak baseline terhadap pekerjaan aktual yang dikerjakan tim.
                </p>
              </div>
              <button
                onClick={() => setShowAddEventModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Event / Revisi</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Scope ID & Fitur</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Klausul Referensi</th>
                    <th className="py-3 px-3">Status Kesesuaian</th>
                    <th className="py-3 px-3">Catatan Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {project.agreementBaseline?.scopeItems.map((scope) => (
                    <tr key={scope.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] text-slate-400 block">{scope.id}</span>
                        <strong className="text-slate-900 font-semibold">{scope.title}</strong>
                        <p className="text-[11px] text-slate-500">{scope.description}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-600">{scope.category}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {scope.contractClauseRef || 'Tidak terdaftar di kontrak'}
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
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Contract Value</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCompactRupiah(project.contractValue)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20">
              <span className="text-[10px] font-bold uppercase text-blue-700">Hak Tagih (Billable)</span>
              <p className="text-xl font-bold text-blue-900 mt-1">{formatCompactRupiah(project.billableValue)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20">
              <span className="text-[10px] font-bold uppercase text-amber-700">Belum Ditagihkan (Gap)</span>
              <p className="text-xl font-bold text-amber-900 mt-1">{formatCompactRupiah(unbilledAmount)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Sudah Masuk (Paid)</span>
              <p className="text-xl font-bold text-emerald-900 mt-1">{formatCompactRupiah(project.paidValue)}</p>
            </div>
          </div>

          {/* Milestone Billing Actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Penagihan Termin & Realisasi Uang</h3>
            <div className="space-y-3 text-xs">
              {project.agreementBaseline?.milestones.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{m.title}</h4>
                    <p className="text-slate-500">Nilai Termin: {formatRupiah(m.value)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <BillingBadge status={m.billingStatus} />
                    {m.billingStatus === 'UNBILLED' && (
                      <button
                        onClick={() => handleCreateInvoice(m.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
                      >
                        Terbitkan Invoice
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
                <h3 className="text-sm font-bold text-slate-900">Catatan Pengeluaran Riil (Actual Cost)</h3>
                <p className="text-xs text-slate-500">Total riil: {formatRupiah(project.actualCost)}</p>
              </div>
              <button
                onClick={() => setShowAddCostModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengeluaran</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {project.actualCosts?.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900">{c.description}</strong>
                    <p className="text-slate-400 text-[11px]">{c.category} • {formatDate(c.date)} by {c.submittedBy}</p>
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
              <h3 className="text-sm font-bold text-slate-900">Change Request & Baseline Versioning</h3>
              <p className="text-xs text-slate-500">
                Pekerjaan di luar SOW dapat disahkan melalui Change Request untuk memperbarui baseline secara legal.
              </p>
            </div>
            <button
              onClick={() => setShowAddCRModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Change Request (CR)</span>
            </button>
          </div>

          <div className="space-y-4">
            {project.changeRequests?.map((cr) => (
              <div key={cr.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
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
                    {cr.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Tambahan Nilai</span>
                    <p className="font-bold text-slate-800">+{formatRupiah(cr.additionalValue)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Perpanjangan Waktu</span>
                    <p className="font-bold text-slate-800">+{cr.deadlineExtensionDays} Hari</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Alasan</span>
                    <p className="font-medium text-slate-700 truncate">{cr.reason}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Resulting Version</span>
                    <p className="font-bold text-blue-600">{cr.resultingBaselineVersion || 'Target V2.0'}</p>
                  </div>
                </div>

                {cr.status === 'PENDING' && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleApproveCR(cr.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Setujui CR & Naikkan Baseline ke {project.baselineVersion === 'V1.0' ? 'V2.0' : 'V3.0'}
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
            <h3 className="text-sm font-bold text-slate-900">Alerts & Evidence Drawer</h3>
            <p className="text-xs text-slate-500">Daftar potensi deviasi yang terdeteksi pada project ini.</p>
          </div>

          <div className="space-y-3">
            {project.alerts?.map((alert) => (
              <div key={alert.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs font-mono text-slate-400">{alert.type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                  <p className="text-xs text-slate-600">{alert.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-rose-600 block mb-1">{formatRupiah(alert.rupiahImpact)}</span>
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddEvent} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Catat Event / Log Revisi</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipe Event</label>
              <select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              >
                <option value="REVISION_LOGGED">Revisi Log (Hitung Batas Revisi Kontrak)</option>
                <option value="MILESTONE_COMPLETED">Milestone Selesai (Sign-off)</option>
                <option value="SCOPE_ADDED">Permintaan Scope Baru</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Judul Event</label>
              <input
                type="text"
                required
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Contoh: Revisi Tampilan UI Form Checkout"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Keterangan Tambahan</label>
              <textarea
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Simpan Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Cost */}
      {showAddCostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddCost} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Catat Pengeluaran Riil (Actual Cost)</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategori</label>
              <select
                value={costCategory}
                onChange={(e) => setCostCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              >
                <option value="DEVELOPMENT">Development & Payroll</option>
                <option value="INFRASTRUCTURE">Cloud & Server Infrastructure</option>
                <option value="THIRD_PARTY_API">Third-party API / License</option>
                <option value="DESIGN">Design & QA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jumlah Biaya (Rp)</label>
              <input
                type="number"
                required
                value={costAmount}
                onChange={(e) => setCostAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deskripsi</label>
              <input
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Simpan Biaya
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create Change Request */}
      {showAddCRModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCR} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Buat Change Request Baru</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Judul Change Request</label>
              <input
                type="text"
                required
                value={crTitle}
                onChange={(e) => setCrTitle(e.target.value)}
                placeholder="Contoh: Integrasi Modul Eksternal BI-FAST"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scope Tambahan (Pisahkan Koma)</label>
              <input
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tambahan Nilai (Rp)</label>
                <input
                  type="number"
                  required
                  value={crValue}
                  onChange={(e) => setCrValue(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Perpanjangan Hari</label>
                <input
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Buat Draft CR
              </button>
            </div>
          </form>
        </div>
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
