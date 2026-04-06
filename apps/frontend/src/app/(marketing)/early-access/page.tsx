"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  FlaskConical, // Icon Laboratorium
  Beaker,
  Check, 
  Loader2,
  Lock,
  Binary,
  Microscope
} from "lucide-react";
import Logo from "@/components/Logo";

export default function EarlyAccessPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col relative overflow-hidden font-sans selection:bg-black selection:text-white">
      
      {/* --- BACKGROUND: TECHNICAL GRID --- */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] z-0 opacity-60"></div>

      {/* --- HEADER --- */}
      <header className="relative z-20 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Link href="/" className="hover:opacity-70 transition-opacity">
           <Logo variant="full" height={26} className="text-slate-900" />
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono tracking-wide uppercase text-slate-500 shadow-sm">
           <FlaskConical className="w-3 h-3 text-indigo-500" />
           Research Lab v0.9
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 py-12">
        
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
          
          {/* LEFT: THE PITCH (Experimental Features) */}
          <div className="text-left space-y-8">
             <div>
                <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                   <Microscope className="w-3.5 h-3.5" />
                   Insider Program
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight text-slate-900">
                   Jadilah yang pertama <br />
                   <span className="text-slate-400">mencoba masa depan.</span>
                </h1>
                <p className="text-slate-600 text-lg leading-relaxed">
                   Bergabunglah dengan Renunganku Insider untuk mendapatkan akses eksklusif ke fitur eksperimental sebelum dirilis ke publik.
                </p>
             </div>

             {/* Feature List (Benefits) */}
             <ul className="space-y-4">
                {[
                   "Akses dini ke Focus Feed™ v2.0",
                   "Eksperimen fitur AI Journaling",
                   "Lencana profil 'Early Adopter' permanen",
                   "Jalur feedback langsung ke Founder"
                ].map((item, idx) => (
                   <li key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-emerald-600">
                         <Check className="w-3.5 h-3.5" />
                      </div>
                      {item}
                   </li>
                ))}
             </ul>
          </div>

          {/* RIGHT: THE FORM CARD */}
          <div className="relative">
             {/* Decorative Elements */}
             <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -z-10"></div>
             
             <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                
                {status === 'success' ? (
                   <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                         <Beaker className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to the Lab!</h3>
                      <p className="text-slate-500 text-sm mb-6">
                         Undangan akses fitur beta telah dikirim ke <span className="font-bold text-slate-900">{email}</span>.
                      </p>
                      <Link href="/" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1">
                         Kembali ke Beranda <ArrowRight className="w-3 h-3" />
                      </Link>
                   </div>
                ) : (
                   <>
                      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                         <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Access Request</span>
                         <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Slots Open</span>
                         </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Email Profesional</label>
                            <input 
                               type="email" 
                               required
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               placeholder="kamu@perusahaan.com"
                               className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            />
                         </div>
                         
                         {/* Optional Interest Checkbox (Data Collection) */}
                         <div className="space-y-2 py-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Tertarik Mencoba:</label>
                            <div className="grid grid-cols-2 gap-2">
                               <label className="flex items-center gap-2 p-2 border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-50 cursor-pointer">
                                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                  AI Journaling
                               </label>
                               <label className="flex items-center gap-2 p-2 border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-50 cursor-pointer">
                                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                  Community Circles
                               </label>
                            </div>
                         </div>

                         <button 
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-black text-white font-bold text-sm py-3.5 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
                         >
                            {status === 'loading' ? (
                               <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                               <>
                                  Dapatkan Akses Insider
                                  <ArrowRight className="w-4 h-4" />
                               </>
                            )}
                         </button>
                         
                         <p className="text-[10px] text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" />
                            Kami tidak mengirim spam. Unsubscribe kapan saja.
                         </p>
                      </form>
                   </>
                )}
             </div>
             
             {/* Tech Decoration */}
             <div className="absolute bottom-4 -left-4 flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-400 shadow-sm rotate-[-2deg]">
                <Binary className="w-3 h-3" />
                Build: 2025.04.Beta
             </div>
          </div>

        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 py-8 text-center text-[11px] text-slate-400 border-t border-slate-100">
         <div className="flex justify-center gap-6 mb-2">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
         </div>
         &copy; 2025 Renunganku Inc.
      </footer>

    </div>
  );
}