import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SLIDERS_PATH = path.join(process.cwd(), 'src', 'data', 'sliders.json');

export async function GET() {
  try {
    const raw = fs.readFileSync(SLIDERS_PATH, 'utf-8');
    const sliders = JSON.parse(raw) as Array<any>;
    const now = new Date();
    const visible = sliders.filter(s => s.active).filter(s => {
      try {
        const st = s.startsAt ? new Date(s.startsAt) : null;
        const en = s.endsAt ? new Date(s.endsAt) : null;
        if (st && now < st) return false;
        if (en && now > en) return false;
        return true;
      } catch { return false }
    });
    return NextResponse.json({ sliders: visible });
  } catch {
    return NextResponse.json({ sliders: [] });
  }
}
