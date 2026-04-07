import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-marketing-display', weight: ['500', '700'] });
const bodyFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-marketing-body', weight: ['400', '500'] });

export const metadata: Metadata = { title: 'Akses Awal | Soplantila', description: 'Join batch pertama.' };

export default function EarlyAccessPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-slate-900 text-white`}>
      <Header />
      <main className="flex-grow pt-40 pb-32 px-6 lg:px-8 max-w-[800px] mx-auto w-full text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <h1 className="[font-family:var(--font-marketing-display)] text-5xl md:text-7xl font-bold mb-8">Akses Awal</h1>
          <p className="[font-family:var(--font-marketing-body)] text-slate-400 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            Kita lagi invite orang secara batch biar server gak jebol. Pesen tiket lo sekarang.
          </p>
          <div className="max-w-md mx-auto p-2 bg-slate-800 rounded-full flex">
             <input type="email" placeholder="Email lo..." className="bg-transparent text-white px-6 w-full focus:outline-none [font-family:var(--font-marketing-body)]" />
             <button className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold [font-family:var(--font-marketing-display)] hover:bg-slate-200 transition-colors">Daftar</button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
