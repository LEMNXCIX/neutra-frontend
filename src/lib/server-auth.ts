
import { cookies } from 'next/headers';

const getBackendUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    return url.endsWith('/api') ? url : `${url}/api`;
};

const BACKEND_API_URL = getBackendUrl();
console.log(BACKEND_API_URL);
export async function validateAdminAccess() {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');

        if (!tokenCookie) {
            return { isValid: false, user: null };
        }

        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');

        const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader,
            },
            cache: 'no-store',
        });

        if (!response.ok) return { isValid: false, user: null };

        const data = await response.json();
        if (!data.success || !data.data?.user) return { isValid: false, user: null };

        const user = data.data.user;

        // We consider an admin anyone who has SUPER_ADMIN role
        const isAdmin = user.role?.name === 'SUPER_ADMIN';

        return { isValid: isAdmin, user, cookieHeader };
    } catch (error) {
        console.error('Admin validation error:', error);
        return { isValid: false, user: null };
    }
}

export async function extractTokenFromCookies() {
    const cookieStore = await cookies();
    return cookieStore.get('token')?.value || null;
}

export async function getCookieString() {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    return allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

export function extractTokenFromRequest(req: Request | any): string | null {
    // Check Authorization header first
    try {
        const auth = req.headers.get('authorization') || req.headers.get('Authorization');
        if (auth && typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
            return auth.slice(7).trim();
        }
    } catch { }

    // Fallback to cookie
    try {
        const cookieHeader = req.headers.get('cookie') || '';
        const pairs = cookieHeader.split(';').map((s: string) => s.trim()).filter(Boolean);
        for (const p of pairs) {
            const [k, ...v] = p.split('=');
            if (k === 'token') return decodeURIComponent(v.join('='));
        }
    } catch { }

    return null;
}
