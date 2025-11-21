import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';

const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

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
        const filename = `avatar_${Date.now()}.${ext}`;
        const dest = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(dest, buf);
        return `/uploads/${filename}`;
    } catch { return null }
}

// GET: get current user profile
export async function GET(req: Request) {
    const userCheck = getUserFromRequest(req);
    if (!userCheck.ok) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    try {
        const raw = fs.readFileSync(USERS_PATH, 'utf-8');
        const users = JSON.parse(raw) as Array<any>;
        const user = users.find(u => u.id === userCheck.user?.id);

        if (!user) {
            return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: !!user.isAdmin,
                avatar: user.avatar || null,
            }
        });
    } catch {
        return NextResponse.json({ error: 'read_failed' }, { status: 500 });
    }
}

// PUT: update current user profile
export async function PUT(req: Request) {
    const userCheck = getUserFromRequest(req);
    if (!userCheck.ok) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const userId = userCheck.user.id;

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    try {
        const raw = fs.readFileSync(USERS_PATH, 'utf-8');
        const users = JSON.parse(raw) as Array<any>;
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
        }

        // Update allowed fields
        if (body.name) users[userIndex].name = String(body.name);
        if (body.email) users[userIndex].email = String(body.email);

        // Handle avatar upload
        if (body.avatarBase64) {
            const avatarUrl = saveBase64Image(String(body.avatarBase64));
            if (avatarUrl) {
                users[userIndex].avatar = avatarUrl;
            }
        }

        // Write updated users
        const tmp = `${USERS_PATH}.tmp`;
        const bak = `${USERS_PATH}.bak`;
        if (fs.existsSync(USERS_PATH)) fs.copyFileSync(USERS_PATH, bak);
        fs.writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf-8');
        fs.renameSync(tmp, USERS_PATH);

        return NextResponse.json({
            user: {
                id: users[userIndex].id,
                name: users[userIndex].name,
                email: users[userIndex].email,
                isAdmin: !!users[userIndex].isAdmin,
                avatar: users[userIndex].avatar || null,
            }
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        return NextResponse.json({ error: 'update_failed' }, { status: 500 });
    }
}
