"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  User,
  Users,
  Building2,
  Check,
  Zap
} from "lucide-react";

type AccountMode = "umkm" | "industri";

interface PackageTier {
  id: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  priceDisplay: string;
  priceSub: string;
  perProjectNote: string;
  quotaCount: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "trial" | "primary" | "secondary" | "outline";
}

const packages: PackageTier[] = [
  {
    id: "trial",
    name: "Trial Eksplorasi",
    badge: "1x Proyek Gratis",
    priceDisplay: "Rp 0",
    priceSub: "gratis untuk setiap akun baru",
    perProjectNote: "1 kuota proyek terkonfirmasi",
    quotaCount: "1 Proyek Lengkap",
    description: "Uji akurasi ekstraksi kontrak AI dan kalkulasi rekonsiliasi deterministik pada proyek nyata Anda tanpa komitmen biaya.",
    features: [
      "1 Kuota Proyek Terkonfirmasi resmi",
      "Kuota baru terpotong saat Baseline V1 disahkan",
      "Bebas revisi draf kontrak & upload berulang kali",
      "Kawal proyek tanpa batas waktu hingga lunas",
      "Ekstraksi AI Multimodal (PKS, SPK, SOW, RAB)",
      "Rekonsiliasi 4 Pilar (Kontrak, RAB, Progres, Invoice)",
      "Ekspor ringkasan rekonsiliasi PDF & Excel"
    ],
    ctaLabel: "Mulai Trial 1 Proyek",
    ctaHref: "/dashboard",
    ctaVariant: "trial"
  },
  {
    id: "starter-5",
    name: "Paket 5 Proyek",
    badge: "Starter",
    priceDisplay: "Rp 135.000",
    priceSub: "total pembayaran satu kali (one-time)",
    perProjectNote: "Hanya ~Rp 27.000 per proyek",
    quotaCount: "5 Kuota Proyek",
    description: "Cocok untuk freelancer, konsultan, dan tim kecil yang menangani proyek awal secara terukur.",
    features: [
      "5 Kuota Proyek Terkonfirmasi resmi",
      "Kuota terpotong HANYA saat Baseline V1 disahkan",
      "Bebas uji coba draf & re-upload tanpa kuota berkurang",
      "Masa aktif kuota selamanya (tanpa kedaluwarsa)",
      "Kawal tiap proyek berbulan-bulan hingga tuntas lunas",
      "Akses 100% Fitur Deterministic Engine & AI OCR",
      "Deteksi otomatis Unbilled Revenue & Scope Variance"
    ],
    ctaLabel: "Pilih Paket 5 Proyek",
    ctaHref: "/dashboard",
    ctaVariant: "secondary"
  },
  {
    id: "growth-10",
    name: "Paket 10 Proyek",
    badge: "Pilihan Hemat UMKM",
    priceDisplay: "Rp 250.000",
    priceSub: "total pembayaran satu kali (one-time)",
    perProjectNote: "Hanya ~Rp 25.000 per proyek",
    quotaCount: "10 Kuota Proyek",
    description: "Solusi pas bagi software house dan agensi berkembang dengan perputaran proyek aktif reguler.",
    features: [
      "10 Kuota Proyek Terkonfirmasi resmi",
      "Garansi kuota: Approve dulu baru berkurang 1",
      "Bebas revisi draf & negosiasi kontrak tanpa limit",
      "Masa aktif tanpa batas waktu, aman sampai lunas",
      "Akses penuh Addendum Studio (Baseline V2, V3...)",
      "Rekonsiliasi 4 Pilar & Proteksi Margin Finansial",
      "Ekspor laporan audit trail lengkap siap cetak"
    ],
    ctaLabel: "Pilih Paket 10 Proyek",
    ctaHref: "/dashboard",
    ctaVariant: "secondary"
  },
  {
    id: "scale-20",
    name: "Paket 20 Proyek",
    badge: "Paling Populer · Hemat Maksimal",
    isPopular: true,
    priceDisplay: "Rp 450.000",
    priceSub: "total pembayaran satu kali (one-time)",
    perProjectNote: "Hanya ~Rp 22.500 per proyek",
    quotaCount: "20 Kuota Proyek",
    description: "Paket paling diminati untuk agensi, kontraktor, dan vendor dengan portofolio proyek intensif.",
    features: [
      "20 Kuota Proyek Terkonfirmasi resmi",
      "Kuota aman: berkurang 1 hanya saat sahkan V1",
      "Bebas revisi draf & upload ulang berkali-kali",
      "Tanpa batas waktu, aktif sampai seluruh termin lunas",
      "Addendum Studio lengkap & deteksi deviasi otomatis",
      "Prioritas antrian pemrosesan AI Vision OCR",
      "Dukungan ekspor rekap eksekutif & lembar sebar"
    ],
    ctaLabel: "Pilih Paket 20 Proyek",
    ctaHref: "/dashboard",
    ctaVariant: "primary"
  }
];

