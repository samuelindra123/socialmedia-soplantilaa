'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-marketing-display',
  weight: ['500', '700'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-marketing-body',
  weight: ['400', '500', '600'],
});

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Fitur', path: '/features' },
    { name: 'Manifesto', path: '/manifesto' },
    { name: 'Harga', path: '/pricing' },
    { name: 'Berita', path: '/blog' },
  ];

  return (
    <header 
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${displayFont.variable} ${bodyFont.variable} ${
        isScrolled ? 'py-3' : 'py-5'
      }`}
      style={{ top: 'var(--banner-height, 0px)' }}
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className={`relative flex items-center justify-between rounded-full border transition-all duration-300 overflow-hidden ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm px-6 py-3' 
            : 'bg-white/50 backdrop-blur-sm border-slate-200/50 px-6 py-4'
        }`}>
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group relative z-10">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md">
               <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="[font-family:var(--font-marketing-display)] font-bold text-xl tracking-tight text-slate-900">
              Soplantila
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50 backdrop-blur-md absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`px-4 py-2 rounded-full [font-family:var(--font-marketing-body)] text-sm font-medium transition-all duration-200 ${
                  pathname === link.path
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3 relative z-10">
            <Link 
              href="/login" 
              className="px-4 py-2 [font-family:var(--font-marketing-body)] text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Masuk
            </Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 rounded-full bg-slate-900 [font-family:var(--font-marketing-body)] text-sm font-medium text-white shadow-md hover:bg-slate-800 hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 relative z-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-[88px] left-6 right-6 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2rem] shadow-2xl p-6 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200 fade-in z-40">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4 rounded-2xl [font-family:var(--font-marketing-display)] text-lg font-medium transition-colors ${
                  pathname === link.path
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="h-px bg-slate-100 w-full my-2" />
          <div className="flex flex-col gap-2">
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-4 text-center rounded-2xl [font-family:var(--font-marketing-body)] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Masuk
            </Link>
            <Link 
              href="/signup" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-4 text-center rounded-2xl bg-slate-900 [font-family:var(--font-marketing-body)] font-medium text-white shadow-xl hover:bg-slate-800 transition-colors"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
