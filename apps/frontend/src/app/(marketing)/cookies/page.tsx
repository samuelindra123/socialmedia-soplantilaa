import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-marketing-display', weight: ['500', '700'] });
const bodyFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-marketing-body', weight: ['400', '500'] });

export const metadata: Metadata = { title: 'Kebijakan Cookies | Soplantila', description: 'Kebijakan cookies Soplantila - Gak ada tracking aneh-aneh.' };

export default function CookiesPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900`}>
      <Header />
      <main className="flex-grow pt-40 pb-32 px-6 lg:px-8 max-w-[800px] mx-auto w-full">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <h1 className="[font-family:var(--font-marketing-display)] text-5xl font-bold mb-4">Kebijakan Cookies</h1>
          <p className="text-slate-500 mb-12">Terakhir diperbarui: 6 April 2026</p>
          
          <div className="[font-family:var(--font-marketing-body)] text-slate-600 space-y-8 text-lg leading-relaxed">
            
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Gak Ada Popup Cookies yang Ganggu</h2>
              <p>
                Lo pasti udah bosen sama popup cookies yang muncul di setiap website, kan? Kami juga. 
                Makanya di Soplantila, <strong>kami cuma pakai cookies yang beneran penting</strong> buat jalanin platform ini. 
                Gak ada tracking aneh-aneh, gak ada third-party cookies dari ad network.
              </p>
              <p className="mt-4">
                Halaman ini jelasin cookies apa aja yang kami pakai dan kenapa kami butuh itu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Apa Itu Cookies?</h2>
              <p>
                Cookies adalah file kecil yang disimpan di browser lo saat lo kunjungi website. 
                Fungsinya buat "inget" lo saat lo balik lagi ke website tersebut.
              </p>
              <p className="mt-4">
                Contoh simpel: Cookies yang bikin lo tetep login saat lo tutup dan buka browser lagi. 
                Tanpa cookies, lo harus login ulang setiap kali buka website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Cookies yang Kami Pakai</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">1. Essential Cookies (Wajib)</h3>
              <p>
                Ini cookies yang <strong>harus ada</strong> buat platform jalan. Lo gak bisa opt-out dari cookies ini karena tanpa ini, 
                lo gak bisa login atau pakai fitur dasar Soplantila.
              </p>
              
              <div className="mt-4 bg-white p-5 rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 font-semibold text-slate-900">Cookie</th>
                      <th className="text-left py-2 font-semibold text-slate-900">Fungsi</th>
                      <th className="text-left py-2 font-semibold text-slate-900">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-mono text-xs">auth_token</td>
                      <td className="py-3">Jaga sesi login lo tetep aktif</td>
                      <td className="py-3">30 hari</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-mono text-xs">refresh_token</td>
                      <td className="py-3">Perpanjang sesi tanpa login ulang</td>
                      <td className="py-3">90 hari</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-mono text-xs">csrf_token</td>
                      <td className="py-3">Keamanan - cegah serangan CSRF</td>
                      <td className="py-3">Session</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono text-xs">preferences</td>
                      <td className="py-3">Simpan setting lo (dark mode, bahasa, dll)</td>
                      <td className="py-3">1 tahun</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-slate-800 mt-8 mb-3">2. Performance Cookies (Opsional)</h3>
              <p>
                Cookies ini bantu kami pahami gimana user pakai platform buat improve performa. 
                Data yang dikumpulin adalah <strong>anonim dan agregat</strong> - kami gak bisa identifikasi lo secara personal.
              </p>
              
              <div className="mt-4 bg-white p-5 rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 font-semibold text-slate-900">Cookie</th>
                      <th className="text-left py-2 font-semibold text-slate-900">Fungsi</th>
                      <th className="text-left py-2 font-semibold text-slate-900">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-mono text-xs">analytics_id</td>
                      <td className="py-3">Track page views (anonim)</td>
                      <td className="py-3">1 tahun</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono text-xs">performance</td>
                      <td className="py-3">Ukur loading time dan error</td>
                      <td className="py-3">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p className="mt-4 text-slate-500 italic">
                Lo bisa disable performance cookies di Settings → Privacy → Cookies tanpa ganggu fungsi platform.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mt-8 mb-3">3. Yang TIDAK Kami Pakai</h3>
              <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
                <li>❌ <strong>Advertising cookies</strong> - Kami gak pakai cookies buat targeted ads</li>
                <li>❌ <strong>Third-party tracking</strong> - Gak ada Google Analytics, Facebook Pixel, atau tracker lain</li>
                <li>❌ <strong>Social media cookies</strong> - Gak ada cookies dari Facebook, Twitter, dll</li>
                <li>❌ <strong>Cross-site tracking</strong> - Kami gak track aktivitas lo di website lain</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Kontrol Cookies Lo</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Di Soplantila</h3>
              <p>
                Lo bisa atur cookies di <strong>Settings → Privacy → Cookies</strong>:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Essential cookies: Gak bisa dimatiin (wajib buat platform jalan)</li>
                <li>Performance cookies: Bisa lo matiin kapan aja</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Di Browser Lo</h3>
              <p>
                Lo juga bisa kontrol cookies lewat browser:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>
              
              <p className="mt-4 text-slate-500 italic">
                Catatan: Kalau lo block semua cookies, lo gak bisa login ke Soplantila.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Local Storage & Session Storage</h2>
              <p>
                Selain cookies, kami juga pakai <strong>local storage</strong> dan <strong>session storage</strong> buat simpan data di browser lo:
              </p>
              
              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Local Storage</h3>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Draft post yang belum dipublish</li>
                <li>Cache konten buat loading lebih cepat</li>
                <li>Setting UI (dark mode, font size, dll)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Session Storage</h3>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Data sementara selama lo browsing (hilang saat tutup tab)</li>
                <li>State navigasi (scroll position, dll)</li>
              </ul>

              <p className="mt-4">
                Data di local/session storage <strong>cuma disimpan di device lo</strong> dan gak dikirim ke server kami kecuali lo eksplisit save/publish.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Third-Party Services</h2>
              <p>
                Kami pakai beberapa third-party services yang mungkin set cookies mereka sendiri:
              </p>
              
              <div className="mt-4 bg-white p-5 rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 font-semibold text-slate-900">Service</th>
                      <th className="text-left py-2 font-semibold text-slate-900">Fungsi</th>
                      <th className="text-left py-2 font-semibold text-slate-900">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-b border-slate-100">
                      <td className="py-3">CDN Provider</td>
                      <td className="py-3">Deliver konten lebih cepat</td>
                      <td className="py-3"><a href="#" className="text-slate-900 underline text-xs">Link</a></td>
                    </tr>
                    <tr>
                      <td className="py-3">Email Service</td>
                      <td className="py-3">Kirim notifikasi email</td>
                      <td className="py-3"><a href="#" className="text-slate-900 underline text-xs">Link</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-slate-500 italic">
                Kami pilih third-party yang respect privasi dan gak pakai data lo buat iklan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Update Kebijakan</h2>
              <p>
                Kalau kami tambah atau ubah cookies yang kami pakai, kami akan update halaman ini dan kasih tahu lo lewat notifikasi.
              </p>
              <p className="mt-4">
                Lo bisa liat history perubahan di repository GitHub kami (kami open source soal kebijakan).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Pertanyaan?</h2>
              <p>
                Ada pertanyaan soal cookies atau tracking? Hubungi kami:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li>📧 Email: <a href="mailto:privacy@soplantila.com" className="text-slate-900 underline hover:text-slate-700">privacy@soplantila.com</a></li>
                <li>💬 Support: <a href="/support" className="text-slate-900 underline hover:text-slate-700">soplantila.com/support</a></li>
              </ul>
            </section>

            <div className="mt-12 p-6 bg-slate-100 rounded-2xl border border-slate-200">
              <p className="text-slate-700 font-medium">
                <strong>TL;DR:</strong> Kami cuma pakai essential cookies buat login dan jaga sesi lo. 
                Gak ada third-party tracking, gak ada ad cookies, gak ada yang aneh-aneh. 
                Lo bisa kontrol cookies di Settings kapan aja.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
