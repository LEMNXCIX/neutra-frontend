import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');

type User = {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  avatar?: string;
};

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const searchQuery = url.searchParams.get('search') || '';
  const roleFilter = url.searchParams.get('role') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf-8');
    let users = JSON.parse(raw) as Array<User>;

    // Hide password
    users = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: !!u.isAdmin,
      avatar: u.avatar || null,
    }));

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter === 'admin') {
      users = users.filter(u => u.isAdmin);
    } else if (roleFilter === 'user') {
      users = users.filter(u => !u.isAdmin);
    }

    // Calculate stats from ALL filtered users (before pagination)
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.isAdmin).length;
    const regularUsers = users.filter(u => !u.isAdmin).length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      users: paginatedUsers,
      stats: {
        totalUsers,
        adminUsers,
        regularUsers,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalUsers,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Error reading users:', err);
    return NextResponse.json({
      users: [],
      stats: { totalUsers: 0, adminUsers: 0, regularUsers: 0 },
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
