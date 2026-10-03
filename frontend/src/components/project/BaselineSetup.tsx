'use client';

import React from 'react';
import { AlertTriangle, Bot, Download, FileSpreadsheet, FileText, Loader2, Plus, RefreshCw, ShieldCheck, Trash2, Upload } from 'lucide-react';
import type { CandidateMilestone, CandidateRabItem, ExtractionCandidate, Project } from '@/types';
import { dataClient, documentUrl } from '@/services/dataClient';
import { useAiHealth } from '@/hooks/useClaraData';
import { formatRupiah } from '@/lib/utils';
import { btn, inputClass, labelClass, Panel, SourceQuote } from '@/components/shared/ui';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

const sourceLabel: Record<ExtractionCandidate['source'], string> = {
  AI: 'Hasil analisis AI — wajib ditinjau',
  SAMPLE: 'Data contoh (tanpa AI) — diberi label demo',
  MANUAL: 'Isian manual',
};

function Steps({ project }: { project: Project }) {
  const hasContract = project.documents.some((d) => d.kind === 'CONTRACT');
  const status = project.extraction?.status;
  const current = !hasContract ? 0 : status === 'READY' ? 2 : 1;
  const steps = ['Dokumen', 'Analisis', 'Tinjau & koreksi', 'Setujui acuan V1'];
  return (
    <ol aria-label="Tahapan menyiapkan acuan proyek" className="flex flex-wrap gap-2 text-sm">
      {steps.map((label, i) => (
        <li key={label} aria-current={i === current ? 'step' : undefined} className={`rounded-full px-3 py-1.5 ${i === current ? 'bg-red-600 font-semibold text-white' : i < current ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
          {i + 1} · {label}
        </li>
      ))}
    </ol>
  );
}

function DocumentsPanel({ project, run, locked }: { project: Project; run: Run; locked: boolean }) {
  const [uploading, setUploading] = React.useState<'CONTRACT' | 'RAB' | 'SAMPLE' | null>(null);
  const contract = [...project.documents].reverse().find((d) => d.kind === 'CONTRACT');
  const rab = [...project.documents].reverse().find((d) => d.kind === 'RAB');

  const upload = async (kind: 'CONTRACT' | 'RAB', file?: File) => {
    if (!file) return;
    setUploading(kind);
    await run(() => dataClient.uploadDocument(project.id, kind, file), `${kind === 'CONTRACT' ? 'Kontrak' : 'RAB'} ${file.name} diunggah.`);
    setUploading(null);
  };

  const row = (kind: 'CONTRACT' | 'RAB', doc: typeof contract) => (
    <div className="min-w-0 rounded-xl border border-zinc-200 p-4">
      <div className="flex items-start gap-3">
        {kind === 'CONTRACT' ? <FileText className="mt-0.5 h-5 w-5 text-red-600" /> : <FileSpreadsheet className="mt-0.5 h-5 w-5 text-emerald-600" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">{kind === 'CONTRACT' ? 'Kontrak' : 'RAB (rencana biaya)'}</p>
          {doc ? (
            <p className="mt-0.5 truncate text-sm text-zinc-600">
              <a href={documentUrl(project.id, doc.id)} target="_blank" rel="noreferrer" className="font-medium text-red-700 hover:underline">{doc.fileName}</a>
              {' · '}{Math.ceil(doc.size / 1024)} KB{doc.isSample && <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-800">Berkas contoh</span>}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-zinc-500">Belum diunggah.</p>
          )}
          <p className="mt-1 text-xs text-zinc-500">{kind === 'CONTRACT' ? 'PDF, JPG, PNG, WebP · maks. 10 MB' : 'CSV dengan kolom kategori, deskripsi, jumlah · maks. 2 MB. XLSX: simpan sebagai CSV.'}</p>
        </div>
      </div>
      {!locked && (
        <label className={`${btn.secondary} mt-3 w-full cursor-pointer sm:w-auto`}>
          {uploading === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading === kind ? 'Mengunggah…' : doc ? 'Ganti berkas' : 'Pilih berkas'}
          <input
            type="file"
            className="sr-only"
            disabled={uploading !== null}
            accept={kind === 'CONTRACT' ? '.pdf,.png,.jpg,.jpeg,.webp' : '.csv'}
            onChange={(e) => {
              void upload(kind, e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );

  return (
    <Panel
      title="1 · Dokumen proyek"
      description="Kontrak dibaca AI. RAB dibaca langsung oleh sistem (tanpa AI) agar angka rencana biaya persis seperti di berkas."
      action={
        <a href="/api/demo/samples/rab" className={btn.ghost}>
          <Download className="h-4 w-4" />Contoh RAB CSV
        </a>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {row('CONTRACT', contract)}
        {row('RAB', rab)}
      </div>
      {!contract && !locked && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-orange-50 p-4 text-sm text-orange-950">
          <span className="flex-1">Belum punya berkas? Gunakan kontrak & RAB contoh yang diberi label demo.</span>
          <button
            type="button"
            disabled={uploading !== null}
            className={btn.secondary}
            onClick={async () => {
              setUploading('SAMPLE');
              await run(() => dataClient.attachSampleDocuments(project.id), 'Berkas contoh dilampirkan.');
              setUploading(null);
            }}
          >
            {uploading === 'SAMPLE' ? 'Melampirkan…' : 'Gunakan berkas contoh'}
          </button>
        </div>
      )}
    </Panel>
  );
}

function AnalysisPanel({ project, run }: { project: Project; run: Run }) {
  const { health, loading: healthLoading, refreshHealth } = useAiHealth();
  const [pending, setPending] = React.useState<'AI' | 'SAMPLE' | 'MANUAL' | null>(null);
  const contract = [...project.documents].reverse().find((d) => d.kind === 'CONTRACT');
  const extraction = project.extraction;
  const processing = pending !== null || extraction?.status === 'PROCESSING';

  const analyze = async (mode: 'AI' | 'SAMPLE' | 'MANUAL') => {
    if (extraction?.status === 'READY' && !window.confirm('Hasil tinjauan saat ini (termasuk koreksi) akan diganti dengan hasil baru. Lanjutkan?')) return;
    setPending(mode);
    await run(() => dataClient.extract(project.id, mode), mode === 'AI' ? 'Analisis AI selesai. Tinjau setiap nilai sebelum menyetujui.' : mode === 'SAMPLE' ? 'Data contoh dimuat untuk ditinjau.' : 'Form isian manual siap.');
    setPending(null);
    if (mode === 'AI') void refreshHealth();
  };

  return (
    <Panel title="2 · Analisis dokumen" description="AI hanya membaca dan mengutip. Angka bisnis dihitung sistem setelah Anda menyetujui acuan.">
      <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm ${health?.available ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <Bot className="h-4 w-4" />
        <span className="flex-1">{healthLoading ? 'Memeriksa layanan AI…' : health?.available ? `Layanan AI siap (${health.service ?? 'CLARA AI'}).` : `${health?.message ?? 'Layanan AI tidak tersedia.'} Anda tetap bisa memakai data contoh atau isian manual.`}</span>
        <button type="button" onClick={() => void refreshHealth()} className="inline-flex items-center gap-1 text-xs font-semibold underline">
          <RefreshCw className="h-3 w-3" />Periksa ulang
        </button>
      </div>

      {processing && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <Loader2 className="h-5 w-5 animate-spin text-red-600" />
          {pending === 'AI' || extraction?.source === 'AI' ? 'AI sedang membaca kontrak (OCR → ekstraksi → validasi kutipan). Biasanya 30–90 detik.' : 'Memproses…'}
        </div>
      )}

      {extraction?.status === 'FAILED' && !processing && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Analisis gagal</p>
          <p className="mt-1">{extraction.error?.message ?? 'Terjadi kesalahan.'}</p>
          <p className="mt-1 text-xs">Dokumen tetap tersimpan dan proyek aman. Anda dapat mencoba lagi atau memakai cara lain di bawah.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={processing || !contract} onClick={() => void analyze('AI')} className={btn.primary}>
          <Bot className="h-4 w-4" />{extraction?.status === 'FAILED' && extraction.source === 'AI' ? 'Coba analisis AI lagi' : 'Analisis dengan AI'}
        </button>
        {contract?.isSample && (
          <button type="button" disabled={processing} onClick={() => void analyze('SAMPLE')} className={btn.secondary}>
            Muat data contoh (tanpa AI)
          </button>
        )}
        <button type="button" disabled={processing} onClick={() => void analyze('MANUAL')} className={btn.ghost}>
          Isi manual
        </button>
      </div>
      {!contract && <p className="mt-2 text-xs text-zinc-500">Unggah kontrak terlebih dahulu untuk analisis AI.</p>}
    </Panel>
  );
}

function ReviewPanel({ project, run }: { project: Project; run: Run }) {
  const c = project.extraction as ExtractionCandidate;
  const [form, setForm] = React.useState(() => ({
    contractNumber: c.contract.contractNumber,
    title: c.contract.title,
    clientName: c.contract.clientName,
    contractValue: c.contract.contractValue?.toString() ?? '',
    startDate: c.contract.startDate ?? '',
    deadline: c.contract.deadline ?? '',
    revisionLimit: c.contract.revisionLimit?.toString() ?? '',
    paymentTerms: c.contract.paymentTerms,
    scope: c.contract.scope.join('\n'),
  }));
  const [milestones, setMilestones] = React.useState<CandidateMilestone[]>(c.milestones);
  const [rabItems, setRabItems] = React.useState<CandidateRabItem[]>(c.rab.items);
  const [saving, setSaving] = React.useState<'save' | 'confirm' | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);

  const pctSum = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);
  const rabTotal = rabItems.reduce((s, i) => s + (Number(i.plannedAmount) || 0), 0);
  const contractValue = Number(form.contractValue) || 0;

  const patch = () => ({
    contract: {
      contractNumber: form.contractNumber,
      title: form.title,
      clientName: form.clientName,
      contractValue: form.contractValue === '' ? null : Number(form.contractValue),
      startDate: form.startDate || null,
      deadline: form.deadline || null,
      revisionLimit: form.revisionLimit === '' ? null : Number(form.revisionLimit),
      paymentTerms: form.paymentTerms,
      scope: form.scope.split('\n').map((s) => s.trim()).filter(Boolean),
    },
    milestones: milestones.map((m) => ({ ...m, percentage: m.percentage === null || (m.percentage as unknown) === '' ? null : Number(m.percentage) })),
    rabItems: rabItems.map((i) => ({ ...i, plannedAmount: Number(i.plannedAmount) })),
  });

  const save = async (confirmAfter: boolean) => {
    setSaving(confirmAfter ? 'confirm' : 'save');
    setErrors([]);
    const saved = await run(() => dataClient.updateCandidate(project.id, patch()), (r) => (r.validation.length ? 'Koreksi disimpan. Masih ada data yang perlu dilengkapi.' : 'Koreksi disimpan.'));
    if (saved) {
      setErrors(saved.validation);
      if (confirmAfter && saved.validation.length === 0) {
        if (window.confirm('Setujui data ini sebagai acuan proyek V1? Setelah disetujui, perubahan hanya melalui permintaan perubahan.')) {
          await run(() => dataClient.confirmBaseline(project.id), 'Acuan proyek V1 disetujui. Pemantauan aktif.');
        }
      }
    }
    setSaving(null);
  };

  const field = (key: keyof typeof form, label: string, type = 'text', sourceKey?: string) => (
    <div>
      <label htmlFor={`cand-${key}`} className={labelClass}>
        {label}
        {c.editedFields.includes(key) && <span className="ml-2 text-[11px] font-semibold text-indigo-700">dikoreksi</span>}
      </label>
      <input id={`cand-${key}`} type={type} inputMode={type === 'number' ? 'numeric' : undefined} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputClass} />
      {key === 'contractValue' && contractValue > 0 && <p className="mt-1 text-xs text-zinc-500">{formatRupiah(contractValue)}</p>}
      {sourceKey && c.source !== 'MANUAL' && <SourceQuote projectId={project.id} source={c.sources[sourceKey]} />}
    </div>
  );

  return (
    <Panel
      title="3 · Tinjau dan koreksi"
      description="Belum aktif. Hanya data yang Anda setujui yang menjadi acuan proyek."
      action={<span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.source === 'AI' ? 'bg-indigo-50 text-indigo-700' : c.source === 'SAMPLE' ? 'bg-orange-50 text-orange-800' : 'bg-zinc-100 text-zinc-700'}`}>{sourceLabel[c.source]}</span>}
    >
      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
        {c.extractionMeta && <span>Mesin: {c.extractionMeta.engine}</span>}
        {c.extractionMeta?.pages ? <span>{c.extractionMeta.pages} halaman</span> : null}
        {c.confidence !== null && <span>Keyakinan AI: {Math.round(c.confidence * 100)}%</span>}
      </div>

      {c.warnings.length > 0 && (
        <ul className="mb-5 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {c.warnings.map((w) => <li key={w} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{w}</li>)}
        </ul>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {field('title', 'Judul pekerjaan')}
        {field('clientName', 'Klien')}
        {field('contractNumber', 'Nomor kontrak', 'text', 'contractNumber')}
        {field('contractValue', 'Nilai kontrak (Rp)', 'number', 'contractValue')}
        {field('startDate', 'Tanggal mulai', 'date', 'startDate')}
        {field('deadline', 'Tenggat', 'date', 'deadline')}
        {field('revisionLimit', 'Batas revisi termasuk nilai kontrak', 'number', 'revisionLimit')}
        <div>
          <label htmlFor="cand-paymentTerms" className={labelClass}>Ringkasan ketentuan pembayaran</label>
          <textarea id="cand-paymentTerms" rows={3} value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="cand-scope" className={labelClass}>Ruang lingkup (satu pekerjaan per baris)</label>
        <textarea id="cand-scope" rows={4} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className={inputClass} />
        {c.source !== 'MANUAL' && <SourceQuote projectId={project.id} source={c.sources.scope} />}
      </div>

      <fieldset className="mt-6">
        <legend className={labelClass}>Termin pembayaran & syarat tagih</legend>
        <p className={`mt-1 text-xs ${Math.abs(pctSum - 100) < 0.01 ? 'text-emerald-700' : 'text-amber-700'}`}>Total {pctSum.toLocaleString('id-ID')}% (harus 100%)</p>
        <div className="mt-3 space-y-3">
          {milestones.map((m, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-3">
              <div className="grid gap-3 sm:grid-cols-[1.4fr_0.6fr_1.6fr_1fr_auto]">
                <div>
                  <label htmlFor={`ms-title-${i}`} className="text-xs font-semibold text-zinc-600">Nama tahap</label>
                  <input id={`ms-title-${i}`} value={m.title} onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={`ms-pct-${i}`} className="text-xs font-semibold text-zinc-600">%</label>
                  <input id={`ms-pct-${i}`} type="number" min="0" max="100" step="0.01" value={m.percentage ?? ''} onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, percentage: e.target.value === '' ? null : Number(e.target.value) } : x)))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={`ms-trigger-${i}`} className="text-xs font-semibold text-zinc-600">Syarat tagih</label>
                  <input id={`ms-trigger-${i}`} value={m.trigger} onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, trigger: e.target.value } : x)))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={`ms-date-${i}`} className="text-xs font-semibold text-zinc-600">Target (opsional)</label>
                  <input id={`ms-date-${i}`} type="date" value={m.targetDate ?? ''} onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, targetDate: e.target.value || null } : x)))} className={inputClass} />
                </div>
                <button type="button" aria-label={`Hapus tahap ${i + 1}`} onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} className="mt-6 self-start rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {contractValue > 0 && m.percentage ? <p className="mt-2 text-xs text-zinc-500">≈ {formatRupiah(Math.round((contractValue * Number(m.percentage)) / 100))} siap ditagih setelah syarat terpenuhi</p> : null}
              {c.source !== 'MANUAL' && <SourceQuote projectId={project.id} source={m.source} />}
            </div>
          ))}
          <button type="button" onClick={() => setMilestones([...milestones, { id: `MLS-${milestones.length + 1}-${Date.now() % 10000}`, title: '', percentage: null, trigger: '', targetDate: null }])} className={btn.ghost}>
            <Plus className="h-4 w-4" />Tambah tahap
          </button>
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className={labelClass}>Rencana biaya (RAB){c.rab.sourceFile ? ` · dari ${c.rab.sourceFile}` : ''}</legend>
        <p className="mt-1 text-xs text-zinc-500">Total {formatRupiah(rabTotal)}{contractValue > 0 && rabTotal > 0 ? ` · laba rencana ${formatRupiah(contractValue - rabTotal)}` : ''}</p>
        {c.rab.warnings.length > 0 && <ul className="mt-2 space-y-1 text-xs text-amber-800">{c.rab.warnings.map((w) => <li key={w}>• {w}</li>)}</ul>}
        <div className="mt-3 space-y-2">
          {rabItems.map((item, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.6fr_1fr_auto]">
              <input aria-label={`Kategori RAB ${i + 1}`} value={item.category} onChange={(e) => setRabItems(rabItems.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} className={inputClass} />
              <input aria-label={`Deskripsi RAB ${i + 1}`} value={item.description} onChange={(e) => setRabItems(rabItems.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} className={inputClass} />
              <input aria-label={`Jumlah RAB ${i + 1}`} type="number" min="1" value={item.plannedAmount || ''} onChange={(e) => setRabItems(rabItems.map((x, j) => (j === i ? { ...x, plannedAmount: Number(e.target.value) } : x)))} className={inputClass} />
              <button type="button" aria-label={`Hapus item RAB ${i + 1}`} onClick={() => setRabItems(rabItems.filter((_, j) => j !== i))} className="mt-1.5 self-start rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setRabItems([...rabItems, { id: `RAB-${rabItems.length + 1}`, category: '', description: '', plannedAmount: 0 }])} className={btn.ghost}>
            <Plus className="h-4 w-4" />Tambah item RAB
          </button>
        </div>
      </fieldset>

      {c.risks.length > 0 && (
        <div className="mt-6">
          <h3 className={labelClass}>Klausul yang perlu diperhatikan</h3>
          <ul className="mt-2 space-y-2">
            {c.risks.map((r) => (
              <li key={r.title} className="rounded-xl border border-zinc-200 p-3 text-sm">
                <span className="font-semibold text-zinc-900">{r.title}</span> <span className="text-xs text-zinc-500">· {r.severity === 'HIGH' ? 'tinggi' : r.severity === 'MEDIUM' ? 'sedang' : 'rendah'}</span>
                <p className="mt-1 text-zinc-700">{r.detail}</p>
                <SourceQuote projectId={project.id} source={r.source} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.length > 0 && (
        <ul role="alert" className="mt-6 space-y-1 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {errors.map((e) => <li key={e}>• {e}</li>)}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-5">
        <button type="button" disabled={saving !== null} onClick={() => void save(false)} className={btn.secondary}>{saving === 'save' ? 'Menyimpan…' : 'Simpan koreksi'}</button>
        <button type="button" disabled={saving !== null} onClick={() => void save(true)} className={btn.success}>
          <ShieldCheck className="h-4 w-4" />{saving === 'confirm' ? 'Memproses…' : '4 · Setujui sebagai acuan V1'}
        </button>
      </div>
    </Panel>
  );
}

export function BaselineSetup({ project, run }: { project: Project; run: Run }) {
  const ready = project.extraction?.status === 'READY';
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-zinc-950">Siapkan acuan proyek</h2>
        <p className="mt-1 text-sm text-zinc-600">Kontrak + RAB → analisis → tinjauan manusia → acuan V1. Pemantauan, rekonsiliasi, dan peringatan aktif setelah acuan disetujui.</p>
        <div className="mt-4"><Steps project={project} /></div>
      </div>
      <DocumentsPanel project={project} run={run} locked={project.extraction?.status === 'PROCESSING'} />
      <AnalysisPanel project={project} run={run} />
      {ready && <ReviewPanel key={`${project.extraction?.completedAt}-${project.extraction?.source}`} project={project} run={run} />}
    </div>
  );
}
