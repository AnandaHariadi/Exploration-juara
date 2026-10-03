'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Download, FileText } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { btn, inputClass, labelClass } from '@/components/shared/ui';

const CONTRACT_EXT = /\.(pdf|png|jpe?g|webp)$/i;
const MAX_CONTRACT = 10 * 1024 * 1024;
const MAX_RAB = 5 * 1024 * 1024;

type Source = 'upload' | 'sample' | 'manual';
type Basis = 'AGREEMENT' | 'BUDGET' | 'BOTH';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [client, setClient] = React.useState('');
  const [source, setSource] = React.useState<Source>('upload');
  const [basis, setBasis] = React.useState<Basis>('BOTH');
  const [contractFile, setContractFile] = React.useState<File | null>(null);
  const [rabFile, setRabFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<string | null>(null);

  function pick(kind: 'contract' | 'rab', file?: File) {
    setError(null);
    if (!file) return;
    if (kind === 'contract' && (!CONTRACT_EXT.test(file.name) || file.size > MAX_CONTRACT)) {
      setError('Kontrak harus PDF, JPG, PNG, atau WebP, maksimal 10 MB.');
      return;
    }
    if (kind === 'rab' && (!/\.(csv|xlsx|xls)$/i.test(file.name) || file.size > MAX_RAB)) {
      setError('RAB harus berkas CSV, XLSX, atau XLS dengan kolom uraian/kegiatan dan jumlah biaya, maksimal 5 MB.');
      return;
    }
    if (kind === 'contract') setContractFile(file);
    else setRabFile(file);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !client.trim()) return setError('Nama proyek dan klien wajib diisi.');
    if (source === 'upload' && basis !== 'BUDGET' && !contractFile) return setError('Pilih berkas kesepakatan untuk alur ini.');
    if (source === 'upload' && basis !== 'AGREEMENT' && !rabFile) return setError('Pilih berkas RAB untuk alur ini.');
    setError(null);
    let projectId: string | null = null;
    try {
      if (source === 'upload' && basis !== 'AGREEMENT' && rabFile) {
        setStep('Memeriksa RAB…');
        await dataClient.previewRab(rabFile);
      }
      setStep('Membuat proyek…');
      const project = await dataClient.createProject({ name: name.trim(), client: client.trim(), useSample: source === 'sample', sampleBasis: source === 'sample' ? basis : undefined });
      projectId = project.id;
      if (source === 'upload' && basis !== 'BUDGET' && contractFile) {
        setStep('Mengunggah kesepakatan…');
        await dataClient.uploadDocument(project.id, 'CONTRACT', contractFile);
      }
      if (source === 'upload' && basis !== 'AGREEMENT' && rabFile) {
        setStep('Mengunggah RAB…');
        await dataClient.uploadDocument(project.id, 'RAB', rabFile);
      }
      router.push(`/projects/${project.id}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Gagal membuat proyek.';
      setStep(null);
      if (projectId) {
        setError(`Proyek dibuat, tetapi unggahan gagal: ${message} Anda dapat mengunggah ulang dari halaman proyek.`);
        setTimeout(() => router.push(`/projects/${projectId}`), 2500);
      } else setError(message);
    }
  }

  const choice = (value: Source, title: string, text: string) => (
    <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm ${source === value ? 'border-red-400 bg-red-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
      <input type="radio" name="source" checked={source === value} onChange={() => setSource(value)} className="mt-0.5 accent-red-600" />
      <span><strong className="block text-zinc-900">{title}</strong><span className="mt-1 block text-zinc-600">{text}</span></span>
    </label>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Proyek baru</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Buat proyek</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">Pilih dokumen yang Anda punya. Periksa hasil bacanya, lalu setujui acuan V1. Dokumen lain bisa ditambahkan belakangan.</p>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="project-name" className={labelClass}>Nama proyek</label><input id="project-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Sistem Manajemen Armada" className={inputClass} /></div>
          <div><label htmlFor="client-name" className={labelClass}>Nama klien</label><input id="client-name" required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Contoh: PT Astra Sahabat Logistik" className={inputClass} /></div>
        </div>

        <fieldset className="border-t border-zinc-100 pt-5">
          <legend className={labelClass}>Dokumen yang tersedia</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {([
              ['AGREEMENT', 'Kesepakatan saja', 'Pantau nilai, tenggat, revisi, dan syarat tagih yang tercantum. Biaya belum bisa dibandingkan dengan RAB.'],
              ['BUDGET', 'RAB saja', 'Pantau pengeluaran terhadap rencana biaya. Nilai kesepakatan dan hak tagih belum tersedia.'],
              ['BOTH', 'Kesepakatan + RAB', 'Pantau pelaksanaan, biaya, dan tagihan dengan acuan yang lengkap.'],
            ] as const).map(([value, title, text]) => (
              <label key={value} className={`cursor-pointer rounded-xl border p-4 text-sm ${basis === value ? 'border-red-400 bg-red-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                <span className="flex items-start gap-2"><input type="radio" name="basis" checked={basis === value} onChange={() => { setBasis(value); setError(null); }} className="mt-0.5 accent-red-600" /><strong className="text-zinc-900">{title}</strong></span>
                <span className="mt-2 block text-zinc-600">{text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border-t border-zinc-100 pt-5">
          <legend className={labelClass}>Cara mengisi</legend>
          <div className="mt-3 grid gap-3">
            {choice('upload', 'Unggah berkas saya', 'Kesepakatan dibaca AI; RAB Excel/CSV dihitung langsung oleh sistem.')}
            {choice('sample', 'Gunakan berkas contoh', 'Berkas contoh sesuai pilihan di atas, diberi label data demo.')}
            {choice('manual', 'Isi manual', 'Isi sendiri data sesuai dokumen yang tersedia, lalu periksa sebelum menyetujui.')}
          </div>
        </fieldset>

        {source === 'upload' && (
          <div className="grid gap-5 sm:grid-cols-2">
            {basis !== 'BUDGET' && <div>
              <label htmlFor="contract-file" className={labelClass}>Berkas kesepakatan</label>
              <input id="contract-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => pick('contract', e.target.files?.[0])} className={inputClass} />
              <p className="mt-1 text-xs text-zinc-500">PDF, JPG, PNG, WebP · maks. 10 MB</p>
              {contractFile && <p className="mt-1 flex items-center gap-1 text-xs text-zinc-700"><FileText className="h-3 w-3" />{contractFile.name}</p>}
            </div>}
            {basis !== 'AGREEMENT' && <div>
              <label htmlFor="rab-file" className={labelClass}>Berkas RAB</label>
              <input id="rab-file" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => pick('rab', e.target.files?.[0])} className={inputClass} />
              <p className="mt-1 text-xs text-zinc-500">CSV, XLSX, XLS: uraian/kegiatan dan jumlah biaya · maks. 5 MB</p>
              {rabFile && <p className="mt-1 text-xs text-zinc-700">{rabFile.name}</p>}
            </div>}
            <div className="flex flex-wrap gap-3 text-xs sm:col-span-2">
              {basis !== 'AGREEMENT' && <a href="/api/demo/samples/rab" className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline"><Download className="h-3 w-3" />Contoh RAB CSV</a>}
              {basis !== 'BUDGET' && <a href="/api/demo/samples/contract" className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline"><Download className="h-3 w-3" />Contoh kesepakatan PDF</a>}
            </div>
          </div>
        )}

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {step && <p role="status" className="text-sm text-zinc-600">{step}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={step !== null} className={btn.primary}>{step ? 'Memproses…' : 'Buat proyek & lanjut ke analisis'}<ArrowRight className="h-4 w-4" /></button>
        </div>
      </form>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm sm:p-7" aria-labelledby="demo-flow-title">
        <h2 id="demo-flow-title" className="font-heading text-lg font-bold text-zinc-950">Alur setelah acuan disetujui</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li><strong>Budi</strong> mencatat progres, tahap selesai, atau pekerjaan tambahan.</li>
          <li><strong>Siti</strong> mencatat biaya dan tagihan; sistem membandingkannya dengan acuan yang tersedia.</li>
          <li>Jika ada perubahan, <strong>Budi</strong> mengajukan, <strong>Siti</strong> memeriksa dampaknya, lalu <strong>Hendra</strong> memutuskan.</li>
          <li>Setelah klien menyetujui, <strong>Budi</strong> mencatat buktinya dan acuan baru berlaku. Pilih pengguna demo lewat profil di header.</li>
        </ol>
        <Link href="/panduan-demo" className="mt-4 inline-flex items-center gap-1 font-semibold text-red-700 hover:underline">Lihat alur lengkap <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  );
}
