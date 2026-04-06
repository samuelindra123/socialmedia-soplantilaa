import Link from "next/link";
import { Twitter, Github, Mail } from "lucide-react";
import Logo from "@/components/Logo";
import SystemStatusIndicator from "@/components/SystemStatusIndicator";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Brand & Links */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20 mb-16">
          
          {/* Left: Brand Identity & System Status */}
          <div className="lg:w-1/3">
            <Link href="/" className="inline-block mb-6 group">
              <Logo variant="full" height={26} className="text-slate-900" />
            </Link>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-xs">
              Ruang digital yang tenang untuk refleksi diri. Dibangun untuk individu yang menghargai fokus di atas kebisingan.
            </p>

            {/* Enterprise Touch: System Status Indicator (interactive) */}
            <SystemStatusIndicator />
          </div>

          {/* Right: Highly Relevant Navigation (No Fluff) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-16 lg:w-2/3 lg:justify-end">
            
            {/* Column 1: Platform (Fokus pada Beta/Dev) */}
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-4">Platform</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/changelog" className="text-slate-500 hover:text-black text-[13px] transition-colors flex items-center gap-2">
                    Changelog
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-600 uppercase">
                      New
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/roadmap" className="text-slate-500 hover:text-black text-[13px] transition-colors">
                    Roadmap & Misi
                  </Link>
                </li>
                <li>
                  <Link href="/early-access" className="text-slate-500 hover:text-black text-[13px] transition-colors">
                    Early Access
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Legal (Wajib ada) */}
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-slate-500 hover:text-black text-[13px] transition-colors">
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-500 hover:text-black text-[13px] transition-colors">
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-slate-500 hover:text-black text-[13px] transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Connect (Simple Socials) */}
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-4">Connect</h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://twitter.com/renunganku" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-black text-[13px] transition-colors flex items-center gap-2">
                    <Twitter className="w-3.5 h-3.5" />
                    Twitter / X
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@renunganku.com" className="text-slate-500 hover:text-black text-[13px] transition-colors flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Email Support
                  </a>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-black text-[13px] transition-colors flex items-center gap-2">
                    <Github className="w-3.5 h-3.5" />
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright & Made By */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[13px] text-slate-400 font-medium">
            &copy; {currentYear} Renunganku Inc. Malang, Indonesia.
          </div>
          
          {/* Subtle signature */}
          <div className="flex items-center gap-1 text-[13px] text-slate-400">
            <span>Didesain dengan</span>
            <span className="text-slate-300">●</span>
            <span>fokus dan ketelitian.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}