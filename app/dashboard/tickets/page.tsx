'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// คอมโพเนนต์
import NeoCard from '@/components/ui/NotionCard';
import { StatsCards, TicketSalesForm, RecentTicketsList } from './components';

// Hooks
import useTicketSales from './hooks/useTicketSales';
import useTicketStats from './hooks/useTicketStats';

export default function TicketSalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // นำเข้า custom hooks
  const { 
    ticketPrice, 
    paymentMethod, 
    setPaymentMethod, 
    lastTicket, 
    sellTicket, 
    loading, 
    printRef, 
    handlePrint 
  } = useTicketSales();
  
  const { stats, recentTickets, loading: statsLoading, fetchData } = useTicketStats();

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ดึงข้อมูลเมื่อเข้าสู่ระบบสำเร็จ
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">TICKET SALES</h1>
      
      {/* แสดงการ์ดสถิติ */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* เนื้อหาหลัก */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ส่วนขายตั๋ว */}
        <NeoCard className="p-6">
          <h2 className="text-lg font-bold mb-6">SELL TICKET</h2>
          
          <TicketSalesForm
            ticketPrice={ticketPrice}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onSellTicket={sellTicket}
            loading={loading}
          />
        </NeoCard>

        {/* ส่วนแสดงตั๋วล่าสุด */}
        <NeoCard className="p-6">
          <h2 className="text-lg font-bold mb-4">RECENT TICKETS</h2>
          
          <RecentTicketsList 
            tickets={recentTickets} 
            onViewAllClick={() => router.push('/dashboard/tickets/history')} 
          />
        </NeoCard>
      </div>

      {/* ส่วนซ่อนสำหรับการพิมพ์ตั๋ว */}
      <div ref={printRef} className="hidden">
        {lastTicket && (
          <PrintableTicket
            ticketNumber={lastTicket.ticketNumber}
            price={lastTicket.price}
            soldAt={new Date(lastTicket.soldAt)}
            soldBy={lastTicket.soldBy}
            paymentMethod={lastTicket.paymentMethod}
          />
        )}
      </div>
    </div>
  );
}

// คอมโพเนนต์ PrintableTicket ที่แยกออกมาจากไฟล์ components/PrintableTicket.tsx
// เพื่อให้โค้ดทำงานได้โดยไม่ต้องแก้ไขไฟล์อื่น
function PrintableTicket({ ticketNumber, price, soldAt, soldBy, paymentMethod }) {
  // โค้ดเดิมจาก TicketTemplate
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div 
      id="printable-content"
      className="mx-auto bg-white border border-black"
      style={{ 
        fontFamily: 'Phetsarath, sans-serif',
        width: '80mm',
        padding: '0',
        margin: '0 auto',
        boxSizing: 'border-box',
        height: 'auto',
        pageBreakInside: 'avoid',
        pageBreakAfter: 'avoid',
        minHeight: '0',
        maxHeight: 'fit-content'
      }}
    >
      {/* ส่วนหัว - ชื่อตั๋ว */}
      <div className="text-center p-2 border-b border-black">
        <div className="text-base font-bold">ປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ</div>
        <div className="text-base font-bold">ລາວ-ຈີນ</div>
      </div>

      {/* ส่วนรายละเอียดตั๋ว */}
      <div className="p-2 border-b border-black">
        <table className="w-full text-sm" style={{ borderSpacing: '0 3px' }}>
          <tbody>
            <tr>
              <td className="align-top font-bold">ໝາຍເລກປີ້/Ticket No:</td>
              <td>{ticketNumber}</td>
            </tr>
            <tr>
              <td className="align-top font-bold">ວັນ-ເວລາ/Date-Time:</td>
              <td>{formatDate(soldAt)}</td>
            </tr>
            <tr>
              <td className="align-top font-bold">ລາຄາ/Price:</td>
              <td>{price.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="align-top font-bold">ຊຳລະ/Payment:</td>
              <td className="text-blue-600">{paymentMethod.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ส่วนเส้นทาง */}
      <div className="border-b border-black">
        <table className="w-full text-center">
          <tbody>
            <tr>
              <td className="p-1 w-1/2">
                <div className="text-xs text-yellow-800">ຈາກ/FROM</div>
                <div className="font-bold">ສະຖານີ</div>
                <div className="font-bold">ລົດໄຟ/TRAIN</div>
                <div className="font-bold">STATION</div>
              </td>
              <td className="p-1 w-1/2">
                <div className="text-xs text-yellow-800">ເຖິງ/TO</div>
                <div className="font-bold">ຕົວ</div>
                <div className="font-bold">ເມືອງ/DOWNTOWN</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ส่วนผู้ขาย */}
      <div className="py-1 px-2 text-center border-b border-black">
        <div className="text-sm">
          ອອກໂດຍ/Sold By:<br/>
          {soldBy}
        </div>
      </div>

      {/* ส่วนขอบคุณ */}
      <div className="py-1 px-2 text-center">
        <p className="text-xs text-blue-600 my-0">*** THANK YOU ***</p>
        <p className="text-xs my-0">ກາລຸນາຮັກສາປີ້ນີ້ໄວ້ເພື່ອກວດກາ/PLEASE KEEP THIS TICKET</p>
        <p className="text-xs my-0 mb-0 pb-0">ຂະນະເດີນທາງ/DURING YOUR JOURNEY</p>
      </div>
    </div>
  );
}