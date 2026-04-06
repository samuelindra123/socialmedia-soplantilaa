import Link from "next/link";
import {
  Search,
  PenLine,
  Layout,
  MessageSquare,
  Bell,
  Settings,
  MoreHorizontal,
  Sparkles,
  Zap,
  BookOpen,
  Heart,
} from "lucide-react";
import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";

export default function Hero() {
  return (
    <section className="relative bg-[#FAFAFA] pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden selection:bg-black selection:text-white">

      {/* --- BACKGROUND ENGINEERING --- */}
      {/* 1. Base Grid: Very subtle technical grid */}
      <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* 2. Ambient Glow: Warm gray light, no blue */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white blur-[100px] rounded-[100%] -z-10 opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* --- LEFT: COPYWRITING --- */}
          <div className="max-w-2xl relative z-10">
            <Reveal animation="fadeInUp" duration={800} delay={200}>
              {/* BADGE: BETA EARLY ACCESS */}
              <div className="inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all cursor-default mb-8 group">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-slate-900 transition-colors">
                  Beta Early Access
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] text-slate-500 font-medium">v0.9.2 Live</span>
              </div>

              {/* HEADLINE: METALLIC GRADIENT */}
              <h1 className="text-5xl sm:text-6xl lg:text-[4.75rem] font-bold tracking-[-0.03em] text-slate-900 mb-8 leading-[1]">
                Refleksi diri, <br />
                <span className="relative">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400">
                    tanpa distraksi.
                  </span>
                  {/* Decorative Squiggle SVG */}
                  <svg className="absolute -bottom-2 right-0 w-32 h-4 text-slate-300" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10C20 20 40 0 60 10C80 20 100 5 100 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg font-medium tracking-tight">
                Eksplorasi pikiran dalam ruang digital yang tenang. Fokus pada esensi, bukan atensi.
              </p>

              {/* BUTTONS: PRO GRADE & CONSISTENT */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">

                {/* Primary: MATCHING HEADER (Black + Zap) */}
                <Link
                  href="/signup"
                  className="group relative w-full sm:w-auto inline-flex justify-center items-center h-12 px-8 font-semibold text-white bg-black rounded-xl overflow-hidden shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>Akses Beta Sekarang</span>
                  </span>
                  {/* Metallic Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                </Link>

                {/* Secondary: MANIFESTO */}
                <Link
                  href="/manifesto"
                  className="group w-full sm:w-auto inline-flex justify-center items-center h-12 px-8 font-semibold text-slate-600 bg-transparent border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:text-black transition-all hover:shadow-sm"
                >
                  <BookOpen className="w-4 h-4 mr-2 text-slate-400 group-hover:text-black transition-colors" />
                  Baca Manifesto
                </Link>
              </div>

              {/* SOCIAL PROOF: AVATAR STACK */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#FAFAFA] bg-slate-200 shadow-sm relative overflow-hidden">
                      {/* Placeholder pattern for avatars to look real but abstract */}
                      <div className={`absolute inset-0 opacity-50 ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-400'}`}></div>
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-500">
                  <span className="text-slate-900 font-bold">2,400+</span> pemikir telah bergabung.
                </div>
              </div>
            </Reveal>

            {/* MOBILE VISUAL: PHONE MOCKUP */}
            <Reveal animation="fadeInUp" duration={800} delay={350}>
              <div className="mt-10 flex justify-center lg:hidden">
                <PhoneMock />
              </div>
            </Reveal>
          </div>

          {/* --- RIGHT: THE NATIVE APP MOCKUP (DESKTOP) --- */}
          <div className="relative hidden lg:block perspective-[2500px]">
            <Reveal animation="fadeIn" duration={1000} delay={400}>
              <div className="relative w-full ml-auto transform transition-transform duration-700 hover:rotate-y-[-2deg] hover:rotate-x-2 hover:scale-[1.01]">
                <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_30px_60px_-12px_rgba(0,0,0,0.08)] ring-1 ring-slate-900/5 overflow-hidden">
                  <div className="flex h-[550px] bg-[#F8F9FA]">
                    {/* Sidebar */}
                    <div className="w-[70px] flex-shrink-0 bg-[#F1F2F4] border-r border-slate-200 flex flex-col items-center py-6 gap-6">
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white mb-2 shadow-md">
                        <Logo variant="icon" height={16} />
                      </div>
                      <div className="flex flex-col gap-4 w-full px-3">
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-900">
                          <Layout className="w-5 h-5" />
                        </div>
                        <div className="w-10 h-10 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all flex items-center justify-center">
                          <Search className="w-5 h-5" />
                        </div>
                        <div className="w-10 h-10 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all flex items-center justify-center">
                          <Bell className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-auto">
                        <div className="w-8 h-8 rounded-full bg-slate-300" />
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                        <h3 className="font-bold text-slate-900 text-sm tracking-tight">Feed Refleksi</h3>
                        <div className="flex gap-2">
                          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-md">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-hidden relative [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)]">
                        <div className="absolute inset-0 px-6 py-4 space-y-5 animate-[scrollUp_25s_linear_infinite] hover:[animation-play-state:paused]">
                          {[1, 2, 3, 4, 1, 2, 3, 4].map((item, idx) => (
                            <div
                              key={idx}
                              className="group relative bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-md"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 border border-white shadow-sm" />
                                  <div>
                                    <div className="text-sm font-bold text-slate-900">User_{1024 + idx}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">@user{1024 + idx} • 2j</div>
                                  </div>
                                </div>
                                <button className="text-slate-300 hover:text-slate-600">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                                {idx % 2 === 0
                                  ? "Ketenangan bukanlah saat tidak ada suara, tapi saat pikiran berdamai dengan kebisingan. Sebuah catatan kecil untuk diri sendiri hari ini."
                                  : "Mencoba fitur jurnal baru di Renunganku. Sangat membantu untuk tracking mood tanpa tekanan likes."}
                              </p>
                              <div className="flex gap-4 mt-4 pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs group-hover:text-slate-600 transition-colors">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Diskusi</span>
                                </div>
                                {idx % 2 === 0 && (
                                  <div className="ml-auto flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                                    <Sparkles className="w-3 h-3 text-slate-500" />
                                    Trending
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="absolute bottom-6 right-6 z-30">
                        <button className="group flex items-center justify-center w-12 h-12 bg-black text-white rounded-full shadow-lg shadow-slate-900/20 hover:scale-110 transition-transform">
                          <PenLine className="w-5 h-5" />
                          <span className="absolute right-full mr-3 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Tulis Renungan
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone overlay */}
                <div className="absolute -right-10 bottom-0 translate-y-10">
                  <PhoneMock className="h-[380px] w-[210px] shadow-[0_20px_45px_rgba(15,23,42,0.45)]" />
                </div>
              </div>
            </Reveal>

            {/* Decorative stripes */}
            <div className="absolute -right-12 top-12 -z-10 opacity-20 transform rotate-12">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-2 h-64 bg-slate-300 rounded-full" />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function PhoneMock({ className }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col rounded-[2rem] border border-slate-800/60 bg-slate-950 text-white overflow-hidden ${
        className || "h-[420px] w-[230px] shadow-[0_20px_45px_rgba(15,23,42,0.6)]"
      }`}
    >
      {/* Status bar */}
      <div className="h-9 px-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/90">
        <span>09:41</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="w-3 h-1 rounded-full bg-slate-500"></span>
          <span className="w-4 h-2 rounded bg-slate-500"></span>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div>
          <p className="text-[11px] font-semibold text-slate-300">Feed Refleksi</p>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
            Tenang • Aktif
          </p>
        </div>
        <div className="flex gap-1.5 text-slate-500">
          <Search className="w-3.5 h-3.5" />
          <Bell className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-3 py-3 space-y-2.5 text-[11px] [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]">
        <div className="space-y-2">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2.5 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold truncate">user_{idx} • 3j</span>
                    {idx === 1 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        Tenang
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-300 leading-snug line-clamp-3">
                {idx === 1
                  ? "Catatan kecil hari ini: menarik napas lebih panjang dari biasanya, dan mengizinkan diri diam tanpa rasa bersalah."
                  : idx === 2
                  ? "Satu paragraf sehari cukup untuk melatih kejujuran pada diri sendiri. Tidak untuk feed publik, tapi untuk hati."
                  : "Tidak semua hal harus dibalas cepat. Beberapa pesan layak dipikirkan dulu dalam diam."}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[9px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> 24
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> 6
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="h-11 border-t border-slate-800 bg-slate-950 flex items-center justify-around text-[10px] text-slate-500">
        <div className="flex flex-col items-center gap-0.5 text-emerald-400">
          <Layout className="w-3.5 h-3.5" />
          <span>Beranda</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Search className="w-3.5 h-3.5" />
          <span>Cari</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Pesan</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Settings className="w-3.5 h-3.5" />
          <span>Profil</span>
        </div>
      </div>
    </div>
  );
}