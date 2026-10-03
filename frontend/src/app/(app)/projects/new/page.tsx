'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Download, FileText } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { btn, inputClass, labelClass } from '@/components/shared/ui';

const CONTRACT_EXT = /\.(pdf|png|jpe?g|webp)$/i;
const MAX_CONTRACT = 10 * 1024 * 1024;
const MAX_RAB = 2 * 1024 * 1024;

type Source = 'upload' | 'sample' | 'manual';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [client, setClient] = React.useState('');
  const [source, setSource] = React.useState<Source>('upload');
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
    if (kind === 'rab' && (!/\.csv$/i.test(file.name) || file.size > MAX_RAB)) {
      setError('RAB harus berkas CSV (kategori, deskripsi, jumlah), maksimal 2 MB. Untuk XLSX, simpan sebagai CSV.');
      return;
    }
    if (kind === 'contract') setContractFile(file);
    else setRabFile(file);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !client.trim()) return setError('Nama proyek dan klien wajib diisi.');
    if (source === 'upload' && !contractFile) return setError('Pilih berkas kontrak, atau gunakan berkas contoh.');
    setError(null);
    let projectId: string | null = null;
    try {
      setStep('Membuat proyek…');
      const project = await dataClient.createProject({ name: name.trim(), client: client.trim(), useSample: source === 'sample' });
      projectId = project.id;
      if (source === 'upload' && contractFile) {
        setStep('Mengunggah kontrak…');
        await dataClient.uploadDocument(project.id, 'CONTRACT', contractFile);
        if (rabFile) {
          setStep('Mengunggah RAB…');
          await dataClient.uploadDocument(project.id, 'RAB', rabFile);
        }
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
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">Proyek dibuat sebagai draf. Setelah itu kontrak dianalisis, Anda meninjau hasilnya, lalu menyetujui acuan V1.</p>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="project-name" className={labelClass}>Nama proyek</label><input id="project-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Sistem Manajemen Armada" className={inputClass} /></div>
          <div><label htmlFor="client-name" className={labelClass}>Nama klien</label><input id="client-name" required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Contoh: PT Astra Sahabat Logistik" className={inputClass} /></div>
        </div>

        <fieldset className="border-t border-zinc-100 pt-5">
          <legend className={labelClass}>Dokumen kontrak & RAB</legend>
          <div className="mt-3 grid gap-3">
            {choice('upload', 'Unggah berkas saya', 'Kontrak dianalisis AI; RAB CSV dibaca langsung oleh sistem.')}
            {choice('sample', 'Gunakan berkas contoh (demo)', 'Kontrak PKS contoh Rp120 juta + RAB Rp75 juta. Diberi label data demo.')}
            {choice('manual', 'Isi manual tanpa dokumen', 'Tanpa analisis; semua nilai diisi sendiri pada langkah tinjauan.')}
          </div>
        </fieldset>

        {source === 'upload' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contract-file" className={labelClass}>Berkas kontrak</label>
              <input id="contract-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => pick('contract', e.target.files?.[0])} className={inputClass} />
              <p className="mt-1 text-xs text-zinc-500">PDF, JPG, PNG, WebP · maks. 10 MB</p>
              {contractFile && <p className="mt-1 flex items-center gap-1 text-xs text-zinc-700"><FileText className="h-3 w-3" />{contractFile.name}</p>}
            </div>
            <div>
              <label htmlFor="rab-file" className={labelClass}>Berkas RAB (opsional)</label>
              <input id="rab-file" type="file" accept=".csv" onChange={(e) => pick('rab', e.target.files?.[0])} className={inputClass} />
              <p className="mt-1 text-xs text-zinc-500">CSV: kategori, deskripsi, jumlah · maks. 2 MB</p>
              {rabFile && <p className="mt-1 text-xs text-zinc-700">{rabFile.name}</p>}
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <a href="/api/demo/samples/rab" className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline"><Download className="h-3 w-3" />Contoh RAB CSV</a>
                <a href="/api/demo/samples/contract" className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline"><Download className="h-3 w-3" />Contoh kontrak PDF</a>
              </div>
            </div>
          </div>
        )}

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {step && <p role="status" className="text-sm text-zinc-600">{step}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={step !== null} className={btn.primary}>{step ? 'Memproses…' : 'Buat proyek & lanjut ke analisis'}<ArrowRight className="h-4 w-4" /></button>
        </div>
      </form>
    </div>
  );
}
