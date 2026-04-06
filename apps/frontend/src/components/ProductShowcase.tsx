"use client";

import {
   Heart,
   Users,
   ArrowRight,
   Quote,
   Zap,
   Globe
} from "lucide-react";
import Reveal from "@/components/Reveal";

export default function ProductShowcase() {
   return (
      <section className="py-24 bg-white relative overflow-hidden">

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* --- HEADER: THE INTRO --- */}
            <Reveal animation="fadeInUp" duration={800}>
               <div className="max-w-3xl mb-16">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                     <Globe className="w-3 h-3" />
                     Hello World
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] text-slate-900 mb-6 leading-[1.1]">
                     Selamat datang di <br />
                     <span className="text-slate-400">internet yang lebih tenang.</span>
                  </h2>
                  <p className="text-xl text-slate-600 leading-relaxed max-w-2xl font-medium">
                     Renunganku bukan sekadar aplikasi. Ini adalah antitesis dari media sosial yang Anda kenal. Tidak ada kebisingan, hanya koneksi.
                  </p>
               </div>
            </Reveal>

            {/* --- BENTO GRID: IDENTITY & STORY --- */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(300px,auto)]">

               {/* CARD 1: WELCOME / DEFINITION (Large, 7 cols) */}
               <div className="md:col-span-7">
                  <Reveal animation="fadeInUp" duration={800} delay={200} className="h-full">
                     <div className="bg-[#F0F4F8] rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-slate-200/50 h-full">
                        <div className="relative z-10">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                           </div>
                           <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                              Sebuah "Digital Sanctuary"
                           </h3>
                           <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                              Kami mendefinisikan ulang "sosial". Bukan tentang seberapa banyak mata yang melihat, tapi seberapa dalam hati yang merasa. Ini adalah ruang aman Anda.
                           </p>
                        </div>

                        {/* Visual: Abstract calming waves */}
                        <div className="absolute right-[-50px] bottom-[-50px] opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                           <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                              <path fill="#0F172A" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.2C93.5,8.8,82.2,21.9,71.2,33.1C60.2,44.3,49.5,53.6,37.8,60.8C26.1,68,13.4,73.1,-0.8,74.5C-15,75.9,-28.4,73.5,-40.5,66.6C-52.6,59.7,-63.3,48.3,-71.3,35.2C-79.3,22.1,-84.6,7.3,-82.7,-6.6C-80.8,-20.5,-71.7,-33.5,-60.8,-43.3C-49.9,-53.1,-37.2,-59.7,-24.3,-67.7C-11.4,-75.7,1.7,-85.1,15.6,-86.3C29.5,-87.5,44.2,-80.5,44.7,-76.4Z" transform="translate(100 100)" />
                           </svg>
                        </div>

                        <div className="mt-8">
                           <button className="text-slate-900 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                              Mulai perjalanan
                              <ArrowRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  </Reveal>
               </div>

               {/* CARD 2: PENJELASAN / THE PROBLEM (Dark, 5 cols) */}
               <div className="md:col-span-5">
                  <Reveal animation="fadeInUp" duration={800} delay={400} className="h-full">
                     <div className="bg-[#0F172A] rounded-[2rem] p-8 md:p-12 relative overflow-hidden text-white flex flex-col justify-center group h-full">
                        {/* Noise texture */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                        <div className="relative z-10">
                           <Quote className="w-10 h-10 text-slate-500 mb-6 rotate-180" />
                           <h3 className="text-2xl md:text-3xl font-serif italic leading-normal text-slate-200 mb-6">
                              "Di dunia yang berteriak meminta perhatian, tindakan paling revolusioner adalah menjadi tenang."
                           </h3>
                           <div className="flex items-center gap-3">
                              <div className="h-[1px] w-12 bg-slate-600"></div>
                              <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">Manifesto No. 1</span>
                           </div>
                        </div>
                     </div>
                  </Reveal>
               </div>

               {/* CARD 3: KAMI / WHO WE ARE (Full width split) */}
               <div className="md:col-span-12">
                  <Reveal animation="fadeInUp" duration={800} delay={600}>
                     <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="grid md:grid-cols-2 gap-12 items-center">

                           {/* Left: The "We" Text */}
                           <div>
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                                 <Users className="w-3 h-3" />
                                 Tentang Kami
                              </div>
                              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                                 Dibuat oleh Manusia,<br />untuk Manusia.
                              </h3>
                              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                 Kami adalah sekelompok kecil pemikir, penulis, dan developer yang lelah dengan algoritma adiktif. Kami tidak menjual data Anda. Kami tidak memanipulasi emosi Anda.
                              </p>
                              <p className="text-lg text-slate-600 leading-relaxed">
                                 Kami hanya membangun alat yang kami harap ada sejak dulu.
                              </p>
                           </div>

                           {/* Right: Abstract Team Representation */}
                           <div className="relative h-full min-h-[200px] bg-slate-50 rounded-2xl border border-slate-100 p-6 flex items-center justify-center">
                              {/* Abstract Connection Visualization */}
                              <div className="relative w-full max-w-sm aspect-video">
                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-between items-center">
                                    {/* Nodes */}
                                    <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-900 shadow-lg flex items-center justify-center z-10">
                                       <span className="text-xs font-bold">You</span>
                                    </div>
                                    <div className="flex-1 h-[2px] bg-slate-200 mx-4 relative overflow-hidden">
                                       <div className="absolute inset-0 bg-slate-900 w-1/2 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                    <div className="w-12 h-12 bg-slate-900 rounded-full border-2 border-slate-900 shadow-lg flex items-center justify-center z-10 text-white">
                                       <span className="text-xs font-bold">Us</span>
                                    </div>
                                 </div>
                                 <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <span className="text-xs font-mono text-slate-400">DIRECT_CONNECTION_ESTABLISHED</span>
                                 </div>
                              </div>
                           </div>

                        </div>
                     </div>
                  </Reveal>
               </div>

            </div>

         </div>
      </section>
   );
}