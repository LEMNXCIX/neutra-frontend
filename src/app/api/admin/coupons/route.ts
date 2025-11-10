import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const COUPONS_PATH = path.join(process.cwd(), 'src', 'data', 'coupons.json');

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const raw = fs.readFileSync(COUPONS_PATH, 'utf-8');
    type Coupon = { code: string; type: 'amount'|'percent'; value: number; expires?: string|null; used?: boolean };
    const coupons = JSON.parse(raw) as Array<Coupon>;
    return NextResponse.json({ coupons });
  } catch {
    return NextResponse.json({ coupons: [] });
  }
}

export async function POST(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !body.code) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(COUPONS_PATH, 'utf-8');
    type Coupon = { code: string; type: 'amount'|'percent'; value: number; expires?: string|null; used?: boolean };
    const coupons = JSON.parse(raw) as Array<Coupon>;
    const newC = { code: String(body.code).toUpperCase(), type: body.type || 'amount', value: Number(body.value||0), expires: body.expires || null, used: false };
    coupons.push(newC);
    const tmp = `${COUPONS_PATH}.tmp`;
    const bak = `${COUPONS_PATH}.bak`;
    if (fs.existsSync(COUPONS_PATH)) fs.copyFileSync(COUPONS_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(coupons, null, 2), 'utf-8');
    fs.renameSync(tmp, COUPONS_PATH);
    return NextResponse.json(newC);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
