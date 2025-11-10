import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const PRODUCTS_PATH = path.join(process.cwd(), 'src', 'data', 'products.json');

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    type Product = { id: string; title: string; price: number; stock?: number };
    const products = JSON.parse(raw) as Array<Product>;
    return NextResponse.json(products);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !body.title) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    type Product = { id: string; title: string; price: number; stock?: number };
  const products = JSON.parse(raw) as Array<Product>;
    const id = `p_${Date.now()}`;
    const newP = { id, title: String(body.title), price: Number(body.price||0), stock: Number(body.stock||0) };
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
