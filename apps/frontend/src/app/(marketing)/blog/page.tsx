import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Rss, PenTool, Clock, User, Tag, Sparkles } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/types";
import { buildBackendUrl } from "@/lib/server/backend-url";
import {
  getInternalApiToken,
  INTERNAL_API_TOKEN_HEADER,
} from "@/lib/server/internal-api-token";

function mapCategoryLabel(category: BlogPost["category"]): string {
  switch (category) {
    case "ProductAndVision":
      return "Product & Vision";
    case "Engineering":
      return "Engineering";
    case "Design":
      return "Design";
    case "Culture":
      return "Culture";
    default:
      return category;
  }
}

function formatReadTime(readTimeMinutes: number): string {
  if (!readTimeMinutes || readTimeMinutes <= 0) return "-";
  return `${readTimeMinutes} menit`;
}

function formatPublishedAt(publishedAt: string | null): string {
  if (!publishedAt) return "";
  const date = new Date(publishedAt);
  return date.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(buildBackendUrl("/blog"), {
    headers: {
      [INTERNAL_API_TOKEN_HEADER]: getInternalApiToken(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as BlogPost[] | null;
  return data ?? [];
}

export default async function BlogPage() {
  const posts = await fetchBlogPosts();

  const featured = posts[0] ?? null;
  const others = posts.slice(1);

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 selection:bg-black selection:text-white font-sans relative">
        
        {/* --- BACKGROUND TEXTURE --- */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* --- PAGE HEADER --- */}
        <div className="max-w-7xl mx-auto px-6 mb-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                <Rss className="w-3 h-3" />
                The Journal
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6">
                Perspektif & <br/>
                <span className="text-slate-400">Pembaruan.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed font-medium">
                Catatan harian tentang engineering, desain, dan filosofi di balik pembangunan Renunganku.
              </p>
            </div>
          </div>
        </div>

        {/* --- BLOG LIST (data asli dari backend) --- */}
        <section className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Empty state */}
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-slate-500">
              <p className="text-sm font-medium mb-2">Belum ada artikel di blog.</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Saat konten pertama diterbitkan dari panel admin, artikel akan muncul di sini
                secara otomatis.
              </p>
            </div>
          ) : (
            <>
          {/* Featured article */}
          {featured && (
            <div className="mb-16">
              <Link
                href={`/blog/${featured.slug}`}
                className="relative block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70"
                aria-label={featured.title}
              >
                <article className="relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0f172a_0,#020617_45%,#000_100%)] opacity-80" />
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_0,#6366f122_0,transparent_40%),radial-gradient(circle_at_90%_0,#ec489944_0,transparent_45%)]" />
                  <div className="relative p-8 md:p-10 flex flex-col gap-6 text-white">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur">
                        <Sparkles className="w-3.5 h-3.5" />
                        Artikel unggulan
                      </span>
                      <span className="h-3 w-px bg-white/30" />
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur">
                        <PenTool className="w-3.5 h-3.5" />
                        {mapCategoryLabel(featured.category)}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl md:text-3xl lg:text-[2.35rem] font-semibold tracking-tight leading-tight mb-3">
                        {featured.title}
                      </h2>
                      <p className="text-sm md:text-base text-slate-100/90 max-w-xl leading-relaxed">
                        {featured.excerpt}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] md:text-xs text-slate-100/80">
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 text-[10px] font-semibold">
                          <User className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">{featured.authorName}</span>
                          <span className="text-slate-200/70 text-[10px]">
                            {featured.authorRole}
                          </span>
                        </div>
                      </div>
                      <span className="h-4 w-px bg-white/20" />
                      <div className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatReadTime(featured.readTimeMinutes)}</span>
                        <span className="mx-1 text-slate-300/60">·</span>
                        <span>{formatPublishedAt(featured.publishedAt)}</span>
                      </div>
                      {featured.tags.length > 0 && (
                        <>
                          <span className="h-4 w-px bg-white/20" />
                          <div className="inline-flex items-center gap-2 flex-wrap">
                            {featured.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] ring-1 ring-white/20"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          )}

          {/* Secondary posts grid */}
          {others.length > 0 && (
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {others.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group h-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70"
                aria-label={post.title}
              >
                <article className="flex h-full flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                      {mapCategoryLabel(post.category)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 normal-case">
                      <Clock className="w-3 h-3" />
                      <span>{formatReadTime(post.readTimeMinutes)}</span>
                      {post.publishedAt && (
                        <>
                          <span className="mx-1">·</span>
                          <span>{formatPublishedAt(post.publishedAt)}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1.5 leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">
                        {post.authorName}
                      </span>
                    </span>
                    <span />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] text-slate-600 border border-slate-200 group-hover:border-slate-300"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                </article>
              </Link>
            ))}
          </div>
          )}
          </>
          )}
        </section>

      </main>
      <Footer />
    </>
  );
}