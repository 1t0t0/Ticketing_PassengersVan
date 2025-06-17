// app/dashboard/admin/settings/page.tsx - Simple version
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import notificationService from '@/lib/notificationService';
import { FiDollarSign, FiSave, FiRefreshCw, FiSettings, FiInfo, FiTrendingUp } from 'react-icons/fi';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPrice, setCurrentPrice] = useState(45000);
  const [newPrice, setNewPrice] = useState('45000');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [status, session, router]);
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCurrentPrice();
    }
  }, [status]);
  
  const fetchCurrentPrice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ticket-price');
      const data = await response.json();
      
      if (data.success) {
        setCurrentPrice(data.ticketPrice);
        setNewPrice(data.ticketPrice.toString());
      } else {
        console.error('Failed to fetch price:', data.error);
        notificationService.error('ບໍ່ສາມາດດຶງຂໍ້ມູນລາຄາປັດຈຸບັນໄດ້');
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericPrice = Number(newPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      notificationService.error('ກະລຸນາໃສ່ລາຄາທີ່ຖືກຕ້ອງ');
      return;
    }
    
    if (numericPrice > 1000000) {
      notificationService.error('ລາຄາບໍ່ສາມາດເກີນ 1,000,000 ກີບ');
      return;
    }
    
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/ticket-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: numericPrice })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentPrice(numericPrice);
        notificationService.success(data.message);
      } else {
        notificationService.error(data.error || 'ເກີດຂໍ້ຜິດພາດ');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການອັບເດດລາຄາ');
    } finally {
      setUpdating(false);
    }
  };
  
  const formatPrice = (value: string) => {
    const num = Number(value.replace(/,/g, ''));
    return isNaN(num) ? value : num.toLocaleString();
  };
  
  const quickPrices = [40000, 45000, 50000, 55000, 60000];
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (session?.user?.role !== 'admin') {
    return null;
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <FiSettings className="h-6 w-6 mr-2" />
              ການຕັ້ງລາຄາປີ້
            </h1>
            <p className="text-gray-600">ປ່ຽນລາຄາປີ້ລົດໂດຍສານໄດ້ງ່າຍໆ</p>
          </div>
          
          <button
            onClick={fetchCurrentPrice}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FiRefreshCw className="h-4 w-4 mr-2" />
            )}
            ອັບເດດຂໍ້ມູນ
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ຟອມປ່ຽນລາຄາ */}
        <NeoCard className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FiDollarSign className="h-5 w-5 mr-2" />
            ປ່ຽນລາຄາປີ້
          </h2>
          
          <form onSubmit={handleUpdatePrice} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ລາຄາໃໝ່ (ກີບ)
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formatPrice(newPrice)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (/^\d*$/.test(value)) {
                      setNewPrice(value);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                  placeholder="45000"
                  disabled={updating || loading}
                />
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <FiInfo className="h-4 w-4 mr-1" />
                  <span>ລາຄາປັດຈຸບັນ: ₭{currentPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* ປຸ່ມລາຄາດ່ວນ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ລາຄາແນະນຳ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickPrices.map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setNewPrice(price.toString())}
                    className={`py-2 px-3 text-sm rounded-lg border transition ${
                      newPrice === price.toString()
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                    disabled={updating || loading}
                  >
                    ₭{price.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <FiInfo className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">ໝາຍເຫດ:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>ລາຄາໃໝ່ຈະມີຜົນທັນທີ</li>
                    <li>ປີ້ທີ່ອອກແລ້ວບໍ່ຖືກປ່ຽນ</li>
                    <li>ສູງສຸດ 1,000,000 ກີບ</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={updating || loading || newPrice === currentPrice.toString()}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
                updating || loading || newPrice === currentPrice.toString()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              } transition`}
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ກຳລັງອັບເດດ...
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4 mr-2" />
                  ບັນທຶກລາຄາໃໝ່
                </>
              )}
            </button>
          </form>
        </NeoCard>
        
        {/* ຂໍ້ມູນປັດຈຸບັນ */}
        <div className="space-y-6">
          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiTrendingUp className="h-5 w-5 mr-2" />
              ຂໍ້ມູນປັດຈຸບັນ
            </h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">ລາຄາປີ້ມາດຕະຖານ</div>
                <div className="text-2xl font-bold text-blue-900">
                  ₭{currentPrice.toLocaleString()}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium mb-1">ລາຄາກຸ່ມ (10 ຄົນ)</div>
                <div className="text-xl font-bold text-green-900">
                  ₭{(currentPrice * 10).toLocaleString()}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium mb-1">ລາຄາກຸ່ມ (5 ຄົນ)</div>
                <div className="text-lg font-bold text-purple-900">
                  ₭{(currentPrice * 5).toLocaleString()}
                </div>
              </div>
            </div>
          </NeoCard>
          
          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ຄຳແນະນຳ</h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>ກວດສອບລາຄາຕະຫຼາດກ່ອນປ່ຽນ</span>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>ແຈ້ງພະນັກງານຂາຍປີ້ລ່ວງໜ້າ</span>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>ລາຄາປ່ຽນທັນທີໃນລະບົບ</span>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>ຕິດຕາມຜົນກະທົບຕໍ່ຍອດຂາຍ</span>
              </div>
            </div>
          </NeoCard>
        </div>
      </div>
    </div>
  );
}