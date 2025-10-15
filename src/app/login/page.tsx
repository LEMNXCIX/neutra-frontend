"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function LoginPage(){
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    router.push('/');
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="border p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-4 py-2 bg-zinc-900 text-white rounded" disabled={loading}>{loading ? '...' : 'Entrar'}</button>
      </form>
      <p className="mt-4 text-sm">¿No tienes cuenta? <Link href="/register" className="text-blue-600">Regístrate</Link></p>
    </main>
  );
}
