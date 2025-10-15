import fs from 'fs';
import path from 'path';

const PRODUCTS_PATH = path.join(process.cwd(), 'src', 'data', 'products.json');

export type Product = {
  id: string;
  title: string;
  price: number;
  category?: string;
  description?: string;
  image?: string;
  stock?: number;
};

export function readProducts(): Product[] {
  try {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

export function writeProducts(items: Product[]) {
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

export function findProduct(id: string): Product | undefined {
  const all = readProducts();
  return all.find(p => p.id === id);
}
