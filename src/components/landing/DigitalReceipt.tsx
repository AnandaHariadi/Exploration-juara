"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";

interface DigitalReceiptProps {
  mode: "campus" | "agency";
}

export function DigitalReceipt({ mode }: DigitalReceiptProps) {
  const isCampus = mode === "campus";
  const [isPaid, setIsPaid] = useState(false);

  const clientName = isCampus ? "HIMATIFA UPNVJT" : "Jagoan Hosting (PT Beon Intermedia)";
  const totalAmount = isCampus ? 1000000 : 4500000;
  const dpAmount = isCampus ? 300000 : 2250000;
  const remainingAmount = totalAmount - dpAmount;
  const invNumber = isCampus ? "INV/2026/09/HMT-001" : "INV/2026/09/JH-002";
  const serviceName = isCampus
    ? "Pengembangan Web Portal Dies Natalis Informatika"
    : "Pengembangan Custom Plugin & Optimasi Server Cloud";

  const handlePay = async () => {
    setIsPaid(true);
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border-2 border-zinc-200 shadow-xl p-6 sm:p-7 relative overflow-hidden font-sans">
      {/* Decorative Stamp if Paid */}
      {isPaid && (
        <div className="absolute top-8 right-6 z-20 border-2 border-emerald-600 text-emerald-700 font-heading font-black text-xs uppercase px-3 py-1 rounded tracking-widest rotate-3 bg-emerald-50 shadow-sm animate-in zoom-in-90">
          DP LUNAS VERIFIED
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-dashed border-zinc-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 block">
            OFFICIAL DIGITAL RECEIPT
          </span>
          <h4 className="font-heading font-black text-base text-zinc-900 tracking-tight">
            Arka Studio Visual
          </h4>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono font-bold text-zinc-800 block">{invNumber}</span>
          <span className="text-[10px] text-zinc-400">Gateway Xendit Sandbox</span>
        </div>
      </div>

      {/* Client & Description */}
      <div className="py-4 space-y-1">
        <span className="text-[10px] uppercase font-bold text-zinc-400 block">Klien:</span>
        <h5 className="font-heading font-bold text-sm text-zinc-900">
          {clientName}
        </h5>
        <p className="text-xs text-zinc-500">
          {serviceName}
        </p>
      </div>

      {/* Breakdown Box with Perforated Accent */}
      <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/80 space-y-2.5 my-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-600">Total Nilai Kontrak</span>
          <span className="font-heading font-bold text-zinc-900">{formatRupiah(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-200">
          <span className="font-semibold text-orange-700">
            Termin 1 (DP {isCampus ? "30%" : "50%"})
          </span>
          <span className="font-heading font-black text-sm text-zinc-900">
            {formatRupiah(dpAmount)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-zinc-400">
          <span>Termin 2 (Pelunasan Proyek)</span>
          <span>{formatRupiah(remainingAmount)} (Pending)</span>
        </div>
      </div>

      {/* Simulated QRIS Code & Payment Action */}
      <div className="pt-3 space-y-3 text-center">
        {!isPaid ? (
          <>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-semibold">
              <span>Metode Pembayaran: QRIS & Virtual Account</span>
            </div>

            <button
              type="button"
              onClick={handlePay}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-heading font-bold text-xs py-3 rounded-xl shadow-md shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Simulasikan Klien Bayar Termin</span>
            </button>
            <p className="text-[10px] text-zinc-400">
              Uji respons webhook otomatis saat transaksi sukses
            </p>
          </>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
            <p className="font-heading font-bold text-xs text-emerald-800">
              Transaksi Berhasil Diverifikasi
            </p>
            <p className="text-[10px] text-emerald-600">
              Status termin otomatis lunas di dashboard tanpa perlu verifikasi mutasi manual.
            </p>
          </div>
        )}
      </div>

      {/* Barcode Accent */}
      <div className="pt-4 mt-3 border-t border-dashed border-zinc-200 flex flex-col items-center">
        <div className="flex gap-1 h-5 items-center opacity-30">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className={`h-full ${i % 3 === 0 ? "w-1 bg-zinc-900" : i % 2 === 0 ? "w-0.5 bg-zinc-700" : "w-1.5 bg-zinc-900"}`}
            />
          ))}
        </div>
        <span className="text-[9px] font-mono tracking-widest text-zinc-400 mt-1 uppercase">
          Xendit Callback Verified
        </span>
      </div>
    </div>
  );
}
