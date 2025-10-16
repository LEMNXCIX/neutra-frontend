import Link from 'next/link';
import PromoSlider from '@/components/promo-slider';
import FeaturedProducts from '@/components/featured-products';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
      <main className="flex max-w-7xl mx-auto py-12 px-6 text-center space-y-8 gap-5">
        <div className='max-w-1/4 self-center' >
          <div className="flex items-center justify-center mb-6 " >
            <div className="text-zinc-900 dark:text-zinc-100">
              <svg width="120" height="120" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="2" y="2" width="60" height="60" rx="10" fill="currentColor" opacity="0" />
                <path d="M 20 48.5 C 20 28.5 47 30.5 44 15.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="24" cy="26.5" r="5" fill="currentColor" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold">Neutra</h1>
          <p className="text-lg text-muted-foreground">Minimal interiors, mindful design — curated furniture and accessories with a clean aesthetic.</p>
        </div>
        <div className="w-full">
          <PromoSlider />
          {/* <div className="flex items-center justify-center gap-4">
            <Link href="/products" className="inline-flex items-center px-5 py-3 bg-zinc-900 text-white rounded-md">Shop products</Link>
            <Link href="/cart" className="inline-flex items-center px-4 py-3 border rounded-md">View cart</Link>
          </div> */}
        </div>
      </main>
      <section className="max-w-7xl mx-auto px-6">
        <h2 className="text-xl font-semibold mb-4">Featured products</h2>
        <FeaturedProducts />
      </section>

      <footer className="py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Neutra
      </footer>
    </div>
  );
}
