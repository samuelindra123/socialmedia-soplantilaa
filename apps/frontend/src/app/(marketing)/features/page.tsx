import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import {
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  Zap,
  Globe2,
  Workflow
} from 'lucide-react';
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

export const metadata: Metadata = { title: 'Fitur | Soplantila', description: 'Semua fitur yang lo butuhin, tanpa yang bikin ribet.' };

export default function FeaturesPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 selection:bg-slate-200`}>
      <Header />

      <main className="flex-grow pt-24">
        {/* HERO SECTION */}
        <section className="relative px-6 py-20 lg:px-8 max-w-[1200px] mx-auto text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-4xl opacity-40 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#e2e8f0_0%,transparent_70%)]" />
          </div>
          
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <h1 className="[font-family:var(--font-marketing-display)] text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-slate-900 leading-[1.05]">
              Fitur yang <span className="text-slate-400">lo butuhin.</span>
            </h1>
            <p className="mt-8 max-w-2xl mx-auto [font-family:var(--font-marketing-body)] text-lg md:text-xl leading-relaxed text-slate-500 font-light">
              Semua yang bikin sosmed jadi enak dipake. Gak ada yang aneh-aneh, gak ada yang maksa. Cuma fitur yang emang berguna.
            </p>
          </div>
        </section>

        {/* ANIMATED BENTO GRID */}
        <section className="px-6 lg:px-8 py-20 max-w-[1200px] mx-auto">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes floatSlow {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulseBorder {
              0%, 100% { border-color: rgba(226, 232, 240, 0.5); }
              50% { border-color: rgba(148, 163, 184, 0.8); }
            }
            .animate-float { animation: floatSlow 6s ease-in-out infinite; }
            .animate-pulse-border { animation: pulseBorder 4s ease-in-out infinite; }
          `}} />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Main Feature - Large */}
            <div className="md:col-span-8 group relative rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/80 transition-all duration-700 min-h-[450px] flex flex-col justify-end p-10 animate-pulse-border">
              <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full opacity-50 transition-transform duration-700 group-hover:scale-110" />
              
              {/* Abstract Floating UI Elements */}
              <div className="absolute top-10 right-10 flex flex-col gap-4 animate-float pointer-events-none">
                 <div className="bg-white/80 backdrop-blur-md rounded-2xl w-64 p-4 border border-slate-100 shadow-lg flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                       <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-32 h-2 rounded-full bg-slate-200" />
                      <div className="w-20 h-2 rounded-full bg-slate-100" />
                    </div>
                 </div>
                 <div className="bg-white/80 backdrop-blur-md rounded-2xl w-56 p-4 border border-slate-100 shadow-lg flex items-center gap-4 translate-x-8">
                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                    <div className="space-y-2 w-full">
                      <div className="w-full h-2 rounded-full bg-slate-200" />
                      <div className="w-2/3 h-2 rounded-full bg-slate-100" />
                    </div>
                 </div>
              </div>

              <div className="relative z-10 max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-8 shadow-lg">
                   <Layers className="w-7 h-7 text-white" />
                </div>
                <h3 className="[font-family:var(--font-marketing-display)] text-3xl md:text-4xl font-medium text-slate-900 mb-4">Feed tanpa algoritma aneh</h3>
                <p className="[font-family:var(--font-marketing-body)] text-lg text-slate-500">
                  Gak ada manipulasi urutan post. Lo liat apa yang diposting, kapan diposting, dari orang yang lo pilih sendiri buat di-follow.
                </p>
              </div>
            </div>

            {/* Smaller Feature 1 */}
            <div className="md:col-span-4 relative rounded-[2.5rem] bg-slate-900 text-white border border-slate-800 overflow-hidden shadow-2xl shadow-slate-900/20 p-10 flex flex-col group min-h-[450px]">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="mt-auto relative z-10">
                 <Lock className="w-10 h-10 text-slate-400 mb-8 transition-transform duration-500 group-hover:scale-110" />
                 <h3 className="[font-family:var(--font-marketing-display)] text-2xl font-medium text-white mb-3">Privasi dijaga ketat</h3>
                 <p className="[font-family:var(--font-marketing-body)] text-slate-400">
                   Data lo aman dan gak dipake buat iklan. Gak ada tracking aneh-aneh, gak ada yang ngintip aktivitas lo.
                 </p>
              </div>
            </div>

            {/* Smaller Feature 2 */}
            <div className="md:col-span-4 relative rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden shadow-lg p-10 flex flex-col group min-h-[400px]">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-100 rounded-full blur-3xl group-hover:bg-slate-200 transition-colors duration-700" />
              <div className="mt-auto relative z-10">
                 <Zap className="w-10 h-10 text-slate-900 mb-8 transition-transform duration-500 group-hover:-rotate-12" />
                 <h3 className="[font-family:var(--font-marketing-display)] text-2xl font-medium text-slate-900 mb-3">Cepet banget</h3>
                 <p className="[font-family:var(--font-marketing-body)] text-slate-500">
                   Konten langsung muncul sebelum jari lo selesai scroll. Gak ada loading lama yang bikin kesel.
                 </p>
              </div>
            </div>

            {/* Wide Feature */}
            <div className="md:col-span-8 relative rounded-[2.5rem] bg-slate-50 border border-slate-200 overflow-hidden shadow-lg p-10 lg:p-12 flex flex-col md:flex-row items-center gap-10 group min-h-[400px]">
              <div className="flex-1 z-10">
                 <Globe2 className="w-10 h-10 text-slate-400 mb-8" />
                 <h3 className="[font-family:var(--font-marketing-display)] text-3xl font-medium text-slate-900 mb-4">Bisa banyak bahasa</h3>
                 <p className="[font-family:var(--font-marketing-body)] text-lg text-slate-500">
                   Posting pakai bahasa apa aja, temen lo dari negara lain bisa baca dengan translate otomatis yang natural.
                 </p>
              </div>

              {/* Decorative Animated Globe / Rings */}
              <div className="w-full md:w-1/2 relative h-64 flex items-center justify-center">
                 <div className="absolute w-48 h-48 rounded-full border border-slate-300 opacity-50" style={{ animation: 'spin 12s linear infinite' }} />
                 <div className="absolute w-64 h-64 rounded-full border border-slate-200 opacity-30" style={{ animation: 'spin 18s linear infinite reverse' }} />
                 <div className="w-24 h-24 rounded-full bg-slate-900 shadow-2xl flex items-center justify-center absolute z-10">
                    <Workflow className="w-10 h-10 text-white" />
                 </div>
              </div>
            </div>

          </div>
        </section>

        {/* STICKY SCROLL SHOWCASE */}
        <section className="relative px-6 lg:px-8 py-32 bg-white">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
            
            {/* Sticky Graphic Side */}
            <div className="hidden lg:block relative">
               <div className="sticky top-40 h-[600px] w-full rounded-[3rem] bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800 shadow-2xl shadow-slate-900/30">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
                  
                  {/* Dynamic Abstract View */}
                  <div className="relative z-10 w-2/3 aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-6 flex flex-col animate-float">
                     <div className="flex gap-2 mb-6">
                        <div className="w-3 h-3 rounded-full bg-slate-700" />
                        <div className="w-3 h-3 rounded-full bg-slate-700" />
                     </div>
                     <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-5 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10" />
                        <div className="space-y-2 mt-2">
                           <div className="h-3 w-full bg-white/10 rounded-full" />
                           <div className="h-3 w-4/5 bg-white/10 rounded-full" />
                           <div className="h-3 w-2/3 bg-white/5 rounded-full" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Scroll Text Side */}
            <div className="py-10 space-y-32 lg:py-40">
               {[
                 {
                   title: 'Mode fokus baca',
                   desc: 'Lagi baca artikel panjang? Semua tombol dan menu bakal hilang otomatis biar lo fokus. Gak ada yang ganggu.',
                 },
                 {
                   title: 'Interaksi yang bermakna',
                   desc: 'Gak cuma like doang. Lo bisa liat siapa yang beneran engage sama konten lo lewat komentar dan sharing yang thoughtful.',
                 },
                 {
                   title: 'Grup privat',
                   desc: 'Bikin circle khusus buat orang-orang tertentu. Obrolan di dalem gak bakal keliatan sama yang di luar.',
                 }
               ].map((item, idx) => (
                 <div key={idx} className="relative group">
                    <div className="absolute -left-8 top-0 w-1 h-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="w-full h-1/3 bg-slate-900 rounded-full absolute top-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out" />
                    </div>
                    <h3 className="[font-family:var(--font-marketing-display)] text-3xl md:text-5xl font-medium text-slate-900 mb-6">
                      {item.title}
                    </h3>
                    <p className="[font-family:var(--font-marketing-body)] text-xl text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                 </div>
               ))}
            </div>

          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-32 px-6 lg:px-8 relative overflow-hidden bg-slate-900 border-t border-slate-800">
          <div className="mx-auto max-w-4xl text-center relative z-10">
            <h2 className="[font-family:var(--font-marketing-display)] text-4xl md:text-6xl font-medium tracking-tighter text-white mb-6">
              Rasain bedanya.
            </h2>
            <p className="[font-family:var(--font-marketing-body)] text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Berhenti dipaksa sama algoritma. Mulai bikin komunitas yang lo mau, dengan cara lo sendiri.
            </p>
            <Link
              href="/signup"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 [font-family:var(--font-marketing-body)] text-base font-medium text-slate-900 transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]"
            >
              Daftar sekarang
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
