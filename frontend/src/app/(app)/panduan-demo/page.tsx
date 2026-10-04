import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const cases = [
  {
    name: 'Kesepakatan saja',
    input: 'PKS, SPK, SOW, atau MoU yang memuat ketentuan pekerjaan atau keuangan.',
    visible: 'Nilai, tenggat, batas revisi, ruang lingkup, dan hak tagih hanya jika tertulis dalam kesepakatan.',
    missing: 'Selisih biaya terhadap RAB dan laba rencana belum tersedia.',
    next: 'Tambahkan RAB di Acuan proyek untuk membuat versi berikutnya.',
  },
  {
    name: 'RAB saja',
    input: 'CSV atau Excel berisi pekerjaan atau kategori serta jumlah rencana biaya.',
    visible: 'Rencana biaya dapat dibandingkan dengan biaya yang benar-benar dicatat.',
    missing: 'Nilai kesepakatan, laba rencana, dan hak tagih belum tersedia.',
    next: 'Tambahkan kesepakatan di Acuan proyek untuk membuat versi berikutnya.',
  },
  {
    name: 'Kesepakatan + RAB',
    input: 'Kedua berkas tersedia sejak awal.',
    visible: 'Pantau ketentuan pekerjaan, biaya, hak tagih, invoice, dan pembayaran.',
    missing: 'Pemeriksaan tetap bergantung pada isi yang benar-benar ada di dokumen.',
    next: 'Lanjutkan ke pemantauan dan, bila perlu, permintaan perubahan.',
  },
] as const;

const activities = [
  ['Budi', 'Pemantauan', 'Catat progres, tahap yang syaratnya terpenuhi, revisi, atau pekerjaan tambahan.', 'Kejadian tersimpan. Progres umum tidak otomatis membuat hak tagih.'],
  ['Siti', 'Keuangan', 'Catat biaya aktual, buat invoice untuk tahap yang siap ditagih, lalu catat pembayaran.', 'Rencana biaya, biaya aktual, tagihan, dan uang masuk tetap terpisah.'],
  ['Sistem', 'Peringatan', 'Bandingkan catatan dengan acuan aktif dan tampilkan bukti.', 'Temuan dapat berupa selisih terverifikasi atau hal yang perlu ditinjau.'],
] as const;

const approvals = [
  ['Draf', 'Budi', 'Isi pekerjaan, nilai, revisi, atau tambahan waktu; periksa saran AI jika ada.', 'Acuan tetap berlaku.'],
  ['Diajukan', 'Budi', 'Ajukan permintaan ke keuangan.', 'Menunggu Siti.'],
  ['Ditinjau keuangan', 'Siti', 'Periksa angka dan dampak biaya, lalu teruskan.', 'Menunggu Hendra.'],
  ['Keputusan internal', 'Hendra', 'Setujui atau tolak dengan alasan.', 'Jika setuju, acuan belum berubah. Jika ditolak, Budi dapat merevisi dan mengajukan ulang.'],
  ['Persetujuan klien', 'Budi', 'Catat bukti persetujuan atau penolakan klien.', 'Jika klien setuju, acuan baru aktif dan versi lama masuk riwayat. Jika menolak, acuan lama tetap aktif dan Budi dapat mengajukan ulang.'],
] as const;

const panel = 'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7';
const th = 'border-b border-r border-zinc-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 last:border-r-0';
const td = 'border-b border-r border-zinc-200 px-4 py-3 align-top text-sm text-zinc-700 last:border-r-0';

