'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { Project } from '@/types';
import { formatRupiah } from '@/lib/utils';

const MAX_CONTRACT = 25 * 1024 * 1024;
const MAX_RAB = 15 * 1024 * 1024;
const today = () => new Date().toISOString().slice(0, 10);
const futureDate = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const inputClass = 'mt-2 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20';
const labelClass = 'block text-sm font-semibold text-zinc-800';

export default function NewProjectFlowPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [source, setSource] = React.useState<'example' | 'manual'>('example');
  const [name, setName] = React.useState('');
  const [client, setClient] = React.useState('');
  const [contractFile, setContractFile] = React.useState<File | null>(null);
  const [rabFile, setRabFile] = React.useState<File | null>(null);
  const [contractValue, setContractValue] = React.useState(120_000_000);
  const [plannedCost, setPlannedCost] = React.useState(75_000_000);
  const [deadline, setDeadline] = React.useState(futureDate(120));
  const [revisionLimit, setRevisionLimit] = React.useState(3);
  const [paymentTerms, setPaymentTerms] = React.useState('30% saat mulai, 40% setelah uji terima, 30% setelah serah terima akhir');
  const [scopeText, setScopeText] = React.useState('Penerapan sistem\nIntegrasi dan pengujian\nSerah terima pekerjaan');
  const [milestoneDates, setMilestoneDates] = React.useState([futureDate(14), futureDate(60), futureDate(120)]);
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function selectSource(next: 'example' | 'manual') {
    setSource(next);
    if (next === 'manual') { setContractValue(0); setPlannedCost(0); setPaymentTerms(''); setScopeText(''); }
    else { setContractValue(120_000_000); setPlannedCost(75_000_000); setPaymentTerms('30% saat mulai, 40% setelah uji terima, 30% setelah serah terima akhir'); setScopeText('Penerapan sistem\nIntegrasi dan pengujian\nSerah terima pekerjaan'); }
    setFieldError(null);
  }

  function chooseFile(file: File | undefined, kind: 'contract' | 'rab') {
    if (!file) return;
    const allowed = kind === 'contract' ? /\.(pdf|doc|docx)$/i : /\.(xlsx|xls|csv)$/i;
    const max = kind === 'contract' ? MAX_CONTRACT : MAX_RAB;
    if (!allowed.test(file.name) || file.size > max) {
      setFieldError(kind === 'contract' ? 'Kontrak harus PDF, DOC, atau DOCX berukuran maksimal 25 MB.' : 'RAB harus XLSX, XLS, atau CSV berukuran maksimal 15 MB.');
      return;
    }
    setFieldError(null);
    if (kind === 'contract') setContractFile(file); else setRabFile(file);
  }

  function review(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !client.trim()) { setFieldError('Nama proyek dan klien harus diisi.'); return; }
    setFieldError(null);
    setStep(2);
  }

  async function save() {
    const scopes = scopeText.split('\n').map((line) => line.trim()).filter(Boolean);
    if (contractValue <= 0 || plannedCost < 0 || !deadline || revisionLimit < 0 || !paymentTerms.trim() || scopes.length === 0 || milestoneDates.some((date) => !date)) {
      setFieldError('Lengkapi nilai kontrak, rencana biaya, tenggat, ketentuan pembayaran, ruang lingkup, dan tanggal tiap tahap.');
      return;
    }
    const id = `PRJ-${Date.now()}`;
    const milestoneNames = ['Tahap awal (30%)', 'Uji terima (40%)', 'Serah terima akhir (30%)'];
    const percentages = [30, 40, 30];
    const project: Project = {
      id, name: name.trim(), client: client.trim(), status: 'ACTIVE', contractValue, plannedCost,
      actualCost: 0, billableValue: 0, billedValue: 0, paidValue: 0, progress: 0,
      baselineVersion: 'V1.0', startDate: today(), endDate: deadline, activeRevisionCount: 0,
      agreementBaseline: {
        contractNumber: `DEMO/${id}`, title: name.trim(), clientName: client.trim(), contractValue,
        startDate: today(), deadline, paymentTerms: paymentTerms.trim(), revisionLimit,
        scopeItems: scopes.map((title, index) => ({ id: `SCP-${index + 1}`, title, description: 'Disetujui saat pembuatan proyek demo.', category: 'CORE_FEATURE' as const, status: 'MATCH' as const })),
        milestones: percentages.map((percentage, index) => ({ id: `MLS-${index + 1}`, title: milestoneNames[index], percentage, value: index === 2 ? contractValue - Math.round(contractValue * 0.3) - Math.round(contractValue * 0.4) : Math.round(contractValue * percentage / 100), targetDate: milestoneDates[index], status: 'PENDING' as const, billingStatus: 'UNBILLED' as const })),
        clausesSummary: [],
      },
      planBaseline: { totalPlannedCost: plannedCost, contingencyBudget: 0, items: [{ id: 'RAB-1', category: 'Rencana biaya', description: 'Total rencana biaya yang disetujui pengguna.', plannedAmount: plannedCost, actualAmount: 0 }] },
      actualCosts: [], invoices: [], changeRequests: [], alerts: [],
      events: [{ id: `EVT-${Date.now()}`, projectId: id, type: 'REVISION_LOGGED', title: 'Acuan proyek disetujui', description: `Data ${source === 'example' ? 'contoh' : 'manual'} ditinjau dan disetujui pengguna. Berkas yang dipilih belum diproses atau disimpan.`, date: today(), author: 'Pengguna demo' }],
    };
    setSubmitting(true); setFieldError(null);
    try { await dataClient.addProject(project); router.push(`/projects/${id}`); }
    catch (cause) { setFieldError(cause instanceof Error ? cause.message : 'Gagal menyimpan proyek.'); setSubmitting(false); }
  }

  return <div className="mx-auto max-w-4xl space-y-6 pb-12">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-red-700">Proyek baru · Mode demo</p><h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Buat proyek baru</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">Isi informasi proyek, lalu periksa kesepakatan awal sebelum menyimpan.</p></div>
    <div aria-label="Tahapan membuat proyek" className="flex gap-3 text-sm"><span className={`rounded-full px-3 py-1.5 ${step === 1 ? 'bg-red-600 font-semibold text-white' : 'bg-zinc-100 text-zinc-600'}`}>1 · Informasi</span><span className={`rounded-full px-3 py-1.5 ${step === 2 ? 'bg-red-600 font-semibold text-white' : 'bg-zinc-100 text-zinc-600'}`}>2 · Tinjau dan setujui</span></div>
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-orange-950"><strong>Mode demo:</strong> Dokumen yang dipilih hanya diperiksa format dan ukurannya di browser. Isinya belum dibaca, diunggah, atau disimpan. Isi kesepakatan di bawah berasal dari data contoh atau isian Anda.</div>
    {step === 1 ? <form onSubmit={review} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="project-name" className={labelClass}>Nama proyek</label><input id="project-name" required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Contoh: Penerapan sistem layanan" /></div><div><label htmlFor="client-name" className={labelClass}>Nama klien</label><input id="client-name" required value={client} onChange={(event) => setClient(event.target.value)} className={inputClass} placeholder="Contoh: PT Contoh Sejahtera" /></div></div>
      <fieldset className="border-t border-zinc-100 pt-5"><legend className="text-sm font-semibold text-zinc-800">Sumber data kesepakatan</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm ${source === 'example' ? 'border-red-400 bg-red-50' : 'border-zinc-200'}`}><input type="radio" name="source" checked={source === 'example'} onChange={() => selectSource('example')} className="accent-red-600" /><span><strong className="block">Gunakan data contoh</strong><span className="mt-1 block text-zinc-600">Angka dan tahap terisi sebagai contoh; Anda dapat mengubahnya.</span></span></label><label className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm ${source === 'manual' ? 'border-red-400 bg-red-50' : 'border-zinc-200'}`}><input type="radio" name="source" checked={source === 'manual'} onChange={() => selectSource('manual')} className="accent-red-600" /><span><strong className="block">Isi sendiri</strong><span className="mt-1 block text-zinc-600">Masukkan nilai dan kesepakatan pada langkah berikutnya.</span></span></label></div></fieldset>
      <div className="grid gap-5 border-t border-zinc-100 pt-5 sm:grid-cols-2"><div><label htmlFor="contract-file" className={labelClass}>Berkas kontrak (opsional)</label><input id="contract-file" type="file" accept=".pdf,.doc,.docx" onChange={(event) => chooseFile(event.target.files?.[0], 'contract')} className={inputClass} /><p className="mt-1 text-xs text-zinc-500">PDF, DOC, DOCX · maksimal 25 MB</p>{contractFile && <p className="mt-1 text-xs text-zinc-700">Dipilih: {contractFile.name}</p>}</div><div><label htmlFor="rab-file" className={labelClass}>Berkas RAB (opsional)</label><input id="rab-file" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => chooseFile(event.target.files?.[0], 'rab')} className={inputClass} /><p className="mt-1 text-xs text-zinc-500">XLSX, XLS, CSV · maksimal 15 MB</p>{rabFile && <p className="mt-1 text-xs text-zinc-700">Dipilih: {rabFile.name}</p>}</div></div>
      {fieldError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{fieldError}</p>}
      <div className="flex justify-end"><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700">Tinjau kesepakatan <ArrowRight size={16} /></button></div>
    </form> : <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
      <div><h2 className="font-heading text-lg font-bold text-zinc-950">Periksa kesepakatan awal</h2><p className="mt-1 text-sm text-zinc-600">Nilai ini akan menjadi acuan proyek setelah Anda menyetujuinya. Tidak ada hasil ekstraksi dokumen pada mode demo.</p><p className="mt-2 text-sm font-medium text-zinc-800">{name} · {client}</p></div>
      <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="contract-value" className={labelClass}>Nilai kontrak (Rp)</label><input id="contract-value" type="number" min="1" required value={contractValue} onChange={(event) => setContractValue(Number(event.target.value))} className={inputClass} /><p className="mt-1 text-xs text-zinc-500">{formatRupiah(contractValue)}</p></div><div><label htmlFor="planned-cost" className={labelClass}>Rencana biaya (Rp)</label><input id="planned-cost" type="number" min="0" required value={plannedCost} onChange={(event) => setPlannedCost(Number(event.target.value))} className={inputClass} /><p className="mt-1 text-xs text-zinc-500">{formatRupiah(plannedCost)}</p></div><div><label htmlFor="deadline" className={labelClass}>Tenggat proyek</label><input id="deadline" type="date" required value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputClass} /></div><div><label htmlFor="revision-limit" className={labelClass}>Batas revisi tanpa biaya tambahan</label><input id="revision-limit" type="number" min="0" required value={revisionLimit} onChange={(event) => setRevisionLimit(Number(event.target.value))} className={inputClass} /></div></div>
      <div><label htmlFor="payment-terms" className={labelClass}>Ketentuan pembayaran</label><input id="payment-terms" required value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} className={inputClass} /></div>
      <div><label htmlFor="scope" className={labelClass}>Ruang lingkup pekerjaan</label><p className="mt-1 text-xs text-zinc-500">Satu pekerjaan per baris.</p><textarea id="scope" rows={4} required value={scopeText} onChange={(event) => setScopeText(event.target.value)} className={inputClass} /></div>
      <fieldset><legend className={labelClass}>Jadwal tahap pembayaran</legend><p className="mt-1 text-xs text-zinc-500">Persentase contoh: 30%, 40%, dan 30% dari nilai kontrak.</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{['Tahap awal · 30%', 'Uji terima · 40%', 'Serah terima akhir · 30%'].map((title, index) => <div key={title}><label htmlFor={`milestone-${index}`} className="text-xs font-medium text-zinc-700">{title}</label><input id={`milestone-${index}`} type="date" required value={milestoneDates[index]} onChange={(event) => setMilestoneDates((dates) => dates.map((date, dateIndex) => dateIndex === index ? event.target.value : date))} className={inputClass} /></div>)}</div></fieldset>
      {fieldError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{fieldError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5"><button type="button" disabled={submitting} onClick={() => { setStep(1); setFieldError(null); }} className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-zinc-700 hover:text-red-700"><ArrowLeft size={16} />Kembali</button><button type="button" disabled={submitting} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"><FileText size={16} />{submitting ? 'Menyimpan…' : 'Setujui dan buat proyek'}</button></div>
    </div>}
  </div>;
}
