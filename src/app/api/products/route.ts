import { NextResponse } from 'next/server';
import { readProducts } from '@/data/products';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';

  let filtered = readProducts();

    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      );
    }

    if (category) {
      const c = category.trim().toLowerCase();
      filtered = filtered.filter(p => (p.category || '').toLowerCase() === c);
    }

    return NextResponse.json({ products: filtered });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
