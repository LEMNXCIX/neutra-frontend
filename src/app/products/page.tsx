import ProductGrid from '@/components/product-grid';
import categories from '@/data/categories.json';

type Category = { id: string; name: string };


async function fetchProducts(search?: string, category?: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
  const url = new URL('/api/products', base);
  if (search) url.searchParams.set('search', search);
  if (category && category !== 'all') url.searchParams.set('category', category);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products;
}

// Use loose typing for Next App Router page props to avoid build type conflicts
export default async function Page(props: unknown) {
  const searchParams = (props as { searchParams?: { [key: string]: string | string[] } })?.searchParams;
  // ensure searchParams is awaited in server component contexts
  const params = (await (searchParams as unknown)) as { [key: string]: string | string[] } | undefined || {};
  const getParam = (k: string) => {
    const v = params[k];
    if (!v) return '';
    return Array.isArray(v) ? v[0] : v;
  };
  const search = getParam('search') || '';
  const category = getParam('category') || 'all';

  const products = await fetchProducts(search, category);

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold mb-4">Products</h1>
        {search && <div className="text-sm text-muted-foreground">Search: {`"${search}"`}</div>}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm text-muted-foreground">Category:</label>
        <div className="flex gap-2 flex-wrap">
          { (categories as Category[]).map((c) => {
            const active = c.id === category;
            // build link preserving search param
            const href = c.id === 'all' ? `/products${search ? `?search=${encodeURIComponent(search)}` : ''}` : `/products?category=${encodeURIComponent(c.id)}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
            return (
              <a key={c.id} href={href} className={`px-3 py-1 rounded text-sm ${active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground'}`}>
                {c.name}
              </a>
            );
          })}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">No products found.</div>
      ) : (
        <ProductGrid products={products} />
      )}
    </main>
  );
}
