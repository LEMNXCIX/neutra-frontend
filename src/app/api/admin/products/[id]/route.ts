/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const PRODUCTS_PATH = path.join(process.cwd(), 'src', 'data', 'products.json');

export async function PUT(req: any, context: any) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = context.params?.id;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    type Product = { id: string; title: string; price: number; stock?: number };
    const products = JSON.parse(raw) as Array<Product>;
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    products[idx] = { ...products[idx], ...body };
    const tmp = `${PRODUCTS_PATH}.tmp`;
    const bak = `${PRODUCTS_PATH}.bak`;
    if (fs.existsSync(PRODUCTS_PATH)) fs.copyFileSync(PRODUCTS_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(products, null, 2), 'utf-8');
    fs.renameSync(tmp, PRODUCTS_PATH);
    return NextResponse.json(products[idx]);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}

export async function DELETE(req: any, context: any) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = context.params?.id;
  try {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    type Product = { id: string; title: string; price: number; stock?: number };
    let products = JSON.parse(raw) as Array<Product>;
    products = products.filter(p => p.id !== id);
    const tmp = `${PRODUCTS_PATH}.tmp`;
    const bak = `${PRODUCTS_PATH}.bak`;
    if (fs.existsSync(PRODUCTS_PATH)) fs.copyFileSync(PRODUCTS_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(products, null, 2), 'utf-8');
    fs.renameSync(tmp, PRODUCTS_PATH);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
