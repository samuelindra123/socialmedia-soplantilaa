import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import {
  ArrowRight,
  Shield,
  Focus,
  Sparkles,
  ArrowUpRight,
  Leaf,
  Play
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-marketing-display',
  weight: ['400', '500', '600', '700'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-marketing-body',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Soplantila - Platform Sosial Media untuk Berbagi & Terhubung',
  description: 'Soplantila adalah platform sosial media Indonesia untuk berbagi postingan, mengikuti teman, dan membangun komunitas. Daftar gratis dengan email atau akun Google.',
  alternates: { canonical: 'https://www.soplantila.my.id' },
  openGraph: {
    title: 'Soplantila - Platform Sosial Media Indonesia',
    description: 'Berbagi konten, terhubung dengan teman, dan bangun komunitas di Soplantila. Login mudah dengan akun Google.',
    url: 'https://www.soplantila.my.id',
    siteName: 'Soplantila',
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 overflow-x-hidden selection:bg-slate-200`}>
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl opacity-30 pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-b from-slate-200/50 to-transparent blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-1.5 text-xs font-medium tracking-wide text-slate-600 mb-8 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
              <span>Sekarang waktunya pindah sosmed</span>
            </div>

            <h1 className="animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out delay-150 fill-mode-both [font-family:var(--font-marketing-display)] text-6xl md:text-8xl font-medium tracking-tighter text-slate-900 leading-[1.05]">
              Sosial media yang <br className="hidden md:block" />
              <span className="text-slate-400">gak bikin pusing.</span>
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out delay-300 fill-mode-both mx-auto mt-8 max-w-2xl [font-family:var(--font-marketing-body)] text-lg md:text-xl leading-relaxed text-slate-500 font-light">
              Bosen sama feed yang isinya iklan mulu? Posting cerita lo, ngobrol santai bareng sirkel lo, tanpa drama dan algoritma aneh yang bikin capek.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out delay-500 fill-mode-both mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-slate-900 px-8 [font-family:var(--font-marketing-body)] text-sm font-medium text-white transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(0,0,0,0.4)]"
              >
                Cobain sekarang gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/manifesto"
                className="flex h-12 w-full sm:w-auto items-center justify-center rounded-full bg-white px-8 [font-family:var(--font-marketing-body)] text-sm font-medium text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50"
              >
                Kenapa kita beda?
              </Link>
            </div>
          </div>
        </section>

        {/* CODE-BASED PRODUCT SHOWCASE DEMO */}
        <section className="px-6 lg:px-8 pb-32 max-w-[1200px] mx-auto hidden sm:block">
          <div className="animate-in fade-in zoom-in-95 duration-1000 delay-700 fill-mode-both relative rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-[0_30px_100px_rgba(15,23,42,0.4)] p-2 overflow-hidden group">
            
            {/* Window Controls */}
            <div className="absolute top-6 left-6 flex gap-2 z-50">
              <div className="w-3 h-3 rounded-full bg-slate-700/60" />
              <div className="w-3 h-3 rounded-full bg-slate-700/60" />
              <div className="w-3 h-3 rounded-full bg-slate-700/60" />
            </div>
            
            {/* Play Button Indicator (Decorative) */}
            <div className="absolute top-5 right-6 flex items-center gap-2 text-slate-500 z-50 font-medium text-xs tracking-widest [font-family:var(--font-marketing-display)]">
               <Play className="w-3 h-3" fill="currentColor" /> DEMO OTOMATIS
            </div>

            {/* Playback progress bar */}
            <div className="absolute bottom-6 left-12 right-12 h-1 bg-slate-800 rounded-full z-50 overflow-hidden backdrop-blur-md">
               <div className="h-full bg-white/70 rounded-full animate-video-progress" />
            </div>

            <div className="relative w-full aspect-video bg-[#0B1120] rounded-[2rem] overflow-hidden flex items-center justify-center">
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes videoProgress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                  }
                  @keyframes scene1 {
                    0%, 5% { opacity: 0; transform: scale(0.95); }
                    10%, 25% { opacity: 1; transform: scale(1); }
                    30%, 100% { opacity: 0; transform: scale(1.05); visibility: hidden; }
                  }
                  @keyframes scene2 {
                    0%, 28% { opacity: 0; transform: translateY(40px); visibility: hidden; }
                    32%, 58% { opacity: 1; transform: translateY(0); visibility: visible; }
                    62%, 100% { opacity: 0; transform: translateY(-40px); visibility: hidden; }
                  }
                  @keyframes scene3 {
                    0%, 61% { opacity: 0; transform: scale(0.95); visibility: hidden; }
                    65%, 92% { opacity: 1; transform: scale(1); visibility: visible; }
                    96%, 100% { opacity: 0; transform: scale(1.05); visibility: hidden; }
                  }
                  @keyframes scrollFeed {
                    0%, 30% { transform: translateY(0); }
                    40%, 60% { transform: translateY(-130px); }
                    70%, 100% { transform: translateY(-260px); }
                  }
                  @keyframes typingBubble1 {
                    0%, 70% { opacity: 0; transform: translateY(10px); }
                    74%, 100% { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes typingBubble2 {
                    0%, 80% { opacity: 0; transform: translateY(10px); }
                    84%, 100% { opacity: 1; transform: translateY(0); }
                  }
                  .animate-video-progress { animation: videoProgress 16s linear infinite; }
                  .animate-scene-1 { animation: scene1 16s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                  .animate-scene-2 { animation: scene2 16s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                  .animate-scene-3 { animation: scene3 16s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                  .animate-feed-scroll { animation: scrollFeed 16s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                  .animate-typing-1 { animation: typingBubble1 16s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                  .animate-typing-2 { animation: typingBubble2 16s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                `}} />

                {/* SCENE 1: Logo Reveal (0s - 4.5s) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center animate-scene-1 z-30">
                   <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-slate-700 flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.08)] mb-8 relative group">
                      <div className="absolute inset-0 bg-white/10 rounded-[2rem] blur-2xl" />
                      <Leaf className="w-12 h-12 text-white relative z-10" strokeWidth={2} />
                   </div>
                   <h2 className="[font-family:var(--font-marketing-display)] text-5xl font-bold text-white tracking-tight mb-4">Soplantila</h2>
                   <p className="text-slate-400 font-medium tracking-[0.3em] uppercase text-xs">SOSMED YANG GAK BIKIN PUSING</p>
                </div>

                {/* SCENE 2: The Feed Scroll (4.5s - 9.5s) */}
                <div className="absolute inset-0 flex items-center justify-center animate-scene-2 z-20 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]">
                   <div className="w-[320px] h-[520px] bg-slate-50 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden relative mr-16">
                      <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl z-10 border-b border-slate-200/50 flex items-center justify-center">
                         <div className="w-20 h-2 bg-slate-200 rounded-full" />
                      </div>
                      <div className="p-4 pt-20 animate-feed-scroll space-y-4">
                         {[1,2,3].map((i) => (
                            <div key={`post-${i}`} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                               <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                                  <div className="h-2 w-24 bg-slate-200 rounded-full" />
                               </div>
                               <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl mb-3" />
                               <div className="space-y-2">
                                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                                  <div className="h-2 w-4/5 bg-slate-100 rounded-full" />
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                   <div className="max-w-sm">
                     <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-[10px] font-medium tracking-widest text-white mb-6">
                        01 / FEED LO PRIBADI
                     </div>
                     <h3 className="[font-family:var(--font-marketing-display)] text-5xl font-medium tracking-tight text-white mb-4">Feed bersih. <br className="hidden md:block"/><span className="text-slate-500">Tanpa drama.</span></h3>
                     <p className="[font-family:var(--font-marketing-body)] text-slate-400 text-lg leading-relaxed">Gak ada iklan nyelip atau algoritma aneh. Cuma postingan dari orang yang beneran lo follow.</p>
                   </div>
                </div>

                {/* SCENE 3: Chat Interactivity (9.5s - 16s) */}
                <div className="absolute inset-0 flex items-center justify-center animate-scene-3 z-10 bg-[radial-gradient(ellipse_at_left,rgba(255,255,255,0.02)_0%,transparent_70%)]">
                   <div className="max-w-sm text-right mr-16">
                     <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-[10px] font-medium tracking-widest text-white mb-6">
                        02 / CHAT AMAN
                     </div>
                     <h3 className="[font-family:var(--font-marketing-display)] text-5xl font-medium tracking-tight text-white mb-4">Privasi lo <br className="hidden md:block"/><span className="text-slate-500">dijaga ketat.</span></h3>
                     <p className="[font-family:var(--font-marketing-body)] text-slate-400 text-lg leading-relaxed text-right ml-auto">Kirim pesan ke temen tanpa khawatir data lo dibaca atau dijual. Privasi lo seratus persen aman di sini.</p>
                   </div>
                   <div className="w-[320px] h-[520px] bg-slate-900 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl relative flex flex-col justify-end p-4">
                      {/* Top Bar Navigation UI */}
                      <div className="absolute top-0 left-0 right-0 h-16 bg-slate-800/90 backdrop-blur-xl z-10 rounded-t-[2rem] flex items-center px-5 gap-3 border-b border-slate-700/50">
                         <div className="w-8 h-8 rounded-full bg-slate-600" />
                         <div className="h-2 w-20 bg-slate-600 rounded-full" />
                      </div>
                      
                      {/* Chat Bubbles Container */}
                      <div className="space-y-4 mb-20 z-0">
                         <div className="flex gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-700 shrink-0" />
                           <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm text-slate-300 text-xs w-[85%]">
                             <div className="h-2 w-full bg-slate-600 rounded-full mb-3" />
                             <div className="h-2 w-3/4 bg-slate-600 rounded-full" />
                           </div>
                         </div>
                         <div className="flex gap-2 flex-row-reverse animate-typing-1">
                           <div className="bg-white p-4 rounded-2xl rounded-tr-sm w-[75%] shadow-lg">
                             <div className="h-2 w-full bg-slate-200 rounded-full mb-3" />
                             <div className="h-2 w-1/2 bg-slate-200 rounded-full" />
                           </div>
                         </div>
                         <div className="flex gap-2 animate-typing-2">
                           <div className="w-6 h-6 rounded-full bg-slate-700 shrink-0" />
                           <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm w-[45%] flex gap-1.5 items-center">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-100" />
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-200" />
                           </div>
                         </div>
                      </div>
                      
                      {/* Keyboard / Input mock */}
                      <div className="absolute bottom-6 left-4 right-4 h-12 bg-slate-800 rounded-full flex items-center px-5 border border-slate-700">
                         <div className="h-2 w-1/3 bg-slate-600 rounded-full" />
                      </div>
                   </div>
                </div>

            </div>
          </div>
        </section>

        {/* BENTO GRID / FEATURES */}
        <section className="px-6 lg:px-8 py-24 bg-white border-t border-slate-100">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-16">
              <h2 className="[font-family:var(--font-marketing-display)] text-3xl md:text-5xl font-medium tracking-tight text-slate-900">
                Dibuat buat lo yang udah bosen
              </h2>
              <p className="mt-4 [font-family:var(--font-marketing-body)] text-lg text-slate-500 max-w-xl">
                Fitur yang lo butuhin, tanpa yang ribet. Gak ada iklan, gak ada algoritma aneh pencuri atensi. Cuma platform asik buat ngobrol.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 rounded-[2.5rem] bg-[#FAFAFA] p-10 lg:p-12 border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-shadow duration-500">
                 <Focus className="w-10 h-10 text-slate-400 mb-8" />
                 <h3 className="[font-family:var(--font-marketing-display)] text-3xl font-medium text-slate-900 mb-4">Fokus ke Konten</h3>
                 <p className="[font-family:var(--font-marketing-body)] text-slate-500 text-lg leading-relaxed max-w-md">
                   Gak ada algoritma robot yang nentuin lo harus liat postingan apaan. Cuma konten real dari temen-temen yang beneran lo follow.
                 </p>
              </div>
              <div className="rounded-[2.5rem] bg-slate-900 p-10 lg:p-12 text-white shadow-2xl shadow-slate-900/20">
                 <Shield className="w-10 h-10 text-slate-500 mb-8" />
                 <h3 className="[font-family:var(--font-marketing-display)] text-3xl font-medium text-white mb-4">Data lo aman</h3>
                 <p className="[font-family:var(--font-marketing-body)] text-slate-400 leading-relaxed">
                   Gak dijual ke siapa-siapa. Gak dipake buat iklan target. Privasi lo beneran kita jaga ketat.
                 </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-32 px-6 lg:px-8 relative overflow-hidden bg-[#FAFAFA]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] max-w-4xl opacity-40 pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-r from-slate-200 flex via-slate-100 to-slate-200 blur-3xl rounded-full" />
          </div>

          <div className="mx-auto max-w-4xl text-center relative z-10">
            <h2 className="[font-family:var(--font-marketing-display)] text-4xl md:text-6xl font-medium tracking-tighter text-slate-900 mb-6">
              Yuk gabung sekarang
            </h2>
            <p className="[font-family:var(--font-marketing-body)] text-xl text-slate-500 mb-10">
              Tinggalin sosmed toxic lo dan rasain bedanya main sosmed tanpa beban.
            </p>
            <Link
              href="/signup"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-900 px-8 [font-family:var(--font-marketing-body)] text-base font-medium text-white transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
            >
              Daftar sekarang gratis
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>
        </section>

        {/* GOOGLE OAUTH DISCLOSURE — required for Google OAuth verification */}
        <section className="py-16 px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
          <div className="mx-auto max-w-3xl">
            <h2 className="[font-family:var(--font-marketing-display)] text-2xl font-bold text-slate-900 mb-4">
              Tentang Soplantila & Penggunaan Akun Google
            </h2>
            <p className="[font-family:var(--font-marketing-body)] text-slate-600 mb-6 leading-relaxed">
              Soplantila adalah <strong>platform sosial media</strong> yang memungkinkan pengguna untuk membuat akun, berbagi postingan, mengikuti pengguna lain, berinteraksi melalui komentar dan likes, serta berkomunikasi melalui pesan langsung.
            </p>
            <div className="space-y-4 text-sm text-slate-600 [font-family:var(--font-marketing-body)]">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-800 mb-1">Mengapa kami meminta akses Google?</p>
                <p>Soplantila menawarkan opsi <strong>Login dengan Google</strong> sebagai cara mudah untuk membuat atau masuk ke akun. Kami hanya meminta akses ke <strong>nama, alamat email, dan foto profil</strong> dari akun Google kamu — tidak lebih.</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-800 mb-1">Data apa yang kami gunakan?</p>
                <p>Data dari Google hanya digunakan untuk membuat profil akun Soplantila kamu. Kami <strong>tidak menyimpan password Google</strong>, tidak mengakses email kamu, dan tidak membagikan data ke pihak ketiga untuk tujuan iklan.</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-800 mb-1">Keamanan & Privasi</p>
                <p>Penggunaan data Google kami sesuai dengan <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-slate-900 underline">Google API Services User Data Policy</a>, termasuk persyaratan Limited Use. Baca <Link href="/privacy" className="text-slate-900 underline">Kebijakan Privasi</Link> kami untuk detail lengkap.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
