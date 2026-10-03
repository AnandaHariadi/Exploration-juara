import { MessageSquareText, Layers, QrCode, BellRing, ArrowRight } from "lucide-react";
import Link from "next/link";

export function FeaturesSection() {
  const points = [
    {
      title: "AI Chat Parser (Ekstraksi Cepat)",
      desc: "Ubah instruksi percakapan bebas menjadi invoice resmi dengan rincian termin dan nomor dokumen unik dalam hitungan detik tanpa input form rumit.",
      icon: MessageSquareText,
    },
    {
      title: "Smart Milestone Splitter (DP & Pelunasan)",
      desc: "Bagi otomatis skema pembayaran menjadi uang muka (DP 30-50%) dan pelunasan bertahap sesuai progres milestone proyek Anda.",
      icon: Layers,
    },
    {
      title: "Integrasi QRIS & Virtual Account Terpadu",
      desc: "Klien skala komunitas kampus maupun industri korporat dapat langsung scan QRIS atau transfer Virtual Account tanpa perlu kirim bukti struk manual.",
      icon: QrCode,
    },
    {
      title: "Otomasi Pengingat Berjadwal (Anti-Sungkan)",
      desc: "Sistem secara mandiri mengirimkan follow-up terjadwal (H-3, Hari H, hingga H+7) dengan bahasa profesional untuk menjaga kelancaran arus kas Anda.",
      icon: BellRing,
    },
  ];

  return (
    <section id="fitur" className="py-24 bg-white border-t border-zinc-100 relative overflow-hidden">
      {/* Floating 3D Isometric Decorative Cube Element (Kanan Atas) */}
      <div className="absolute top-10 right-8 md:right-16 pointer-events-none opacity-85 hidden xl:block animate-bounce [animation-duration:7s]">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
            <polygon points="50,15 85,32 50,49 15,32" fill="#fb923c" />
            <polygon points="15,32 50,49 50,85 15,68" fill="#ea580c" />
            <polygon points="50,49 85,32 85,68 50,85" fill="#c2410c" />
            {/* Outline icon inside cube */}
            <circle cx="50" cy="38" r="4" fill="white" />
          </svg>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Sisi Kiri: Header Persis Gaya Aitoma */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="inline-block bg-gradient-to-r from-orange-600 to-rose-600 text-white px-5 py-1.5 rounded-full text-xs font-semibold mb-5 shadow-xs">
              Ekosistem Penagihan Terpadu
            </div>

            <h2 className="text-3xl sm:text-4xl font-heading font-black text-zinc-950 leading-tight mb-4 tracking-tight">
              Tiga Komponen,
              <br />
              Satu Solusi Utuh
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed mb-6 font-normal">
              Kami menggabungkan pemrosesan bahasa alami cerdas dengan infrastruktur pembayaran resmi untuk memberikan kepastian pencairan dana bagi setiap pekerjaan Anda.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-heading font-bold text-sm group"
            >
              <span>Jelajahi Dashboard Penagihan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Sisi Kanan: List Poin-Poin Persis Gaya Aitoma */}
          <div className="lg:col-span-7 space-y-7">
            {points.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="shrink-0 pt-0.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-base text-zinc-950 mb-1">
                      {p.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
