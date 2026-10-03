// TEST-ONLY stand-in for the Gemini REST API, for integration-testing the AI
// pipeline without a real key. Never used in normal runs.
//
//   node scripts/gemini-stub.mjs            # listens on :3999
//   GOOGLE_AI_API_KEY=stub GEMINI_BASE_URL=http://localhost:3999 npm run dev
//
// It "OCRs" the demo contract from frontend/data/samples/kontrak-demo.json and
// answers extraction prompts with JSON shaped like a real model response,
// including one paraphrased quote and one malformed date so the service's
// evidence verification and validation paths are exercised.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const spec = JSON.parse(fs.readFileSync(path.join(here, '../../frontend/data/samples/kontrak-demo.json'), 'utf8'));
const ocrText = spec.pages.map((lines, i) => `=== HALAMAN ${i + 1} ===\n${lines.join('\n')}`).join('\n\n');

const extraction = {
  document_type: 'CONTRACT',
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
  },
  risks: [{ title: 'Denda keterlambatan', severity: 'MEDIUM', detail: 'Paparan maksimum 5% dari nilai kontrak bila terlambat.', evidence_quote: 'Keterlambatan penyelesaian pekerjaan dikenakan denda 0,1% per hari dari nilai kontrak, paling banyak 5% dari nilai kontrak.' }],
  confidence: 0.91,
  warnings: [],
};

const reply = (res, text) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP', index: 0 }] }));
};

http
  .createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const json = body ? JSON.parse(body) : {};
      if (req.url.includes(':embedContent')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }));
      }
      const parts = (json.contents ?? []).flatMap((c) => c.parts ?? []);
      const prompt = parts.map((p) => p.text ?? '').join('\n');
      if (parts.some((p) => p.inlineData)) return reply(res, ocrText);
      if (prompt.includes('TEKS KONTRAK')) return reply(res, JSON.stringify(extraction));
      return reply(res, 'Ringkasan: termin UAT (25%) dapat ditagih setelah UAT diterima dan Berita Acara UAT ditandatangani, sesuai Pasal 4 ayat 4.1 kontrak. Tagihan jatuh tempo 14 hari sejak diterima (Pasal 4.4). Rekomendasi: pastikan Berita Acara UAT ditandatangani sebelum menerbitkan invoice. [ATTENTION] Verifikasi dengan dokumen asli.');
    });
  })
  .listen(Number(process.env.PORT || 3999), () => console.log('Gemini stub on :' + (process.env.PORT || 3999)));
