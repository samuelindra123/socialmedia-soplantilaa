"use client";

import {
  Layers,
  Users,
  Heart,
  MessageCircle,
  Bell,
  BookOpen,
  Shield,
  Search,
  Cpu,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const featureGroups = [
  {
    title: "Feed & Cerita",
    icon: <Heart className="w-5 h-5 text-rose-500" />,
    description:
      "Timeline utama berisi foto, video, dan tulisan refleksi dari orang-orang yang kamu ikuti.",
    points: [
      "Feed media vertikal dengan dukungan multi-kualitas video dan gambar.",
      "Stories di bagian atas feed dengan viewer layar penuh yang tenang.",
      "Like, bookmark, dan komentar bertingkat (balasan) untuk setiap postingan.",
      "Hashtag dan link di dalam konten untuk mengelompokkan tema renungan.",
    ],
  },
  {
    title: "Discover & Pencarian",
    icon: <Search className="w-5 h-5 text-blue-500" />,
    description:
      "Mode eksplorasi global untuk menemukan orang dan konten baru di luar lingkaranmu.",
    points: [
      "Halaman Discover dengan filter tipe konten (teks, media).",
      "Grid eksplorasi foto/video dengan modal detail bergaya Instagram.",
      "Pencarian pengguna berdasarkan nama lengkap dan username.",
      "Saran akun yang relevan di sidebar feed.",
    ],
  },
  {
    title: "Pesan & Notifikasi Realtime",
    icon: <MessageCircle className="w-5 h-5 text-emerald-500" />,
    description:
      "Percakapan pribadi dan pusat notifikasi yang terhubung ke socket realtime.",
    points: [
      "Inbox percakapan dengan unread badge dan ringkasan pesan terakhir.",
      "Halaman chat khusus per percakapan dengan dukungan real‑time.",
      "Notifikasi like, komen, dan permintaan follow di pusat Notifikasi.",
      "Badge notifikasi & pesan di header dan sidebar yang selalu sinkron.",
    ],
  },
  {
    title: "Relasi & Komunitas",
    icon: <Users className="w-5 h-5 text-indigo-500" />,
    description:
      "Sistem hubungan sosial yang sehat untuk mengikuti dan berinteraksi.",
    points: [
      "Follow / unfollow dengan dukungan akun privat dan permintaan follow.",
      "Halaman permintaan follow khusus dengan tombol Terima / Tolak.",
      "Statistik pengikut, mengikuti, dan jumlah postingan di profil.",
      "Sistem like & komentar yang mendorong percakapan berkualitas, bukan spam.",
    ],
  },
  {
    title: "Profil & Personalisasi",
    icon: <BookOpen className="w-5 h-5 text-amber-500" />,
    description:
      "Ruang personal untuk menampilkan identitas, cerita, dan tautan pentingmu.",
    points: [
      "Profil dengan foto, username unik, bio, dan nama lengkap.",
      "Background profile khusus dan daftar website eksternal yang bisa diklik.",
      "Tab postingan sendiri lengkap dengan statistik interaksi.",
      "Onboarding profil agar akun baru langsung terasa rapi dan siap dibagikan.",
    ],
  },
  {
    title: "Keamanan, Tema & Ruang Alkitab",
    icon: <Shield className="w-5 h-5 text-slate-700" />,
    description:
      "Fondasi keamanan dan pengalaman yang tenang untuk perjalanan spiritualmu.",
    points: [
      "Halaman Pengaturan dengan manajemen sesi perangkat dan ganti password.",
      "Login dengan email/password, reset password via OTP, dan Google OAuth.",
      "Laporan aktivitas mencurigakan langsung ke tim keamanan.",
      "Mode terang/gelap berbasis sistem serta halaman khusus Ruang Alkitab.",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 selection:bg-black selection:text-white">
        {/* --- BACKGROUND GRID --- */}
        <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* --- PAGE HEADER --- */}
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-6">
              <Layers className="w-3 h-3 text-slate-900" />
              Feature Catalog
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-slate-900 mb-6 leading-[1.1]">
              Kapabilitas Sosial Renunganku
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-xl font-medium">
              Ringkasan seluruh fitur yang saat ini sudah hidup di pengalaman sosial Renunganku:
              dari feed, discover, percakapan, hingga pengaturan keamanan akun.
            </p>
          </div>

          {/* --- FEATURE GRID --- */}
          <section className="relative w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 lg:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.25em] mb-4">
                SOCIAL FEATURE MAP
              </p>
              <p className="text-base text-slate-500 max-w-2xl mb-8">
                Berikut peta modul sosial yang sudah diimplementasikan di aplikasi: setiap kartu di
                bawah mewakili satu kelompok fitur yang benar‑benar ada di produk saat ini.
              </p>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {featureGroups.map((group) => (
                  <article
                    key={group.title}
                    className="h-full rounded-2xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200">
                        {group.icon}
                      </div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {group.title}
                      </h2>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                      {group.description}
                    </p>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      {group.points.map((point) => (
                        <li key={point} className="flex items-start gap-2">
                          <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* --- INFO STRIP (Tech/Runtime) --- */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full bg-white border border-slate-100 shadow-sm text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Realtime Socket Feed
              </span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Notifications & Sessions
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}