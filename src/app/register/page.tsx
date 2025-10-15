"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function RegisterPage(){
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(name, email, password);
    router.push('/');
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Registro</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="border p-2 rounded" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-4 py-2 bg-zinc-900 text-white rounded" disabled={loading}>{loading ? '...' : 'Crear cuenta'}</button>
      </form>
      <p className="mt-4 text-sm">¿Ya tienes cuenta? <Link href="/login" className="text-blue-600">Entrar</Link></p>
    </main>
  );
}
