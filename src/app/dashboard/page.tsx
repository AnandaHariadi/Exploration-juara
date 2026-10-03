"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Building2,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Layers,
  ArrowUpRight,
  Filter
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { InvoiceIntent } from "@/features/ai/types";
import { parseNaturalLanguageInvoice } from "@/features/ai/parser";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalInflow: 0,
    totalReceivables: 0,
    activeInvoicesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // AI Command Input state
  const [prompt, setPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<InvoiceIntent | null>(null);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Fetch invoices & metrics
  const loadData = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
        setMetrics(data.metrics || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleParsePrompt = () => {
    if (!prompt.trim()) return;
    setIsParsing(true);
    setTimeout(() => {
      const result = parseNaturalLanguageInvoice(prompt);
      setParsedDraft(result);
      setIsParsing(false);
    }, 400);
  };

  const handleSaveInvoice = async () => {
    if (!parsedDraft) return;
    setIsSubmittingDraft(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: parsedDraft.clientName || "Klien",
          clientCategory: parsedDraft.clientCategory,
          description: parsedDraft.description || "Jasa Layanan",
          totalAmount: parsedDraft.totalAmountIdr || 100000,
          scheme: parsedDraft.scheme,
          notes: parsedDraft.suggestedMessage,
          installments: parsedDraft.installments.map((inst) => ({
            label: inst.label,
            percentage: inst.percentage,
            amount: inst.amountIdr,
            dueAt: inst.dueDate,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedDraft(null);
        setPrompt("");
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/i/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">● Lunas</span>;
      case "partially_paid":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">● DP Lunas</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">● Menunggu Bayar</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-red-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-heading font-extrabold text-lg text-zinc-900 tracking-tight">CLARA</span>
            </Link>
            <span className="hidden sm:inline-block text-zinc-300">/</span>
            <span className="hidden sm:inline-block text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
              Dashboard Keuangan
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-zinc-900">Arka Studio Visual</p>
              <p className="text-[11px] text-zinc-500">Freelance Developer & Creative</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-sm">
              AS
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Metrik Finansial Cards (Gaya Aitoma + SaaS Modern) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Uang Masuk (Bulan Ini)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="font-heading font-black text-2xl sm:text-3xl text-zinc-900">
              {formatRupiah(metrics.totalInflow || 0)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              ✓ Berhasil terverifikasi via QRIS / VA
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Piutang Tertahan</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="font-heading font-black text-2xl sm:text-3xl text-orange-600">
              {formatRupiah(metrics.totalReceivables || 0)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Dari termin aktif & uang muka yang belum cair
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoice Berjalan</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="font-heading font-black text-2xl sm:text-3xl text-zinc-900">
              {metrics.activeInvoicesCount || 0} Proyek
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Menunggu termin berikutnya
            </p>
          </div>
        </div>

        {/* AI Command Bar (Buat Tagihan Baru via Chat) */}
        <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-md shadow-orange-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 text-white flex items-center justify-center text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-heading font-bold text-base text-zinc-900">
              Perintah Asisten AI (Buat Tagihan Baru)
            </h2>
          </div>

          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleParsePrompt()}
              placeholder="Contoh: Tagihkan 1.5jt ke Jagoan Hosting untuk jasa integrasi backend, DP 50%..."
              className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-xl pl-4 pr-32 py-3.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            <button
              type="button"
              onClick={handleParsePrompt}
              disabled={isParsing || !prompt.trim()}
              className="absolute right-2 top-2 bottom-2 inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-heading font-bold text-xs px-4 rounded-lg shadow-sm transition-all"
            >
              <Send className="w-3 h-3" />
              <span>{isParsing ? "Memproses..." : "Proses AI"}</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-zinc-500">
            <span>Ide cepat:</span>
            <button
              type="button"
              onClick={() => {
                const text = "Tagihkan 200k ke HIMATIFA UPNVJT untuk desain feed instagram dan banner, bayar lunas";
                setPrompt(text);
                const res = parseNaturalLanguageInvoice(text);
                setParsedDraft(res);
              }}
              className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1 rounded-full transition-all"
            >
              HIMATIFA (Lunas 200k)
            </button>
            <button
              type="button"
              onClick={() => {
                const text = "Tagihkan 4.5jt ke Jagoan Hosting untuk integrasi API cloud hosting dan plugin, DP 50%";
                setPrompt(text);
                const res = parseNaturalLanguageInvoice(text);
                setParsedDraft(res);
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-full transition-all"
            >
              Jagoan Hosting (DP 50%)
            </button>
          </div>
        </div>

        {/* Review & Confirmation Modal (Human-In-The-Loop) */}
        {parsedDraft && (
          <div className="bg-gradient-to-b from-orange-50/50 to-white rounded-2xl border-2 border-orange-300 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-orange-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="font-heading font-bold text-base text-zinc-900">
                  Tinjau & Konfirmasi Draft Invoice (Human-in-the-loop)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setParsedDraft(null)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕ Batal
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-5">
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200">
                <span className="text-[11px] text-zinc-400 block">Klien & Kategori</span>
                <p className="font-heading font-bold text-sm text-zinc-900 flex items-center gap-1.5 mt-0.5">
                  {parsedDraft.clientCategory === "campus" ? (
                    <GraduationCap className="w-4 h-4 text-orange-600 shrink-0" />
                  ) : (
                    <Building2 className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  {parsedDraft.clientName}
                </p>
                <span className="text-[10px] text-orange-600 font-semibold uppercase">{parsedDraft.clientCategory}</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-zinc-200">
                <span className="text-[11px] text-zinc-400 block">Deskripsi Jasa</span>
                <p className="font-heading font-bold text-sm text-zinc-900 mt-0.5">
                  {parsedDraft.description}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-zinc-200">
                <span className="text-[11px] text-zinc-400 block">Total Tagihan</span>
                <p className="font-heading font-black text-base text-zinc-900 mt-0.5">
                  {formatRupiah(parsedDraft.totalAmountIdr || 0)}
                </p>
              </div>
            </div>

            {/* Installments Table */}
            <div className="mb-5">
              <span className="text-xs font-semibold text-zinc-700 block mb-2">
                Jadwal & Pembagian Termin yang Disusun AI:
              </span>
              <div className="space-y-2">
                {parsedDraft.installments.map((inst, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-zinc-200 p-3 rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 block">{inst.label}</span>
                      <span className="text-[11px] text-zinc-500">Jatuh tempo: {inst.dueDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-heading font-extrabold text-sm text-zinc-900">
                        {formatRupiah(inst.amountIdr)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation CTA */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setParsedDraft(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
              >
                Ubah Input
              </button>
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={isSubmittingDraft}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-heading font-bold text-xs px-6 py-2.5 rounded-full shadow-md shadow-orange-500/20 transition-all hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingDraft ? "Menyimpan..." : "Konfirmasi & Terbitkan Invoice"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Invoices List Table */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-zinc-900">Daftar Tagihan & Piutang</h3>
              <p className="text-xs text-zinc-500">Semua transaksi, pembagian DP, dan tautan invoice untuk klien</p>
            </div>
            <span className="text-xs font-semibold bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              {invoices.length} Dokumen
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400">Memuat data invoice...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Belum ada invoice. Ketik perintah di bar atas untuk membuat tagihan baru!
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-5 hover:bg-zinc-50/60 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Invoice Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-700">{inv.number}</span>
                        {getStatusBadge(inv.status)}
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                          {inv.scheme.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                        {inv.clientCategory === "campus" ? (
                          <GraduationCap className="w-4 h-4 text-orange-600 shrink-0" />
                        ) : (
                          <Building2 className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{inv.clientName}</span>
                        <span className="font-normal text-xs text-zinc-500">— {inv.title}</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Diterbitkan pada {formatDate(inv.issuedAt)}
                      </p>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-5">
                      <div className="text-left md:text-right">
                        <span className="text-[11px] text-zinc-400 block">Total Tagihan</span>
                        <span className="font-heading font-extrabold text-base text-zinc-900">
                          {formatRupiah(inv.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Copy Public Link */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(inv.publicToken)}
                          title="Salin Tautan Invoice Klien"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-medium transition-all"
                        >
                          {copiedToken === inv.publicToken ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>

                        {/* Open Public Link */}
                        <Link
                          href={`/i/${inv.publicToken}`}
                          target="_blank"
                          title="Buka Halaman Invoice Klien"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold transition-all"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Termin Badges breakdown */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] text-zinc-400">Termin:</span>
                    {inv.installments.map((inst: any, idx: number) => (
                      <span
                        key={idx}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1 ${
                          inst.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-50 text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        <span>{inst.label}:</span>
                        <strong>{formatRupiah(inst.amount)}</strong>
                        {inst.status === "paid" ? " ✓" : " (Pending)"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
