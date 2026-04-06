import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Rss, Clock, User, Tag, Sparkles } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
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

function mapStatusLabel(status: BlogPost["status"]): string {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "DRAFT":
      return "Draft";
    case "SCHEDULED":
      return "Scheduled";
    default:
      return status;
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
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const res = await fetch(
    buildBackendUrl(`/blog/${encodeURIComponent(slug)}`),
    {
      headers: {
        [INTERNAL_API_TOKEN_HEADER]: getInternalApiToken(),
      },
    cache: "no-store",
    },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Gagal memuat blog post");
  }

  const data = (await res.json()) as BlogPost;
  return data ?? null;
}

interface BlogDetailPageProps {
  params: { slug: string };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const post = await fetchBlogPost(params.slug);

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 selection:bg-black selection:text-white font-sans relative">
          <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

          <div className="max-w-3xl mx-auto px-6 relative z-10">
            <div className="mb-6 text-xs text-slate-500">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 hover:bg-slate-100 transition"
              >
                <span className="h-1 w-1 rounded-full bg-slate-500" />
                Kembali ke semua artikel
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 px-6 py-10 text-center shadow-sm">
              <h1 className="text-xl font-semibold text-slate-900 mb-3">
                Artikel tidak ditemukan
              </h1>
              <p className="text-sm text-slate-500">
                Artikel yang Anda coba buka mungkin sudah dihapus, diubah, atau belum dipublikasikan.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 selection:bg-black selection:text-white font-sans relative">
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-5xl mx-auto px-6 mb-12 relative z-10">
          <div className="mb-4 text-xs text-slate-500">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 hover:bg-slate-100 transition"
            >
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              Kembali ke semua artikel
            </Link>
          </div>
          <div className="flex flex-col gap-6 border-b border-slate-200 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider w-fit">
              <Rss className="w-3 h-3" />
              The Journal · {mapCategoryLabel(post.category)}
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
                {post.title}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-semibold">
                  <User className="w-3.5 h-3.5" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 text-sm">{post.authorName}</span>
                  <span className="text-[11px] text-slate-500">{post.authorRole}</span>
                </div>
              </div>
              <span className="h-4 w-px bg-slate-200" />
              <div className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatReadTime(post.readTimeMinutes)}</span>
                {post.publishedAt && (
                  <>
                    <span className="mx-1 text-slate-300">·</span>
                    <span>{formatPublishedAt(post.publishedAt)}</span>
                  </>
                )}
              </div>
              <span className="h-4 w-px bg-slate-200" />
              <div className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium text-slate-700 border-slate-200 bg-slate-50">
                <Sparkles className="w-3 h-3" />
                <span>{mapStatusLabel(post.status)}</span>
              </div>
              {post.tags?.length ? (
                <>
                  <span className="h-4 w-px bg-slate-200" />
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 border border-slate-200"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <section className="max-w-3xl mx-auto px-6 relative z-10">
          {post.body && (
            <article className="prose prose-slate max-w-none prose-headings:scroll-mt-28">
              <ReactMarkdown>{post.body}</ReactMarkdown>
            </article>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
