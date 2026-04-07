import Link from 'next/link';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import { Leaf } from 'lucide-react';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-marketing-display',
  weight: ['500', '700'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-marketing-body',
  weight: ['400', '500'],
});

export default function Footer() {
  return (
    <footer className={`bg-[#FAFAFA] border-t border-slate-200 pt-20 pb-10 px-6 lg:px-8 ${displayFont.variable} ${bodyFont.variable}`}>
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Col */}
          <div className="md:col-span-4 lg:col-span-5">
            <Link href="/" className="flex items-center gap-2.5 group mb-6 inline-flex">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(15,23,42,0.1)]">
                 <Leaf className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="[font-family:var(--font-marketing-display)] font-bold text-2xl tracking-tight text-slate-900">
                Soplantila
              </span>
            </Link>
            <p className="[font-family:var(--font-marketing-body)] text-slate-500 text-base leading-relaxed max-w-sm">
              Sosial media yang gak bikin pusing. Dibangun khusus buat lo yang pengen ngobrol santai tanpa disetirin algoritma, bebas iklan, dan 100% aman.
            </p>
          </div>
          
          {/* Links Cols */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Produk */}
            <div className="flex flex-col gap-5">
              <h4 className="[font-family:var(--font-marketing-display)] text-base font-bold text-slate-900">Produk</h4>
              <nav className="flex flex-col gap-4 [font-family:var(--font-marketing-body)] text-sm text-slate-500">
                <Link href="/features" className="hover:text-slate-900 transition-colors w-fit">Fitur</Link>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors w-fit">Harga</Link>
                <Link href="/changelog" className="hover:text-slate-900 transition-colors w-fit">Changelog</Link>
                <Link href="/roadmap" className="hover:text-slate-900 transition-colors w-fit">Roadmap</Link>
              </nav>
            </div>

            {/* Perusahaan */}
            <div className="flex flex-col gap-5">
              <h4 className="[font-family:var(--font-marketing-display)] text-base font-bold text-slate-900">Perusahaan</h4>
              <nav className="flex flex-col gap-4 [font-family:var(--font-marketing-body)] text-sm text-slate-500">
                <Link href="/manifesto" className="hover:text-slate-900 transition-colors w-fit">Manifesto</Link>
                <Link href="/blog" className="hover:text-slate-900 transition-colors w-fit">Berita</Link>
                <Link href="/early-access" className="hover:text-slate-900 transition-colors w-fit">Akses Awal</Link>
              </nav>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-5">
              <h4 className="[font-family:var(--font-marketing-display)] text-base font-bold text-slate-900">Legal</h4>
              <nav className="flex flex-col gap-4 [font-family:var(--font-marketing-body)] text-sm text-slate-500">
                <Link href="/privacy" className="hover:text-slate-900 transition-colors w-fit">Privasi</Link>
                <Link href="/terms" className="hover:text-slate-900 transition-colors w-fit">Ketentuan</Link>
                <Link href="/cookies" className="hover:text-slate-900 transition-colors w-fit">Cookies</Link>
              </nav>
            </div>

          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="[font-family:var(--font-marketing-body)] text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Soplantila. Dibuat dengan santai.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-2 text-sm [font-family:var(--font-marketing-body)]">
               <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse" />
               Semua sistem normal
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
