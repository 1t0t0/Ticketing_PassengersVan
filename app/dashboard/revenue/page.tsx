'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface RevenueRatio {
  _id?: string;
  company: number;
  station: number;
  drivers: number;
  updatedAt?: Date;
  lastUpdatedBy?: string;
}

export default function RevenueSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // สถานะสำหรับการแบ่งรายได้
  const [revenueRatio, setRevenueRatio] = useState<RevenueRatio>({
    company: 10,
    station: 20,
    drivers: 70
  });
  
  // สถานะสำหรับฟอร์มแก้ไข
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<RevenueRatio>({
    company: 10,
    station: 20,
    drivers: 70
  });
  
  // สถานะการโหลด
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // สีสำหรับกราฟวงกลม
  const COLORS = ['#2383E2', '#ff9800', '#4caf50'];
  
  // ตรวจสอบการ authenticate
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // ดึงข้อมูลสัดส่วนการแบ่งรายได้
  useEffect(() => {
    if (status === 'authenticated') {
      fetchRevenueRatio();
    }
  }, [status]);
  
  // ฟังก์ชันดึงข้อมูลการแบ่งรายได้
  const fetchRevenueRatio = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/settings/revenue-ratio');
      if (!response.ok) {
        throw new Error('Failed to fetch revenue ratio');
      }
      
      const data = await response.json();
      setRevenueRatio(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching revenue ratio:', error);
      // ใช้ค่าเริ่มต้นหากไม่สามารถดึงข้อมูลได้
    } finally {
      setLoading(false);
    }
  };
  
  // ฟังก์ชันบันทึกการแบ่งรายได้
  const saveRevenueRatio = async () => {
    // ตรวจสอบว่าผลรวมต้องเท่ากับ 100%
    const total = formData.company + formData.station + formData.drivers;
    if (total !== 100) {
      alert('ผลรวมเปอร์เซ็นต์ต้องเท่ากับ 100%');
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await fetch('/api/settings/revenue-ratio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update revenue ratio');
      }
      
      const updatedData = await response.json();
      setRevenueRatio(updatedData);
      setEditMode(false);
      alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving revenue ratio:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };
  
  // ฟังก์ชันจัดการการเปลี่ยนแปลงฟอร์ม
  const handleInputChange = (field: keyof RevenueRatio, value: number) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  // แปลงข้อมูลสำหรับแสดงในกราฟวงกลม
  const chartData = [
    { name: 'บริษัท', value: revenueRatio.company },
    { name: 'สถานี', value: revenueRatio.station },
    { name: 'คนขับรถ', value: revenueRatio.drivers }
  ];
  
  // ฟังก์ชันแสดงวันที่อัปเดต
  const formatUpdateDate = (date?: Date) => {
    if (!date) return 'ยังไม่เคยอัปเดต';
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ການແບ່ງລາຍໄດ້</h1>
        {session?.user?.role === 'admin' && !editMode && (
          <NeoButton onClick={() => setEditMode(true)}>
            ແກ້ໄຂການຕັ້ງຄ່າ
          </NeoButton>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* กราฟวงกลมแสดงสัดส่วน */}
        <div className="lg:col-span-2">
          <NeoCard className="p-6">
            <h2 className="text-xl font-bold mb-4">ອັດຕາສ່ວນການແບ່ງລາຍໄດ້</h2>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>ອັບເດດລ່າສຸດ: {formatUpdateDate(revenueRatio.updatedAt)}</p>
              {revenueRatio.lastUpdatedBy && (
                <p>ອັບເດດໂດຍ: {revenueRatio.lastUpdatedBy}</p>
              )}
            </div>
          </NeoCard>
        </div>
        
        {/* ข้อมูลหรือฟอร์มแก้ไข */}
        <div>
          <NeoCard className="p-6">
            <h2 className="text-xl font-bold mb-4">
              {editMode ? 'ແກ້ໄຂອັດຕາສ່ວນ' : 'ລາຍລະອຽດ'}
            </h2>
            
            {editMode ? (
              // ฟอร์มแก้ไข (แสดงเฉพาะ admin)
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">ບໍລິສັດ (%)</label>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-300 rounded p-2"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">ສະຖານີ (%)</label>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-300 rounded p-2"
                    value={formData.station}
                    onChange={(e) => handleInputChange('station', parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">ຄົນຂັບລົດ (%)</label>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-300 rounded p-2"
                    value={formData.drivers}
                    onChange={(e) => handleInputChange('drivers', parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="text-right pt-2">
                  <span className={`font-bold text-sm ${
                    formData.company + formData.station + formData.drivers === 100
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    ຜົນລວມ: {formData.company + formData.station + formData.drivers}%
                    {formData.company + formData.station + formData.drivers !== 100 && (
                      ' (ຕ້ອງເທົ່າກັບ 100%)'
                    )}
                  </span>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <NeoButton 
                    variant="secondary"
                    onClick={() => {
                      setFormData(revenueRatio);
                      setEditMode(false);
                    }}
                  >
                    ຍົກເລີກ
                  </NeoButton>
                  <NeoButton 
                    onClick={saveRevenueRatio}
                    disabled={saving || formData.company + formData.station + formData.drivers !== 100}
                  >
                    {saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
                  </NeoButton>
                </div>
              </div>
            ) : (
              // แสดงข้อมูลปัจจุบัน
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">ບໍລິສັດ:</span>
                  <span className="text-xl font-bold">{revenueRatio.company}%</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">ສະຖານີ:</span>
                  <span className="text-xl font-bold">{revenueRatio.station}%</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">ຄົນຂັບລົດ:</span>
                  <span className="text-xl font-bold">{revenueRatio.drivers}%</span>
                </div>
                
                <div className="pt-4 text-sm text-gray-600">
                  <p>
                    ສ່ວນແບ່ງລາຍໄດ້ຈະຖືກນຳໄປໃຊ້ເມື່ອມີການຂາຍບີ້ລົດໂດຍສານ.
                    ລາຍໄດ້ຈະຖືກແບ່ງຕາມເປີເຊັນໃຫ້ແຕ່ລະຝ່າຍອັດຕະໂນມັດ.
                  </p>
                </div>
              </div>
            )}
          </NeoCard>
          
          {/* ตัวอย่างการแบ่งรายได้ */}
          <NeoCard className="p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">ຕົວຢ່າງການແບ່ງລາຍໄດ້</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-1">ສຳລັບບີ້ລາຄາ ₭45,000</h3>
                <div className="space-y-2 text-sm pl-4">
                  <p className="flex justify-between">
                    <span>ບໍລິສັດ ({revenueRatio.company}%):</span>
                    <span className="font-bold">₭{Math.round(45000 * revenueRatio.company / 100).toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>ສະຖານີ ({revenueRatio.station}%):</span>
                    <span className="font-bold">₭{Math.round(45000 * revenueRatio.station / 100).toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>ຄົນຂັບລົດ ({revenueRatio.drivers}%):</span>
                    <span className="font-bold">₭{Math.round(45000 * revenueRatio.drivers / 100).toLocaleString()}</span>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">ສຳລັບການຂາຍ 100 ບີ້ ມູນຄ່າ ₭4,500,000</h3>
                <div className="space-y-2 text-sm pl-4">
                  <p className="flex justify-between">
                    <span>ບໍລິສັດ ({revenueRatio.company}%):</span>
                    <span className="font-bold">₭{Math.round(4500000 * revenueRatio.company / 100).toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>ສະຖານີ ({revenueRatio.station}%):</span>
                    <span className="font-bold">₭{Math.round(4500000 * revenueRatio.station / 100).toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>ຄົນຂັບລົດ ({revenueRatio.drivers}%):</span>
                    <span className="font-bold">₭{Math.round(4500000 * revenueRatio.drivers / 100).toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>
          </NeoCard>
        </div>
      </div>
    </div>
  );
}