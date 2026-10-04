'use client';

import React from 'react';
import { AlertTriangle, Bot, Download, FileSpreadsheet, FileText, Loader2, Plus, RefreshCw, Scale, ShieldCheck, Trash2, Upload } from 'lucide-react';
import type { CandidateMilestone, CandidateRabItem, ExtractionCandidate, Project } from '@/types';
import { dataClient, documentUrl } from '@/services/dataClient';
import { useAiHealth } from '@/hooks/useClaraData';
import { formatRupiah } from '@/lib/utils';
import { baselineAvailability, candidateAvailability } from '@/lib/baseline';
import { DocumentStatusBadge } from '@/components/shared/labels';
import { btn, inputClass, labelClass, Panel, SourceQuote } from '@/components/shared/ui';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

const sourceLabel: Record<ExtractionCandidate['source'], string> = {
  AI: 'Hasil analisis AI — wajib ditinjau',
  SAMPLE: 'Data contoh (tanpa AI) — diberi label demo',
  MANUAL: 'Isian manual',
};

function Steps({ project }: { project: Project }) {
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const available = active ? baselineAvailability(active) : null;
  const neededKind = available?.agreement ? 'RAB' : available?.budget ? 'CONTRACT' : null;
  const hasDocument = project.documents.some((d) => d.kind === neededKind || (!neededKind && (d.kind === 'CONTRACT' || d.kind === 'RAB')));
  const status = project.extraction?.status;
  const current = !hasDocument ? 0 : status === 'READY' ? 2 : 1;
  const steps = ['Dokumen', 'Analisis', 'Tinjau & koreksi', `Setujui acuan V${active ? active.version + 1 : 1}`];
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
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const available = active ? baselineAvailability(active) : null;
  const [uploading, setUploading] = React.useState<'CONTRACT' | 'RAB' | 'SAMPLE' | null>(null);
  const contract = [...project.documents].reverse().find((d) => d.kind === 'CONTRACT');
  const rab = [...project.documents].reverse().find((d) => d.kind === 'RAB');

  const upload = async (kind: 'CONTRACT' | 'RAB', file?: File) => {
    if (!file) return;
    setUploading(kind);
    await run(() => dataClient.uploadDocument(project.id, kind, file), kind === 'CONTRACT'
      ? `Kontrak ${file.name} diunggah. CLARA mulai menganalisis otomatis.`
      : `RAB ${file.name} diunggah. Jumlah biaya dibaca oleh sistem.`);
    setUploading(null);
  };

  const row = (kind: 'CONTRACT' | 'RAB', doc: typeof contract) => (
    <div className="min-w-0 rounded-xl border border-zinc-200 p-4">
      <div className="flex items-start gap-3">
        {kind === 'CONTRACT' ? <FileText className="mt-0.5 h-5 w-5 text-red-600" /> : <FileSpreadsheet className="mt-0.5 h-5 w-5 text-emerald-600" />}
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900">{kind === 'CONTRACT' ? 'Kontrak' : 'RAB (rencana biaya)'}{doc && <DocumentStatusBadge status={doc.status} />}</p>
          {doc ? (
            <p className="mt-0.5 truncate text-sm text-zinc-600">
              <a href={documentUrl(project.id, doc.id)} target="_blank" rel="noreferrer" className="font-medium text-red-700 hover:underline">{doc.fileName}</a>
              {' · '}{Math.ceil(doc.size / 1024)} KB{doc.isSample && <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-800">Berkas contoh</span>}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-zinc-500">Belum diunggah.</p>
          )}
          <p className="mt-1 text-xs text-zinc-500">{kind === 'CONTRACT' ? 'PDF, JPG, PNG, WebP · maks. 10 MB' : 'CSV, XLSX, XLS · kolom uraian/kegiatan dan jumlah biaya · maks. 5 MB'}</p>
        </div>
      </div>
      {!locked && (kind === 'CONTRACT' ? !available?.agreement : !available?.budget) && (
        <label className={`${btn.secondary} relative mt-3 w-full cursor-pointer sm:w-auto`}>
          {uploading === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading === kind ? 'Mengunggah…' : doc ? 'Ganti berkas' : 'Pilih berkas'}
          <input
            type="file"
            className="sr-only"
            disabled={uploading !== null}
            accept={kind === 'CONTRACT' ? '.pdf,.png,.jpg,.jpeg,.webp' : '.csv,.xlsx,.xls'}
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
      description={available?.agreement ? 'Tambahkan RAB yang belum ada. Angka dibaca langsung dari berkas dan menunggu persetujuan Anda.' : available?.budget ? 'Tambahkan kesepakatan yang belum ada. AI membaca isi dokumen, lalu Anda meninjau hasilnya.' : 'Kontrak dibaca AI. RAB dibaca langsung oleh sistem agar angka rencana biaya sesuai berkas.'}
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
      {!active && !contract && !rab && !locked && (
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
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const needsAgreement = !active || !baselineAvailability(active).agreement;
  const [pending, setPending] = React.useState<'AI' | 'SAMPLE' | 'MANUAL' | null>(null);
  const contract = [...project.documents].reverse().find((d) => d.kind === 'CONTRACT');
  const rab = [...project.documents].reverse().find((d) => d.kind === 'RAB');
  const rabOnly = !active && Boolean(rab) && !contract;
  const extraction = project.extraction;
  const processing = pending !== null || extraction?.status === 'PROCESSING' || contract?.status === 'PROCESSING' || rab?.status === 'PROCESSING';
  const neverAnalyzed = contract?.status === 'UPLOADED' && !extraction;

  const analyze = async (mode: 'AI' | 'SAMPLE' | 'MANUAL') => {
    if (extraction?.status === 'READY' && !window.confirm('Hasil tinjauan saat ini (termasuk koreksi) akan diganti dengan hasil baru. Lanjutkan?')) return;
    setPending(mode);
    await run(() => dataClient.extract(project.id, mode), mode === 'AI' ? 'Analisis AI selesai. Tinjau setiap nilai sebelum menyetujui.' : mode === 'SAMPLE' ? 'Data contoh dimuat untuk ditinjau.' : 'Form isian manual siap.');
    setPending(null);
    if (mode === 'AI') void refreshHealth();
  };

  return (
    <Panel title="2 · Analisis dokumen" description={rabOnly ? 'RAB dibaca langsung oleh sistem. Periksa item dan totalnya di bawah; kesepakatan dapat ditambahkan setelah acuan V1.' : needsAgreement ? 'Kesepakatan dibaca AI. Anda memeriksa hasilnya sebelum menjadi acuan.' : 'RAB dibaca oleh sistem. Periksa setiap item dan jumlah sebelum menyetujui versi baru.'}>
      {needsAgreement && !rabOnly && <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm ${health?.available ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <Bot className="h-4 w-4" />
        <span className="flex-1">{healthLoading ? 'Memeriksa layanan AI…' : health?.available ? `Layanan AI siap (${health.service ?? 'CLARA AI'}).` : `${health?.message ?? 'Layanan AI tidak tersedia.'} Anda tetap bisa memakai data contoh atau isian manual.`}</span>
        <button type="button" onClick={() => void refreshHealth()} className="inline-flex items-center gap-1 text-xs font-semibold underline">
          <RefreshCw className="h-3 w-3" />Periksa ulang
        </button>
      </div>}

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
        {needsAgreement && contract && <button type="button" disabled={processing} onClick={() => void analyze('AI')} className={btn.primary}>
          <Bot className="h-4 w-4" />{extraction?.status === 'FAILED' && extraction.source === 'AI' ? 'Coba analisis AI lagi' : neverAnalyzed ? 'Mulai analisis AI' : extraction?.status === 'READY' ? 'Analisis ulang dengan AI' : 'Analisis dengan AI'}
        </button>}
        {!active && contract?.isSample && (
          <button type="button" disabled={processing} onClick={() => void analyze('SAMPLE')} className={btn.secondary}>
            Muat data contoh (tanpa AI)
          </button>
        )}
        {!rabOnly && <button type="button" disabled={processing} onClick={() => void analyze('MANUAL')} className={btn.ghost}>
          Isi manual
        </button>}
      </div>
      {needsAgreement && !contract && !rabOnly && <p className="mt-2 text-xs text-zinc-500">Unggah kesepakatan terlebih dahulu untuk analisis AI.</p>}
    </Panel>
  );
}

function ReviewPanel({ project, run }: { project: Project; run: Run }) {
  const c = project.extraction as ExtractionCandidate;
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const approved = active ? baselineAvailability(active) : null;
  const hasContractDocument = project.documents.some((doc) => doc.kind === 'CONTRACT');
  const hasRabDocument = project.documents.some((doc) => doc.kind === 'RAB');
  const showAgreementFields = !approved?.agreement && (hasContractDocument || !hasRabDocument || c.rab.items.length === 0 || candidateAvailability(c).agreement);
  const showBudgetFields = !approved?.budget && (hasRabDocument || !hasContractDocument || c.rab.items.length > 0);
  const nextLabel = active ? `V${active.version + 1}` : 'V1';
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
  const [terms, setTerms] = React.useState(() => Object.fromEntries(Object.entries(c.terms ?? {}).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])) as Record<string, string>);
  const [milestones, setMilestones] = React.useState<CandidateMilestone[]>(c.milestones);
  const [rabItems, setRabItems] = React.useState<CandidateRabItem[]>(c.rab.items);
  const [saving, setSaving] = React.useState<'save' | 'confirm' | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);

  const pctSum = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);
  const rabTotal = rabItems.reduce((s, i) => s + (Number(i.plannedAmount) || 0), 0);
  const contractValue = Number(form.contractValue) || 0;

  const patch = () => ({
    ...(showAgreementFields ? { contract: {
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
    terms: Object.fromEntries(Object.entries(terms).map(([k, v]) => [k, v === '' ? null : Number(v)])) } : {}),
    ...(showBudgetFields ? { rabItems: rabItems.map((i) => ({ ...i, plannedAmount: Number(i.plannedAmount) })) } : {}),
  });

  const save = async (confirmAfter: boolean) => {
    setSaving(confirmAfter ? 'confirm' : 'save');
    setErrors([]);
    const saved = await run(() => dataClient.updateCandidate(project.id, patch()), (r) => (r.validation.length ? 'Koreksi disimpan. Masih ada data yang perlu dilengkapi.' : 'Koreksi disimpan.'));
    if (saved) {
      setErrors(saved.validation);
      if (confirmAfter && saved.validation.length === 0) {
        if (window.confirm(`Setujui data ini sebagai acuan proyek ${nextLabel}? Acuan sebelumnya tetap tersimpan.`)) {
          await run(() => dataClient.confirmBaseline(project.id), `Acuan proyek ${nextLabel} disetujui. Pemantauan diperbarui.`);
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
      action={<span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.source === 'AI' ? 'bg-indigo-50 text-indigo-700' : c.source === 'SAMPLE' ? 'bg-orange-50 text-orange-800' : 'bg-zinc-100 text-zinc-700'}`}>{c.source === 'MANUAL' && hasRabDocument && !hasContractDocument ? 'RAB dibaca sistem · tinjau angka' : sourceLabel[c.source]}</span>}
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

      {!showAgreementFields && !approved?.agreement && <p className="mb-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">Kesepakatan belum ada. Anda dapat menambahkannya setelah RAB disetujui sebagai acuan V1.</p>}
      {showAgreementFields && <>
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
        <legend className={labelClass}>Ketentuan komersial (dipakai mesin rekonsiliasi)</legend>
        <p className="mt-1 text-xs text-zinc-500">Tarif dan denda ini menjadi dasar perhitungan anomali: tarif invoice, nilai revisi tambahan, dan potensi denda.</p>
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] text-zinc-600">
          <Scale className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <span><strong>Rujukan Hukum:</strong> Asas Kebebasan Berkontrak (Pasal 1338 KUHPerdata) mengikat para pihak; besaran ganti rugi/denda dibatasi asas kepatutan (Pasal 1267 KUHPerdata & kelaziman OJK).</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {([
            ['hourlyRate', 'Tarif pekerjaan tambahan (Rp/jam)', 'hourlyRate'],
            ['revisionUnitPrice', 'Biaya per revisi tambahan (Rp)', 'revisionUnitPrice'],
            ['revisionExtensionDays', 'Tambahan hari per adendum revisi', 'revisionExtensionDays'],
            ['penaltyPerDayPercent', 'Denda keterlambatan (% per hari)', 'penalty'],
            ['penaltyCapPercent', 'Batas denda (% nilai kontrak)', 'penalty'],
            ['paymentDueDays', 'Tempo pembayaran (hari)', ''],
          ] as const).map(([key, label, src]) => (
            <div key={key}>
              <label htmlFor={`term-${key}`} className="text-xs font-semibold text-zinc-600">{label}</label>
              <input id={`term-${key}`} type="number" min="0" step="any" value={terms[key] ?? ''} onChange={(e) => setTerms({ ...terms, [key]: e.target.value })} className={inputClass} />
              {src && c.source !== 'MANUAL' && c.sources[src] && <SourceQuote projectId={project.id} source={c.sources[src]} />}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className={labelClass}>Termin pembayaran & syarat tagih</legend>
        <p className={`mt-1 text-xs ${milestones.length === 0 || Math.abs(pctSum - 100) < 0.01 ? 'text-emerald-700' : 'text-amber-700'}`}>{milestones.length ? `Total ${pctSum.toLocaleString('id-ID')}% (harus 100%)` : 'Belum ada tahap pembayaran; hak tagih belum dapat dihitung.'}</p>
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

      </>}

      {!showBudgetFields && !approved?.budget && <p className="mt-5 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">RAB belum ada. Anda dapat menambahkannya setelah kesepakatan disetujui sebagai acuan V1.</p>}
      {showBudgetFields && <fieldset className="mt-6">
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
      </fieldset>}

      {!approved?.agreement && c.risks.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-700" />
            <h3 className={labelClass}>Klausul yang perlu diperhatikan & Dasar Hukum</h3>
          </div>
          <ul className="mt-2 space-y-2">
            {c.risks.map((r) => (
              <li key={r.title} className="rounded-xl border border-zinc-200 p-3 text-sm">
                <span className="font-semibold text-zinc-900">{r.title}</span> <span className="text-xs text-zinc-500">· {r.severity === 'HIGH' ? 'tinggi' : r.severity === 'MEDIUM' ? 'sedang' : 'rendah'}</span>
                <p className="mt-1 text-zinc-700">{r.detail}</p>
                {r.legalBasis && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2.5 text-xs text-indigo-950">
                    <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-700" />
                    <div>
                      <span className="font-semibold text-indigo-900">Dasar Hukum & Batasan:</span>
                      <p className="mt-0.5 text-indigo-800">{r.legalBasis}</p>
                    </div>
                  </div>
                )}
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
          <ShieldCheck className="h-4 w-4" />{saving === 'confirm' ? 'Memproses…' : `4 · Setujui sebagai acuan ${nextLabel}`}
        </button>
      </div>
    </Panel>
  );
}

export function BaselineSetup({ project, run }: { project: Project; run: Run }) {
  const ready = project.extraction?.status === 'READY';
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const available = active ? baselineAvailability(active) : null;
  const analyzingDocument = project.documents.some((doc) => (doc.kind === 'CONTRACT' || doc.kind === 'RAB') && doc.status === 'PROCESSING');
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-zinc-950">{active ? `Lengkapi acuan proyek untuk V${active.version + 1}` : 'Siapkan acuan proyek'}</h2>
        <p className="mt-1 text-sm text-zinc-600">{active ? `Acuan ${active.label} tetap berlaku selama Anda meninjau ${available?.agreement ? 'RAB' : 'kesepakatan'} baru. Setelah disetujui, versi lama disimpan dalam riwayat.` : 'Unggah kesepakatan, RAB, atau keduanya. Tinjau data yang tersedia lalu setujui acuan V1. Hanya parameter yang punya acuan dapat dipantau.'}</p>
        <div className="mt-4"><Steps project={project} /></div>
      </div>
      <DocumentsPanel project={project} run={run} locked={project.extraction?.status === 'PROCESSING' || analyzingDocument} />
      <AnalysisPanel project={project} run={run} />
      {ready && <ReviewPanel key={`${project.extraction?.completedAt}-${project.extraction?.source}`} project={project} run={run} />}
    </div>
  );
}
