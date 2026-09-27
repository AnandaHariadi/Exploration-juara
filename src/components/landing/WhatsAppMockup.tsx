"use client";

import { CheckCheck, Mic } from "lucide-react";

interface WhatsAppMockupProps {
  mode: "campus" | "agency";
}

export function WhatsAppMockup({ mode }: WhatsAppMockupProps) {
  const isCampus = mode === "campus";

  return (
    <div className="w-full max-w-md bg-[#EFEAE2] rounded-2xl border border-zinc-300 shadow-xl overflow-hidden flex flex-col font-sans text-xs">
      {/* WhatsApp Header */}
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-bold text-xs uppercase tracking-wider">
            {isCampus ? "HF" : "JH"}
          </div>
          <div>
            <h4 className="font-semibold text-xs tracking-tight text-white">
              {isCampus ? "Bendahara HIMATIFA (Alif)" : "Tim Partnership — Jagoan Hosting"}
            </h4>
            <p className="text-[10px] text-emerald-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Online
            </p>
          </div>
        </div>
        <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded text-white font-medium">
          Verified Link
        </span>
      </div>

      {/* WhatsApp Chat Area */}
      <div className="p-4 space-y-3 bg-[#E5DDD5] min-h-[300px] flex flex-col justify-end">
        {/* Incoming Client Message */}
        <div className="bg-white rounded-xl rounded-tl-xs p-3 max-w-[85%] self-start shadow-xs text-zinc-800 space-y-1">
          <p className="text-[11.5px] leading-relaxed">
            {isCampus
              ? "Halo mas Arka, website Dies Natalis udah kami cek dan oke. Untuk tagihan termin pertama invoice-nya udah bisa dikirim?"
              : "Siang Mas Arka, scope pengembangan plugin dan optimasi server kemarin sudah disetujui tim lead Jagoan Hosting. Boleh kirimkan invoice termin 1 untuk DP 50%?"}
          </p>
          <span className="text-[9.5px] text-zinc-400 block text-right">10:42</span>
        </div>

        {/* Outgoing Message via Tagih.ai */}
        <div className="bg-[#D9FDD3] rounded-xl rounded-tr-xs p-3 max-w-[90%] self-end shadow-xs text-zinc-800 space-y-2 border border-emerald-200">
          <p className="text-[11.5px] leading-relaxed">
            {isCampus ? (
              <>
                Halo rekan panitia HIMATIFA. Website sudah live dan siap digunakan. Terlampir invoice resmi untuk <strong>Termin 1 (DP 30% Rp 300.000)</strong>. Pembayaran QRIS instan dapat diakses melalui tautan berikut:
              </>
            ) : (
              <>
                Yth. Tim Jagoan Hosting, terima kasih atas konfirmasinya. Bersama ini kami lampirkan invoice resmi <strong>Termin 1 (DP 50% Rp 2.250.000)</strong> dengan opsi Virtual Account bank & QRIS di tautan berikut:
              </>
            )}
          </p>

          {/* Embedded Invoice Link Card */}
          <div className="bg-white rounded-lg p-2.5 border border-emerald-300/80 shadow-xs flex items-center justify-between gap-3">
            <div className="truncate">
              <span className="font-bold text-[11px] text-zinc-900 block truncate">
                {isCampus ? "INV/2026/09/HMT-001 (Himatifa)" : "INV/2026/09/JH-002 (Jagoan Hosting)"}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                {isCampus ? "Tagihan DP 30% · Rp 300.000" : "Tagihan DP 50% · Rp 2.250.000"}
              </span>
            </div>
            <span className="text-[9.5px] font-bold text-orange-700 uppercase shrink-0 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
              QRIS Aktif
            </span>
          </div>

          <div className="flex items-center justify-end gap-1 text-[9.5px] text-zinc-500">
            <span>10:44</span>
            <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>

        {/* Audio / Voice Command bar */}
        <div className="bg-white/95 rounded-lg p-2 border border-zinc-200 shadow-xs flex items-center gap-2 self-center w-full max-w-[95%]">
          <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
            <Mic className="w-3 h-3" />
          </div>
          <p className="text-[10.5px] text-zinc-600 truncate flex-1 font-mono">
            {isCampus
              ? 'Voice: "Tagihkan DP 30% ke Himatifa untuk website..."'
              : 'Voice: "Tagihkan 4.5jt ke Jagoan Hosting, DP 50%..."'}
          </p>
          <span className="text-[9px] font-semibold text-zinc-500 uppercase bg-zinc-100 px-1.5 py-0.5 rounded">
            Parsed
          </span>
        </div>
      </div>
    </div>
  );
}
