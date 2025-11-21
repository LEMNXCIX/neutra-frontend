import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const PRODUCTS_PATH = path.join(process.cwd(), 'src', 'data', 'products.json');

type Product = {
  id: string;
  title: string;
  price: number;
  stock?: number;
  category?: string;
  image?: string;
};

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const searchQuery = url.searchParams.get('search') || '';
  const categoryFilter = url.searchParams.get('category') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '12', 10);

  try {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    let products = JSON.parse(raw) as Array<Product>;

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
      );
    }

    if (categoryFilter) {
      products = products.filter(p => p.category === categoryFilter);
    }

    // Calculate stats from ALL filtered products (before pagination)
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
    const lowStockCount = products.filter(p => (p.stock || 0) < 10).length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalProducts / limit);

    return NextResponse.json({
      products: paginatedProducts,
      stats: {
        totalProducts,
        totalValue,
        lowStockCount
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalProducts,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Error reading products:', err);
    return NextResponse.json({
      products: [],
      stats: { totalProducts: 0, totalValue: 0, lowStockCount: 0 },
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  }
}

export async function POST(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !body.title) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    const products = JSON.parse(raw) as Array<Product>;
    const id = `p_${Date.now()}`;
    const newP: any = { id, title: String(body.title), price: Number(body.price || 0), stock: Number(body.stock || 0) };
    if (body.category) newP.category = String(body.category);
    // handle imageBase64 upload
    if (body.imageBase64) {
      try {
        const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        const m = String(body.imageBase64).match(/^data:(image\/(\w+));base64,(.+)$/);
        if (m) {
          const ext = m[2] || 'png';
          const b64 = m[3];
          const buf = Buffer.from(b64, 'base64');
          const filename = `upload_${Date.now()}.${ext}`;
          const dest = path.join(UPLOADS_DIR, filename);
          fs.writeFileSync(dest, buf);
          newP.image = `/uploads/${filename}`;
        }
      } catch { }
    } else if (body.image) newP.image = String(body.image);
    products.push(newP);
    // atomic write
    const tmp = `${PRODUCTS_PATH}.tmp`;
    const bak = `${PRODUCTS_PATH}.bak`;
    if (fs.existsSync(PRODUCTS_PATH)) fs.copyFileSync(PRODUCTS_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(products, null, 2), 'utf-8');
    fs.renameSync(tmp, PRODUCTS_PATH);
    return NextResponse.json(newP);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
