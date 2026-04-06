"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Shield, 
  Lock, 
  EyeOff, 
  FileText, 
  Server, 
  Globe,
  CheckCircle2
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 selection:bg-slate-900 selection:text-white font-sans">
        
        {/* --- HERO SECTION --- */}
        <div className="max-w-5xl mx-auto px-6 mb-16">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                    <Shield className="w-3 h-3" />
                    Legal Center
                 </div>
                 <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4">
                    Kebijakan Privasi
                 </h1>
                 <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                    Bagaimana Renunganku mengumpulkan, menggunakan, dan (yang lebih penting) <span className="text-slate-900 font-semibold">melindungi</span> data Anda.
                 </p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Last Updated</p>
                 <p className="text-sm font-bold text-slate-900">29 November 2025</p>
              </div>
           </div>
        </div>

        {/* --- PRIVACY AT A GLANCE (Visual Summary) --- */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
           <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Ringkasan Inti (TL;DR)</h3>
           <div className="grid md:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                 <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                    <EyeOff className="w-5 h-5" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2">Zero Ads, Zero Tracking</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                    Kami tidak menjual data Anda ke pengiklan. Model bisnis kami adalah langganan, bukan eksploitasi atensi.
                 </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                 <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                    <Lock className="w-5 h-5" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2">Enkripsi End-to-End</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                    Jurnal pribadi Anda dienkripsi. Bahkan tim engineering kami tidak bisa membaca isinya.
                 </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                 <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                    <Server className="w-5 h-5" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2">Kepemilikan Penuh</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                    Data Anda milik Anda. Export atau hapus akun kapan saja tanpa dipersulit (No dark patterns).
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
                    { id: "#introduction", label: "1. Pendahuluan" },
                    { id: "#collection", label: "2. Data yang Kami Kumpulkan" },
                    { id: "#usage", label: "3. Penggunaan Data" },
                    { id: "#sharing", label: "4. Berbagi Data" },
                    { id: "#security", label: "5. Keamanan" },
                    { id: "#rights", label: "6. Hak Anda" },
                    { id: "#contact", label: "7. Kontak" },
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
              <section id="introduction" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Pendahuluan</h2>
                 <p className="mb-4">
                    Selamat datang di Renunganku ("kami", "kita", atau "milik kami"). Kami mengoperasikan situs web renunganku.id dan layanan terkait.
                 </p>
                 <p>
                    Privasi Anda bukan sekadar kepatuhan hukum bagi kami; itu adalah fondasi produk kami. Dokumen ini menjelaskan secara transparan apa yang terjadi dengan data Anda saat Anda menggunakan layanan kami.
                 </p>
              </section>

              {/* Section 2 */}
              <section id="collection" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Data yang Kami Kumpulkan</h2>
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                       Hanya yang Diperlukan
                    </h4>
                    <p className="text-sm text-slate-600">
                       Kami memegang prinsip "Data Minimization". Kami hanya meminta data yang mutlak diperlukan untuk menjalankan fitur.
                    </p>
                 </div>
                 <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Informasi Akun:</strong> Email dan nama panggilan (pseudonym) untuk identifikasi.</li>
                    <li><strong>Konten Pengguna:</strong> Teks jurnal, komentar, dan preferensi mood yang Anda buat.</li>
                    <li><strong>Data Teknis:</strong> Alamat IP (untuk keamanan), jenis perangkat, dan log akses server.</li>
                 </ul>
              </section>

              {/* Section 3 */}
              <section id="usage" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Penggunaan Data</h2>
                 <p className="mb-4">Kami menggunakan data Anda semata-mata untuk:</p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li>Menyediakan dan memelihara Layanan.</li>
                    <li>Personalisasi <i>Focus Feed™</i> agar relevan dengan minat Anda (diproses secara lokal jika memungkinkan).</li>
                    <li>Mendeteksi dan mencegah penyalahgunaan atau aktivitas berbahaya.</li>
                 </ul>
                 <p className="mt-4 font-bold text-slate-900">
                    Kami TIDAK menggunakan konten jurnal pribadi Anda untuk melatih model AI publik tanpa persetujuan eksplisit (Opt-in).
                 </p>
              </section>

              {/* Section 4 */}
              <section id="sharing" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Berbagi Data</h2>
                 <p className="mb-4">
                    Kami tidak menjual, memperdagangkan, atau menyewakan informasi identifikasi pribadi Anda kepada pihak lain. Kami hanya berbagi data dengan pihak ketiga tepercaya yang membantu operasional kami (seperti penyedia server cloud dan layanan email transaksional), yang terikat oleh perjanjian kerahasiaan yang ketat.
                 </p>
              </section>

              {/* Section 5 */}
              <section id="security" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Keamanan</h2>
                 <p className="mb-4">
                    Infrastruktur kami di-host di pusat data dengan standar keamanan ISO 27001.
                 </p>
                 <p>
                    Fitur Jurnal Privat menggunakan enkripsi standar industri (AES-256) saat istirahat (at rest) dan saat transit (in transit). Kunci enkripsi dikelola dengan prosedur rotasi yang ketat.
                 </p>
              </section>

              {/* Section 6 */}
              <section id="rights" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Hak Anda</h2>
                 <p className="mb-4">
                    Sesuai dengan peraturan perundang-undangan yang berlaku di Republik Indonesia, Anda memiliki hak untuk:
                 </p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li>Meminta salinan data pribadi yang kami simpan tentang Anda.</li>
                    <li>Meminta koreksi data yang tidak akurat.</li>
                    <li>Meminta penghapusan akun dan seluruh data terkait ("Right to be Forgotten").</li>
                 </ul>
              </section>

              {/* Section 7 */}
              <section id="contact" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Kontak</h2>
                 <p className="mb-6">
                    Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi Data Protection Officer (DPO) kami:
                 </p>
                 
                 <div className="bg-slate-900 text-white p-8 rounded-2xl">
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-white/10 rounded-lg">
                          <Globe className="w-6 h-6 text-white" />
                       </div>
                       <div>
                          <h4 className="font-bold text-lg mb-1">Renunganku Legal Team</h4>
                          <p className="text-slate-400 text-sm mb-4">
                             PT. Renunganku Teknologi Indonesia<br/>
                             Malang, Jawa Timur, Indonesia.
                          </p>
                          <a href="mailto:privacy@renunganku.id" className="text-emerald-400 hover:text-emerald-300 font-mono text-sm underline decoration-dashed underline-offset-4">
                             privacy@renunganku.id
                          </a>
                       </div>
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