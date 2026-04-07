import type { Metadata } from 'next';
import Link from 'next/link';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import { Check, Star, Zap, HelpCircle, X } from 'lucide-react';
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
  title: 'Harga | Soplantila',
  description: 'Mulai gratis, upgrade kalau lo butuh lebih.',
};

export default function PricingPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 selection:bg-slate-200 relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-[0.2] pointer-events-none" />

      <Header />

      <main className="flex-grow pt-32 pb-32 px-6 lg:px-8 relative z-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out mb-16">
            <h1 className="[font-family:var(--font-marketing-display)] text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6">
              Harga transparan. <br className="hidden md:block"/>
              <span className="text-slate-400">Gak ada biaya siluman.</span>
            </h1>
            <p className="[font-family:var(--font-marketing-body)] text-xl text-slate-500 max-w-2xl mx-auto">
              Kita gak jualan data lo ke pengiklan. Makanya kita pasang harga masuk akal biar platform ini tetep hidup, bersih, dan aman.
            </p>
          </div>

          {/* PRICING CARDS */}
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 ease-out grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[900px] mx-auto relative">
             
            {/* Free Plan */}
            <div className="relative rounded-[3rem] bg-white p-10 lg:p-14 border border-slate-200 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col items-start text-left group">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 ease-out">
                <Star className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="[font-family:var(--font-marketing-display)] text-3xl font-bold text-slate-900 mb-2">Santai</h3>
              <p className="text-slate-500 mb-8 text-base">Cukup banget buat interaksi harian</p>
              
              <div className="mb-10 pb-10 border-b border-slate-100 w-full">
                <span className="text-6xl font-bold tracking-tight [font-family:var(--font-marketing-display)]">Rp 0</span>
                <span className="text-slate-400 text-base font-medium ml-2">/selamanya</span>
              </div>

              <ul className="space-y-5 mb-12 text-slate-600 [font-family:var(--font-marketing-body)] text-base w-full">
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-slate-900 shrink-0" /> Follow max 100 orang target</li>
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-slate-900 shrink-0" /> Post text & foto kualitas tinggi</li>
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-slate-900 shrink-0" /> Chat end-to-end encrypted</li>
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-slate-900 shrink-0" /> 100% Bebas iklan (iya, beneran)</li>
                <li className="flex items-center gap-4 text-slate-400"><X className="w-6 h-6 shrink-0" /> <span className="line-through">Upload video 4K</span></li>
              </ul>
              
              <Link href="/signup" className="w-full py-5 px-6 rounded-full bg-slate-50 text-slate-900 font-bold border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all text-center mt-auto text-lg">
                Mulai Gratis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-[3rem] bg-slate-900 p-10 lg:p-14 border border-slate-800 shadow-2xl flex flex-col items-start text-left text-white group overflow-hidden">
              {/* Animated Glow Background */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-slate-700/40 blur-[80px] rounded-full pointer-events-none group-hover:bg-slate-600/40 transition-colors duration-700" />
              
              <div className="absolute top-10 right-10 border border-white/20 bg-white/10 backdrop-blur-md text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider animate-pulse">
                 Paling Asik
              </div>

              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 ease-out">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="[font-family:var(--font-marketing-display)] text-3xl font-bold text-white mb-2">Pro</h3>
              <p className="text-slate-400 mb-8 text-base">Buat lo yang ngejalanin komunitas</p>
              
              <div className="mb-10 pb-10 border-b border-slate-800 w-full relative z-10">
                <span className="text-6xl font-bold tracking-tight [font-family:var(--font-marketing-display)]">Rp 49K</span>
                <span className="text-slate-400 text-base font-medium ml-2">/bulan</span>
              </div>

              <ul className="space-y-5 mb-12 text-slate-300 [font-family:var(--font-marketing-body)] text-base w-full relative z-10">
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-white shrink-0" /> <strong>Semua di paket Santai, plus:</strong></li>
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-white shrink-0" /> Unlimited follow siapa aja</li>
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-white shrink-0" /> Upload Video super HD (4K)</li>
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-white shrink-0" /> Custom profile badge & themes</li>
                <li className="flex items-center gap-4"><Check className="w-6 h-6 text-white shrink-0" /> Analytics views sederhana</li>
              </ul>
              
              <Link href="/signup?plan=pro" className="mt-auto w-full py-5 px-6 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-transform text-center z-10 shadow-[0_0_40px_rgba(255,255,255,0.15)] text-lg">
                Langganan Pro
              </Link>
            </div>

          </div>

          {/* FAQ SECTION */}
          <div className="mt-32 max-w-3xl mx-auto text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <div className="flex items-center justify-center gap-3 mb-12">
               <HelpCircle className="w-6 h-6 text-slate-400" />
               <h2 className="[font-family:var(--font-marketing-display)] text-3xl font-bold text-slate-900">Yang Sering Ditanyain</h2>
            </div>

            <div className="space-y-6">
               <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="[font-family:var(--font-marketing-display)] text-xl font-bold text-slate-900 mb-3">Kenapa gak gratis semua aja?</h4>
                  <p className="text-slate-500 leading-relaxed">Kalo gratis total, kita harus jual data lo atau pasang iklan buat bayar server. Kita milih jualan fitur premium biar platform ini tetep bersih dan aman baut semua orang.</p>
               </div>
               <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="[font-family:var(--font-marketing-display)] text-xl font-bold text-slate-900 mb-3">Bisa cancel langganan kapan aja?</h4>
                  <p className="text-slate-500 leading-relaxed">Bisa banget, bro. Gak ada kontrak ribet. Lo bisa cancel kapan aja dan akun lo bakal balik ke paket Santai di bulan berikutnya tanpa kehilangan data.</p>
               </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
