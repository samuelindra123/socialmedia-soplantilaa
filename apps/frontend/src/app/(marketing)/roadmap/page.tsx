"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Milestone, 
  Map, 
  CheckCircle2, 
  CircleDashed, 
  Circle, 
  ArrowRight,
  GitCommit,
  Clock,
  Target,
  Compass
} from "lucide-react";

// --- ROADMAP DATA ---
const ROADMAP_ITEMS = [
  {
    phase: "Phase 1: Foundation",
    quarter: "Q1 2025",
    status: "completed", // completed, current, upcoming
    title: "Membangun Pondasi Ketenangan",
    description: "Fokus pada infrastruktur inti, keamanan data, dan pengalaman dasar jurnal.",
    items: [
      "Peluncuran Private Beta (v0.9)",
      "Sistem Enkripsi End-to-End (E2EE)",
      "Editor Jurnal Distraction-Free",
      "Mode Gelap/Terang Adaptif"
    ]
  },
  {
    phase: "Phase 2: Intelligence",
    quarter: "Q2 2025",
    status: "current",
    title: "Focus Feed™ & Personalisasi",
    description: "Implementasi algoritma 'Anti-Doomscrolling' dan kurasi konten berbasis intensi.",
    items: [
      "Rilis Focus Feed™ Algoritma",
      "Analisis Mood Harian (AI-Lite)",
      "Filter Konten Negatif Otomatis",
      "Integrasi Spotify/Apple Music untuk Mood"
    ]
  },
  {
    phase: "Phase 3: Connection",
    quarter: "Q3 2025",
    status: "upcoming",
    title: "Community Circles",
    description: "Membuka ruang diskusi kelompok kecil yang dimoderasi dengan ketat.",
    items: [
      "Private Circles (Group max 50 orang)",
      "Moderasi Berbasis Komunitas",
      "Sesi 'Deep Talk' Audio Live",
      "Sistem Reputasi Member"
    ]
  },
  {
    phase: "Phase 4: Ecosystem",
    quarter: "Q4 2025+",
    status: "upcoming",
    title: "Mobile App & API",
    description: "Membawa pengalaman Renunganku ke saku Anda dan membuka platform untuk developer.",
    items: [
      "Native iOS & Android App",
      "Public API untuk Integrasi Jurnal",
      "Widget Homescreen (Daily Quotes)",
      "Export Data Fisik (Buku Cetak)"
    ]
  }
];

export default function RoadmapPage() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 selection:bg-slate-900 selection:text-white font-sans">
        
        {/* --- HERO: NORTH STAR --- */}
        <div className="max-w-5xl mx-auto px-6 mb-24">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-8">
              <Compass className="w-3 h-3 text-indigo-600" />
              North Star Metric: Human Clarity
           </div>
           
           <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Peta Jalan Menuju <br/>
              <span className="text-slate-400">Internet yang Waras.</span>
           </h1>
           
           <div className="grid md:grid-cols-3 gap-8 border-t border-slate-200 pt-8">
              <div className="space-y-2">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Misi Kami</h4>
                 <p className="text-slate-600 text-sm leading-relaxed">
                    Menciptakan ruang digital di mana teknologi melayani kesejahteraan mental manusia, bukan mengeksploitasinya.
                 </p>
              </div>
              <div className="space-y-2">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Status Saat Ini</h4>
                 <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 w-fit px-2 py-1 rounded">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Beta Phase (Q2 2025)
                 </div>
              </div>
              <div className="space-y-2">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Transparansi</h4>
                 <p className="text-slate-600 text-sm leading-relaxed">
                    Roadmap ini adalah janji hidup. Kami memperbaruinya setiap bulan berdasarkan feedback pengguna.
                 </p>
              </div>
           </div>
        </div>

        {/* --- THE TIMELINE (GANTT STYLE) --- */}
        <section className="max-w-4xl mx-auto px-6 mb-32 relative">
           
           {/* Vertical Line */}
           <div className="absolute left-6 md:left-[50%] top-0 bottom-0 w-px bg-slate-200 transform md:-translate-x-1/2"></div>

           <div className="space-y-16">
              {ROADMAP_ITEMS.map((item, index) => (
                 <div key={index} className={`relative flex flex-col md:flex-row gap-8 ${
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                 }`}>
                    
                    {/* Timeline Dot */}
                    <div className="absolute left-6 md:left-[50%] top-0 w-8 h-8 rounded-full bg-[#FDFDFD] border-2 border-slate-200 flex items-center justify-center transform -translate-x-1/2 z-10">
                       {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                       {item.status === 'current' && <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_0_4px_rgba(79,70,229,0.2)]"></div>}
                       {item.status === 'upcoming' && <Circle className="w-4 h-4 text-slate-300" />}
                    </div>

                    {/* Content Card Side */}
                    <div className="md:w-1/2 pl-16 md:pl-0">
                       <div className={`p-6 md:p-8 rounded-2xl border transition-all duration-500 ${
                          item.status === 'current' 
                          ? "bg-white border-indigo-200 shadow-xl shadow-indigo-100/50" 
                          : "bg-white border-slate-200 hover:border-slate-300"
                       }`}>
                          {/* Quarter Badge */}
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase mb-4 ${
                             item.status === 'current' ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
                          }`}>
                             <CalendarIcon status={item.status} />
                             {item.quarter}
                          </div>

                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                             {item.phase}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                          <p className="text-sm text-slate-600 leading-relaxed mb-6">
                             {item.description}
                          </p>

                          {/* Checklist Items */}
                          <ul className="space-y-3">
                             {item.items.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                                   {item.status === 'completed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                   ) : item.status === 'current' ? (
                                      <GitCommit className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                   ) : (
                                      <CircleDashed className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                                   )}
                                   <span className={item.status === 'completed' ? "line-through text-slate-400" : ""}>
                                      {feature}
                                   </span>
                                </li>
                             ))}
                          </ul>
                       </div>
                    </div>

                    {/* Empty Space for Zig-Zag Layout */}
                    <div className="md:w-1/2"></div>
                 </div>
              ))}
           </div>
        </section>

        {/* --- BOTTOM CTA: OPEN SOURCE / CONTRIBUTE --- */}
        <section className="max-w-4xl mx-auto px-6">
           <div className="bg-[#0B0C0E] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              
              {/* Texture */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
              <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-900/50 rounded-full blur-[100px]"></div>

              <div className="relative z-10 max-w-lg">
                 <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                    <Target className="w-4 h-4" />
                    Community Driven
                 </div>
                 <h3 className="text-2xl font-bold mb-2">Punya ide fitur lain?</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                    Roadmap ini tidak dipahat di atas batu. Kami mendengarkan komunitas kami. Kirimkan permintaan fitur atau vote prioritas pengembangan.
                 </p>
              </div>

              <div className="relative z-10 flex-shrink-0">
                 <button className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">
                    Ajukan Request
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>

           </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

// Helper Component for Calendar Icon based on status
function CalendarIcon({ status }: { status: string }) {
   if (status === 'completed') return <CheckCircle2 className="w-3 h-3" />;
   if (status === 'current') return <Clock className="w-3 h-3 animate-pulse" />;
   return <Map className="w-3 h-3" />;
}