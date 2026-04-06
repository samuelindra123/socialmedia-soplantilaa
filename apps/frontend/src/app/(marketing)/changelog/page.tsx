"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  GitCommit, 
  Rss, 
  Terminal,
  Activity,
  Server,
  CloudOff
} from "lucide-react";

export default function ChangelogPage() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 selection:bg-black selection:text-white font-sans relative">
        
        {/* --- HERO SECTION --- */}
        <div className="max-w-4xl mx-auto px-6 mb-16 relative z-10">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-12">
              <div>
                 <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">
                    <GitCommit className="w-4 h-4" />
                    Product Updates
                 </div>
                 <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
                    Changelog
                 </h1>
                 <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                    Jejak rekam evolusi Renunganku. Fitur baru, perbaikan bug, dan peningkatan performa dicatat di sini.
                 </p>
              </div>

              {/* RSS / Subscribe Small Form (Inactive/Ghost) */}
              <div className="flex items-center gap-2 opacity-50 cursor-not-allowed" title="Not available yet">
                 <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed">
                    <Rss className="w-4 h-4" />
                    RSS Feed
                 </button>
              </div>
           </div>
        </div>

        {/* --- EMPTY STATE / SYSTEM WAITING --- */}
        <section className="max-w-4xl mx-auto px-6 relative z-10">
           
           <div className="w-full min-h-[400px] border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
              
              {/* Background Tech Pattern */}
              <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000),linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)] bg-[length:30px_30px]"></div>

              {/* Visual Icon */}
              <div className="relative mb-8">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 z-10 relative">
                    <CloudOff className="w-8 h-8 text-slate-300" />
                 </div>
                 <div className="absolute top-0 left-0 w-20 h-20 border border-slate-200 rounded-full animate-ping opacity-20"></div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3">
                 Belum Ada Rilis Publik
              </h3>
              
              <p className="text-slate-500 max-w-md mb-10 leading-relaxed text-sm">
                 Sistem versioning telah diinisialisasi. Kami sedang mempersiapkan catatan rilis perdana untuk peluncuran v1.0.
              </p>

              {/* Terminal / Code Block Effect */}
              <div className="w-full max-w-lg bg-[#0F172A] rounded-xl p-4 text-left shadow-lg font-mono text-xs overflow-hidden">
                 <div className="flex gap-1.5 mb-4 border-b border-slate-700 pb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                 </div>
                 <div className="space-y-2 text-slate-300">
                    <div className="flex gap-2">
                       <span className="text-emerald-400">➜</span>
                       <span>system check --status</span>
                    </div>
                    <div className="text-slate-500 pl-4">All systems operational.</div>
                    
                    <div className="flex gap-2 mt-2">
                       <span className="text-emerald-400">➜</span>
                       <span>git log --oneline</span>
                    </div>
                    <div className="text-slate-500 pl-4">
                       Waiting for initial commit...
                    </div>
                    
                    <div className="flex gap-2 mt-2 animate-pulse">
                       <span className="text-emerald-400">➜</span>
                       <span className="w-2 h-4 bg-slate-500 block"></span>
                    </div>
                 </div>
              </div>

              {/* Footer Status Indicators */}
              <div className="mt-8 flex gap-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                 <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Pipeline: Idle
                 </div>
                 <div className="flex items-center gap-2">
                    <Server className="w-3 h-3" />
                    Deploy: Pending
                 </div>
              </div>

           </div>

        </section>

      </main>
      <Footer />
    </>
  );
}