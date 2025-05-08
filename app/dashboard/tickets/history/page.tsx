'use client';

import { useState, useEffect } from 'react';
import NeoButton from '@/components/ui/NotionButton';
import NeoCard from '@/components/ui/NotionCard';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';

interface Ticket {
  _id: string;
  ticketNumber: string;
  price: number;
  soldAt: Date;
  soldBy: string;
  paymentMethod: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export default function TicketHistoryPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'cash' | 'qr'>('all');
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10; // จำนวนตั๋วต่อหน้า
  
  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ดึงค่า page จาก URL เมื่อโหลดหน้า
  useEffect(() => {
    const page = searchParams.get('page');
    if (page) {
      setCurrentPage(parseInt(page));
    }
    
    const pmMethod = searchParams.get('paymentMethod');
    if (pmMethod && (pmMethod === 'cash' || pmMethod === 'qr')) {
      setPaymentMethod(pmMethod as 'cash' | 'qr');
    }
  }, [searchParams]);

  // ฟังก์ชันดึงข้อมูลตั๋วทั้งหมด
  const fetchTickets = async (page = 1) => {
    setLoading(true);
    try {
      // สร้าง URL พร้อม query parameters
      let url = `/api/tickets?page=${page}&limit=${itemsPerPage}`;
      
      // เพิ่ม payment method filter ถ้าไม่ได้เลือก "all"
      if (paymentMethod !== 'all') {
        url += `&paymentMethod=${paymentMethod}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const data = await response.json();
      
      // ถ้า API ส่งข้อมูล pagination มาด้วย
      if (data.tickets && data.pagination) {
        setTickets(data.tickets);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      } else {
        // กรณี API รูปแบบเก่า
        setTickets(data);
        // คำนวณจำนวนหน้าทั้งหมดจากข้อมูลที่ได้รับ
        setTotalPages(Math.ceil(data.length / itemsPerPage));
        setTotalItems(data.length);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // เรียกข้อมูลเมื่อโหลดหน้าหรือเปลี่ยนหน้า
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTickets(currentPage);
    }
  }, [status, currentPage, paymentMethod]);

  // ฟังก์ชันสำหรับค้นหาตั๋ว
  const handleSearch = async () => {
    setLoading(true);
    try {
      let url = '/api/tickets/search?';
      
      if (searchQuery) {
        url += `query=${encodeURIComponent(searchQuery)}&`;
      }
      
      if (selectedDate) {
        url += `date=${encodeURIComponent(selectedDate)}&`;
      }
      
      if (paymentMethod !== 'all') {
        url += `paymentMethod=${paymentMethod}&`;
      }
      
      // เพิ่ม pagination parameters
      url += `page=1&limit=${itemsPerPage}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to search tickets');
      }
      
      const data = await response.json();
      
      // ตรวจสอบรูปแบบข้อมูลที่ได้รับ
      if (data.tickets && data.pagination) {
        setTickets(data.tickets);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      } else {
        setTickets(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
        setTotalItems(data.length);
      }
      
      // รีเซ็ตกลับไปหน้าแรกเมื่อค้นหา
      setCurrentPage(1);
      // อัปเดต URL
      updateURL(1);
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
    setPaymentMethod('all');
    setCurrentPage(1);
    updateURL(1);
    fetchTickets(1);
  };

  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(page);
  };

  // ฟังก์ชันเปลี่ยนวิธีการชำระเงิน
  const handlePaymentMethodChange = (method: 'all' | 'cash' | 'qr') => {
    setPaymentMethod(method);
    setCurrentPage(1);
    updateURL(1, method);
  };

  // ฟังก์ชันอัปเดต URL
  const updateURL = (page: number, method: string = paymentMethod) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    
    if (method !== 'all') {
      url.searchParams.set('paymentMethod', method);
    } else {
      url.searchParams.delete('paymentMethod');
    }
    
    window.history.pushState({}, '', url.toString());
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
      <h1 className="text-3xl font-black mb-6">ລາຍການປີ້</h1>
      
      {/* ส่วนค้นหา */}
      <NeoCard className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2">ຄົ້ນຫາ</label>
            <input
              type="text"
              className="w-full border-2 border-black p-2"
              placeholder="ຄົ້ນຫາໂດຍເລກປີ້"
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black">ລາຍການບີ້</h2>
          <div className="text-sm text-gray-600">
            ທັງໝົດ {totalItems} ລາຍການ
          </div>
        </div>
        
        {/* ตัวกรองวิธีการชำระเงิน */}
        <div className="mb-4">
          <div className="font-bold mb-2">ຮູບແບບການຊຳລະ:</div>
          <div className="flex gap-2">
            <NeoButton 
              variant={paymentMethod === 'all' ? 'primary' : 'secondary'}
              onClick={() => handlePaymentMethodChange('all')}
              size="sm"
            >
              ທັງໝົດ
            </NeoButton>
            <NeoButton 
              variant={paymentMethod === 'cash' ? 'primary' : 'secondary'}
              onClick={() => handlePaymentMethodChange('cash')}
              size="sm"
            >
              ເງິນສົດ
            </NeoButton>
            <NeoButton 
              variant={paymentMethod === 'qr' ? 'primary' : 'secondary'}
              onClick={() => handlePaymentMethodChange('qr')}
              size="sm"
            >
              QR
            </NeoButton>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="p-2 text-left w-16">
                  <input type="checkbox" className="w-5 h-5" />
                </th>
                <th className="p-2 text-left">ອອກໂດຍ</th>
                <th className="p-2 text-left">ເລກບີ້</th>
                <th className="p-2 text-center">ວິທີການຊຳລະເງິນ</th>
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
                    <td className="p-2 text-center">    {ticket.paymentMethod === 'cash' ? 'ເງິນສົດ' : 'QR'}
                    </td>
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
                                fetchTickets(currentPage);
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
        
        {/* Pagination */}
        <div className="mt-6">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </NeoCard>
    </div>
  );
}