import { getRequest } from "@tanstack/react-start/server";

import { getBackendUrl } from "@/lib/backend-url";

/** All cookies of the current Start request, as a `{ name: value }` map. */
const currentCookies = (): Record<string, string> => {
    const jar = getRequest()?.headers?.get("cookie") ?? "";
    const cookies: Record<string, string> = {};
    for (const pair of jar.split(";")) {
        const separator = pair.indexOf("=");
        if (separator < 0) continue;
        const name = pair.slice(0, separator).trim();
        if (!name) continue;
        cookies[name] = decodeURIComponent(pair.slice(separator + 1).trim());
    }
    return cookies;
};

export async function validateAdminAccess() {
    try {
        const cookies = currentCookies();
        const tokenCookie = cookies.token;

        if (!tokenCookie) {
            return { isValid: false, user: null };
        }

        const cookieHeader = Object.entries(cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join("; ");

        const response = await fetch(`${getBackendUrl()}/auth/validate`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            cache: "no-store",
        });

        if (!response.ok) return { isValid: false, user: null };

        const data = await response.json();
        if (!data.success || !data.data?.user)
            return { isValid: false, user: null };

        const user = data.data.user;

        // We consider an admin anyone with SUPER_ADMIN or ADMIN role
        const isAdmin =
            user.role?.name === "SUPER_ADMIN" || user.role?.name === "ADMIN";

        return { isValid: isAdmin, user, cookieHeader };
    } catch (error) {
        console.error("Admin validation error:", error);
        return { isValid: false, user: null };
    }
}

export async function extractTokenFromCookies() {
    return currentCookies().token || null;
}

export async function getCookieString() {
    return Object.entries(currentCookies())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
}

export function extractTokenFromRequest(req: Request | any): string | null {
    // Check Authorization header first
    try {
        const auth =
            req.headers.get("authorization") ||
            req.headers.get("Authorization");
        if (
            auth &&
            typeof auth === "string" &&
            auth.toLowerCase().startsWith("bearer ")
        ) {
            return auth.slice(7).trim();
        }
    } catch {}

    // Fallback to cookie
    try {
        const cookieHeader = req.headers.get("cookie") || "";
        const pairs = cookieHeader.split(";").flatMap((s: string) => {
            const trimmed = s.trim();
            return trimmed ? [trimmed] : [];
        });
        for (const p of pairs) {
            const [k, ...v] = p.split("=");
            if (k === "token") return decodeURIComponent(v.join("="));
        }
    } catch {}

    return null;
}
