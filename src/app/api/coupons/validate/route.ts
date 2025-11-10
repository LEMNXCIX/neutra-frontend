import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractTokenFromRequest, verifyToken } from '@/lib/auth';

const COUPONS_PATH = path.join(process.cwd(), 'src', 'data', 'coupons.json');

async function readCoupons() {
  try {
    const raw = fs.readFileSync(COUPONS_PATH, 'utf-8');
    return JSON.parse(raw) as Array<{ code: string; type: 'amount' | 'percent'; value: number; expires?: string; used?: boolean }>;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  // require a valid JWT (either Authorization: Bearer or cookie `neutra_jwt`)
  try {
    const token = extractTokenFromRequest(req as unknown as Request);
    if (!token) return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 401 });
    const payload = verifyToken(token as string);
    if (!payload) return NextResponse.json({ valid: false, reason: 'invalid_token' }, { status: 401 });
  } catch {
    return NextResponse.json({ valid: false, reason: 'auth_error' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const code = String((body?.code || '')).trim().toUpperCase();
    const subtotal = Number(body?.subtotal || 0);

    if (!code) return NextResponse.json({ valid: false, reason: 'empty' }, { status: 400 });

    const coupons = await readCoupons();
    const c = coupons.find((x) => x.code === code);
    if (!c) return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 });

    if (c.used) return NextResponse.json({ valid: false, reason: 'already_used' }, { status: 400 });

    if (c.expires) {
      const now = new Date();
      const exp = new Date(c.expires);
      if (exp < now) return NextResponse.json({ valid: false, reason: 'expired' }, { status: 400 });
    }

    // compute discount based on provided subtotal
    let discount = 0;
    if (c.type === 'percent') {
      discount = Math.round((subtotal * (c.value / 100)) * 100) / 100;
    } else {
      discount = Math.round((c.value) * 100) / 100;
      // cap discount to subtotal
      if (discount > subtotal) discount = subtotal;
    }

    const newTotal = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

    return NextResponse.json({ valid: true, coupon: { code: c.code, type: c.type, value: c.value }, discount, newTotal });
  } catch {
    return NextResponse.json({ valid: false, reason: 'invalid_request' }, { status: 400 });
  }
}
