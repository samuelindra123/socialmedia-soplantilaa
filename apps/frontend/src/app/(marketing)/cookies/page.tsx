"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Cookie, 
  Info, 
  Settings, 
  ShieldCheck, 
  ToggleRight,
  Database,
  Clock
} from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 selection:bg-slate-900 selection:text-white font-sans">
        
        {/* --- HERO SECTION --- */}
        <div className="max-w-5xl mx-auto px-6 mb-16">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                    <Cookie className="w-3 h-3" />
                    Legal Center
                 </div>
                 <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4">
                    Kebijakan Cookie
                 </h1>
                 <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                    Transparansi tentang bagaimana kami menggunakan "memori digital" kecil ini untuk meningkatkan pengalaman Anda tanpa mengorbankan privasi.
                 </p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Last Updated</p>
                 <p className="text-sm font-bold text-slate-900">29 November 2025</p>
              </div>
           </div>
        </div>

        {/* --- COOKIE CATEGORIES (Visual Summary) --- */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
           <div className="grid md:grid-cols-3 gap-6">
              
              {/* Card 1: Necessary */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="w-12 h-12 text-slate-900" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    Sangat Diperlukan
                 </h4>
                 <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Cookie teknis yang wajib ada agar website bisa berfungsi (Login, Keamanan, Session).
                 </p>
                 <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 border border-slate-200 px-2 py-1 rounded">
                    Always Active
                 </span>
              </div>

              {/* Card 2: Functional */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Settings className="w-12 h-12 text-slate-900" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    Fungsional
                 </h4>
                 <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Mengingat preferensi Anda seperti Bahasa, Mode Gelap/Terang, dan pengaturan font.
                 </p>
                 <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    Optional
                 </span>
              </div>

              {/* Card 3: Analytics */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Database className="w-12 h-12 text-slate-900" />
                 </div>
                 <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Performa
                 </h4>
                 <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Data anonim untuk memahami bagaimana pengguna berinteraksi dengan fitur kami (bukan tracking iklan).
                 </p>
                 <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    Optional
                 </span>
              </div>

           </div>
        </section>

        {/* --- MAIN CONTENT --- */}
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-12 gap-12">
           
           {/* LEFT: Sticky Navigation */}
           <aside className="hidden md:block md:col-span-3 lg:col-span-3">
              <nav className="sticky top-32 space-y-1">
                 {[
                    { id: "#what-are-cookies", label: "1. Apa itu Cookie?" },
                    { id: "#how-we-use", label: "2. Penggunaan" },
                    { id: "#cookie-list", label: "3. Daftar Cookie" },
                    { id: "#management", label: "4. Kelola Preferensi" },
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

           {/* RIGHT: Content */}
           <div className="md:col-span-9 lg:col-span-9 space-y-16 text-slate-700 leading-relaxed">
              
              {/* Section 1 */}
              <section id="what-are-cookies" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Apa itu Cookie?</h2>
                 <p className="mb-4">
                    Cookie adalah file teks kecil yang disimpan di perangkat Anda (komputer atau ponsel) saat Anda mengunjungi situs web tertentu. Anggap saja sebagai "memori jangka pendek" untuk browser web Anda.
                 </p>
                 <p>
                    Cookie memungkinkan kami mengenali Anda saat Anda kembali, sehingga Anda tidak perlu login ulang setiap kali berpindah halaman.
                 </p>
              </section>

              {/* Section 2 */}
              <section id="how-we-use" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Bagaimana Kami Menggunakannya</h2>
                 <p className="mb-4">
                    Di Renunganku, kami menggunakan pendekatan minimalis. Kami tidak menggunakan cookie pelacak pihak ketiga (Third-party Ad Trackers) yang mengikuti Anda di internet.
                 </p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Otentikasi:</strong> Untuk mengetahui apakah Anda sudah login.</li>
                    <li><strong>Keamanan:</strong> Untuk mencegah serangan CSRF (Cross-Site Request Forgery).</li>
                    <li><strong>Preferensi:</strong> Menyimpan setting tema (Dark/Light Mode).</li>
                 </ul>
              </section>

              {/* Section 3 - THE ENTERPRISE TABLE */}
              <section id="cookie-list" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-6">3. Daftar Cookie Aktif</h2>
                 
                 <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 border-b border-slate-200">
                             <tr>
                                <th className="px-6 py-4 font-bold text-slate-900">Nama Cookie</th>
                                <th className="px-6 py-4 font-bold text-slate-900">Tujuan</th>
                                <th className="px-6 py-4 font-bold text-slate-900">Durasi</th>
                                <th className="px-6 py-4 font-bold text-slate-900">Tipe</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {/* Row 1 */}
                             <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50/30">session_token</td>
                                <td className="px-6 py-4">Mengelola sesi login pengguna.</td>
                                <td className="px-6 py-4 flex items-center gap-1.5 text-slate-500">
                                   <Clock className="w-3.5 h-3.5" /> 30 Hari
                                </td>
                                <td className="px-6 py-4 text-rose-600 font-medium">Wajib</td>
                             </tr>
                             {/* Row 2 */}
                             <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50/30">csrf_token</td>
                                <td className="px-6 py-4">Token keamanan untuk validasi form.</td>
                                <td className="px-6 py-4 flex items-center gap-1.5 text-slate-500">
                                   <Clock className="w-3.5 h-3.5" /> Sesi
                                </td>
                                <td className="px-6 py-4 text-rose-600 font-medium">Wajib</td>
                             </tr>
                             {/* Row 3 */}
                             <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50/30">theme_pref</td>
                                <td className="px-6 py-4">Menyimpan preferensi Dark Mode.</td>
                                <td className="px-6 py-4 flex items-center gap-1.5 text-slate-500">
                                   <Clock className="w-3.5 h-3.5" /> 1 Tahun
                                </td>
                                <td className="px-6 py-4 text-indigo-600 font-medium">Fungsional</td>
                             </tr>
                             {/* Row 4 */}
                             <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50/30">rn_analytics</td>
                                <td className="px-6 py-4">Metrik penggunaan anonim.</td>
                                <td className="px-6 py-4 flex items-center gap-1.5 text-slate-500">
                                   <Clock className="w-3.5 h-3.5" /> 90 Hari
                                </td>
                                <td className="px-6 py-4 text-emerald-600 font-medium">Performance</td>
                             </tr>
                          </tbody>
                       </table>
                    </div>
                 </div>
              </section>

              {/* Section 4 */}
              <section id="management" className="scroll-mt-32">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Kelola Preferensi</h2>
                 <p className="mb-6">
                    Anda dapat mengubah pengaturan cookie browser Anda untuk menolak semua cookie atau menunjukkan kapan cookie dikirim. Namun, beberapa fitur Layanan mungkin tidak berfungsi dengan baik tanpa cookie.
                 </p>
                 
                 {/* Mock Preference Center Button */}
                 <div className="p-6 bg-slate-900 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-white/10 rounded-lg">
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                       </div>
                       <div>
                          <h4 className="font-bold text-lg">Cookie Manager</h4>
                          <p className="text-slate-400 text-xs">Atur persetujuan cookie Anda secara granular.</p>
                       </div>
                    </div>
                    <button className="px-6 py-3 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors shadow-lg">
                       Buka Pengaturan
                    </button>
                 </div>
              </section>

           </div>
        </div>

      </main>
      <Footer />
    </>
  );
}