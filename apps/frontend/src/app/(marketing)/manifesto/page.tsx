"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Quote, 
  Scale, 
  Fingerprint, 
  Wind, 
  EyeOff,
  ScrollText,
  MapPin,
  Barcode,
  ArrowDown
} from "lucide-react";

export default function ManifestoPage() {
  return (
    <>
      <Header />
      
      {/* BACKGROUND GLOBAL: High-End Paper Texture with Grid */}
      <main className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 selection:bg-slate-900 selection:text-white font-sans relative overflow-hidden">
        
        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-60"></div>

        {/* --- HERO SECTION: THE BLUEPRINT --- */}
        <div className="max-w-7xl mx-auto px-6 mb-24 relative z-10">
           
           {/* Top Metadata Strip */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-slate-900 pb-8 mb-12">
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                    <ScrollText className="w-3 h-3" />
                    Core Philosophy v.1.0
                 </div>
                 <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 leading-[0.9]">
                    THE <br/>
                    <span className="font-serif italic font-normal">Attention</span><br/>
                    REVOLT.
                 </h1>
              </div>
              
              {/* Technical Details: Malang Context */}
              <div className="mt-8 md:mt-0 flex flex-col items-start md:items-end text-right font-mono text-xs text-slate-500 gap-1">
                 <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span className="uppercase tracking-widest">Malang, East Java</span>
                 </div>
                 <div>Lat: 7.9666° S, Long: 112.6326° E</div>
                 <div>Est. 2025</div>
                 <div className="mt-2">
                    <Barcode className="w-24 h-8 opacity-50" />
                 </div>
              </div>
           </div>

           <div className="grid md:grid-cols-12 gap-12">
              <div className="md:col-span-4 border-l border-slate-300 pl-6 py-2">
                 <p className="font-serif text-2xl italic text-slate-800 leading-snug">
                    "Sebuah deklarasi untuk masa depan internet yang lebih tenang, disengaja, dan manusiawi."
                 </p>
              </div>
              <div className="md:col-span-8">
                 <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                    Kami percaya bahwa internet telah kehilangan arah. Apa yang dimulai sebagai alat untuk koneksi, telah berubah menjadi mesin ekstraksi perhatian yang dirancang untuk membuat kita cemas, marah, dan kecanduan. Kami di sini untuk mengubah arus tersebut.
                 </p>
              </div>
           </div>
        </div>

        {/* --- SECTION 1: THE DATA (Editorial Layout) --- */}
        <section className="py-24 border-y border-slate-300 bg-[#EAEAEA]">
           <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              
              {/* Left: The Visual Metric */}
              <div className="relative group">
                 <div className="absolute -inset-4 bg-white/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                 <div className="relative border-2 border-slate-900 p-8 md:p-12 rounded-none bg-[#F5F5F7]">
                    <span className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Daily Screen Time avg.</span>
                    <div className="text-[6rem] md:text-[10rem] font-bold text-slate-900 leading-none tracking-tighter">
                       6.5<span className="text-4xl align-top text-slate-400">h</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 mt-6 overflow-hidden">
                       <div className="h-full bg-red-500 w-[80%] animate-pulse"></div>
                    </div>
                    <p className="text-slate-500 text-sm mt-4 font-mono">
                       WARNING: ATTENTION_SPAN_CRITICAL
                    </p>
                 </div>
              </div>

              {/* Right: Narrative */}
              <div className="space-y-8 text-lg text-slate-700 leading-relaxed">
                 <h3 className="text-3xl font-bold text-slate-900">Ekonomi Atensi Telah Rusak.</h3>
                 <p>
                    Model bisnis media sosial saat ini bergantung pada satu metrik: <em>Time on Site</em>. Untuk memaksimalkan ini, algoritma dilatih untuk memicu emosi primitif kita—ketakutan, kemarahan, dan validasi sosial.
                 </p>
                 <p>
                    Dampaknya nyata. Rentang perhatian memendek. Kecemasan meningkat. Dan yang paling parah, kita kehilangan kemampuan untuk duduk diam dengan pikiran kita sendiri.
                 </p>
                 <div className="flex items-center gap-4 pt-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white">
                        <ArrowDown className="w-5 h-5 animate-bounce" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wide">Solusi Kami</span>
                 </div>
              </div>
           </div>
        </section>

        {/* --- SECTION 2: THE 4 PILLARS (Architectural Grid) --- */}
        <section className="py-32 relative">
           <div className="max-w-7xl mx-auto px-6">
              
              {/* Vertical Title */}
              <div className="absolute left-6 top-32 hidden lg:block">
                 <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180">
                    Design Principles
                 </h2>
              </div>

              <div className="lg:pl-24 grid md:grid-cols-2 gap-x-12 gap-y-24">
                 
                 {/* Pillar 1 */}
                 <div className="group relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-slate-300 origin-top scale-y-100 transition-transform group-hover:scale-y-100"></div>
                    <div className="mb-6 flex items-center justify-between">
                       <span className="font-mono text-4xl text-slate-300 group-hover:text-slate-900 transition-colors">01</span>
                       <EyeOff className="w-8 h-8 text-slate-900" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:underline decoration-2 underline-offset-4">Anti-Algoritma</h3>
                    <p className="text-slate-600 leading-relaxed">
                       Anda melihat apa yang Anda ikuti. Kronologis. Tidak ada "For You Page" yang dirancang untuk menjebak Anda dalam <i>doomscrolling</i>. Kendali kembali ke tangan Anda.
                    </p>
                 </div>

                 {/* Pillar 2 */}
                 <div className="group relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-slate-300 origin-top scale-y-100"></div>
                    <div className="mb-6 flex items-center justify-between">
                       <span className="font-mono text-4xl text-slate-300 group-hover:text-slate-900 transition-colors">02</span>
                       <Scale className="w-8 h-8 text-slate-900" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:underline decoration-2 underline-offset-4">Metrik yang Tenang</h3>
                    <p className="text-slate-600 leading-relaxed">
                       Tidak ada penghitung <i>Likes</i> publik. Validasi sosial adalah candu yang kami hilangkan dari desain UI kami. Fokus pada kualitas interaksi, bukan kuantitas angka.
                    </p>
                 </div>

                 {/* Pillar 3 */}
                 <div className="group relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-slate-300 origin-top scale-y-100"></div>
                    <div className="mb-6 flex items-center justify-between">
                       <span className="font-mono text-4xl text-slate-300 group-hover:text-slate-900 transition-colors">03</span>
                       <Fingerprint className="w-8 h-8 text-slate-900" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:underline decoration-2 underline-offset-4">Kedaulatan Data</h3>
                    <p className="text-slate-600 leading-relaxed">
                       Data Anda adalah milik Anda. Export kapan saja. Hapus selamanya. Kami tidak menjual profil psikografis Anda ke pengiklan. Privasi adalah fitur standar, bukan opsi.
                    </p>
                 </div>

                 {/* Pillar 4 */}
                 <div className="group relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-slate-300 origin-top scale-y-100"></div>
                    <div className="mb-6 flex items-center justify-between">
                       <span className="font-mono text-4xl text-slate-300 group-hover:text-slate-900 transition-colors">04</span>
                       <Wind className="w-8 h-8 text-slate-900" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:underline decoration-2 underline-offset-4">Finite Scrolling</h3>
                    <p className="text-slate-600 leading-relaxed">
                       Setiap feed memiliki akhir. Kami akan memberi tahu Anda "You're all caught up", lalu menyarankan Anda untuk menutup aplikasi dan kembali ke dunia nyata.
                    </p>
                 </div>

              </div>
           </div>
        </section>

        {/* --- SECTION 3: THE SIGNATURE (Malang Context) --- */}
        <section className="bg-[#111] text-white py-32 relative overflow-hidden">
           {/* Texture Overlay */}
           <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
           
           <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
              <Quote className="w-16 h-16 text-slate-700 mx-auto mb-10" />
              <h2 className="text-3xl md:text-5xl font-serif leading-tight mb-16">
                 "Kami membangun Renunganku bukan karena ini cara termudah untuk membuat startup, tapi karena ini adalah satu-satunya cara kami ingin hidup di dunia digital."
              </h2>
              
              <div className="flex flex-col items-center justify-center border-t border-slate-800 pt-12">
                 {/* Simulated Signature */}
                 <div className="font-serif italic text-4xl text-slate-400 transform -rotate-2 mb-2">
                    Tim Renunganku
                 </div>
                 <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded border border-slate-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Crafted in Malang, ID
                 </div>
              </div>
           </div>
        </section>

      </main>
      <Footer />
    </>
  );
}