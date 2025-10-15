import { NextResponse } from 'next/server';

const orders = [
  { id: 'o1', userId: 'u1', total: 199.0, status: 'delivered', tracking: 'TRK123', address: 'Calle Falsa 123, Ciudad', items: [{id:'p1', name:'Minimal Chair', qty:1}], date: '2025-09-01' },
  { id: 'o2', userId: 'u2', total: 89.0, status: 'shipped', tracking: 'TRK124', address: 'Av. Siempre Viva 5', items: [{id:'p2', name:'Desk Lamp', qty:1}], date: '2025-09-12' },
  { id: 'o3', userId: 'u1', total: 579.0, status: 'processing', tracking: '', address: 'Calle Falsa 123, Ciudad', items: [{id:'p4', name:'Minimal Sofa', qty:1},{id:'p6',name:'Side Table',qty:1}], date: '2025-10-01' },
  { id: 'o4', userId: 'u1', total: 45.0, status: 'delivered', tracking: 'TRK125', address: 'Calle Falsa 123, Ciudad', items: [{id:'p2', name:'Desk Lamp', qty:1}], date: '2025-08-20' },
];

export async function GET(req: Request, context: { params: Promise<{ id: string }> }){
  const p = await context.params;
  const id = p.id;
  const found = orders.find(o => o.id === id);
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ order: found });
}
