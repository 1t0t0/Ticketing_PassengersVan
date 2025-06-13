// app/login/page.tsx - Updated to use phone number instead of email
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

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Limit to 10 digits for Lao phone numbers
    if (phoneNumber.length <= 10) {
      // Format as XXX-XXX-XXXX or similar
      if (phoneNumber.length >= 7) {
        return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
      } else if (phoneNumber.length >= 4) {
        return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
      }
      return phoneNumber;
    }
    return phone; // Don't update if too long
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Remove formatting for login
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
            ປະຈຳທາງລົດໄຟ ລາວ-ຈີນ
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
                    placeholder="020-5555-5555"
                    required
                    disabled={isLoading}
                    maxLength={12} // XXX-XXX-XXXX format
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ກະລຸນາໃສ່ເບີໂທ 10 ຫຼັກ (ຕົວຢ່າງ: 020-5555-5555)
                </p>
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

          {/* Demo Account Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              🔐 ບັນຊີທົດລອງ:
            </h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>ແອດມິນ:</span>
                <span className="font-mono">020-1111-1111</span>
              </div>
              <div className="flex justify-between">
                <span>ພະນັກງານ:</span>
                <span className="font-mono">020-2222-2222</span>
              </div>
              <div className="flex justify-between">
                <span>ຄົນຂັບ:</span>
                <span className="font-mono">020-3333-3333</span>
              </div>
              <div className="flex justify-between">
                <span>ສະຖານີ:</span>
                <span className="font-mono">020-4444-4444</span>
              </div>
              <div className="text-center mt-2 pt-2 border-t border-gray-200">
                <span>ລະຫັດຜ່ານ: </span>
                <span className="font-mono font-semibold">123456</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2025 ລະບົບຂາຍປີ້ລົດຕູ້ໂດຍສານ ປະຈຳທາງລົດໄຟ ລາວ-ຈີນ
          </p>
        </div>
      </div>
    </div>
  );
}