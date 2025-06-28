// app/login/page.tsx - Fixed to not auto-format phone numbers
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { TbBus, TbPhone, TbLock } from "react-icons/tb";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // แก้ไข: ไม่ทำการ format เบอร์โทรอัตโนมัติ
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // อนุญาตเฉพาะตัวเลขและขีดกลาง (สำหรับผู้ใช้ที่ต้องการใส่เอง)
    const cleanValue = value.replace(/[^\d-]/g, '');
    
    // จำกัดความยาว
    if (cleanValue.length <= 12) {
      setPhone(cleanValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // ลบขีดกลางออกเพื่อการ login
      const cleanPhone = phone.replace(/\D/g, '');
      
      const result = await signIn('credentials', {
        phone: cleanPhone,
        password,
        redirect: false,
      });

      console.log('Login result:', result);

      if (result?.error) {
        setError(result.error);
      } else {
        const session = await getSession();
        console.log('Session after login:', session);
        
        if (session?.user?.role === 'driver') {
          router.push('/driver-portal');
        } else if (session?.user?.role === 'station') {
          router.push('/station-portal');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('ເກີດຂໍ້ຜິດພາດໃນການເຂົ້າສູ່ລະບົບ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="bg-white rounded-t-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <TbBus className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ລະບົບຂາຍປີ້ລົດຕູ້ໂດຍສານ
          </h1>
          <p className="text-sm text-gray-600">
            ປະຈຳສະຖານີລົດໄຟຫຼວງພະບາງ
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-b-xl shadow-lg border-t-0 border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ເບີໂທລະສັບ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TbPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="2012345678"
                    required
                    disabled={isLoading}
                    maxLength={12}
                  />
                </div>
                
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ລະຫັດຜ່ານ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TbLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  ກຳລັງເຂົ້າສູ່ລະບົບ...
                </div>
              ) : (
                'ເຂົ້າສູ່ລະບົບ'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2025 ລະບົບຂາຍປີ້ລົດຕູ້ໂດຍສານ ປະຈຳສະຖານີລົດໄຟຫຼວງພະບາງ
          </p>
        </div>
      </div>
    </div>
  );
}