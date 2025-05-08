'use client';

import { useState, useEffect } from 'react';
import NeoButton from '@/components/ui/NotionButton';
import NeoCard from '@/components/ui/NotionCard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Ticket {
  _id: string;
  ticketNumber: string;
  price: number;
  soldAt: Date;
  soldBy: string;
  paymentMethod: string;
}

export default function TicketHistoryPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ฟังก์ชันดึงข้อมูลตั๋วทั้งหมด
  const fetchTickets = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลตั๋วล่าสุด 50 รายการ
      const response = await fetch('/api/tickets?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // เรียกข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTickets();
    }
  }, [status]);

  // ฟังก์ชันสำหรับค้นหาตั๋ว
  const handleSearch = async () => {
    setLoading(true);
    try {
      let url = '/api/tickets/search?';
      
      if (searchQuery) {
        url += `query=${encodeURIComponent(searchQuery)}&`;
      }
      
      if (selectedDate) {
        url += `date=${encodeURIComponent(selectedDate)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to search tickets');
      }
      
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error searching tickets:', error);
      alert('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันล้างการค้นหา
  const handleClear = () => {
    setSearchQuery('');
    setSelectedDate('');
    fetchTickets();
  };

  // ฟังก์ชันแปลงสถานะการชำระเงิน
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'ເງິນສົດ';
      case 'qr':
        return 'QR';
      case 'card':
        return 'ບັດ';
      default:
        return method;
    }
  };

  // ฟังก์ชันพิมพ์ตั๋วซ้ำ
  const handleReprint = async (ticket: Ticket) => {
    try {
      // สร้าง state สำหรับเก็บตั๋วที่จะพิมพ์
      const response = await fetch(`/api/tickets/${ticket._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get ticket details');
      }
      
      const ticketData = await response.json();
      
      // เก็บ ticket ในท้องถิ่น storage ชั่วคราว
      localStorage.setItem('reprintTicket', JSON.stringify(ticketData));
      
      // ไปที่หน้าพิมพ์ตั๋ว
      window.open(`/dashboard/tickets/print/${ticket._id}`, '_blank');
    } catch (error) {
      console.error('Error preparing ticket for reprint:', error);
      alert('เกิดข้อผิดพลาดในการเตรียมพิมพ์ตั๋ว');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-black mb-6">ລາຍການບີ້</h1>
      
      {/* ส่วนค้นหา */}
      <NeoCard className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2">ຄົ້ນຫາ</label>
            <input
              type="text"
              className="w-full border-2 border-black p-2"
              placeholder="ຄົ້ນຫາໂດຍເລກບີ້"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2">ວັນເວລາ</label>
            <input
              type="date"
              className="w-full border-2 border-black p-2"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <NeoButton onClick={handleSearch}>ຄົ້ນຫາ</NeoButton>
            <NeoButton variant="secondary" onClick={handleClear}>ແກ້ໄຂ</NeoButton>
          </div>
        </div>
      </NeoCard>
      
      {/* ตารางตั๋ว */}
      <NeoCard className="p-6">
        <h2 className="text-xl font-black mb-4">ລາຍການບີ້</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="p-2 text-left w-16">
                  <input type="checkbox" className="w-5 h-5" />
                </th>
                <th className="p-2 text-left">ອອກໂດຍ</th>
                <th className="p-2 text-left">ເລກບີ້</th>
                <th className="p-2 text-right">ລາຄາ</th>
                <th className="p-2 text-center">ວັນເວລາ</th>
                <th className="p-2 text-center">ການຈັດການ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">ກຳລັງໂຫລດ...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2">
                      <input type="checkbox" className="w-5 h-5" />
                    </td>
                    <td className="p-2">{ticket.soldBy}</td>
                    <td className="p-2">{ticket.ticketNumber}</td>
                    <td className="p-2 text-right">{ticket.price.toLocaleString()}</td>
                    <td className="p-2 text-center">
                      {new Date(ticket.soldAt).toLocaleTimeString('lo-LA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        <NeoButton 
                          size="sm" 
                          className="bg-yellow-400 hover:bg-yellow-500"
                          onClick={() => handleReprint(ticket)}
                        >
                          ແກ້ໄຂ
                        </NeoButton>
                        <NeoButton 
                          size="sm" 
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={async () => {
                            if (confirm('ຕ້ອງການລຶບບີ້ນີ້ບໍ?')) {
                              try {
                                const response = await fetch(`/api/tickets/${ticket._id}`, {
                                  method: 'DELETE',
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Failed to delete ticket');
                                }
                                
                                // รีโหลดข้อมูลหลังลบ
                                fetchTickets();
                                alert('ລຶບບີ້ສຳເລັດແລ້ວ');
                              } catch (error) {
                                console.error('Error deleting ticket:', error);
                                alert('ເກີດຂໍ້ຜິດພາດໃນການລຶບບີ້');
                              }
                            }
                          }}
                        >
                          ລົບ
                        </NeoButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeoCard>
    </div>
  );
}