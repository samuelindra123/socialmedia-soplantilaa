import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Map } from 'lucide-react';

const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-marketing-display', weight: ['500', '700'] });
const bodyFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-marketing-body', weight: ['400', '500'] });

export const metadata: Metadata = { title: 'Roadmap | Soplantila', description: 'Masa depan platform kita.' };

export default function RoadmapPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900`}>
      <Header />
      <main className="flex-grow pt-40 pb-32 px-6 lg:px-8 max-w-[1000px] mx-auto w-full">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out mb-16 text-center">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Map className="w-8 h-8" />
          </div>
          <h1 className="[font-family:var(--font-marketing-display)] text-5xl font-bold mb-4">Roadmap Kita</h1>
          <p className="[font-family:var(--font-marketing-body)] text-slate-500 text-xl max-w-xl mx-auto">Nih intip apa aje yang lagi kita garap ke depannya.</p>
        </div>
        
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 max-w-[800px] mx-auto">
           <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-2 block">Kuartal Ini</span>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 [font-family:var(--font-marketing-display)]">Video Calls & Voice Notes</h3>
              <p className="text-slate-600">Bakalan bisa ngobrol langsung tanpa ninggalin obrolan seru lo.</p>
           </div>
           <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm opacity-70">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tahun Depan</span>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 [font-family:var(--font-marketing-display)]">Komunitas & Sub-Space</h3>
              <p className="text-slate-600">Bikin grup nyantai khusus sirkel atau hobby lu biar makin asik.</p>
           </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
