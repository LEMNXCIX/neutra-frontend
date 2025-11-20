import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const ORDERS_PATH = path.join(process.cwd(), 'src', 'data', 'orders.json');

type OrderItem = { id: string; name: string; qty: number; price: number };
type Order = {
    id: string;
    userId: string;
    total: number;
    status: string;
    tracking: string;
    address: string;
    items: OrderItem[];
    date: string;
    coupon?: {
        code: string;
        type: string;
        value: number;
        discount: number;
    };
};

function readOrders(): Order[] {
    try {
        const raw = fs.readFileSync(ORDERS_PATH, 'utf-8');
        return JSON.parse(raw) as Order[];
    } catch {
        return [];
    }
}

function writeOrders(arr: Order[]) {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(arr, null, 2), 'utf-8');
}

// GET /api/admin/orders/[id] - Get detailed order information
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const check = requireAdminFromRequest(req);
    if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = params;
    const orders = readOrders();
    const order = orders.find(o => o.id === id);

    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
}

// PUT /api/admin/orders/[id] - Update order status and/or tracking
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const check = requireAdminFromRequest(req);
    if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await req.json().catch(() => null);

    if (!body) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { status, tracking } = body;

    // Validate status if provided
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled', 'pending'];
    if (status !== undefined && !validStatuses.includes(status)) {
        return NextResponse.json({
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        }, { status: 400 });
    }

    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order fields
    if (status !== undefined) {
        orders[orderIndex].status = status;
    }
    if (tracking !== undefined) {
        orders[orderIndex].tracking = String(tracking);
    }

    writeOrders(orders);

    return NextResponse.json({ order: orders[orderIndex] });
}
