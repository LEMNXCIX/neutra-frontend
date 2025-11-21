import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const COUPONS_PATH = path.join(process.cwd(), 'src', 'data', 'coupons.json');

type Coupon = {
  code: string;
  type: 'amount' | 'percent';
  value: number;
  expires?: string | null;
  used?: boolean;
};

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const searchQuery = url.searchParams.get('search') || '';
  const typeFilter = url.searchParams.get('type') || '';
  const statusFilter = url.searchParams.get('status') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  try {
    const raw = fs.readFileSync(COUPONS_PATH, 'utf-8');
    let coupons = JSON.parse(raw) as Array<Coupon>;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      coupons = coupons.filter(c =>
        c.code.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter && (typeFilter === 'amount' || typeFilter === 'percent')) {
      coupons = coupons.filter(c => c.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter === 'used') {
      coupons = coupons.filter(c => c.used);
    } else if (statusFilter === 'unused') {
      coupons = coupons.filter(c => !c.used);
    } else if (statusFilter === 'expired') {
      const now = new Date();
      coupons = coupons.filter(c => c.expires && new Date(c.expires) < now);
    } else if (statusFilter === 'active') {
      const now = new Date();
      coupons = coupons.filter(c => !c.used && (!c.expires || new Date(c.expires) >= now));
    }

    // Calculate stats from ALL filtered coupons (before pagination)
    const totalCoupons = coupons.length;
    const usedCoupons = coupons.filter(c => c.used).length;
    const unusedCoupons = coupons.filter(c => !c.used).length;
    const now = new Date();
    const expiredCoupons = coupons.filter(c => c.expires && new Date(c.expires) < now).length;
    const activeCoupons = coupons.filter(c => !c.used && (!c.expires || new Date(c.expires) >= now)).length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCoupons = coupons.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCoupons / limit);

    return NextResponse.json({
      coupons: paginatedCoupons,
      stats: {
        totalCoupons,
        usedCoupons,
        unusedCoupons,
        expiredCoupons,
        activeCoupons,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCoupons,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Error reading coupons:', err);
    return NextResponse.json({
      coupons: [],
      stats: { totalCoupons: 0, usedCoupons: 0, unusedCoupons: 0, expiredCoupons: 0, activeCoupons: 0 },
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
  if (!body || !body.code) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(COUPONS_PATH, 'utf-8');
    const coupons = JSON.parse(raw) as Array<Coupon>;
    const newC = { code: String(body.code).toUpperCase(), type: body.type || 'amount', value: Number(body.value || 0), expires: body.expires || null, used: false };
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
