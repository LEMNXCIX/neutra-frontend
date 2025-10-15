import { NextResponse } from 'next/server';

const products = [
  { id: "p1", title: "Minimal Chair", price: 129.0, category: "seating", description: "A stylish minimal chair.", image: "https://picsum.photos/seed/p1/600/400" },
  { id: "p2", title: "Desk Lamp", price: 59.0, category: "lighting", description: "Warm LED desk lamp.", image: "https://picsum.photos/seed/p2/600/400" },
  { id: "p3", title: "Wooden Table", price: 299.0, category: "table", description: "Solid oak table.", image: "https://picsum.photos/seed/p3/600/400" },
  { id: "p4", title: "Minimal Sofa", price: 499.0, category: "seating", description: "Comfortable two-seater sofa.", image: "https://picsum.photos/seed/p4/600/400" },
  { id: "p5", title: "Floor Lamp", price: 89.0, category: "lighting", description: "Tall floor lamp with soft light.", image: "https://picsum.photos/seed/p5/600/400" },
  { id: "p6", title: "Side Table", price: 79.0, category: "table", description: "Compact side table for small spaces.", image: "https://picsum.photos/seed/p6/600/400" },
  { id: "p7", title: "Accent Armchair", price: 219.0, category: "seating", description: "Comfortable accent chair with fabric upholstery.", image: "https://picsum.photos/seed/p7/600/400" },
];

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const p = await context.params;
  const id = p.id;
  const found = products.find((p) => p.id === id);
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product: found });
}
