"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Minus } from "lucide-react";

interface FaqItem {
  id: string;
  number: string;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    id: "q1",
    number: "01",
    question: "Apakah mitra klien harus membuat akun untuk menyelesaikan pembayaran?",
    answer: "Sama sekali tidak. Mitra kerja Anda (baik bendahara kepanitiaan ormawa maupun departemen finance korporat) cukup mengakses tautan invoice resmi yang dikirimkan. Di halaman tersebut, mitra dapat langsung memindai QRIS via m-Banking/e-wallet atau menyalin nomor Virtual Account tanpa registrasi apa pun."
  },
  {
    id: "q2",
    number: "02",
    question: "Bagaimana jika sistem salah mengidentifikasi nominal proyek atau nama mitra?",
    answer: "YUPIENS menerapkan standar pengesahan mandiri (Human-in-the-loop) yang ketat. Sebelum lembar tagihan resmi diterbitkan atau dikirimkan ke mitra kerja, sistem selalu menampilkan peninjauan draft terlebih dahulu. Anda memegang kendali penuh 100% untuk mengoreksi nama, nilai kontrak, maupun persentase uang muka (DP)."
  },
  {
    id: "q3",
    number: "03",
    question: "Metode pembayaran apa saja yang didukung oleh sistem?",
    answer: "Sistem terhubung langsung dengan payment gateway berlisensi resmi Bank Indonesia melalui Xendit. Mendukung pembayaran QRIS dinamis seluruh bank & e-wallet nasional (BCA, Mandiri, BNI, BRI, GoPay, OVO, ShopeePay, DANA) serta rekening Virtual Account perbankan terkemuka di Indonesia."
  },
  {
    id: "q4",
    number: "04",
    question: "Bagaimana mekanisme pengingat otomatis (auto-reminder) dijalankan?",
    answer: "Sistem menjadwalkan notifikasi penagihan bertahap menjelang tanggal jatuh tempo secara terjadwal. Tata bahasa pengingat disesuaikan secara diplomatis dan santun sesuai kategori mitra, menjaga profesionalitas relasi bisnis tanpa menimbulkan rasa canggung."
  },
  {
    id: "q5",
    number: "05",
    question: "Apakah dokumen invoice dapat diunduh dalam format PDF komersial resmi?",
    answer: "Ya. Setiap lembar invoice publik dilengkapi dengan fitur cetak dan unduh dokumen PDF resmi berstandar komersial yang siap diarsipkan untuk keperluan pembukuan internal maupun lampiran audit pertanggungjawaban mitra."
  }
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string>("q1");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? "" : id));
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-white border-b border-zinc-200 relative overflow-hidden">
      {/* Left Flank: Shield Crest Dynamic Ribbon */}
      <div className="absolute left-0 sm:left-2 lg:left-4 xl:left-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-60 sm:opacity-70 transition-opacity">
        <Image
          src="/images/shapes/shape_faq_left.svg"
          alt="Yupiens Shield Crest Left"
          width={450}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Right Flank: Slender Serpentine Tapered Ribbon */}
      <div className="absolute right-0 sm:right-2 lg:right-4 xl:right-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-60 sm:opacity-70 transition-opacity">
        <Image
          src="/images/shapes/shape_faq_right.svg"
          alt="Yupiens Serpentine Ribbon Right"
          width={450}
          height={850}
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Sticky Editorial Heading & Support Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[2px] bg-red-600 inline-block" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                Pusat Informasi &amp; Bantuan
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-zinc-950 tracking-tight mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-base text-zinc-600 leading-relaxed font-normal mb-8">
              Informasi mendasar seputar tata cara penagihan, keamanan transaksi, dan integrasi pembayaran resmi YUPIENS.
            </p>

            {/* Direct Consultation Card */}
            <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-6 sm:p-8">
              <span className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                Simulasi Sistem
              </span>
              <h4 className="font-heading font-bold text-base text-zinc-950 mb-2">
                Ingin langsung mencoba alur kerja?
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                Masukkan instruksi penagihan perdana Anda di dashboard dan amati bagaimana sistem mengonversi teks percakapan menjadi dokumen komersial resmi.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-5 py-2.5 rounded-lg transition-colors"
              >
                <span>Akses Dashboard Mandiri</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Clean Spacious Accordion List */}
          <div className="lg:col-span-7 divide-y divide-zinc-200 border-t border-b border-zinc-200">
            {faqs.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="py-6 transition-colors">
                  <button
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-start justify-between text-left gap-4 focus:outline-none group"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono font-bold text-xs text-red-600 shrink-0 mt-1">
                        {item.number}
                      </span>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-zinc-900 group-hover:text-red-600 transition-colors">
                        {item.question}
                      </h3>
                    </div>
                    <div className="w-7 h-7 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover:border-red-600 group-hover:text-red-600 shrink-0 mt-0.5 transition-colors">
                      {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pt-4 pl-8 sm:pl-9 pr-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
