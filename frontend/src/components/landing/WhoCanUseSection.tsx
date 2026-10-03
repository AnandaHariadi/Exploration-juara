import { Code, Palette, GraduationCap, Building2 } from "lucide-react";

export function WhoCanUseSection() {
  const segments = [
    {
      role: "Developer & IT Talents",
      desc: "Web developer, mobile engineer, dan devops independen yang membutuhkan invoice termin milestone pengerjaan.",
      icon: Code,
    },
    {
      role: "Desainer & Kreatif",
      desc: "UI/UX designer, video editor, dan ilustrator yang sering terkendala penagihan pelunasan karya visual.",
      icon: Palette,
    },
    {
      role: "Komunitas & Organisasi Kampus",
      desc: "Bendahara kepanitiaan dan ormawa yang membutuhkan pencatatan tagihan cepat dengan pembayaran QRIS instan.",
      icon: GraduationCap,
    },
    {
      role: "Agensi & Startup B2B",
      desc: "Startup, studio pengembang, dan CV yang memerlukan dokumen tagihan resmi berstandar korporasi.",
      icon: Building2,
    },
  ];

  return (
    <section className="py-20 bg-zinc-50/50 border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <div className="bg-red-600 text-white font-heading font-black text-sm sm:text-base px-6 py-2.5 rounded-r-xl shadow-xs uppercase tracking-wider">
            PROFIL PENGGUNA
          </div>
          <div className="flex-1 h-0.5 bg-zinc-200 ml-4" />
        </div>

        <div className="max-w-2xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 uppercase tracking-tight mb-3">
            Siapa yang Menggunakan Tagih.ai?
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
            Dirancang khusus untuk ekosistem kerja independen di Indonesia, dari pengerjaan proyek kampus hingga kolaborasi industri.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {segments.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between shadow-xs hover:border-red-400 transition-colors"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-zinc-950 mb-2">
                    {item.role}
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
