import type { Metadata } from 'next';
import Link from 'next/link';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import { ArrowRight, Newspaper, Calendar, Clock } from 'lucide-react';
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
  title: 'Berita | Soplantila',
  description: 'Update terbaru, cerita di balik layar, dan berita dari Soplantila.',
};

const posts = [
  {
    slug: 'selamat-datang-di-soplantila',
    title: 'Selamat datang di Soplantila, sosmed tanpa beban.',
    excerpt: 'Cerita di balik kenapa gue mutusin buat bikin sosmed baru yang gak jualan data dan ngebebasin lo dari algoritma toxic.',
    date: '12 April 2026',
    readTime: '4 min',
    category: 'Pengumuman',
    featured: true,
  },
  {
    slug: 'kenapa-kita-hapus-algoritma',
    title: 'Kenapa kita milih ngebunuh algoritma feed?',
    excerpt: 'Kita bahas alasan teknis dan psikologis kenapa chronological feed jauh lebih sehat buat mental lo.',
    date: '10 April 2026',
    readTime: '6 min',
    category: 'Product',
    featured: false,
  },
  {
    slug: 'update-v1-2',
    title: 'Update v1.2: Chat end-to-end encryption udah live',
    excerpt: 'Privasi lo makin aman. Sekarang semua DM lo otomatis dienkripsi secara penuh.',
    date: '05 April 2026',
    readTime: '3 min',
    category: 'Release Notes',
    featured: false,
  },
  {
    slug: 'how-we-protect-your-data',
    title: 'Data lo di tangan yang tepat. Ini buktinya.',
    excerpt: 'Transparansi total tentang gimana cara kita nyimpen dan ngejaga data personal lo biar gak bocor.',
    date: '01 April 2026',
    readTime: '5 min',
    category: 'Engineering',
    featured: false,
  }
];

export default function BlogPage() {
  const featuredPost = posts.find(p => p.featured) || posts[0];
  const regularPosts = posts.filter(p => !p.featured);

  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 selection:bg-slate-200`}>
      <Header />

      <main className="flex-grow pt-32 pb-32 px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header Section */}
          <div className="mb-16 md:mb-24 flex justify-between items-end border-b border-slate-200 pb-10">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold tracking-widest text-slate-500 uppercase mb-6">
                 <Newspaper className="h-3.5 w-3.5" /> Berita Terkini
              </div>
              <h1 className="[font-family:var(--font-marketing-display)] text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
                Apa kabar <span className="text-slate-400">Soplantila.</span>
              </h1>
            </div>
            <p className="hidden md:block [font-family:var(--font-marketing-body)] text-xl text-slate-500 max-w-xs text-right animate-in fade-in duration-1000 delay-300">
              Cerita dapur, update produk, dari meja tim Soplantila buat lo.
            </p>
          </div>

          {/* Featured Post (Big Bento Style) */}
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 mb-10">
            <Link href={`/blog/${featuredPost.slug}`} className="group block relative rounded-[3rem] bg-slate-900 p-8 md:p-14 border border-slate-800 shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(15,23,42,0.4)] transition-all overflow-hidden content-center min-h-[400px] flex flex-col justify-end">
               {/* Ambient Glow */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-800/60 blur-[100px] rounded-full pointer-events-none group-hover:bg-slate-700/50 transition-colors duration-1000" />
               
               <div className="relative z-10 grid md:grid-cols-2 gap-10 items-end">
                 <div>
                   <div className="inline-flex items-center gap-3 mb-6">
                      <span className="px-3 py-1 bg-white text-slate-900 rounded-full text-xs font-bold [font-family:var(--font-marketing-display)]">{featuredPost.category}</span>
                      <div className="flex items-center gap-1 text-slate-400 text-sm [font-family:var(--font-marketing-body)]">
                         <Calendar className="w-4 h-4" /> {featuredPost.date}
                      </div>
                   </div>
                   <h2 className="[font-family:var(--font-marketing-display)] text-4xl md:text-5xl font-bold text-white mb-6 group-hover:text-slate-200 transition-colors leading-[1.1]">
                     {featuredPost.title}
                   </h2>
                   <p className="[font-family:var(--font-marketing-body)] text-lg text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                     {featuredPost.excerpt}
                   </p>
                 </div>
                 
                 <div className="flex justify-start md:justify-end">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 shadow-xl">
                       <ArrowRight className="w-7 h-7 text-slate-900" />
                    </div>
                 </div>
               </div>
            </Link>
          </div>

          {/* Grid Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
             {regularPosts.map((post) => (
               <Link 
                 key={post.slug} 
                 href={`/blog/${post.slug}`}
                 className="group flex flex-col justify-between rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all min-h-[320px]"
               >
                  <div>
                    <div className="inline-flex items-center gap-2 mb-6">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest [font-family:var(--font-marketing-display)]">{post.category}</span>
                    </div>
                    <h3 className="[font-family:var(--font-marketing-display)] text-2xl font-bold text-slate-900 mb-4 group-hover:text-slate-600 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="[font-family:var(--font-marketing-body)] text-slate-500 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
                     <div className="flex items-center gap-4 text-xs text-slate-400 font-medium [font-family:var(--font-marketing-body)]">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                     </div>
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                  </div>
               </Link>
             ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
