'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Lock,
  Layers,
  FileCheck
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project } from '@/types';
import { formatRupiah } from '@/lib/utils';

export default function NewProjectFlowPage() {
  const router = useRouter();

  // Stepper state: 1 = Form & Upload, 2 = Document Parsing, 3 = Confirmation & Lock
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Form inputs
  const [projectName, setProjectName] = React.useState('');
  const [clientName, setClientName] = React.useState('');
  const [contractFile, setContractFile] = React.useState<File | null>(null);
  const [rabFile, setRabFile] = React.useState<File | null>(null);

  // Extracted data (editable by user in step 3)
  const [contractValue, setContractValue] = React.useState<number>(0);
  const [plannedCost, setPlannedCost] = React.useState<number>(0);
  const [deadline, setDeadline] = React.useState('');
  const [revisionLimit, setRevisionLimit] = React.useState<number>(3);
  const [paymentTerms, setPaymentTerms] = React.useState('30% DP, 40% UAT Staging, 30% Final Go-Live');

  // File input refs
  const contractInputRef = React.useRef<HTMLInputElement>(null);
  const rabInputRef = React.useRef<HTMLInputElement>(null);

  // Extraction Progress simulation
  const [parsingStage, setParsingStage] = React.useState<string>('Ekstraksi teks digital dari dokumen PKS PDF...');
  const [parsingPercent, setParsingPercent] = React.useState<number>(25);

  const handleStartExtraction = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);

    setTimeout(() => {
      setParsingStage('Segmentasi pasal kontrak (Klausul pembayaran, batas revisi & penalti)...');
      setParsingPercent(50);
    }, 1000);

    setTimeout(() => {
      setParsingStage('Ekstraksi baris anggaran biaya rencana (RAB)...');
      setParsingPercent(75);
    }, 2000);

    setTimeout(() => {
      setParsingStage('Mencocokkan termin kontrak dengan milestone deliverable...');
      setParsingPercent(100);
    }, 3000);

    setTimeout(() => {
      setStep(3);
    }, 3800);
  };

  const handleConfirmAndLock = () => {
    const newProjectId = `PRJ-${Date.now().toString().slice(-3)}`;
    const newProject: Project = {
      id: newProjectId,
      name: projectName,
      client: clientName,
      status: 'ACTIVE',
      contractValue,
      plannedCost,
      actualCost: 0,
      billableValue: 0,
      billedValue: 0,
      paidValue: 0,
      progress: 0,
      baselineVersion: 'V1.0',
      startDate: new Date().toISOString().split('T')[0],
      endDate: deadline,
      activeRevisionCount: 0,
      agreementBaseline: {
        contractNumber: `PKS/CLARA/${new Date().getFullYear()}/${newProjectId}`,
        title: projectName,
        clientName,
        contractValue,
        startDate: new Date().toISOString().split('T')[0],
        deadline,
        paymentTerms,
        revisionLimit,
        scopeItems: [
          { id: 'SCP-01', title: `${projectName || 'Pekerjaan Utama'} - Core Implementation`, description: 'Deliverable utama sesuai kesepakatan PKS.', category: 'CORE_FEATURE', status: 'MATCH' },
          { id: 'SCP-02', title: 'System Integration & Deployment', description: 'Integrasi sistem dan deployment lingkungan kerja.', category: 'INTEGRATION', status: 'MATCH' },
          { id: 'SCP-03', title: 'User Acceptance Testing & Handover', description: 'Verifikasi UAT dan serah terima dokumen operasional.', category: 'CORE_FEATURE', status: 'MATCH' },
        ],
        milestones: [
          { id: 'MLS-01', title: 'Termin 1: Down Payment (30%)', percentage: 30, value: Math.round(contractValue * 0.3), targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], status: 'PENDING', billingStatus: 'UNBILLED' },
          { id: 'MLS-02', title: 'Termin 2: UAT Delivery Staging (40%)', percentage: 40, value: Math.round(contractValue * 0.4), targetDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0], status: 'PENDING', billingStatus: 'UNBILLED' },
          { id: 'MLS-03', title: 'Termin 3: Final Acceptance & Handover (30%)', percentage: 30, value: Math.round(contractValue * 0.3), targetDate: deadline || new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], status: 'PENDING', billingStatus: 'UNBILLED' },
        ],
        clausesSummary: [
          { clauseNumber: 'Pasal 5', title: 'Batas Revisi', description: `Maksimal ${revisionLimit} putaran revisi resmi.` },
          { clauseNumber: 'Pasal 8', title: 'Ketentuan Termin', description: paymentTerms || 'Termin pembayaran berkala sesuai progres deliverable.' },
        ],
      },
      planBaseline: {
        totalPlannedCost: plannedCost,
        contingencyBudget: Math.round(plannedCost * 0.05),
        items: [
          { id: 'RAB-1', category: 'Biaya Tenaga Ahli (Engineering)', description: 'Tim implementasi dan rekayasa sistem', plannedAmount: Math.round(plannedCost * 0.7), actualAmount: 0 },
          { id: 'RAB-2', category: 'Infrastruktur & Lisensi', description: 'Server, cloud hosting & lisensi pendukung', plannedAmount: Math.round(plannedCost * 0.2), actualAmount: 0 },
          { id: 'RAB-3', category: 'Testing & Quality Assurance', description: 'UAT, audit keamanan sistem & dokumentasi', plannedAmount: Math.round(plannedCost * 0.1), actualAmount: 0 },
        ],
      },
      actualCosts: [],
      invoices: [],
      events: [
        {
          id: `EVT-${Date.now()}`,
          projectId: newProjectId,
          type: 'MILESTONE_COMPLETED',
          title: 'Project Initialized & Baseline Locked',
          description: 'Kontrak dan RAB resmi diverifikasi oleh Project Owner sebagai Baseline V1.0.',
          date: new Date().toISOString().split('T')[0],
          author: 'Project Owner',
        },
      ],
      changeRequests: [],
      alerts: [],
    };

    storageService.addProject(newProject);
    router.push(`/projects/${newProjectId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
          Commercial Onboarding
        </span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Setup Kontrak Baru & Kunci Baseline</h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Unggah dokumen PKS / Kontrak dan RAB. Sistem CLARA akan memetakan klausul komersial secara terstruktur untuk diverifikasi oleh user.
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-center gap-4 text-xs font-semibold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-700 text-white' : 'bg-slate-200'}`}>1</span>
          <span>Upload Dokumen</span>
        </div>
        <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-700' : 'bg-slate-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-700 text-white' : 'bg-slate-200'}`}>2</span>
          <span>Document Parsing</span>
        </div>
        <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-blue-700' : 'bg-slate-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-700' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-blue-700 text-white' : 'bg-slate-200'}`}>3</span>
          <span>Verifikasi & Kunci Baseline</span>
        </div>
      </div>

      {/* STEP 1: FORM & UPLOAD */}
      {step === 1 && (
        <form onSubmit={handleStartExtraction} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Project</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: Implementasi Core Banking"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Klien / Instansi</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: PT Bank Mandiri Syariah"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Upload Kontrak */}
            <div
              onClick={() => contractInputRef.current?.click()}
              className="p-6 border border-dashed border-slate-300 hover:border-slate-500 rounded-2xl text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <input
                ref={contractInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setContractFile(e.target.files[0]);
                }}
              />
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-slate-700 mx-auto mb-3 transition-colors" />
              <h3 className="text-xs font-bold text-slate-800">Upload Dokumen Kontrak / PKS</h3>
              <p className="text-[11px] text-slate-500 mt-1">Format PDF / DOC (Maks 25MB)</p>
              <div className="mt-4">
                <span className="inline-block bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-2xs font-mono">
                  {contractFile ? contractFile.name : 'Pilih file PDF kontrak...'}
                </span>
              </div>
            </div>

            {/* Upload RAB */}
            <div
              onClick={() => rabInputRef.current?.click()}
              className="p-6 border border-dashed border-slate-300 hover:border-slate-500 rounded-2xl text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <input
                ref={rabInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setRabFile(e.target.files[0]);
                }}
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-slate-700 mx-auto mb-3 transition-colors" />
              <h3 className="text-xs font-bold text-slate-800">Upload Rencana Anggaran Biaya (RAB)</h3>
              <p className="text-[11px] text-slate-500 mt-1">Format XLSX / CSV (Maks 15MB)</p>
              <div className="mt-4">
                <span className="inline-block bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-2xs font-mono">
                  {rabFile ? rabFile.name : 'Pilih file spreadsheet RAB...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Mulai Proses Parsing & Rekonsiliasi</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: DOCUMENT PARSING IN PROGRESS (CLEAN CORPORATE) */}
      {step === 2 && (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6 text-blue-700 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">Document Parsing & Cross-Reconciliation</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Memproses dokumen secara deterministik: membaca klausul hukum, menghitung termin komersial, dan memetakan alokasi biaya RAB.
            </p>
          </div>

          {/* Clean Corporate Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="text-[11px] font-mono">{parsingStage}</span>
              <span>{parsingPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-700 h-full rounded-full transition-all duration-500" style={{ width: `${parsingPercent}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: BASELINE REVIEW & CONFIRMATION */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900">
              <strong className="font-bold">Human Verification Required:</strong> Sistem telah memetakan data komersial dari dokumen. Mohon periksa kembali kesepakatan di bawah ini sebelum mengunci baseline project.
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Draft Baseline Komersial & Anggaran</h3>
                <p className="text-xs text-slate-500">Konfirmasi kesepakatan legal dan alokasi biaya rencana.</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Parsed with 98% Confidence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nilai Kontrak (Contract Value)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-xs font-semibold text-slate-400 absolute right-4 top-3">
                    {formatRupiah(contractValue)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Total Planned Cost (RAB Baseline)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={plannedCost}
                    onChange={(e) => setPlannedCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-xs font-semibold text-slate-400 absolute right-4 top-3">
                    {formatRupiah(plannedCost)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Deadline Target Penyelesaian
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Batas Revisi Gratis (Revision Allowance)
                </label>
                <input
                  type="number"
                  value={revisionLimit}
                  onChange={(e) => setRevisionLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Skema Termin Pembayaran (Payment Terms)
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Kembali ke Upload
              </button>

              <button
                type="button"
                onClick={handleConfirmAndLock}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Confirm & Lock Baseline (V1.0)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
