import { NextResponse } from "next/server";

// Simple in-memory store for demo purposes
let store: { id: string; name: string; qty: number }[] = [
  { id: "p1", name: "Product 1", qty: 2 },
];

export async function GET() {
  return NextResponse.json({ items: store });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { id, name } = body;
  const existing = store.find((s) => s.id === id);
  if (existing) existing.qty += 1;
  else store.push({ id, name, qty: 1 });
  return NextResponse.json({ items: store });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    store = store.filter((s) => s.id !== id);
  }
  return NextResponse.json({ items: store });
}
