/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const BANNERS_PATH = path.join(process.cwd(), 'src', 'data', 'banners.json');

export async function PUT(req: any, context: any) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = context.params?.id;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(BANNERS_PATH, 'utf-8');
    const banners = JSON.parse(raw) as Array<any>;
    const idx = banners.findIndex(b => b.id === id);
    if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    banners[idx] = { ...banners[idx], ...body };
    const tmp = `${BANNERS_PATH}.tmp`;
    const bak = `${BANNERS_PATH}.bak`;
    if (fs.existsSync(BANNERS_PATH)) fs.copyFileSync(BANNERS_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(banners, null, 2), 'utf-8');
    fs.renameSync(tmp, BANNERS_PATH);
    return NextResponse.json(banners[idx]);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}

export async function DELETE(req: any, context: any) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = context.params?.id;
  try {
    const raw = fs.readFileSync(BANNERS_PATH, 'utf-8');
    let banners = JSON.parse(raw) as Array<any>;
    banners = banners.filter(b => b.id !== id);
    const tmp = `${BANNERS_PATH}.tmp`;
    const bak = `${BANNERS_PATH}.bak`;
    if (fs.existsSync(BANNERS_PATH)) fs.copyFileSync(BANNERS_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(banners, null, 2), 'utf-8');
    fs.renameSync(tmp, BANNERS_PATH);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
