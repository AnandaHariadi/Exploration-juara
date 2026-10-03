// TEST-ONLY stand-in for the Gemini REST API, for integration-testing the AI
// pipeline without a real key. Never used in normal runs.
//
//   node scripts/gemini-stub.mjs            # listens on :3999
//   GOOGLE_AI_API_KEY=stub GEMINI_BASE_URL=http://localhost:3999 npm run dev
//
// It "OCRs" the labelled demo PDFs (identified by hash) from
// frontend/data/samples and answers each prompt type with output shaped like a
// real model. Some answers contain deliberate defects (a paraphrased quote, a
// malformed date) so the service's verification and validation paths run.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const samples = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../frontend/data/samples');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const specs = {};
for (const file of ['kontrak-demo.json', 'invoice-uat.json', 'invoice-tambahan.json', 'persetujuan-klien.json']) {
  const spec = JSON.parse(fs.readFileSync(path.join(samples, file), 'utf8'));
  const pdf = path.join(samples, spec.fileName);
  if (fs.existsSync(pdf)) specs[sha(fs.readFileSync(pdf))] = { file, text: spec.pages.map((lines, i) => `=== HALAMAN ${i + 1} ===\n${lines.join('\n')}`).join('\n\n') };
}
const contractText = Object.values(specs).find((s) => s.file === 'kontrak-demo.json').text;

const contract = {
  document_type: 'CONTRACT',
  summary: 'Perjanjian kerja sama pengembangan sistem manajemen armada senilai Rp120.000.000 dengan tiga termin pembayaran.',
  contract_number: 'PKS/ASL/2026/089',
  title: 'Perjanjian Kerja Sama Pengembangan Sistem Manajemen Armada',
  client_name: 'PT Astra Sahabat Logistik',
  vendor_name: 'PT Karya Digital Nusantara',
  contract_value: 120000000,
  start_date: '2026-08-01',
  deadline: '2026-11-30',
  revision_limit: 3,
  payment_terms_summary: '25% setelah UAT diterima, 50% setelah go-live, 25% setelah masa garansi 30 hari; tagihan dibayar 14 hari.',
  scope: ['Modul pelacakan armada berbasis GPS', 'Integrasi data telematika pengemudi', 'Dashboard dispatcher logistik', 'Pelatihan pengguna dan dokumentasi sistem'],
  obligations: ['Tagihan dibayar paling lambat 14 hari kalender sejak invoice diterima.'],
  penalties: ['Denda keterlambatan 0,1% per hari, maksimal 5% nilai kontrak.'],
  terms: { hourly_rate: 500000, revision_unit_price: 2000000, revision_extension_days: 5, penalty_per_day_percent: 0.1, penalty_cap_percent: 5, payment_due_days: 14 },
  milestones: [
    { name: 'UAT diterima', billing_percentage: 25, trigger: 'UAT diterima dan Berita Acara UAT ditandatangani', target_date: null, evidence_quote: '4.1 Sebesar 25% dari nilai kontrak dibayarkan setelah UAT diterima dan Berita Acara UAT ditandatangani.' },
    { name: 'Go-live', billing_percentage: 50, trigger: 'Sistem go-live di lingkungan produksi', target_date: '30-11-2026', evidence_quote: '4.2 Sebesar 50% dari nilai kontrak dibayarkan setelah sistem go-live di lingkungan produksi.' },
    { name: 'Akhir masa garansi', billing_percentage: 25, trigger: 'Masa garansi 30 hari berakhir', target_date: null, evidence_quote: '4.3 Sebesar 25% dari nilai kontrak dibayarkan setelah masa garansi 30 hari berakhir.' },
  ],
  field_evidence: {
    contract_number: 'Nomor: PKS/ASL/2026/089',
    contract_value: 'Nilai kontrak keseluruhan adalah Rp120.000.000 (seratus dua puluh juta rupiah), belum termasuk PPN.',
    start_date: 'Pekerjaan dimulai pada tanggal 1 Agustus 2026',
    deadline: 'wajib diselesaikan paling lambat tanggal 30 November 2026.',
    revision_limit: 'Nilai kontrak sudah termasuk maksimal 3 (tiga) putaran revisi.',
    scope: 'Vendor mengerjakan GPS, telematika, dashboard, dan pelatihan.',
    hourly_rate: 'Pekerjaan tambahan di luar ruang lingkup ditagih dengan tarif Rp500.000 per jam.',
    revision_unit_price: 'Setiap putaran revisi tambahan di luar batas tersebut dikenakan biaya Rp2.000.000 per putaran dan dituangkan dalam adendum.',
    penalty: 'Keterlambatan penyelesaian pekerjaan dikenakan denda 0,1% per hari dari nilai kontrak, paling banyak 5% dari nilai kontrak.',
  },
  risks: [{ title: 'Denda keterlambatan', severity: 'LOW', detail: 'Paparan maksimum 5% dari nilai kontrak bila terlambat.', evidence_quote: 'Keterlambatan penyelesaian pekerjaan dikenakan denda 0,1% per hari dari nilai kontrak, paling banyak 5% dari nilai kontrak.' }],
  confidence: 0.91,
  warnings: [],
};

