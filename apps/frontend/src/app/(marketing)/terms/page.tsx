import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-marketing-display', weight: ['500', '700'] });
const bodyFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-marketing-body', weight: ['400', '500'] });

export const metadata: Metadata = { title: 'Ketentuan Layanan | Soplantila', description: 'Ketentuan layanan Soplantila — aturan main yang fair dan jelas.' };

export default function TermsPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900`}>
      <Header />
      <main className="flex-grow pt-40 pb-32 px-6 lg:px-8 max-w-[800px] mx-auto w-full">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <h1 className="[font-family:var(--font-marketing-display)] text-5xl font-bold mb-4">Ketentuan Layanan</h1>
          <p className="text-slate-500 mb-12">Terakhir diperbarui: 7 April 2026</p>

          <div className="[font-family:var(--font-marketing-body)] text-slate-600 space-y-8 text-lg leading-relaxed">

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Selamat Datang di Soplantila</h2>
              <p>
                Dengan menggunakan Soplantila, lo setuju dengan ketentuan ini. Kami tulis sesimpel mungkin — intinya: <strong>saling respect dan jaga platform ini tetap nyaman buat semua orang</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Siapa yang Boleh Pakai</h2>
              <ul className="list-disc pl-6 space-y-3 mt-4">
                <li>Minimal <strong>13 tahun</strong> untuk membuat akun</li>
                <li>Informasi pendaftaran harus <strong>akurat dan benar</strong></li>
                <li>Satu orang satu akun utama</li>
                <li>Lo bertanggung jawab atas keamanan akun dan password lo sendiri</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Aturan Main</h2>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Yang BOLEH:</h3>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Posting konten original lo sendiri</li>
                <li>Berbagi pendapat dan berdiskusi dengan sopan</li>
                <li>Follow, like, comment, dan berinteraksi dengan user lain</li>
                <li>Report konten atau user yang melanggar aturan</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Yang DILARANG:</h3>
              <ul className="list-disc pl-6 space-y-3 mt-3">
                <li><strong>❌ Hate speech & harassment</strong> — konten yang menyerang orang berdasarkan ras, agama, gender, dll</li>
                <li><strong>❌ Hoax & misinformasi</strong> — sebar berita palsu dengan sengaja</li>
                <li><strong>❌ Spam & bot</strong> — posting berulang, auto-follow, atau aktivitas bot</li>
                <li><strong>❌ Konten ilegal</strong> — pornografi, kekerasan ekstrem, narkoba, atau aktivitas kriminal</li>
                <li><strong>❌ Impersonation</strong> — pura-pura jadi orang lain tanpa izin</li>
                <li><strong>❌ Pencurian konten</strong> — upload konten orang lain tanpa izin</li>
                <li><strong>❌ Doxxing</strong> — sebar informasi pribadi orang lain tanpa izin</li>
                <li><strong>❌ Scam & phishing</strong> — tipu user lain atau curi data mereka</li>
                <li><strong>❌ Manipulasi platform</strong> — exploit bug atau hack sistem</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Konten Lo</h2>
              <p>
                <strong>Konten yang lo posting tetap milik lo.</strong> Kami tidak mengambil hak cipta atas foto, video, atau tulisan lo.
              </p>
              <p className="mt-4">
                Dengan posting di Soplantila, lo memberi kami lisensi terbatas untuk menampilkan, menyimpan, dan memproses konten lo (resize, compress, dll) semata-mata untuk operasional platform. Kami <strong>tidak</strong> menggunakan konten lo untuk iklan atau menjualnya ke pihak ketiga.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Analytics & Tracking</h2>
              <p>
                Soplantila menggunakan <strong>Google Analytics</strong> untuk memahami cara pengguna berinteraksi dengan platform. Ini membantu kami memperbaiki fitur dan pengalaman pengguna.
              </p>
              <p className="mt-4">
                Dengan menggunakan Soplantila, lo menyetujui pengumpulan data analytics ini. Lo bisa opt-out kapan saja menggunakan <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-slate-900 underline hover:text-slate-700">Google Analytics Opt-out Add-on</a>. Detail lengkap ada di <a href="/privacy" className="text-slate-900 underline hover:text-slate-700">Kebijakan Privasi</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Moderasi & Enforcement</h2>
              <p>Kalau lo melanggar aturan, kami bisa:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Warning</strong> — peringatan untuk pelanggaran ringan</li>
                <li><strong>Hapus konten</strong> — konten yang melanggar dihapus</li>
                <li><strong>Suspend akun</strong> — suspend sementara (7–30 hari)</li>
                <li><strong>Ban permanen</strong> — untuk pelanggaran berat atau berulang</li>
              </ul>
              <p className="mt-4">
                Kalau lo merasa keputusan kami tidak adil, ajukan banding ke <a href="mailto:appeal@soplantila.com" className="text-slate-900 underline hover:text-slate-700">appeal@soplantila.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Layanan "As Is"</h2>
              <p>
                Soplantila disediakan sebagaimana adanya. Kami berusaha menjaga platform berjalan 24/7, tapi kadang ada downtime untuk maintenance, bug, atau fitur yang masih dalam pengembangan. Kami berkomitmen untuk memperbaiki masalah secepat mungkin.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Batasan Tanggung Jawab</h2>
              <p>Kami tidak bertanggung jawab atas:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Konten yang diposting oleh pengguna lain</li>
                <li>Kerugian akibat bug, downtime, atau insiden keamanan di luar kendali kami</li>
                <li>Transaksi atau interaksi antar pengguna</li>
                <li>Link eksternal yang dibagikan pengguna</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Perubahan Layanan</h2>
              <p>
                Kami berhak mengubah fitur, ketentuan, atau menghentikan layanan dengan pemberitahuan yang wajar. Perubahan signifikan pada ketentuan ini akan dikomunikasikan minimal 30 hari sebelumnya lewat email dan notifikasi platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Hukum yang Berlaku</h2>
              <p>
                Ketentuan ini diatur oleh hukum Republik Indonesia. Sengketa diselesaikan secara musyawarah terlebih dahulu, dan jika tidak tercapai kesepakatan, melalui pengadilan yang berwenang di Jakarta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Kontak</h2>
              <ul className="list-none space-y-2 mt-4">
                <li>📧 <a href="mailto:legal@soplantila.com" className="text-slate-900 underline hover:text-slate-700">legal@soplantila.com</a></li>
              </ul>
            </section>

            <div className="mt-12 p-6 bg-slate-100 rounded-2xl border border-slate-200">
              <p className="text-slate-700 font-medium">
                <strong>TL;DR:</strong> Jangan jadi orang jahat. Respect user lain. Konten lo tetap milik lo. Kami pakai Google Analytics untuk improve platform. Moderasi fair, ada banding kalau lo merasa salah.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
