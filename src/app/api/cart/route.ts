import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/session';
import fs from 'fs';
import path from 'path';
import { readProducts, findProduct } from '@/data/products';

const CARTS_PATH = path.join(process.cwd(), 'src', 'data', 'carts.json');

function readCarts(): Record<string, { id: string; name: string; qty: number }[]> {
  try {
    const raw = fs.readFileSync(CARTS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeCarts(obj: Record<string, { id: string; name: string; qty: number }[]>) {
  fs.writeFileSync(CARTS_PATH, JSON.stringify(obj, null, 2), 'utf-8');
}

// inventory is stored as `stock` inside products.json now

function parseSid(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookiePairs = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
  let rawSid: string | undefined;
  for (const p of cookiePairs) {
    const [k, ...v] = p.split('=');
    if (k === '_neutra_sid') rawSid = decodeURIComponent(v.join('='));
  }
  return rawSid;
}

export async function GET(req: Request) {
  const rawSid = parseSid(req);
  const userId = getUserId(rawSid);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const carts = readCarts();
  const products = readProducts();
  const items = (carts[userId] || []).map(it => {
    const prod = products.find(p => p.id === it.id);
    const available = prod?.stock ?? 0;
    return { ...it, available };
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const rawSid = parseSid(request as unknown as Request);
  const userId = getUserId(rawSid);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { id, name } = body;
  if (!id || !name) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  // Validate product exists and check inventory
  const prod = findProduct(id);
  if (!prod) return NextResponse.json({ error: 'Unknown product' }, { status: 400 });

  const available = prod.stock ?? 0;

  const carts = readCarts();
  if (!carts[userId]) carts[userId] = [];
  const existing = carts[userId].find((s) => s.id === id);

  const currentQty = existing ? existing.qty : 0;
  if (currentQty + 1 > available) {
    return NextResponse.json({ error: 'Out of stock', available }, { status: 400 });
  }

  if (existing) existing.qty += 1;
  else carts[userId].push({ id, name, qty: 1 });
  writeCarts(carts);
  const products = readProducts();
  const items = (carts[userId] || []).map(it => ({ ...it, available: products.find(p => p.id === it.id)?.stock ?? 0 }));
  return NextResponse.json({ items });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const rawSid = parseSid(request as unknown as Request);
  const userId = getUserId(rawSid);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const carts = readCarts();
  if (!carts[userId]) carts[userId] = [];
  if (id) {
    carts[userId] = carts[userId].filter((s) => s.id !== id);
  } else {
    // clear cart for user
    carts[userId] = [];
  }
  writeCarts(carts);
  return NextResponse.json({ items: carts[userId] });
}
