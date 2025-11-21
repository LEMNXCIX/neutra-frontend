import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const CATEGORIES_PATH = path.join(process.cwd(), 'src', 'data', 'categories.json');
const PRODUCTS_PATH = path.join(process.cwd(), 'src', 'data', 'products.json');

type Category = { id: string; name: string; description?: string };

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const searchQuery = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  try {
    const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    let categories = JSON.parse(raw) as Array<Category>;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      categories = categories.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }

    // Count products per category
    let productsCount: Record<string, number> = {};
    try {
      const productsRaw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
      const products = JSON.parse(productsRaw) as Array<{ category?: string }>;
      productsCount = products.reduce((acc, p) => {
        if (p.category) {
          acc[p.category] = (acc[p.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
    } catch { }

    // Calculate stats from ALL filtered categories (before pagination)
    const totalCategories = categories.length;
    const totalProducts = Object.values(productsCount).reduce((sum, count) => sum + count, 0);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCategories = categories.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCategories / limit);

    // Add product count to each category
    const categoriesWithCount = paginatedCategories.map(cat => ({
      ...cat,
      productCount: productsCount[cat.id] || 0,
    }));

    return NextResponse.json({
      categories: categoriesWithCount,
      stats: {
        totalCategories,
        totalProducts,
        averageProductsPerCategory: totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCategories,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Error reading categories:', err);
    return NextResponse.json({
      categories: [],
      stats: { totalCategories: 0, totalProducts: 0, averageProductsPerCategory: 0 },
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
  if (!body || !body.name) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    const cats = JSON.parse(raw) as Array<any>;
    const id = `c_${Date.now()}`;
    const newC = { id, name: String(body.name), description: body.description ? String(body.description) : undefined };
    cats.push(newC);
    const tmp = `${CATEGORIES_PATH}.tmp`;
    const bak = `${CATEGORIES_PATH}.bak`;
    if (fs.existsSync(CATEGORIES_PATH)) fs.copyFileSync(CATEGORIES_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(cats, null, 2), 'utf-8');
    fs.renameSync(tmp, CATEGORIES_PATH);
    return NextResponse.json(newC);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
