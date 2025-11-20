import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CATEGORIES_PATH = path.join(process.cwd(), 'src', 'data', 'categories.json');

export async function GET() {
  try {
    const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    const cats = JSON.parse(raw);
    return NextResponse.json({ categories: cats });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
