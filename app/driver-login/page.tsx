'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotionDriverLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F6F3] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-[#37352F] mb-2">Driver Login</h1>
          <p className="text-[#6B6B6B]">Access your income data</p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white border border-[#E9E9E8] rounded-sm shadow-sm p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-[#FFEBE9] border border-[#FFC1BC] rounded-sm text-[#E03E3E] text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#6B6B6B] mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-9 px-3 py-2 bg-white border border-[#E9E9E8] rounded-sm focus:outline-none focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] text-sm transition duration-150"
                placeholder="D0001"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#6B6B6B] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 px-3 py-2 bg-white border border-[#E9E9E8] rounded-sm focus:outline-none focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] text-sm transition duration-150"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center h-9 rounded-sm text-white text-sm font-medium transition duration-150 ${
                isLoading 
                  ? 'bg-[#9EC2F0] cursor-not-allowed' 
                  : 'bg-[#2383E2] hover:bg-[#1b6ac4]'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
        
        {/* Back link */}
        <div className="mt-4 text-center">
          <a 
            href="/login" 
            className="text-sm text-[#2383E2] hover:underline"
          >
            Back to main login
          </a>
        </div>
      </div>
    </div>
  );
}