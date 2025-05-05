'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NeoButton from '@/components/ui/NeoButton';
import NeoCard from '@/components/ui/NeoCard';

export default function DriverLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/driver-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // บันทึกข้อมูลลงใน localStorage
      localStorage.setItem('driverToken', data.token);
      localStorage.setItem('driverInfo', JSON.stringify(data.driver));

      // นำทางไปยังหน้าแสดงข้อมูลรายได้ของคนขับ
      router.push('/driver-income');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neo-yellow p-4">
      <NeoCard className="w-full max-w-md p-8">
        <h1 className="text-4xl font-black text-center mb-2">DRIVER LOGIN</h1>
        <h2 className="text-2xl font-bold text-center mb-8">BUS TICKET SYSTEM</h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-center font-bold">{error}</div>
          )}
          
          <div>
            <label className="block text-sm font-bold mb-2">EMPLOYEE ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="neo-input"
              placeholder="D0001"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neo-input"
              placeholder="********"
              required
            />
          </div>
          
          <NeoButton type="submit" className="w-full" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </NeoButton>
        </form>

        <div className="mt-4 text-center">
          <a href="/login" className="text-sm underline">
            Back to main login
          </a>
        </div>
      </NeoCard>
    </div>
  );
}