'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileCheck2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Edit2,
  Lock
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project } from '@/types';
import { formatRupiah } from '@/lib/utils';

export default function NewProjectFlowPage() {
  const router = useRouter();

  // Stepper state: 1 = Form & Upload, 2 = AI Processing, 3 = Confirmation & Lock
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Form inputs
  const [projectName, setProjectName] = React.useState('Aplikasi Monitoring Pelabuhan Pintar (Smart Port)');
  const [clientName, setClientName] = React.useState('PT Pelabuhan Terpadu Nusantara');
  const [contractFile, setContractFile] = React.useState<File | null>(null);
  const [rabFile, setRabFile] = React.useState<File | null>(null);

  // Extracted data (editable by user in step 3)
  const [contractValue, setContractValue] = React.useState<number>(1450000000);
  const [plannedCost, setPlannedCost] = React.useState<number>(950000000);
  const [deadline, setDeadline] = React.useState('2027-04-30');
  const [revisionLimit, setRevisionLimit] = React.useState<number>(3);
  const [paymentTerms, setPaymentTerms] = React.useState('30% DP, 40% UAT Staging, 30% Final Go-Live');

  // AI Extraction Progress simulation
  const [extractionProgress, setExtractionProgress] = React.useState<string>('Membaca dokumen kontrak PDF...');

  const handleStartExtraction = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);

    // Simulate AI extraction pipeline
    setTimeout(() => {
      setExtractionProgress('Melakukan OCR dan ekstraksi pasal-pasal kontrak hukum...');
    }, 1200);

    setTimeout(() => {
      setExtractionProgress('Membaca item rincian RAB dari spreadsheet...');
    }, 2400);

    setTimeout(() => {
      setExtractionProgress('Mencocokkan klausul pembayaran dan batas revisi (Cross-validation)...');
    }, 3600);

    setTimeout(() => {
      setStep(3);
    }, 4500);
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
          { id: 'SCP-01', title: 'Port Vessel Traffic Tracking System', description: 'Pelacakan armada kapal sandar.', category: 'CORE_FEATURE', status: 'MATCH' },
          { id: 'SCP-02', title: 'Container Yard IoT Gate Integration', description: 'Sensor barrier gate otomatis.', category: 'INTEGRATION', status: 'MATCH' },
          { id: 'SCP-03', title: 'Executive Operations Dashboard', description: 'Laporan throughput peti kemas real-time.', category: 'CORE_FEATURE', status: 'MATCH' },
        ],
        milestones: [
          { id: 'MLS-01', title: 'Termin 1: Down Payment (30%)', percentage: 30, value: contractValue * 0.3, targetDate: '2026-11-15', status: 'PENDING', billingStatus: 'UNBILLED' },
          { id: 'MLS-02', title: 'Termin 2: UAT Delivery Staging (40%)', percentage: 40, value: contractValue * 0.4, targetDate: '2027-02-28', status: 'PENDING', billingStatus: 'UNBILLED' },
          { id: 'MLS-03', title: 'Termin 3: Final Acceptance & Handover (30%)', percentage: 30, value: contractValue * 0.3, targetDate: deadline, status: 'PENDING', billingStatus: 'UNBILLED' },
        ],
        clausesSummary: [
          { clauseNumber: 'Pasal 5', title: 'Batas Revisi', description: `Maksimal ${revisionLimit} putaran revisi resmi.` },
          { clauseNumber: 'Pasal 8', title: 'Ketentuan Termin', description: paymentTerms },
        ],
      },
      planBaseline: {
        totalPlannedCost: plannedCost,
        contingencyBudget: plannedCost * 0.05,
        items: [
          { id: 'RAB-1', category: 'Software Development', description: 'Backend, Frontend & Mobile Eng', plannedAmount: plannedCost * 0.7, actualAmount: 0 },
          { id: 'RAB-2', category: 'Hardware & IoT Gateway', description: 'Sensors, Gateway & Mounting', plannedAmount: plannedCost * 0.2, actualAmount: 0 },
          { id: 'RAB-3', category: 'Testing & Deployment', description: 'QA, Cloud Cluster & UAT', plannedAmount: plannedCost * 0.1, actualAmount: 0 },
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
          description: 'Kontrak dan RAB berhasil diverifikasi oleh Business Owner sebagai Baseline V1.0.',
          date: new Date().toISOString().split('T')[0],
          author: 'Human Approver',
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
        <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          New Baseline Onboarding
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Upload Kontrak & Kunci Baseline</h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Unggah dokumen PKS / Kontrak dan RAB. AI CLARA akan mengekstrak klausul komersial secara terstruktur untuk dikonfirmasi.
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-center gap-4 text-xs font-semibold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>1</span>
          <span>Upload Dokumen</span>
        </div>
        <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>2</span>
          <span>AI Extraction</span>
        </div>
        <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>3</span>
          <span>Review & Lock Baseline</span>
        </div>
      </div>

      {/* STEP 1: FORM & UPLOAD */}
      {step === 1 && (
        <form onSubmit={handleStartExtraction} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Project</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Contoh: PT Bank Mandiri Syariah"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Upload Kontrak */}
            <div className="p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl text-center bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer group">
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-600 mx-auto mb-3 transition-colors" />
              <h3 className="text-sm font-bold text-slate-800">Upload Dokumen Kontrak / PKS</h3>
              <p className="text-xs text-slate-500 mt-1">Format PDF (Maks 25MB)</p>
              <div className="mt-4">
                <span className="inline-block bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm">
                  {contractFile ? contractFile.name : 'PKS_Pelabuhan_SmartPort_2026.pdf (Sample Ready)'}
                </span>
              </div>
            </div>

            {/* Upload RAB */}
            <div className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer group">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 mx-auto mb-3 transition-colors" />
              <h3 className="text-sm font-bold text-slate-800">Upload Rencana Anggaran Biaya (RAB)</h3>
              <p className="text-xs text-slate-500 mt-1">Format XLSX / CSV (Maks 15MB)</p>
              <div className="mt-4">
                <span className="inline-block bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm">
                  {rabFile ? rabFile.name : 'RAB_SmartPort_V1_Approved.xlsx (Sample Ready)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mulai Ekstraksi AI & Analisis</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: AI EXTRACTION IN PROGRESS */}
      {step === 2 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-6 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Intelligence Engine Sedang Bekerja...</h3>
            <p className="text-xs font-mono text-blue-600 mt-2 bg-blue-50 py-2 px-4 rounded-lg inline-block border border-blue-200">
              {extractionProgress}
            </p>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            CLARA mengonversi dokumen pasif menjadi data terstruktur: nilai kesepakatan, termin pembayaran, batasan revisi, dan item biaya.
          </p>
        </div>
      )}

      {/* STEP 3: BASELINE REVIEW & CONFIRMATION */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <strong className="font-bold">Human Confirmation Required:</strong> AI telah mengekstrak data dari dokumen. Silakan periksa kembali dan sesuaikan field di bawah jika ada kesalahan sebelum mengunci baseline. Baseline yang sudah dikunci menjadi acuan perbandingan selama project berjalan.
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hasil Ekstraksi Baseline Kontrak & RAB</h3>
                <p className="text-xs text-slate-500">Konfirmasi kesepakatan komersial dan anggaran rencana.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confidence: 98%
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-xs font-semibold text-slate-400 absolute right-4 top-3">
                    {formatRupiah(plannedCost)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Deadline / Target Penyelesaian
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Batas Revisi Gratis (Revision Limit)
                </label>
                <input
                  type="number"
                  value={revisionLimit}
                  onChange={(e) => setRevisionLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm & Lock Baseline (V1.0)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
