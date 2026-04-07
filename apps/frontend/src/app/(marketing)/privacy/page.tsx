import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-marketing-display', weight: ['500', '700'] });
const bodyFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-marketing-body', weight: ['400', '500'] });

export const metadata: Metadata = { title: 'Kebijakan Privasi | Soplantila', description: 'Kebijakan privasi Soplantila — transparan soal data apa yang kami kumpulkan dan kenapa.' };

export default function PrivacyPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900`}>
      <Header />
      <main className="flex-grow pt-40 pb-32 px-6 lg:px-8 max-w-[800px] mx-auto w-full">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <h1 className="[font-family:var(--font-marketing-display)] text-5xl font-bold mb-4">Kebijakan Privasi</h1>
          <p className="text-slate-500 mb-12">Terakhir diperbarui: 7 April 2026</p>

          <div className="[font-family:var(--font-marketing-body)] text-slate-600 space-y-8 text-lg leading-relaxed">

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Komitmen Kami</h2>
              <p>
                Kami percaya lo berhak tahu <strong>persis</strong> data apa yang kami kumpulkan dan buat apa. Kebijakan ini ditulis sejelas mungkin — tanpa bahasa legal yang bikin pusing.
              </p>
              <p className="mt-4">
                Soplantila menggunakan beberapa layanan pihak ketiga (seperti Google Analytics) untuk membantu kami memahami cara orang menggunakan platform ini dan memperbaikinya. Kami transparan soal ini.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Data yang Kami Kumpulkan</h2>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">1. Informasi Akun</h3>
              <p>Saat lo daftar:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Email</strong> — verifikasi akun dan notifikasi penting</li>
                <li><strong>Username & nama lengkap</strong> — identitas di platform</li>
                <li><strong>Password</strong> — disimpan terenkripsi (bcrypt), kami tidak bisa lihat password asli lo</li>
                <li><strong>Foto profil</strong> (opsional)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">2. Konten yang Lo Buat</h3>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Post, foto, video, stories</li>
                <li>Komentar, likes, dan interaksi sosial</li>
                <li>Pesan langsung (direct messages)</li>
                <li>Bio dan informasi profil publik</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3. Data Teknis & Penggunaan</h3>
              <p>Kami mengumpulkan data teknis untuk keamanan dan operasional:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>IP address (deteksi login mencurigakan, pencegahan spam)</li>
                <li>Tipe perangkat, browser, dan sistem operasi</li>
                <li>Waktu akses dan sesi login</li>
                <li>Log error untuk perbaikan bug</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">4. Data Analytics (Google Analytics)</h3>
              <p>
                Kami menggunakan <strong>Google Analytics</strong> untuk memahami bagaimana pengguna berinteraksi dengan platform. Data yang dikumpulkan Google Analytics meliputi:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Halaman yang dikunjungi dan durasi kunjungan</li>
                <li>Sumber traffic (dari mana lo datang ke Soplantila)</li>
                <li>Tipe perangkat, browser, dan lokasi umum (kota/negara)</li>
                <li>Interaksi dengan fitur (klik tombol, scroll, dll)</li>
                <li>Data demografis umum (usia, gender — jika tersedia dari akun Google)</li>
              </ul>
              <p className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-base">
                ⚠️ <strong>Penting:</strong> Google Analytics menggunakan cookies dan dapat mengaitkan data ini dengan akun Google lo jika lo login ke Google di browser yang sama. Data ini diproses oleh Google sesuai <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Kebijakan Privasi Google</a>.
              </p>
              <p className="mt-3">
                Lo bisa opt-out dari Google Analytics dengan menginstall <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-slate-900 underline hover:text-slate-700">Google Analytics Opt-out Browser Add-on</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Cookies & Tracking</h2>
              <p>Kami menggunakan beberapa jenis cookies:</p>

              <div className="mt-4 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="font-semibold text-green-800">✅ Essential Cookies (Wajib)</p>
                  <p className="text-green-700 text-base mt-1">Session login, keamanan CSRF, preferensi bahasa. Tanpa ini platform tidak bisa berjalan.</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="font-semibold text-blue-800">📊 Analytics Cookies (Google Analytics)</p>
                  <p className="text-blue-700 text-base mt-1">Mengumpulkan data penggunaan anonim untuk membantu kami memahami dan memperbaiki platform. Bisa di-opt-out.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Cara Kami Pakai Data Lo</h2>
              <ul className="list-disc pl-6 space-y-3 mt-3">
                <li><strong>Menjalankan layanan</strong> — feed, notifikasi, penyimpanan konten</li>
                <li><strong>Keamanan akun</strong> — deteksi login mencurigakan, pencegahan spam dan bot</li>
                <li><strong>Perbaikan platform</strong> — analisis bug, optimasi performa, pengembangan fitur baru</li>
                <li><strong>Komunikasi penting</strong> — update kebijakan, notifikasi keamanan, info maintenance</li>
                <li><strong>Analytics</strong> — memahami pola penggunaan untuk membuat platform lebih baik</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Yang TIDAK kami lakukan:</h3>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>❌ Jual data lo ke advertiser atau data broker</li>
                <li>❌ Tampilkan iklan bertarget berdasarkan konten lo</li>
                <li>❌ Bagikan data personal lo ke pihak ketiga untuk tujuan komersial</li>
                <li>❌ Baca pesan pribadi lo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Layanan Pihak Ketiga yang Kami Gunakan</h2>
              <div className="space-y-4 mt-4">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <p className="font-semibold text-slate-800">Google Analytics</p>
                  <p className="text-base mt-1">Analitik penggunaan platform. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-slate-900 underline">Kebijakan Privasi Google</a></p>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <p className="font-semibold text-slate-800">Google OAuth</p>
                  <p className="text-base mt-1">Login dengan akun Google (opsional). Kami hanya menerima nama, email, dan foto profil dari Google.</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <p className="font-semibold text-slate-800">DigitalOcean Spaces</p>
                  <p className="text-base mt-1">Penyimpanan file (foto, video) yang lo upload. Data disimpan di server yang aman.</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <p className="font-semibold text-slate-800">SMTP / Email Service</p>
                  <p className="text-base mt-1">Pengiriman email transaksional (OTP, notifikasi keamanan). Kami tidak mengirim email marketing tanpa izin lo.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Keamanan Data</h2>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Enkripsi TLS/SSL untuk semua data yang dikirim</li>
                <li>Password di-hash dengan bcrypt (tidak bisa dibaca balik)</li>
                <li>Akses database terbatas hanya untuk tim teknis yang berwenang</li>
                <li>Rate limiting dan proteksi brute force pada login</li>
                <li>Notifikasi email otomatis jika ada login dari perangkat baru</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Hak Lo atas Data</h2>
              <ul className="list-disc pl-6 space-y-3 mt-4">
                <li><strong>Akses</strong> — Download semua data lo via Settings → Privacy → Download Data</li>
                <li><strong>Koreksi</strong> — Edit informasi profil kapan saja</li>
                <li><strong>Hapus</strong> — Hapus akun dan semua data lo (permanen dalam 30 hari)</li>
                <li><strong>Portabilitas</strong> — Export data dalam format JSON</li>
                <li><strong>Opt-out analytics</strong> — Gunakan Google Analytics Opt-out Add-on</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Data Anak-anak</h2>
              <p>
                Soplantila tidak ditujukan untuk anak di bawah 13 tahun. Jika kami mengetahui ada pengguna di bawah 13 tahun, akun dan datanya akan segera dihapus.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Perubahan Kebijakan</h2>
              <p>
                Perubahan signifikan akan dikomunikasikan lewat email dan notifikasi di platform minimal 30 hari sebelum berlaku.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Hubungi Kami</h2>
              <ul className="list-none space-y-2 mt-4">
                <li>📧 <a href="mailto:privacy@soplantila.com" className="text-slate-900 underline hover:text-slate-700">privacy@soplantila.com</a></li>
              </ul>
              <p className="mt-4 text-slate-500 italic">Kami berkomitmen menjawab pertanyaan privasi dalam 48 jam kerja.</p>
            </section>

            <div className="mt-12 p-6 bg-slate-100 rounded-2xl border border-slate-200">
              <p className="text-slate-700 font-medium">
                <strong>TL;DR:</strong> Kami pakai Google Analytics untuk memahami penggunaan platform (lo bisa opt-out). Data lo tidak dijual. Password lo terenkripsi. Lo punya kontrol penuh atas data lo.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
