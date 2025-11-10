import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const COUPONS_PATH = path.join(process.cwd(), 'src', 'data', 'coupons.json');

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function PUT(req: any, context: any) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const code = decodeURIComponent((context?.params?.code) || '');
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(COUPONS_PATH, 'utf-8');
    type Coupon = { code: string; type: 'amount'|'percent'; value: number; expires?: string|null; used?: boolean };
    const coupons = JSON.parse(raw) as Array<Coupon>;
    const idx = coupons.findIndex(c => String(c.code).toUpperCase() === String(code).toUpperCase());
    if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    coupons[idx] = { ...coupons[idx], ...body };
    const tmp = `${COUPONS_PATH}.tmp`;
    const bak = `${COUPONS_PATH}.bak`;
    if (fs.existsSync(COUPONS_PATH)) fs.copyFileSync(COUPONS_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(coupons, null, 2), 'utf-8');
    fs.renameSync(tmp, COUPONS_PATH);
    return NextResponse.json(coupons[idx]);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
