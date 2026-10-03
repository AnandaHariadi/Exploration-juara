import { Clock, Zap, ShieldCheck } from "lucide-react";

export function MetricsBanner() {
  const metrics = [
    {
      stat: "< 1 Menit",
      label: "Waktu Penerbitan Invoice",
      desc: "Cukup ketik 1 kalimat santai, rincian termin & QRIS langsung siap kirim.",
      icon: Clock,
    },
    {
      stat: "3x Lebih Cepat",
      label: "Pelunasan Piutang",
      desc: "Klien membayar lebih tepat waktu berkat sistem reminder ramah otomatis.",
      icon: Zap,
    },
    {
      stat: "0% Sungkan",
      label: "Bebas Rasa Gak Enakan",
      desc: "Asisten AI yang mewakili Anda menagih piutang dengan bahasa profesional.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-zinc-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className={`flex flex-col items-center text-center ${idx !== 0 ? "pt-6 md:pt-0 md:pl-6" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-heading font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600 mb-1.5">
                  {item.stat}
                </p>
                <h4 className="font-heading font-bold text-sm sm:text-base text-zinc-900 mb-1">
                  {item.label}
                </h4>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
