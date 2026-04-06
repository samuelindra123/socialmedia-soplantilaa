import type { Metadata } from 'next';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import ProductShowcase from '@/components/ProductShowcase';

export const metadata: Metadata = {
  title: 'Renunganku - Platform Sosial Media Penuh Makna',
  description: 'Bergabunglah dengan Renunganku, tempat berbagi cerita dan menemukan kedamaian dalam komunitas digital yang positif dan aman.',
  openGraph: {
    title: 'Renunganku - Platform Sosial Media Penuh Makna',
    description: 'Tempat berbagi cerita dan menemukan kedamaian.',
    siteName: 'Renunganku',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Komponen Header fixed di atas. 
        Main content memiliki padding-top yang cukup (di handle di section Hero).
      */}
      <Header />
      
      <main className="flex-grow">
        <Hero />
        
       <ProductShowcase />
      </main>

      <Footer />
    </div>
  );
}