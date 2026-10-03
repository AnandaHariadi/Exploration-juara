'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useProjects } from '@/hooks/useClaraData';
import { Project } from '@/types';
import { formatRupiah } from '@/lib/utils';

function findAnswer(project: Project, question: string) {
  const query = question.toLowerCase();
  const agreement = project.agreementBaseline;
  if (/revisi/.test(query)) return `Batas revisi yang tersimpan: ${agreement.revisionLimit} kali. Periksa kontrak asli sebelum memakai angka ini sebagai dasar keputusan.`;
  if (/bayar|termin|tagih/.test(query)) return `Ketentuan pembayaran yang tersimpan: ${agreement.paymentTerms}. Jadwal tiap tahap dapat dilihat di detail proyek.`;
  if (/nilai|kontrak|biaya/.test(query)) return `Nilai kontrak yang tersimpan: ${formatRupiah(project.contractValue)}. Rencana biaya: ${formatRupiah(project.plannedCost)}.`;
  if (/tenggat|selesai|tanggal/.test(query)) return `Tenggat proyek yang tersimpan: ${agreement.deadline}.`;
  if (/lingkup|pekerjaan/.test(query)) return `Ruang lingkup yang tersimpan: ${agreement.scopeItems.map((item) => item.title).join('; ') || 'belum ada'}.`;
  return 'Informasi tersebut belum tersedia dalam data kesepakatan proyek. Periksa dokumen asli atau lengkapi data proyek.';
}

export default function LegalAiPage() {
  const { projects, loading, error } = useProjects();
  const [projectId, setProjectId] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [answer, setAnswer] = React.useState<{ question: string; text: string } | null>(null);
  React.useEffect(() => { setProjectId((current) => projects.some((project) => project.id === current) ? current : projects[0]?.id ?? ''); }, [projects]);
  const project = projects.find((item) => item.id === projectId);

  function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim() || !project) return;
    setAnswer({ question: query.trim(), text: findAnswer(project, query.trim()) });
    setQuery('');
  }

  return <div className="mx-auto max-w-4xl space-y-6 pb-12">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-red-700">Data kesepakatan · Mode demo</p><h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Cari informasi proyek</h1><p className="mt-2 text-sm leading-relaxed text-zinc-600">Cari nilai, jadwal, dan ketentuan yang tersimpan pada proyek demo.</p></div>
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-orange-950">Pencarian ini membaca data kesepakatan proyek, bukan isi berkas kontrak. Hasilnya bukan kutipan pasal atau pemeriksaan hukum.</div>
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
      <label htmlFor="contract-project" className="block text-sm font-semibold text-zinc-800">Pilih proyek</label>
      <select id="contract-project" value={projectId} onChange={(event) => { setProjectId(event.target.value); setAnswer(null); }} className="mt-2 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20">
        {projects.length === 0 && <option value="">Belum ada proyek</option>}
        {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="mt-5 text-sm text-zinc-500">Memuat proyek…</p> : !project ? <p className="mt-5 text-sm text-zinc-600">Buat proyek terlebih dahulu untuk melihat informasi kesepakatan.</p> : <>
        <form onSubmit={ask} className="mt-6"><label htmlFor="question" className="block text-sm font-semibold text-zinc-800">Apa yang ingin dicari?</label><div className="mt-2 flex gap-2"><input id="question" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contoh: Berapa batas revisi?" className="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20" /><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"><Search size={17} />Cari</button></div></form>
        <p className="mt-3 text-xs text-zinc-500">Tersedia: batas revisi, pembayaran, nilai kontrak, biaya, tenggat, dan ruang lingkup.</p>
        {answer && <div role="status" className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{answer.question}</p><p className="mt-2 text-sm leading-relaxed text-zinc-900">{answer.text}</p><p className="mt-3 text-xs text-zinc-500">Sumber: data kesepakatan proyek {project.name}.</p></div>}
      </>}
    </div>
  </div>;
}
