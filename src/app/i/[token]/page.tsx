"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  QrCode,
  Download,
  Building2,
  GraduationCap,
  CreditCard,
  Printer,
  ShieldCheck,
  Check
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal payment simulation state
  const [activeInstallment, setActiveInstallment] = useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${token}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Invoice tidak ditemukan");
      }
    } catch (e: any) {
      setError(e?.message || "Gagal memuat invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInvoice();
  }, [token]);

  const handleSimulatePayment = async () => {
    if (!activeInstallment) return;
    setIsProcessingPayment(true);

    try {
      const res = await fetch(`/api/installments/${activeInstallment.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "QRIS" }),
      });
      const result = await res.json();

      if (result.success) {
        setPaymentSuccess(true);
        // Trigger celebratory confetti
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}

        // Refresh data
        setTimeout(async () => {
          await fetchInvoice();
          setIsProcessingPayment(false);
          setActiveInstallment(null);
          setPaymentSuccess(false);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-zinc-500">Memuat rincian invoice resmi...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            ✕
          </div>
          <h2 className="font-heading font-bold text-lg text-zinc-900">Invoice Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Tautan pembayaran mungkin sudah kedaluwarsa atau token tidak valid. Silakan hubungi freelancer terkait.
          </p>
          <Link
            href="/"
            className="inline-block text-xs font-semibold text-orange-600 hover:underline pt-2"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const { invoice, profile } = data;

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Action Bar (Print / Powered by) */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-heading font-extrabold text-sm text-zinc-900">YUPIENS</span>
            <span className="text-[11px] text-zinc-400">| Tautan Resmi Pembayaran Klien</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Invoice Paper Document */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-8 sm:p-12 shadow-lg shadow-zinc-200/40 relative overflow-hidden">
          {/* Status Ribbon */}
          {invoice.status === "paid" && (
            <div className="absolute top-6 right-6 border-2 border-emerald-600 text-emerald-700 font-heading font-bold text-xs uppercase px-4 py-1.5 rounded-md tracking-wider rotate-2 bg-emerald-50 shadow-xs">
              Lunas Sepenuhnya
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-zinc-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block mb-1">
                INVOICE TAGIHAN RESMI
              </span>
              <h1 className="font-heading font-black text-2xl text-zinc-900 tracking-tight">
                {profile.brandName}
              </h1>
              <p className="text-xs text-zinc-500 mt-1">{profile.contactEmail}</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <p className="text-xs font-mono font-bold text-zinc-800">{invoice.number}</p>
              <p className="text-xs text-zinc-500">
                Tanggal: <strong>{formatDate(invoice.issuedAt)}</strong>
              </p>
              <p className="text-xs text-zinc-500">
                Mata Uang: <strong>{invoice.currency} (Rupiah)</strong>
              </p>
            </div>
          </div>

          {/* Billed To */}
          <div className="py-6 border-b border-zinc-100 grid sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] uppercase font-bold text-zinc-400 block mb-1">
                Ditagihkan Kepada:
              </span>
              <h3 className="font-heading font-bold text-base text-zinc-900 flex items-center gap-1.5">
                {invoice.clientCategory === "campus" ? (
                  <GraduationCap className="w-4 h-4 text-orange-600 shrink-0" />
                ) : (
                  <Building2 className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{invoice.clientName}</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">{invoice.notes}</p>
            </div>
            <div className="sm:text-right flex flex-col justify-end">
              <span className="text-[11px] uppercase font-bold text-zinc-400 block mb-0.5">
                Total Tagihan:
              </span>
              <span className="font-heading font-black text-2xl text-zinc-900">
                {formatRupiah(invoice.totalAmount)}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2">Rincian Jasa / Pekerjaan</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Harga</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="py-2.5">
                    <td className="py-3 font-medium text-zinc-900">{item.description}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatRupiah(item.unitAmount)}</td>
                    <td className="py-3 text-right font-bold">{formatRupiah(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Skema Termin & Tombol Pembayaran */}
          <div className="mt-4 pt-6 border-t border-zinc-200 bg-zinc-50/50 -mx-8 -mb-8 sm:-mx-12 sm:-mb-12 p-8 sm:p-12 rounded-b-2xl">
            <h4 className="font-heading font-bold text-sm text-zinc-900 mb-4 flex items-center justify-between">
              <span>Jadwal Pembayaran & Termin</span>
              <span className="text-[11px] font-normal text-zinc-500">Mendukung QRIS & Virtual Account</span>
            </h4>

            <div className="space-y-3">
              {invoice.installments.map((inst: any) => (
                <div
                  key={inst.id}
                  className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    inst.status === "paid"
                      ? "border-emerald-200 bg-emerald-50/20"
                      : inst.status === "pending"
                      ? "border-orange-300 ring-2 ring-orange-500/10"
                      : "border-zinc-200 opacity-70"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-zinc-900">{inst.label}</span>
                      {inst.status === "paid" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Lunas
                        </span>
                      ) : inst.status === "pending" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 animate-pulse">
                          Siap Dibayar
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                          Menunggu Milestone
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Jatuh tempo: <strong>{inst.dueAt}</strong>
                      {inst.paidAt && ` · Dibayar pada ${formatDate(inst.paidAt)}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="font-heading font-extrabold text-base text-zinc-900">
                      {formatRupiah(inst.amount)}
                    </span>

                    {/* Pay Button for Pending Installment */}
                    {inst.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => setActiveInstallment(inst)}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-heading font-bold text-xs px-4 py-2 rounded-full shadow-md shadow-orange-500/20 hover:scale-105 transition-all no-print"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Guarantee */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verifikasi otomatis oleh Xendit Payment Session Sandbox</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Simulator Modal */}
      {activeInstallment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="font-heading font-bold text-xs text-zinc-700">Checkout Xendit Demo</span>
              <button
                type="button"
                onClick={() => setActiveInstallment(null)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-orange-600 font-bold block mb-1">
                Scan QRIS Pembayaran
              </span>
              <h3 className="font-heading font-black text-xl text-zinc-900">
                {formatRupiah(activeInstallment.amount)}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">{activeInstallment.label}</p>
            </div>

            {/* QRIS Graphic Mockup */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl inline-block shadow-inner">
              <div className="w-44 h-44 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center p-3 relative">
                {/* Simulated QR Pattern */}
                <div className="grid grid-cols-6 gap-1 w-32 h-32 opacity-80">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 || i % 7 === 0) ? "bg-zinc-900" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-widest">
                  QRIS STANDAR BI
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              Bisa di-scan menggunakan BCA, Mandiri, GoPay, OVO, atau ShopeePay.
            </p>

            {/* Interactive Hackathon Simulation Button */}
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessingPayment || paymentSuccess}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-heading font-bold text-xs py-3 rounded-full shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {paymentSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Pembayaran Sukses!</span>
                </>
              ) : isProcessingPayment ? (
                <span>Memproses Webhook...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Simulasikan Pembayaran Berhasil</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
