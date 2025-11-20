import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const BANNERS_PATH = path.join(process.cwd(), 'src', 'data', 'banners.json');

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const raw = fs.readFileSync(BANNERS_PATH, 'utf-8');
    const banners = JSON.parse(raw) as Array<any>;
    return NextResponse.json({ banners });
  } catch {
    return NextResponse.json({ banners: [] });
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
