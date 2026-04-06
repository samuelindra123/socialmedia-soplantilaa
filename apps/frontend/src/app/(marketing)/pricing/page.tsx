"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Check, 
  Bell, 
  Zap, 
  Shield, 
  Users, 
  Building, 
  Feather, 
  Sparkles,
  ArrowRight,
  Clock,
  Loader2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Data Structure untuk Plan Masa Depan
const UPCOMING_PLANS = [
  {
    id: "plus",
    name: "Reflector Plus",
    icon: Sparkles,
    desc: "AI-powered insights untuk jurnal harian Anda.",
    features: ["Analisis Mood AI", "Export PDF Cantik", "Tema Kustom"],
    price: "Rp 29rb/bln"
  },
  {
    id: "creator",
    name: "Creator",
    icon: Feather,
    desc: "Publikasikan pemikiran Anda via Newsletter.",
    features: ["Newsletter Tool", "Custom Domain", "Subscriber Analytics"],
    price: "Rp 79rb/bln"
  },
  {
    id: "community",
    name: "Community",
    icon: Users,
    desc: "Bangun ruang diskusi privat (Circle) berbayar.",
    features: ["Private Circles", "Paid Membership", "Moderation Tools"],
    price: "Rp 149rb/bln"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building,
    desc: "Solusi White-label untuk organisasi & wellbeing.",
    features: ["SSO Enforcement", "Audit Logs", "Dedicated Support"],
    price: "Custom"
  }
];

export default function PricingPage() {
  const [notifiedPlans, setNotifiedPlans] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleNotify = (id: string) => {
    setLoadingId(id);
    // Simulasi API Call
    setTimeout(() => {
      setNotifiedPlans((prev) => [...prev, id]);
      setLoadingId(null);
    }, 1500);
  };

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 selection:bg-black selection:text-white font-sans">
        
        {/* --- BACKGROUND --- */}
        <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* --- HEADER COPY --- */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-6">
               <Shield className="w-3 h-3 text-slate-900" />
               Fair Pricing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-slate-900 mb-6">
              Investasi untuk <span className="text-slate-400">ketenangan.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed font-medium">
              Mulai gratis selamanya. Upgrade hanya ketika Anda membutuhkan fitur lebih dalam. Tanpa iklan, tanpa penjualan data.
            </p>
          </div>

          {/* --- MAIN GRID LAYOUT --- */}
          {/* Top Row: The Free Plan (Hero) */}
          <div className="mb-12">
             <div className="relative bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl shadow-slate-200/40 overflow-hidden group">
                {/* Active Badge */}
                <div className="absolute top-6 right-6 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-bold">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   Available Now
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                   <div>
                      <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-md">
                         <Zap className="w-7 h-7 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">Starter (Free)</h2>
                      <p className="text-slate-500 text-lg mb-8">
                         Semua yang Anda butuhkan untuk mulai menulis jurnal dan berdiskusi secara bermakna.
                      </p>
                      
                      {/* Price Tag */}
                      <div className="flex items-baseline gap-1 mb-8">
                         <span className="text-4xl font-bold text-slate-900">Rp 0</span>
                         <span className="text-slate-400 font-medium">/ selamanya</span>
                      </div>

                      <Link 
                        href="/signup"
                        className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-lg shadow-slate-900/10 w-full md:w-auto"
                      >
                         Mulai Sekarang
                         <ArrowRight className="w-4 h-4" />
                      </Link>
                      <p className="mt-4 text-xs text-slate-400">
                         Tidak memerlukan kartu kredit.
                      </p>
                   </div>

                   {/* Features List */}
                   <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 h-full">
                      <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wide">Yang Anda Dapatkan:</h4>
                      <ul className="space-y-4">
                         {[
                            "Akses penuh ke Focus Feed™",
                            "Jurnal pribadi unlimited (Enkripsi E2E)",
                            "Bergabung ke Public Circles",
                            "Mode Gelap / Terang",
                            "Export data kapan saja"
                         ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-600 text-sm font-medium">
                               <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 text-slate-600" />
                               </div>
                               {item}
                            </li>
                         ))}
                      </ul>
                   </div>
                </div>
             </div>
          </div>

          {/* --- SEPARATOR: THE ROADMAP --- */}
          <div className="flex items-center gap-4 mb-12">
             <div className="h-px bg-slate-200 flex-1"></div>
             <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                Coming Soon / Roadmap
             </div>
             <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* --- UPCOMING PLANS GRID --- */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             {UPCOMING_PLANS.map((plan) => {
                const isNotified = notifiedPlans.includes(plan.id);
                const isLoading = loadingId === plan.id;
                const Icon = plan.icon;

                return (
                   <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-slate-300 transition-colors group relative overflow-hidden">
                      {/* Blueprint Texture */}
                      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000),linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)] bg-[length:20px_20px]"></div>
                      
                      <div className="relative z-10 flex-1 flex flex-col">
                         <div className="w-10 h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center mb-4 group-hover:bg-slate-100 transition-colors">
                            <Icon className="w-5 h-5 text-slate-500" />
                         </div>
                         
                         <h3 className="font-bold text-slate-900 mb-1">{plan.name}</h3>
                         <div className="text-xs font-mono text-slate-400 mb-4">{plan.price}</div>
                         
                         <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                            {plan.desc}
                         </p>

                         {/* Mini Features */}
                         <ul className="space-y-2 mb-6">
                            {plan.features.map((f, i) => (
                               <li key={i} className="text-[11px] text-slate-400 flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                  {f}
                               </li>
                            ))}
                         </ul>

                         {/* Action Button */}
                         <button
                            onClick={() => !isNotified && handleNotify(plan.id)}
                            disabled={isNotified || isLoading}
                            className={`w-full py-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                               isNotified 
                               ? "bg-slate-100 border-slate-200 text-slate-500 cursor-default"
                               : "bg-white border-slate-200 text-slate-900 hover:border-slate-900 hover:bg-slate-50"
                            }`}
                         >
                            {isLoading ? (
                               <>
                                 <Loader2 className="w-3 h-3 animate-spin" />
                                 Processing...
                               </>
                            ) : isNotified ? (
                               <>
                                 <Check className="w-3 h-3 text-emerald-500" />
                                 Notified
                               </>
                            ) : (
                               <>
                                 <Bell className="w-3 h-3" />
                                 Notify when ready
                               </>
                            )}
                         </button>
                      </div>
                   </div>
                );
             })}
          </div>

          {/* --- ENTERPRISE CONTACT STRIP --- */}
          <div className="mt-12 p-6 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
             <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
             
             <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                   <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h4 className="font-bold text-lg">Butuh kustomisasi khusus?</h4>
                   <p className="text-slate-400 text-sm">Untuk organisasi besar, sekolah, atau komunitas kesehatan mental.</p>
                </div>
             </div>
             
             <div className="relative z-10">
                <Link href="mailto:enterprise@renunganku.id" className="px-6 py-3 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
                   Hubungi Sales
                </Link>
             </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}