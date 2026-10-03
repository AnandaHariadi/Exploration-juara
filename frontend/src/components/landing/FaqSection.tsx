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
    question: "Apa perbedaan CLARA dengan Contract Management biasa atau Project Tracker?",
    answer: "CLARA bukan sekadar tempat menyimpan PDF atau to-do list tugas. CLARA adalah platform Contract Intelligence rekonsiliasi yang secara deterministik menghubungkan 4 pilar data: Kontrak (apa yang disepakati), RAB (apa yang direncanakan), Progress Lapangan (apa yang terjadi), dan Invoice (apa yang direalisasikan). Sistem secara proaktif mendeteksi mismatch, scope creep, dan unbilled revenue yang kerap lolos dari pengawasan tim."
  },
  {
    id: "q2",
    number: "02",
    question: "Dokumen apa saja yang dapat diunggah dan dianalisis di CLARA?",
    answer: "CLARA mendukung dokumen Perjanjian Kerja Sama (PKS), Surat Perintah Kerja (SPK), Scope of Work (SOW), Kontrak Payung, MoU operasional, addendum, serta file Rencana Anggaran Biaya (RAB) / Quotation dalam format PDF, gambar dokumen, maupun lembar sebar."
  },
  {
    id: "q3",
    number: "03",
    question: "Bagaimana cara kerja prinsip 'Human Confirms the Truth' di CLARA?",
    answer: "CLARA memegang prinsip: AI understands language, backend calculates facts, frontend explains the state, dan human confirms the truth. Hasil ekstraksi AI tidak langsung dijadikan kebenaran mutlak; Project Owner atau Finance selalu diberi ruang verifikasi untuk mengonfirmasi data sebelum Baseline V1 resmi dikunci sebagai standar kebenaran proyek."
  },
  {
    id: "q4",
    number: "04",
    question: "Bagaimana CLARA mendeteksi Scope Creep dan Unbilled Revenue?",
    answer: "Engine deterministik CLARA secara berkala membandingkan deliverable aktual di lapangan dengan daftar ruang lingkup pada baseline. Bila ada task tambahan di luar kesepakatan, sistem memicu alert Scope Variance. Bila ada milestone yang sudah berstatus selesai namun belum ada invoice terkait, sistem memicu alert Unbilled Revenue agar penagihan segera diterbitkan."
  },
  {
    id: "q5",
    number: "05",
    question: "Bagaimana jika ada addendum atau perubahan kontrak di tengah jalan?",
    answer: "CLARA menyediakan fitur Change Request & Baseline Versioning. Setiap addendum atau perubahan resmi yang disetujui akan menaikkan versi baseline proyek (menjadi Baseline V2, V3, dst.) secara transparan dengan jejak audit lengkap, sehingga riwayat perubahan nilai kontrak dan alokasi RAB tetap terdokumentasi akuntabel."
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
      <div className="absolute left-0 sm:left-2 lg:left-4 xl:left-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-60 sm:opacity-70 transition-opacity animate-float-slow">
        <Image
          src="/images/shapes/shape_faq_left.svg"
          alt="Clara Shield Crest Left"
          width={450}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Right Flank: Slender Serpentine Tapered Ribbon */}
      <div className="absolute right-0 sm:right-2 lg:right-4 xl:right-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-60 sm:opacity-70 transition-opacity animate-float-reverse">
        <Image
          src="/images/shapes/shape_faq_right.svg"
          alt="Clara Serpentine Ribbon Right"
          width={450}
          height={850}
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Sticky Editorial Heading & Support Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 reveal-left">
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
              Informasi mendasar seputar intelijen kontrak, pencegahan risiko klausul, dan rekonsiliasi finansial proyek CLARA.
            </p>

            {/* Direct Consultation Card */}
            <div className="bg-zinc-50 border border-zinc-200/90 hover:border-red-600/40 rounded-2xl p-6 sm:p-8 card-executive-hover reveal-3d">
              <span className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                Simulasi Rekonsiliasi
              </span>
              <h4 className="font-heading font-bold text-base text-zinc-950 mb-2">
                Ingin mencoba rekonsiliasi proyek?
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                Unggah draft kontrak atau file RAB Anda di dashboard dan amati bagaimana engine CLARA membangun baseline deterministik secara otomatis.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-5 py-2.5 rounded-lg transition-colors"
              >
                <span>Akses Dashboard CLARA</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Clean Spacious Accordion List */}
          <div className="lg:col-span-7 divide-y divide-zinc-200 border-t border-b border-zinc-200 reveal-right">
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