export default function PanduanDemoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-14">
      <header className={panel}>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Panduan demo</p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Dari dokumen sampai keputusan</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">CLARA membaca kesepakatan, menghitung dari data yang tersedia, dan menunggu keputusan manusia. Ikuti urutan ini untuk mencoba tiga kondisi awal proyek dan alur persetujuan perubahan.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Mulai proyek baru <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/projects" className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">Buka proyek yang ada</Link>
        </div>
      </header>

      <nav aria-label="Isi panduan" className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-sm font-semibold text-red-700">
        <a href="#pilih-dokumen" className="hover:underline">1. Pilih dokumen</a>
        <a href="#setujui-acuan" className="hover:underline">2. Setujui acuan</a>
        <a href="#pantau" className="hover:underline">3. Pantau proyek</a>
        <a href="#perubahan" className="hover:underline">4. Putuskan perubahan</a>
        <a href="#contoh" className="hover:underline">5. Contoh angka</a>
      </nav>

      <section id="pilih-dokumen" className={`${panel} scroll-mt-28`}>
        <h2 className="font-heading text-xl font-bold text-zinc-950">1. Mulai sebagai Budi dan pilih dokumen</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700">Di <strong>Proyek baru</strong>, isi nama proyek dan klien. Pilih jenis dokumen yang tersedia, lalu unggah berkas, gunakan berkas contoh, atau isi manual. Proyek dimulai sebagai draf.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-zinc-50"><tr><th className={th}>Pilihan</th><th className={th}>Masukan</th><th className={th}>Yang bisa diperiksa</th><th className={th}>Yang menunggu data</th></tr></thead>
            <tbody>{cases.map((item) => <tr key={item.name} className="last:[&>td]:border-b-0"><td className={`${td} font-semibold text-zinc-900`}>{item.name}</td><td className={td}>{item.input}</td><td className={td}>{item.visible}</td><td className={td}>{item.missing}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">Kesepakatan dibaca layanan AI jika tersedia. RAB dihitung parser sistem tanpa AI. Hasil bacanya masih berupa usulan sampai Budi meninjaunya.</p>
      </section>

      <section id="setujui-acuan" className={`${panel} scroll-mt-28`}>
        <h2 className="font-heading text-xl font-bold text-zinc-950">2. Tinjau hasil, lalu setujui acuan</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-zinc-700">
          <li>Buka proyek dan periksa hasil di <strong>Acuan proyek</strong>: nilai, tanggal, ruang lingkup, batas revisi, syarat tagih, dan item RAB yang tersedia. Buka kutipan dokumen untuk memeriksa sumbernya.</li>
          <li>Perbaiki hasil yang keliru atau isi data yang belum terbaca. Jika AI gagal pada berkas contoh, pilih <strong>Muat data contoh (tanpa AI)</strong>. Untuk berkas sendiri, gunakan isian manual. Jangan menyetujui angka yang belum diperiksa.</li>
          <li>Klik <strong>Setujui sebagai acuan V1</strong>. Baru setelah itu sistem membandingkan kegiatan proyek dengan acuan tersebut.</li>
          <li>Jika V1 hanya memiliki satu jenis dokumen, tambahkan dokumen yang belum ada lewat <strong>Acuan proyek</strong>. Periksa hasilnya dan setujui versi berikutnya. V1 tetap ada di riwayat; catatan progres dan biaya tidak hilang.</li>
        </ol>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {cases.map((item) => <div key={item.name} className="rounded-xl border border-zinc-200 p-4 text-sm"><p className="font-semibold text-zinc-900">{item.name}</p><p className="mt-2 text-zinc-600">{item.next}</p></div>)}
        </div>
      </section>

      <section id="pantau" className={`${panel} scroll-mt-28`}>
        <h2 className="font-heading text-xl font-bold text-zinc-950">3. Catat yang terjadi dan periksa peringatan</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="bg-zinc-50"><tr><th className={th}>Siapa</th><th className={th}>Halaman</th><th className={th}>Tindakan</th><th className={th}>Hasil</th></tr></thead>
            <tbody>{activities.map(([who, where, action, result]) => <tr key={who} className="last:[&>td]:border-b-0"><td className={`${td} font-semibold text-zinc-900`}>{who}</td><td className={td}>{where}</td><td className={td}>{action}</td><td className={td}>{result}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-700">Buka <strong>Lihat bukti</strong> pada peringatan sebelum bertindak. RAB adalah rencana, biaya aktual adalah pengeluaran yang dicatat, hak tagih adalah nilai tahap yang syaratnya terpenuhi, dan pembayaran adalah uang yang sudah diterima. Peringatan atas nilai yang belum ditagih atau potensi denda bukan kerugian aktual.</p>
      </section>

      <section id="perubahan" className={`${panel} scroll-mt-28`}>
        <h2 className="font-heading text-xl font-bold text-zinc-950">4. Ajukan dan putuskan perubahan</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700">Alur ini tersedia bila nilai kesepakatan, tenggat, dan batas revisi sudah disetujui. Pilih pengguna demo dari profil di header saat berpindah peran.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-zinc-50"><tr><th className={th}>Tahap</th><th className={th}>Pelaku demo</th><th className={th}>Tindakan</th><th className={th}>Pengaruh pada acuan</th></tr></thead>
            <tbody>{approvals.map(([stage, actor, action, result]) => <tr key={stage} className="last:[&>td]:border-b-0"><td className={`${td} font-semibold text-zinc-900`}>{stage}</td><td className={td}>{actor}</td><td className={td}>{action}</td><td className={td}>{result}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Ada dua cara versi acuan bertambah: melengkapi dokumen yang belum ada dan meresmikan permintaan perubahan. Keduanya menyimpan versi lama. Persetujuan Hendra saja belum meresmikan perubahan; persetujuan klien tetap harus dicatat.</p>
        <p className="mt-3 text-sm leading-6 text-zinc-700">Jika Hendra atau klien menolak, Budi dapat mengubah permintaan dan mengajukannya lagi. Tinjauan Siti dan keputusan Hendra diulang untuk pengajuan baru itu.</p>
      </section>

      <section id="contoh" className={`${panel} scroll-mt-28`}>
        <h2 className="font-heading text-xl font-bold text-zinc-950">5. Contoh presentasi dengan angka</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          <li>Gunakan contoh <strong>Kesepakatan + RAB</strong>: nilai Rp120.000.000, RAB Rp75.000.000, tiga revisi termasuk kesepakatan, dan tahap UAT sebesar 25%.</li>
          <li>Catat UAT selesai tanpa invoice. Sistem menunjukkan Rp30.000.000 siap ditagih tetapi belum dibuatkan tagihan.</li>
          <li>Catat lima revisi. Dua revisi melebihi acuan; tarif Rp2.000.000 per revisi menunjukkan nilai usulan Rp4.000.000. Catat biaya aktual Rp64.000.000 untuk melihat pemakaian RAB sekitar 85,3%.</li>
          <li>Budi ajukan tambahan dua revisi, Rp4.000.000, dan lima hari. Siti tinjau dampak; Hendra setujui internal; Budi catat persetujuan klien.</li>
          <li>Periksa acuan baru: nilai Rp124.000.000, batas lima revisi, dan tenggat mundur lima hari. Riwayat V1 serta peringatan yang masih relevan tetap dapat dibuka.</li>
        </ol>
        <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">Mode demo tidak memakai login produksi. Peran disimpan per browser, sedangkan proyek dan reset data masih dipakai bersama. Tombol reset mengubah data semua pengunjung; gunakan saat memulai presentasi yang memang ingin kembali ke kondisi awal.</div>
      </section>
    </div>
  );
}
