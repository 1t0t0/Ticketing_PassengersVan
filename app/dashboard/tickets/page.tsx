'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import TicketTemplate from '@/components/TicketTemplate';

interface Ticket {
  _id: string;
  ticketNumber: string;
  price: number;
  soldAt: Date;
  soldBy: string;
  paymentMethod: string;
}

interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  totalDrivers: number;
  checkedInDrivers: number;
}

export default function TicketSalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ticketPrice] = useState(45000);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTicketsSold: 124,
    totalRevenue: 5580000,
    totalDrivers: 124,
    checkedInDrivers: 87,
  });
  const printRef = useRef<HTMLDivElement>(null);

  // ฟังก์ชันแปลง payment method เป็นภาษาลาว
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'ເງິນສົດ';
      case 'qr':
        return 'QR';
      default:
        return method;
    }
  };

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ฟังก์ชันดึงข้อมูลตั๋วล่าสุดและสถิติ
  const fetchData = async () => {
    try {
      if (status !== 'authenticated') return;

      // ดึงข้อมูลตั๋วล่าสุด
      try {
        const ticketResponse = await fetch('/api/tickets?limit=3');
        const ticketData = await ticketResponse.json();
        
        if (Array.isArray(ticketData)) {
          setRecentTickets(ticketData);
        } else if (ticketData.tickets && Array.isArray(ticketData.tickets)) {
          setRecentTickets(ticketData.tickets);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
      
      // ดึงข้อมูลสถิติ
      try {
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    }
  };

  // เตรียมข้อมูลเริ่มต้น
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // ฟังก์ชันพิมพ์ตั๋ว
  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  // ฟังก์ชันขายตั๋ว
  const handleSellTicket = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: ticketPrice,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLastTicket(data);
        fetchData(); // อัพเดทข้อมูลหลังขายตั๋ว
        
        requestAnimationFrame(() => {
          handlePrint();
        });
      } else {
        alert(data.error || 'Failed to sell ticket');
      }
    } catch (error) {
      console.error('Error selling ticket:', error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Placeholder tickets
  const placeholderTickets = [
    {
      _id: '1',
      ticketNumber: 'T1746505407721',
      price: 45000,
      soldAt: new Date(),
      soldBy: 'System',
      paymentMethod: 'cash'
    },
    {
      _id: '2',
      ticketNumber: 'T1746505407722',
      price: 45000,
      soldAt: new Date(),
      soldBy: 'System',
      paymentMethod: 'qr'
    },
    {
      _id: '3',
      ticketNumber: 'T1746505407723',
      price: 45000,
      soldAt: new Date(),
      soldBy: 'System',
      paymentMethod: 'cash'
    }
  ];

  // ใช้ข้อมูลจริงหรือข้อมูลตัวอย่าง
  const ticketsToShow = recentTickets.length > 0 ? recentTickets : placeholderTickets;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">TICKET SALES</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <NeoCard className="p-4">
          <h3 className="text-xs text-gray-600 uppercase font-medium mb-1">TOTAL TICKETS</h3>
          <p className="text-2xl font-bold">{stats.totalTicketsSold}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-xs text-gray-600 uppercase font-medium mb-1">TOTAL REVENUE</h3>
          <p className="text-2xl font-bold">₭{stats.totalRevenue.toLocaleString()}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-xs text-gray-600 uppercase font-medium mb-1">TOTAL DRIVERS</h3>
          <p className="text-2xl font-bold">{stats.totalDrivers}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-xs text-gray-600 uppercase font-medium mb-1">CHECKED-IN</h3>
          <p className="text-2xl font-bold">{stats.checkedInDrivers}</p>
        </NeoCard>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sell Ticket Card */}
        <NeoCard className="p-6">
          <h2 className="text-lg font-bold mb-6">SELL TICKET</h2>
          
          <div className="mb-6">
            <p className="text-xs text-gray-600 uppercase font-medium mb-1">TICKET PRICE</p>
            <p className="text-3xl font-bold">₭{ticketPrice.toLocaleString()}</p>
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-600 uppercase font-medium mb-1">PAYMENT METHOD</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`py-2 px-4 text-center font-medium rounded ${
                  paymentMethod === 'cash' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                ເງິນສົດ
              </button>
              <button
                className={`py-2 px-4 text-center font-medium rounded ${
                  paymentMethod === 'qr' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setPaymentMethod('qr')}
              >
                QR
              </button>
            </div>
          </div>

          <button
            className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded"
            onClick={handleSellTicket}
            disabled={loading}
          >
            {loading ? 'PROCESSING...' : 'SELL TICKET'}
          </button>
        </NeoCard>

        {/* Recent Tickets Card */}
        <NeoCard className="p-6">
          <h2 className="text-lg font-bold mb-4">RECENT TICKETS</h2>
          
          <div className="space-y-1">
            {ticketsToShow.map((ticket, index) => (
              <div key={ticket._id || index} className="py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{ticket.ticketNumber}</p>
                    <p className="text-sm text-gray-600">₭{ticket.price.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      ticket.paymentMethod === 'cash' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getPaymentMethodText(ticket.paymentMethod)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(ticket.soldAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded mt-4"
            onClick={() => router.push('/dashboard/tickets/history')}
          >
            VIEW ALL TICKETS
          </button>
        </NeoCard>
      </div>

      {/* Component สำหรับพิมพ์ */}
      {lastTicket && (
        <div ref={printRef} className="hidden">
          <TicketTemplate
            ticketNumber={lastTicket.ticketNumber}
            price={lastTicket.price}
            soldAt={new Date(lastTicket.soldAt)}
            soldBy={lastTicket.soldBy}
            paymentMethod={lastTicket.paymentMethod}
          />
        </div>
      )}
    </div>
  );
}