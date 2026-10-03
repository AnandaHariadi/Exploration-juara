import { AlertTriangle, Clock, Frown, FileSpreadsheet } from "lucide-react";

export function PainPointsSection() {
  const problems = [
    {
      title: "Rasa Sungkan Saat Menagih",
      desc: "Merasa canggung setiap kali harus mengirim pesan pengingat pelunasan ke klien, khawatir dianggap tidak sabar atau merusak hubungan kerja.",
      icon: Frown,
    },
    {
      title: "Uang Muka Habis, Pelunasan Tertunda",
      desc: "Uang muka 30% telah habis untuk kebutuhan operasional pengerjaan, namun pelunasan 70% tertunda berlarut-larut karena menunggu approval internal.",
      icon: Clock,
    },
    {
      title: "Pergantian Kepengurusan Organisasi",
      desc: "Pengerjaan proyek digital untuk organisasi mahasiswa sering terhambat pencairannya saat terjadi suksesi kepengurusan di akhir periode.",
      icon: AlertTriangle,
    },
    {
      title: "Pencatatan Tercecer Tanpa Sistem",
      desc: "Software akuntansi korporat terlalu rumit dan mahal untuk kebutuhan solopreneur, sehingga riwayat tagihan hanya mengandalkan catatan ponsel.",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <section id="penyakit" className="py-20 bg-slate-50/50 border-t border-zinc-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Header Gaya Aitoma */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="inline-block bg-zinc-900 text-white px-5 py-1.5 rounded-full text-xs font-semibold mb-5 shadow-xs">
              Latar Belakang Masalah
            </div>

            <h2 className="text-3xl sm:text-4xl font-heading font-black text-zinc-950 leading-tight mb-4 tracking-tight">
              Tantangan Finansial,
              <br />
              Pekerja Lepas
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
              Fokus utama freelancer adalah menghasilkan karya terbaik. Namun kendala penagihan dan pembukuan sering kali menguras waktu dan mengganggu kelancaran arus kas.
            </p>
          </div>

          {/* List Poin Gaya Aitoma */}
          <div className="lg:col-span-7 space-y-6">
            {problems.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="shrink-0 pt-0.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 shadow-xs">
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
