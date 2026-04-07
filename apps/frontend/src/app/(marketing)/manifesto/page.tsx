import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import { Shield, Sparkles, ScrollText, Users, EyeOff, Activity, MoveRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-marketing-display',
  weight: ['400', '500', '600', '700'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-marketing-body',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Manifesto | Soplantila',
  description: 'Kenapa kita bangun sosmed baru. Balik ke fungsi asli sosmed.',
};

export default function ManifestoPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 overflow-x-hidden selection:bg-slate-200`}>
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 lg:px-8 max-w-[1200px] mx-auto text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-4xl opacity-30 pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-b from-slate-200/50 to-transparent blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out flex justify-center mb-8">
               <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium tracking-widest text-slate-600 shadow-sm">
                 <ScrollText className="h-4 w-4 text-slate-400" />
                 MANIFESTO KITA
               </div>
            </div>

            <h1 className="animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out delay-150 [font-family:var(--font-marketing-display)] text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.05]">
              Sosmed udah rusak.<br />
              <span className="text-slate-400">Waktunya kita benerin.</span>
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out delay-300 [font-family:var(--font-marketing-body)] text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Kita semua ngerasain hal yang sama. Sosmed yang dulu asik buat ngobrol, sekarang berubah jadi mesin pencetak uang yang haus atensi.
            </p>
          </div>
        </section>

        {/* COMPARISON / BENTO SECTION */}
        <section className="px-6 lg:px-8 pb-32">
          <div className="max-w-[1000px] mx-auto relative relative z-10">
            
            {/* Intro paragraph box */}
            <div className="animate-in fade-in zoom-in-95 duration-1000 delay-500 bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 mb-8 text-center">
               <p className="[font-family:var(--font-marketing-body)] text-xl text-slate-600 leading-relaxed">
                 Timeline isinya iklan mulu, algoritma sengaja bikin kita emosi, dan notifikasi didesain biar dapet dopamin murahan. Ini bukan tempat nyambung sama orang lagi, ini tempat jualan atensi kita. <strong className="text-slate-900 border-b-2 border-slate-200">Gue capek. Lo juga pasti capek.</strong>
               </p>
            </div>

            {/* Premium Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 rounded-[2.5rem] bg-white p-10 border border-slate-100 shadow-lg shadow-slate-200/20 group hover:border-slate-300 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Activity className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="[font-family:var(--font-marketing-display)] text-2xl font-bold text-slate-900 mb-3">Tanpa Algoritma</h3>
                <p className="[font-family:var(--font-marketing-body)] text-slate-500 leading-relaxed">
                  Gak ada robot nyebelin yang ngatur lo harus liat konten apa. Chronological feed is back. Lo pegang kendali penuh atas apa yang lo konsumsi.
                </p>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700 rounded-[2.5rem] bg-white p-10 border border-slate-100 shadow-lg shadow-slate-200/20 group hover:border-slate-300 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Shield className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="[font-family:var(--font-marketing-display)] text-2xl font-bold text-slate-900 mb-3">Privasi Mutlak</h3>
                <p className="[font-family:var(--font-marketing-body)] text-slate-500 leading-relaxed">
                  Data lo bukan komoditas. Kita gak jual data lo ke pengiklan manapun. Chat lo aman, post lo aman. Titik.
                </p>
              </div>

              <div className="md:col-span-2 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-[900ms] rounded-[2.5rem] bg-slate-900 p-10 md:p-14 border border-slate-800 shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-slate-800/50 blur-[80px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
                
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                  <div className="max-w-xl">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-8">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="[font-family:var(--font-marketing-display)] text-3xl md:text-4xl font-bold text-white mb-4">Fokus ke Sirkel Lo</h3>
                    <p className="[font-family:var(--font-marketing-body)] text-slate-400 text-lg leading-relaxed">
                      Bukan platform buat ngejar likes atau nyari validasi dari orang random. Soplantila didesain murni buat ngobrol santai bareng temen-temen asli lo.
                    </p>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center w-32 h-32 rounded-full border border-slate-800 bg-slate-900 shadow-xl shrink-0 group-hover:bg-white group-hover:border-white transition-colors duration-500">
                    <MoveRight className="w-10 h-10 text-slate-700 group-hover:text-slate-900 transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-[1100ms]">
               <h2 className="[font-family:var(--font-marketing-display)] text-3xl md:text-5xl font-medium tracking-tight text-slate-900 mb-6">
                 Yuk balik ke fungsi asli sosmed.
               </h2>
               <p className="[font-family:var(--font-marketing-body)] text-lg text-slate-500 mb-10 max-w-2xl mx-auto">
                 Sebuah rumah digital yang hening, damai, dan aman. Tanpa drama, tanpa algoritma aneh. Sosmed yang gak bikin pusing.
               </p>
            </div>
            
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