const invoices = {
  'invoice-uat.json': {
    document_type: 'INVOICE', summary: 'Invoice termin UAT 25% senilai Rp30.000.000 untuk PKS/ASL/2026/089.', invoice_number: 'INV/KDN/2026/031', issue_date: '2026-10-15',
    issuer: 'PT Karya Digital Nusantara', recipient: 'PT Astra Sahabat Logistik', total: 30000000, milestone_reference: 'Termin: UAT diterima (25% dari nilai kontrak)', revisions_charged: null,
    line_items: [{ description: 'Termin UAT diterima', quantity: 1, unit: 'termin', unit_price: 30000000, amount: 30000000, evidence_quote: '1. Termin UAT diterima - 1 termin x Rp30.000.000 = Rp30.000.000' }],
    field_evidence: { invoice_number: 'Nomor: INV/KDN/2026/031', total: 'Total tagihan: Rp30.000.000', milestone_reference: 'Termin: UAT diterima (25% dari nilai kontrak)' }, risks: [], confidence: 0.93, warnings: [],
  },
  'invoice-tambahan.json': {
    document_type: 'INVOICE', summary: 'Invoice pekerjaan tambahan 40 jam dan revisi dashboard (total 8 putaran) senilai Rp36.000.000.', invoice_number: 'INV/KDN/2026/032', issue_date: '2026-10-20',
    issuer: 'PT Karya Digital Nusantara', recipient: 'PT Astra Sahabat Logistik', total: 36000000, milestone_reference: 'Termin: Pekerjaan tambahan dan revisi', revisions_charged: 8,
    line_items: [
      { description: 'Pekerjaan tambahan integrasi notifikasi', quantity: 40, unit: 'jam', unit_price: 650000, amount: 26000000, evidence_quote: '1. Pekerjaan tambahan integrasi notifikasi - 40 jam x Rp650.000 = Rp26.000.000' },
      { description: 'Revisi dashboard putaran 4 sampai 8', quantity: 5, unit: 'putaran', unit_price: 2000000, amount: 10000000, evidence_quote: '2. Revisi dashboard putaran 4 sampai 8 (total 8 putaran revisi) - 5 putaran x Rp2.000.000 = Rp10.000.000' },
    ],
    field_evidence: { invoice_number: 'Nomor: INV/KDN/2026/032', total: 'Total tagihan: Rp36.000.000', milestone_reference: 'Termin: Pekerjaan tambahan dan revisi' }, risks: [], confidence: 0.9, warnings: [],
  },
};

