'use client';

import React from 'react';
import { Bot, RefreshCw, Search, Trash2 } from 'lucide-react';
import type { LegalAnswer } from '@/types';
import { dataClient } from '@/services/dataClient';
import { useAiHealth, useProjects } from '@/hooks/useClaraData';
import { formatDate, formatRupiah } from '@/lib/utils';
import { btn, inputClass, labelClass, Panel } from '@/components/shared/ui';

interface Turn {
  question: string;
  answer?: LegalAnswer;
  error?: string;
}

const confidenceStyle = { green: 'bg-emerald-50 text-emerald-800 border-emerald-200', yellow: 'bg-amber-50 text-amber-800 border-amber-200', red: 'bg-red-50 text-red-800 border-red-200' };
const EXAMPLES = ['Kapan termin UAT boleh ditagih?', 'Apa risiko jika revisi melebihi batas kontrak?', 'Bagaimana aturan denda keterlambatan dalam kontrak ini?'];

export default function LegalAiPage() {
  const { projects, loading } = useProjects();
  const { health, loading: healthLoading, refreshHealth } = useAiHealth();
  const [projectId, setProjectId] = React.useState('');
  const [question, setQuestion] = React.useState('');
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [asking, setAsking] = React.useState(false);

  React.useEffect(() => {
    setProjectId((current) => (current === '__none' || projects.some((p) => p.id === current) ? current : projects.find((p) => p.metrics.hasBaseline)?.id ?? projects[0]?.id ?? ''));
  }, [projects]);
  const project = projects.find((p) => p.id === projectId);

  const ask = async (text: string) => {
    const q = text.trim();
    if (q.length < 3 || asking) return;
    setAsking(true);
    const history = turns.filter((t) => t.answer).slice(-3).flatMap((t) => [{ role: 'user' as const, content: t.question }, { role: 'assistant' as const, content: t.answer!.answer }]);
    setTurns((prev) => [...prev.filter((t) => !(t.error && t.question === q)), { question: q }]);
    setQuestion('');
    try {
      const answer = await dataClient.askLegal(q, project?.id, history);
      setTurns((prev) => prev.map((t) => (t.question === q && !t.answer && !t.error ? { question: q, answer } : t)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mendapatkan jawaban.';
      setTurns((prev) => prev.map((t) => (t.question === q && !t.answer && !t.error ? { question: q, error: message } : t)));
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Fitur pendukung · CLARA Legal AI</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Tanya kontrak & hukum</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">Jawaban AI berdasarkan acuan proyek yang disetujui dan basis pengetahuan hukum (RAG). Bukan nasihat hukum final.</p>
      </div>

      <div className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm ${health?.available ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <Bot className="h-4 w-4" />
        <span className="flex-1">
          {healthLoading ? 'Memeriksa layanan AI…' : health?.available ? `Layanan AI siap.${health.ai?.neo4j === 'connected' ? ' Basis pengetahuan hukum terhubung.' : ' Basis pengetahuan hukum (Neo4j) tidak terhubung — jawaban memakai data proyek dan pengetahuan model, kutipan pasal perlu diverifikasi.'}` : health?.message ?? 'Layanan AI tidak tersedia.'}
        </span>
        <button type="button" onClick={() => void refreshHealth()} className="inline-flex items-center gap-1 text-xs font-semibold underline"><RefreshCw className="h-3 w-3" />Periksa ulang</button>
      </div>

      <Panel>
        <label htmlFor="contract-project" className={labelClass}>Konteks proyek</label>
        <select id="contract-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
          {loading && <option value="">Memuat proyek…</option>}
          <option value="__none">Tanpa proyek (pertanyaan hukum umum)</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.metrics.hasBaseline ? ` · acuan ${p.metrics.baselineVersion}` : ' · belum ada acuan'}</option>)}
        </select>
        {project?.metrics.hasBaseline && (
          <dl className="mt-3 grid gap-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700 sm:grid-cols-4">
            <div><dt className="text-zinc-500">Nilai kontrak</dt><dd className="font-semibold">{formatRupiah(project.metrics.contractValue)}</dd></div>
            <div><dt className="text-zinc-500">Tenggat</dt><dd className="font-semibold">{formatDate(project.metrics.deadline ?? '')}</dd></div>
            <div><dt className="text-zinc-500">Batas revisi</dt><dd className="font-semibold">{project.metrics.includedRevisions}</dd></div>
            <div><dt className="text-zinc-500">Termin</dt><dd className="font-semibold">{project.agreementBaseline.milestones.length} tahap</dd></div>
          </dl>
        )}

        <form onSubmit={(e) => { e.preventDefault(); void ask(question); }} className="mt-5">
          <label htmlFor="question" className={labelClass}>Pertanyaan</label>
          <div className="mt-1.5 flex gap-2">
            <input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Contoh: Kapan termin UAT boleh ditagih?" className={`${inputClass} mt-0 flex-1`} />
            <button type="submit" disabled={asking || question.trim().length < 3} className={btn.primary}><Search className="h-4 w-4" />{asking ? 'Menunggu…' : 'Tanya'}</button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => <button key={ex} type="button" disabled={asking} onClick={() => void ask(ex)} className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 hover:border-red-300 disabled:opacity-50">{ex}</button>)}
        </div>
      </Panel>

      {turns.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-end"><button type="button" disabled={asking} onClick={() => setTurns([])} className={btn.ghost}><Trash2 className="h-4 w-4" />Bersihkan percakapan</button></div>
          {[...turns].reverse().map((t, i) => (
            <article key={`${t.question}-${i}`} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pertanyaan</p>
              <p className="mt-1 font-semibold text-zinc-900">{t.question}</p>
              {!t.answer && !t.error && <p role="status" className="mt-4 text-sm text-zinc-500">AI sedang menelusuri sumber dan menyusun jawaban…</p>}
              {t.error && (
                <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <span>{t.error}</span>
                  <button type="button" disabled={asking} onClick={() => void ask(t.question)} className={btn.secondary}>Coba lagi</button>
                </div>
              )}
              {t.answer && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${confidenceStyle[t.answer.confidenceLevel]}`}>Keyakinan {Math.round(t.answer.confidence * 100)}%</span>
                    <span className="text-xs text-zinc-500">{t.answer.contextUsed.projectContext ? 'Memakai data acuan proyek' : 'Tanpa data proyek'} · {t.answer.contextUsed.legalSources} sumber hukum dari basis pengetahuan</span>
                  </div>
                  <div className="whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-900">{t.answer.answer}</div>
                  {t.answer.confidenceLabel && <p className="text-xs text-zinc-500">{t.answer.confidenceLabel}</p>}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rujukan</p>
                    {t.answer.citations.length === 0 ? (
                      <p className="mt-1 text-xs text-amber-700">Tidak ada rujukan terverifikasi dari basis pengetahuan. Verifikasi jawaban dengan dokumen asli.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">{t.answer.citations.map((c) => <li key={c.id} className="text-sm text-zinc-700">• <strong>{c.title}</strong> <span className={`text-xs ${/model knowledge/i.test(c.source) ? 'text-amber-700' : 'text-zinc-500'}`}>({/model knowledge/i.test(c.source) ? 'pengetahuan model — belum diverifikasi dari basis hukum' : c.source})</span></li>)}</ul>
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
