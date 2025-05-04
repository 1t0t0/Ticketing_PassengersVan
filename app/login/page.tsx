'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NeoButton from '@/components/ui/NeoButton';
import NeoCard from '@/components/ui/NeoCard';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch  {
      setError('An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neo-yellow p-4">
      <NeoCard className="w-full max-w-md p-8">
        <h1 className="text-4xl font-black text-center mb-2">BUS TICKET</h1>
        <h2 className="text-2xl font-bold text-center mb-8">SYSTEM</h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-center font-bold">{error}</div>
          )}
          
          <div>
            <label className="block text-sm font-bold mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@busticketing.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
            />
          </div>
          
          <NeoButton type="submit" className="w-full">
            SIGN IN
          </NeoButton>
        </form>

        <div className="mt-6 text-sm text-center">
          <p className="font-bold">DEMO ACCOUNTS:</p>
          <p>admin@busticketing.com</p>
          <p>Password: password123</p>
        </div>
      </NeoCard>
    </div>
  );
}