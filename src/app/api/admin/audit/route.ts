import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const AUDIT_PATH = path.join(process.cwd(), 'src', 'data', 'audit.log');

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const raw = fs.readFileSync(AUDIT_PATH, 'utf-8');
    const lines = raw.split('\n').filter(Boolean);
    const last = lines.slice(-200).map(l => l);
    return NextResponse.json({ lines: last });
  } catch {
    return NextResponse.json({ lines: [] });
  }
}
