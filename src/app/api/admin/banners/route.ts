import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const BANNERS_PATH = path.join(process.cwd(), 'src', 'data', 'banners.json');

type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  cta?: string;
  ctaUrl?: string;
  startsAt?: string;
  endsAt?: string;
  active?: boolean;
};

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const searchQuery = url.searchParams.get('search') || '';
  const statusFilter = url.searchParams.get('status') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  try {
    const raw = fs.readFileSync(BANNERS_PATH, 'utf-8');
    let banners = JSON.parse(raw) as Array<Banner>;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      banners = banners.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      banners = banners.filter(b => b.active);
    } else if (statusFilter === 'inactive') {
      banners = banners.filter(b => !b.active);
    }

    // Calculate stats from ALL filtered banners (before pagination)
    const totalBanners = banners.length;
    const activeBanners = banners.filter(b => b.active).length;
    const inactiveBanners = banners.filter(b => !b.active).length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBanners = banners.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalBanners / limit);

    return NextResponse.json({
      banners: paginatedBanners,
      stats: {
        totalBanners,
        activeBanners,
        inactiveBanners,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalBanners,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Error reading banners:', err);
    return NextResponse.json({
      banners: [],
      stats: { totalBanners: 0, activeBanners: 0, inactiveBanners: 0 },
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
    const raw = fs.readFileSync(BANNERS_PATH, 'utf-8');
    const banners = JSON.parse(raw) as Array<any>;
    const id = `b_${Date.now()}`;
    const newB = {
      id,
      title: String(body.title),
      subtitle: body.subtitle ? String(body.subtitle) : undefined,
      cta: body.cta ? String(body.cta) : undefined,
      ctaUrl: body.ctaUrl ? String(body.ctaUrl) : undefined,
      startsAt: body.startsAt ? String(body.startsAt) : undefined,
      endsAt: body.endsAt ? String(body.endsAt) : undefined,
      active: !!body.active,
    };
    banners.push(newB);
    const tmp = `${BANNERS_PATH}.tmp`;
    const bak = `${BANNERS_PATH}.bak`;
    if (fs.existsSync(BANNERS_PATH)) fs.copyFileSync(BANNERS_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(banners, null, 2), 'utf-8');
    fs.renameSync(tmp, BANNERS_PATH);
    return NextResponse.json(newB);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
