import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BANNERS_PATH = path.join(process.cwd(), 'src', 'data', 'banners.json');

export async function GET() {
  try {
    const raw = fs.readFileSync(BANNERS_PATH, 'utf-8');
    const banners = JSON.parse(raw) as Array<any>;
    // filter active and within date range
    const now = new Date();
    const visible = banners.filter(b => b.active).filter(b => {
      try {
        const s = b.startsAt ? new Date(b.startsAt) : null;
        const e = b.endsAt ? new Date(b.endsAt) : null;
        if (s && now < s) return false;
        if (e && now > e) return false;
        return true;
      } catch { return false }
    });
    return NextResponse.json({ banners: visible });
  } catch {
    return NextResponse.json({ banners: [] });
  }
}
