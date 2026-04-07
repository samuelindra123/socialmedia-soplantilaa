import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-marketing-display', weight: ['500', '700'] });
const bodyFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-marketing-body', weight: ['400', '500'] });

export const metadata: Metadata = { title: 'Changelog | Soplantila', description: 'Yang baru di platform.' };

export default function ChangelogPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900`}>
      <Header />
      <main className="flex-grow pt-40 pb-32 px-6 lg:px-8 max-w-[800px] mx-auto w-full">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <h1 className="[font-family:var(--font-marketing-display)] text-5xl font-bold mb-10">Changelog</h1>
          
          <div className="space-y-12">
            <div className="border-l-4 border-slate-900 pl-6">
              <h2 className="[font-family:var(--font-marketing-display)] text-3xl font-bold mb-2">v1.2: Chat E2EE</h2>
              <span className="text-slate-400 text-sm mb-4 block">April 2026</span>
              <p className="[font-family:var(--font-marketing-body)] text-slate-600 text-lg">Sekarang pesan lo makin aman. Gak ada yang bisa ngintip.</p>
            </div>
            
            <div className="border-l-4 border-slate-200 pl-6">
              <h2 className="[font-family:var(--font-marketing-display)] text-3xl font-bold text-slate-400 mb-2">v1.0: Kita Live!</h2>
              <span className="text-slate-400 text-sm mb-4 block">Mar 2026</span>
              <p className="[font-family:var(--font-marketing-body)] text-slate-600 text-lg">Platform resmi kita rilis. Bye-bye algoritma toxic.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
