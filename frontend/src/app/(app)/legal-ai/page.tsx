'use client';

import React from 'react';
import { FileSearch, Search, FileText, Send, Scale, BookOpen, ShieldCheck } from 'lucide-react';
import { storageService } from '@/services/storage';

export default function LegalAiPage() {
  const [query, setQuery] = React.useState('');
  const [selectedContract, setSelectedContract] = React.useState('PRJ-001');
  const [chatLog, setChatLog] = React.useState<
    { role: 'user' | 'assistant'; text: string; citation?: string; clause?: string }[]
  >([
    {
      role: 'assistant',
      text: 'Selamat datang di modul Legal & Contract Clause Audit CLARA. Anda dapat menanyakan ketentuan formal dari dokumen PKS yang telah diunggah: jatah revisi desain, syarat jatuh tempo termin, atau klausul denda keterlambatan.',
    },
  ]);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setQuery('');
    setChatLog((prev) => [...prev, { role: 'user', text: userText }]);

    setTimeout(() => {
      let reply = 'Berdasarkan audit komputasional pada naskah kontrak tersebut, tidak ditemukan ketentuan spesifik mengenai hal yang ditanyakan.';
      let citation = 'PKS ASL/IT/PKS/2026/089';
      let clause = 'Ketentuan Umum';

      const lower = userText.toLowerCase();
      if (lower.includes('revisi') || lower.includes('batas')) {
        reply = 'Berdasarkan Pasal 6 Ayat 3, Klien berhak mengajukan maksimal 3 (tiga) putaran revisi desain dan alur kerja. Revisi tambahan wajib diajukan melalui mekanisme Change Request resmi dengan tarif man-day terpisah.';
        clause = 'Pasal 6 Ayat 3: Batas Revisi & Add-on Komersial';
      } else if (lower.includes('termin') || lower.includes('bayar') || lower.includes('dp')) {
        reply = 'Ketentuan pembayaran termin diatur pada Pasal 7: Termin 1 (30% DP) telah selesai, Termin 2 (30%) jatuh tempo saat Berita Acara UAT ditandatangani. Termin 3 (30%) Go-Live, dan 10% Retensi 90 hari.';
        clause = 'Pasal 7: Skema Termin Pembayaran';
      } else if (lower.includes('denda') || lower.includes('penalti') || lower.includes('telat')) {
        reply = 'Pasal 9 Ayat 2 mengatur bahwa keterlambatan pembayaran oleh pihak pertama dikenakan denda sebesar 1‰ (satu permil) per hari kalender dengan batas maksimal akumulasi 5% dari nilai invoice tertunggak.';
        clause = 'Pasal 9 Ayat 2: Denda Keterlambatan Finansial';
      } else {
        reply = `Audit kontrak CLARA: Ruang lingkup terkait "${userText}" terikat pada Lampiran Teknis A (Scope of Work). Segala penambahan di luar lampiran tersebut mewajibkan persetujuan adendum tertulis agar tidak memicu deviasi scope.`;
        clause = 'Pasal 12: Klausul Penutup & Addendum';
      }

      setChatLog((prev) => [...prev, { role: 'assistant', text: reply, citation, clause }]);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Contract Clause Retrieval
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Klausul Kontrak & Legal Audit</h1>
          <p className="text-xs text-slate-500 mt-1">
            Penelusuran instan isi pasal kontrak PKS, batasan tanggung jawab, dan audit hak komersial.
          </p>
        </div>

        <div>
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none"
          >
            <option value="PRJ-001">PKS ERP PT Astra Sahabat Logistik</option>
            <option value="PRJ-002">PKS Mobile Banking Mandiri Syariah</option>
            <option value="PRJ-003">PKS Smart Warehouse IoT Pelabuhan</option>
          </select>
        </div>
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider whitespace-nowrap">Pertanyaan Standar:</span>
        {[
          'Berapa batas revisi gratis di kontrak ini?',
          'Kapan termin pembayaran ke-2 jatuh tempo?',
          'Bagaimana aturan denda keterlambatan invoice?',
        ].map((q) => (
          <button
            key={q}
            onClick={() => setQuery(q)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors whitespace-nowrap text-xs font-medium shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat / Query Display Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[520px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatLog.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs border border-slate-800">
                  <Scale className="w-4 h-4 text-blue-400" />
                </div>
              )}

              <div
                className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white font-medium rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                <p>{msg.text}</p>

                {msg.clause && (
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                    <span className="font-bold text-slate-900 block">Kutipan Pasal Sah:</span>
                    <p className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-800 text-[11px]">
                      {msg.clause}
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono">Sumber Dokumen: {msg.citation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Query Input Bar */}
        <form onSubmit={handleAsk} className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center gap-2 rounded-b-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tanyakan hal seputar klausul kontrak, batasan revisi, atau penalti..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          />
          <button
            type="submit"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
