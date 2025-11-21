import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const SLIDERS_PATH = path.join(process.cwd(), 'src', 'data', 'sliders.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

type Slide = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  startsAt?: string;
  endsAt?: string;
  active?: boolean;
};

function ensureUploads() { if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true }) }

function saveBase64Image(dataUrl: string) {
  try {
    const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!m) return null;
    const mime = m[1];
    const ext = mime.split('/')[1] || 'png';
    const b64 = m[2];
    const buf = Buffer.from(b64, 'base64');
    ensureUploads();
    const filename = `upload_${Date.now()}.${ext}`;
    const dest = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(dest, buf);
    return `/uploads/${filename}`;
  } catch { return null }
}

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const searchQuery = url.searchParams.get('search') || '';
  const statusFilter = url.searchParams.get('status') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  try {
    const raw = fs.readFileSync(SLIDERS_PATH, 'utf-8');
    let sliders = JSON.parse(raw) as Array<Slide>;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sliders = sliders.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      sliders = sliders.filter(s => s.active);
    } else if (statusFilter === 'inactive') {
      sliders = sliders.filter(s => !s.active);
    }

    // Calculate stats from ALL filtered sliders (before pagination)
    const totalSliders = sliders.length;
    const activeSliders = sliders.filter(s => s.active).length;
    const inactiveSliders = sliders.filter(s => !s.active).length;
    const withImages = sliders.filter(s => s.image).length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSliders = sliders.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalSliders / limit);

    return NextResponse.json({
      sliders: paginatedSliders,
      stats: {
        totalSliders,
        activeSliders,
        inactiveSliders,
        withImages,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalSliders,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Error reading sliders:', err);
    return NextResponse.json({
      sliders: [],
      stats: { totalSliders: 0, activeSliders: 0, inactiveSliders: 0, withImages: 0 },
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
    const raw = fs.readFileSync(SLIDERS_PATH, 'utf-8');
    const sliders = JSON.parse(raw) as Array<any>;
    const id = `s_${Date.now()}`;
    const entry: any = { id, title: String(body.title), subtitle: body.subtitle ? String(body.subtitle) : undefined, startsAt: body.startsAt ? String(body.startsAt) : undefined, endsAt: body.endsAt ? String(body.endsAt) : undefined, active: !!body.active };
    if (body.imageBase64) {
      const url = saveBase64Image(String(body.imageBase64));
      if (url) entry.image = url;
    } else if (body.image) entry.image = String(body.image);
    sliders.push(entry);
    const tmp = `${SLIDERS_PATH}.tmp`;
    if (fs.existsSync(SLIDERS_PATH)) fs.copyFileSync(SLIDERS_PATH, `${SLIDERS_PATH}.bak`);
    fs.writeFileSync(tmp, JSON.stringify(sliders, null, 2), 'utf-8');
    fs.renameSync(tmp, SLIDERS_PATH);
    return NextResponse.json(entry);
  } catch { return NextResponse.json({ error: 'write_failed' }, { status: 500 }); }
}
