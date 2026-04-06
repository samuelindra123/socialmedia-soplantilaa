"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Scale, 
  FileSignature, 
  UserCheck, 
  AlertTriangle, 
  Gavel, 
  Ban,
  ScrollText,
  HeartHandshake
} from "lucide-react";

export default function TermsPage() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 selection:bg-slate-900 selection:text-white font-sans">
        
        {/* --- HERO SECTION --- */}
        <div className="max-w-5xl mx-auto px-6 mb-16">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                    <Scale className="w-3 h-3" />
                    Legal Center
                 </div>
                 <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4">
                    Syarat & Ketentuan
                 </h1>
                 <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                    Aturan main penggunaan platform Renunganku. Membangun komunitas yang sehat membutuhkan <span className="text-slate-900 font-semibold">kesepakatan bersama</span>.
                 </p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Effective Date</p>
                 <p className="text-sm font-bold text-slate-900">29 November 2025</p>
              </div>
           </div>
        </div>

        {/* --- TERMS AT A GLANCE (Visual Summary) --- */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
           <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Prinsip Utama (The Spirit of Law)</h3>
           <div className="grid md:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                 <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4 text-amber-600">
                    <HeartHandshake className="w-5 h-5" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2">Kode Etik Komunitas</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                    Kami tidak mentolerir ujaran kebencian, pelecehan, atau konten berbahaya. Jadilah manusia yang baik.
                 </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                 <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                    <FileSignature className="w-5 h-5" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2">Hak Kekayaan Intelektual</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                    Tulisan Anda adalah milik Anda. Anda memberi kami lisensi untuk menampilkannya, tapi hak cipta tetap di tangan Anda.
                 </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                 <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center mb-4 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2">Bukan Nasihat Medis</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                    Renunganku adalah alat refleksi, bukan pengganti psikolog atau psikiater profesional.
                 </p>
              </div>

           </div>
        </section>

        {/* --- MAIN CONTENT (Split Layout) --- */}
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-12 gap-12">
           
           {/* LEFT: Sticky Navigation */}
           <aside className="hidden md:block md:col-span-3 lg:col-span-3">
              <nav className="sticky top-32 space-y-1">
                 {[
                    { id: "#acceptance", label: "1. Penerimaan Syarat" },
                    { id: "#accounts", label: "2. Akun & Keamanan" },
                    { id: "#content", label: "3. Konten Pengguna" },
                    { id: "#conduct", label: "4. Perilaku Terlarang" },
                    { id: "#disclaimer", label: "5. Penafian Penting" },
                    { id: "#termination", label: "6. Penghentian" },
                    { id: "#governing", label: "7. Hukum Berlaku" },
                 ].map((item) => (
                    <a 
                       key={item.id} 
                       href={item.id} 
                       className="block px-3 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                       {item.label}
                    </a>
                 ))}
              </nav>
           </aside>

           {/* RIGHT: Legal Text */}
           <div className="md:col-span-9 lg:col-span-9 space-y-16 text-slate-700 leading-relaxed">
              
              {/* Section 1 */}
              <section id="acceptance" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-slate-300">01.</span> Penerimaan Syarat
                 </h2>
                 <p className="mb-4">
                    Dengan mendaftar, mengakses, atau menggunakan layanan Renunganku, Anda setuju untuk terikat oleh Syarat & Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diperkenankan menggunakan layanan kami.
                 </p>
                 <div className="bg-slate-50 border-l-4 border-slate-900 p-4">
                    <p className="text-sm text-slate-600 italic">
                       "Layanan" mencakup situs web, aplikasi mobile, dan semua fitur terkait yang dioperasikan oleh Renunganku.
                    </p>
                 </div>
              </section>

              {/* Section 2 */}
              <section id="accounts" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-slate-300">02.</span> Akun & Keamanan
                 </h2>
                 <ul className="list-disc pl-5 space-y-2">
                    <li>Anda harus berusia minimal 13 tahun (atau batas usia legal di negara Anda) untuk menggunakan layanan ini.</li>
                    <li>Anda bertanggung jawab penuh atas keamanan kata sandi dan aktivitas akun Anda.</li>
                    <li>Kami berhak menangguhkan akun dengan nama pengguna (username) yang menyinggung, melanggar merek dagang, atau meniru orang lain.</li>
                 </ul>
              </section>

              {/* Section 3 */}
              <section id="content" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-slate-300">03.</span> Konten Pengguna
                 </h2>
                 <p className="mb-4">
                    Anda memegang hak kepemilikan penuh atas konten yang Anda tulis. Namun, dengan memposting konten publik (seperti di Community Circles), Anda memberikan kami lisensi non-eksklusif, bebas royalti, untuk menampilkan, mendistribusikan, dan memformat konten tersebut di dalam platform.
                 </p>
                 <p className="mb-4 font-medium text-slate-900">
                    Untuk konten Jurnal Pribadi (Private Journal), kami tidak memiliki hak akses, membaca, atau mendistribusikan konten tersebut sama sekali.
                 </p>
              </section>

              {/* Section 4 */}
              <section id="conduct" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-slate-300">04.</span> Perilaku Terlarang
                 </h2>
                 <p className="mb-4">Anda setuju untuk TIDAK:</p>
                 <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                       <Ban className="w-5 h-5 text-rose-600 mt-0.5" />
                       <span className="text-sm text-rose-900">Menggunakan layanan untuk tujuan ilegal atau melanggar hukum.</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                       <Ban className="w-5 h-5 text-rose-600 mt-0.5" />
                       <span className="text-sm text-rose-900">Melakukan scraping data atau mengakses API secara tidak sah.</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                       <Ban className="w-5 h-5 text-rose-600 mt-0.5" />
                       <span className="text-sm text-rose-900">Menyebarkan malware, virus, atau kode perusak.</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                       <Ban className="w-5 h-5 text-rose-600 mt-0.5" />
                       <span className="text-sm text-rose-900">Melakukan pelecehan (bullying) terhadap pengguna lain.</span>
                    </div>
                 </div>
              </section>

              {/* Section 5 - CRITICAL FOR MENTAL HEALTH APP */}
              <section id="disclaimer" className="scroll-mt-32">
                 <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-4 text-amber-700">
                       <AlertTriangle className="w-6 h-6" />
                       <h2 className="text-xl font-bold">05. Penafian Medis (Medical Disclaimer)</h2>
                    </div>
                    <div className="text-amber-900 text-sm leading-relaxed space-y-3">
                       <p>
                          Renunganku adalah platform untuk pencatatan pribadi, refleksi diri, dan dukungan komunitas sebaya (peer-support). 
                       </p>
                       <p className="font-bold">
                          KAMI BUKAN PENYEDIA LAYANAN KESEHATAN, DAN LAYANAN KAMI BUKAN PENGGANTI SARAN MEDIS, DIAGNOSIS, ATAU PERAWATAN PROFESIONAL.
                       </p>
                       <p>
                          Jangan pernah mengabaikan nasihat medis profesional atau menunda mencarinya karena sesuatu yang Anda baca di platform ini. Jika Anda berpikir Anda mungkin mengalami keadaan darurat medis atau kesehatan mental, segera hubungi dokter atau layanan darurat setempat.
                       </p>
                    </div>
                 </div>
              </section>

              {/* Section 6 */}
              <section id="termination" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-slate-300">06.</span> Penghentian
                 </h2>
                 <p className="mb-4">
                    Kami dapat menghentikan atau menangguhkan akses Anda segera, tanpa pemberitahuan sebelumnya, jika Anda melanggar Ketentuan ini. Setelah penghentian, hak Anda untuk menggunakan Layanan akan segera berakhir.
                 </p>
              </section>

              {/* Section 7 */}
              <section id="governing" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-slate-300">07.</span> Hukum yang Berlaku
                 </h2>
                 <p className="mb-6">
                    Syarat & Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan di yurisdiksi pengadilan berikut:
                 </p>
                 
                 <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm w-fit">
                    <Gavel className="w-5 h-5 text-slate-400" />
                    <div>
                       <div className="text-sm font-bold text-slate-900">Pengadilan Negeri Malang</div>
                       <div className="text-xs text-slate-500">Jawa Timur, Indonesia</div>
                    </div>
                 </div>
              </section>

           </div>
        </div>

      </main>
      <Footer />
    </>
  );
}