const approval = {
  document_type: 'CLIENT_APPROVAL', summary: 'Klien menyetujui tambahan 2 putaran revisi, tambahan nilai Rp4.000.000, dan perpanjangan 5 hari.',
  approval: { approved: true, approver: 'Rina Kusuma, Kepala Pengadaan PT Astra Sahabat Logistik', date: '2026-10-22', reference: '045/ASL-PROC/X/2026' },
  key_points: [{ text: 'Tambahan 2 putaran revisi, Rp4.000.000, perpanjangan 5 hari.', evidence_quote: 'b. Tambahan nilai pekerjaan sebesar Rp4.000.000.' }], confidence: 0.92, warnings: [],
};

function draftFrom(prompt) {
  const type = /JENIS DOKUMEN: (.+)/.exec(prompt)?.[1] ?? 'Dokumen';
  const title = /JUDUL: (.+)/.exec(prompt)?.[1] ?? type;
  const facts = (/FAKTA TERVERIFIKASI \(salin angka persis\):\n([\s\S]*?)(\n\n|$)/.exec(prompt)?.[1] ?? '').split('\n').filter(Boolean);
  return [`# ${title}`, '', `Dokumen ini adalah draf ${type} untuk ditinjau para pihak.`, '', '## Ketentuan', ...facts, '', '## Dasar & Rujukan', '- Kontrak dan acuan proyek aktif sebagaimana tercantum di atas.', '', '## Persetujuan', 'Berlaku setelah disetujui secara tertulis oleh para pihak.'].join('\n');
}

const reply = (res, text) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP', index: 0 }] }));
};

http
  .createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const json = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
      if (req.url.includes(':embedContent')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }));
      }
      const parts = (json.contents ?? []).flatMap((c) => c.parts ?? []);
      const prompt = parts.map((p) => p.text ?? '').join('\n');
      const inline = parts.find((p) => p.inlineData);
      if (inline) return reply(res, (specs[sha(Buffer.from(inline.inlineData.data, 'base64'))] ?? { text: contractText }).text);
      if (prompt.includes('pembaca kontrak')) return reply(res, JSON.stringify(contract));
      if (prompt.includes('pembaca invoice')) return reply(res, JSON.stringify(prompt.includes('INV/KDN/2026/032') ? invoices['invoice-tambahan.json'] : invoices['invoice-uat.json']));
      if (prompt.includes('asisten dokumen bisnis')) return reply(res, JSON.stringify(approval));
      if (prompt.includes('Periksa DRAF terhadap FAKTA')) return reply(res, JSON.stringify({ issues: [] }));
      if (prompt.includes('INSTRUKSI REVISI')) {
        const current = /DRAF SAAT INI:\n([\s\S]*?)\n\nINSTRUKSI REVISI/.exec(prompt)?.[1] ?? '';
        const instruction = /INSTRUKSI REVISI:\n(.+)/.exec(prompt)?.[1] ?? '';
        return reply(res, `${current}\n\n## Catatan revisi\n${instruction}`);
      }
      if (prompt.includes('JENIS DOKUMEN:')) return reply(res, draftFrom(prompt));
      if (prompt.includes('Jelaskan temuan berikut')) return reply(res, 'Apa yang terjadi: syarat tagih atau batas acuan terlampaui menurut data tercatat.\nMengapa penting: nilai terkait dapat memengaruhi arus kas proyek.\nYang sebaiknya ditinjau: bukti pada daftar di atas, lalu putuskan tindak lanjutnya.');
      return reply(res, 'Ringkasan: termin UAT (25%) dapat ditagih setelah UAT diterima dan Berita Acara UAT ditandatangani, sesuai Pasal 4 ayat 4.1 kontrak. Tagihan jatuh tempo 14 hari sejak diterima (Pasal 4.4). [ATTENTION] Verifikasi dengan dokumen asli.');
    });
  })
  .listen(Number(process.env.PORT || 3999), () => console.log(`Gemini stub on :${process.env.PORT || 3999} · ${Object.keys(specs).length} sample PDFs`));
