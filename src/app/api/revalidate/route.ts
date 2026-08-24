import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Webhook target for Strapi publish/unpublish events.
 * Configure in Strapi: URL + header x-revalidate-secret + trigger on
 * entry.publish / entry.unpublish / entry.delete.
 */
export async function POST(req: Request) {
    const secret = process.env.REVALIDATE_SECRET;
    if (secret && req.headers.get("x-revalidate-secret") !== secret) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const tenantId = body?.entry?.tenantId ?? body?.tenantId;
    if (typeof tenantId === "string" && tenantId) {
        revalidateTag(`content:${tenantId}`, "max");
        return NextResponse.json({ ok: true, revalidated: `content:${tenantId}` });
    }

    return NextResponse.json(
        { ok: false, reason: "no tenantId in payload" },
        { status: 400 }
    );
}