export function PricingSection() {
  const [accountMode, setAccountMode] = useState<AccountMode>("umkm");

  return (
    <section
      id="paket"
      className="py-24 md:py-32 bg-white relative overflow-hidden border-b border-zinc-200"
    >
      {/* Decorative Floating Wings */}
      <div className="absolute left-0 top-1/3 -translate-y-1/2 w-28 sm:w-44 md:w-56 h-auto pointer-events-none select-none z-0 opacity-40 animate-float-slow">
        <Image
          src="/images/shapes/shape_alur_left.svg"
          alt="Clara Shape Left"
          width={400}
          height={700}
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="absolute right-0 top-2/3 -translate-y-1/2 w-28 sm:w-44 md:w-56 h-auto pointer-events-none select-none z-0 opacity-40 animate-float-reverse">
        <Image
          src="/images/shapes/shape_alur_right.svg"
          alt="Clara Shape Right"
          width={400}
          height={700}
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Singkat & Padat */}
        <div className="max-w-3xl mx-auto text-center mb-12 reveal-on-scroll">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider font-heading">
              Paket &amp; Harga Fair Quota
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-zinc-950 tracking-tight">
            Bayar Per Proyek,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-600 to-red-700">
              Bukan Langganan Hangus
            </span>
          </h2>
        </div>

        {/* 3 Core Value Pillars (Fair Usage Guarantees) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          {/* Pillar 1 */}
          <div className="bg-gradient-to-br from-zinc-50 to-orange-50/30 rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-zinc-950 text-base mb-1">
                Approve Dulu, Baru Potong Kuota
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Bebas unggah, coba ekstraksi AI, dan revisi draft berkali-kali. Kuota hanya berkurang saat Anda resmi menekan tombol <strong>Kunci Baseline V1</strong>.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-gradient-to-br from-zinc-50 to-orange-50/30 rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-orange-600/10 text-orange-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-zinc-950 text-base mb-1">
                Tanpa Batas Waktu Proyek
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Proyek memakan waktu 3 bulan, 6 bulan, atau 1 tahun? Tidak ada kuota hangus bulanan. Sistem mengawal proyek sampai seluruh termin penagihan lunas.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-gradient-to-br from-zinc-50 to-orange-50/30 rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-zinc-900/10 text-zinc-900 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-zinc-950 text-base mb-1">
                100% Fitur Lengkap Terbuka
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Tidak ada fitur yang disunat. Baik akun UMKM maupun Industri, semuanya menikmati AI Vision OCR, Rekonsiliasi 4 Pilar, Adendum Studio, hingga Ekspor Audit.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Account Tier Switcher */}
        <div className="max-w-3xl mx-auto mb-16 bg-zinc-100/80 p-2 sm:p-2.5 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={() => setAccountMode("umkm")}
            className={`w-full sm:w-1/2 py-3.5 px-4 rounded-xl font-heading font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
              accountMode === "umkm"
                ? "bg-white text-zinc-950 shadow-md border border-zinc-200/60"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-white/50"
            }`}
          >
            <User className={`w-4 h-4 ${accountMode === "umkm" ? "text-red-600" : "text-zinc-500"}`} />
            <span>Mode UMKM (Solo Boss)</span>
            <span className="text-[10px] uppercase font-heading px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
              Kendali Penuh
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAccountMode("industri")}
            className={`w-full sm:w-1/2 py-3.5 px-4 rounded-xl font-heading font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
              accountMode === "industri"
                ? "bg-white text-zinc-950 shadow-md border border-zinc-200/60"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-white/50"
            }`}
          >
            <Users className={`w-4 h-4 ${accountMode === "industri" ? "text-red-600" : "text-zinc-500"}`} />
            <span>Mode Industri (Multi-Tier Team)</span>
            <span className="text-[10px] uppercase font-heading px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-bold">
              Governance
            </span>
          </button>
        </div>

        {/* Dynamic Mode Explanatory Card */}
        <div className="max-w-4xl mx-auto mb-16 bg-zinc-50 rounded-2xl border border-zinc-200 p-6 sm:p-7 shadow-xs">
          {accountMode === "umkm" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-red-600 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Karakteristik Mode UMKM · Solo Boss</span>
                </div>
                <h4 className="text-lg font-heading font-bold text-zinc-950">
                  Satu Akun Kendali Penuh Tanpa Rantai Birokrasi
                </h4>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Didesain untuk Founder, Freelance Consultant, dan Agensi Mandiri. Anda memegang peran &quot;Si Bos&quot; langsung: upload kontrak, setujui baseline secara mandiri, input progres pekerjaan, dan klaim penagihan secara lincah tanpa approval bertingkat.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-zinc-200 pt-4 md:pt-0 md:pl-6 text-xs text-zinc-700">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Persetujuan 1-Klik tanpa birokrasi</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Proteksi margin laba otomatis</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Siap pakai dalam 2 menit</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-zinc-700 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Karakteristik Mode Industri · Multi-Tier Team Governance</span>
                </div>
                <h4 className="text-lg font-heading font-bold text-zinc-950">
                  Struktur Persetujuan Bertingkat &amp; Audit Trail Kepatuhan
                </h4>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Didesain untuk Korporasi, Kontraktor Umum, dan Multi-Divisi. Dilengkapi alur verifikasi hierarkis: Project Manager memvalidasi fisik, Finance merekonsiliasi RAB &amp; Faktur, dan Direktur/C-Level mengesahkan baseline resmi dengan log pertanggungjawaban terenkripsi.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-zinc-200 pt-4 md:pt-0 md:pl-6 text-xs text-zinc-700">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hierarki 3 Level (PM, Finance, Board)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Audit Trail &amp; Rekam Jejak Kepatuhan</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kontrol Otorisasi Addendum Ketat</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid (4 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-20">
          {packages.map((pkg) => {
            const isHighlight = pkg.isPopular;

            return (
              <div
                key={pkg.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative ${
                  isHighlight
                    ? "bg-white border-2 border-red-600 shadow-xl shadow-red-600/10 ring-4 ring-red-600/5 -translate-y-1 lg:-translate-y-2"
                    : "bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg"
                }`}
              >
                {/* Popular Pill */}
                {pkg.badge && (
                  <div className="mb-4">
                    <span
                      className={`inline-block text-xs font-heading font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        isHighlight
                          ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Title & Quota */}
                  <div className="mb-3">
                    <h3 className="font-heading font-extrabold text-xl text-zinc-950">
                      {pkg.name}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{pkg.quotaCount}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4 pb-4 border-b border-zinc-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-heading font-extrabold text-zinc-950">
                        {pkg.priceDisplay}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-medium">
                      {pkg.priceSub}
                    </p>
                    <p className="text-xs font-bold text-orange-600 mt-0.5">
                      {pkg.perProjectNote}
                    </p>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-zinc-600 leading-relaxed mb-6">
                    {pkg.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-8">
                    <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-heading">
                      Cakupan Fitur &amp; Jaminan:
                    </p>
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-600">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <Link
                    href={pkg.ctaHref}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-heading font-bold text-xs transition-all text-center ${
                      pkg.ctaVariant === "primary"
                        ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg"
                        : pkg.ctaVariant === "trial"
                        ? "bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm"
                        : pkg.ctaVariant === "secondary"
                        ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                        : "border border-zinc-300 hover:border-zinc-950 text-zinc-800 hover:text-zinc-950"
                    }`}
                  >
                    <span>{pkg.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
