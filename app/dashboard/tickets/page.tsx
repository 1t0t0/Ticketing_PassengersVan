'use client';

import { useState, useRef, useEffect } from 'react';
import NeoButton from '@/components/ui/NeoButton';
import NeoCard from '@/components/ui/NeoCard';
import TicketTemplate from '@/components/TicketTemplate';

interface Ticket {
  _id: string;
  ticketNumber: string;
  price: number;
  soldAt: Date;
  soldBy: string;
  paymentMethod: string;
}

export default function TicketsPage() {
  const [ticketPrice] = useState(45000);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // ฟังก์ชันดึงข้อมูลตั๋วล่าสุด
  const fetchRecentTickets = async () => {
    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      setRecentTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  // เตรียมข้อมูลเริ่มต้น
  useEffect(() => {
    fetchRecentTickets();
  }, []);

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
        fetchRecentTickets();
        
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-black mb-6">TICKET SALES</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card ขายตั๋ว */}
        <NeoCard className="p-6">
          <h2 className="text-xl font-black mb-4">SELL TICKET</h2>
          
          <div className="mb-6">
            <p className="text-sm font-bold mb-2">TICKET PRICE</p>
            <p className="text-4xl font-black">฿{ticketPrice.toLocaleString()}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold mb-2">PAYMENT METHOD</p>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'qr'] as const).map((method) => (
                <NeoButton
                  key={method}
                  variant={paymentMethod === method ? 'primary' : 'secondary'}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method.toUpperCase()}
                </NeoButton>
              ))}
            </div>
          </div>

          <NeoButton
            className="w-full"
            size="lg"
            onClick={handleSellTicket}
            disabled={loading}
          >
            {loading ? 'PROCESSING...' : 'SELL TICKET'}
          </NeoButton>
        </NeoCard>

        {/* Card ตั๋วล่าสุด */}
        <NeoCard className="p-6">
          <h2 className="text-xl font-black mb-4">RECENT TICKETS</h2>
          <div className="space-y-2">
            {recentTickets.map((ticket) => (
              <div key={ticket._id} className="border-2 border-black p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{ticket.ticketNumber}</p>
                    <p className="text-sm">฿{ticket.price.toLocaleString()}</p>
                    <p className="text-xs">{new Date(ticket.soldAt).toLocaleString()}</p>
                  </div>
                  <NeoButton
                    size="sm"
                    onClick={() => {
                      setLastTicket(ticket);
                      requestAnimationFrame(() => {
                        handlePrint();
                      });
                    }}
                  >
                    REPRINT
                  </NeoButton>
                </div>
              </div>
            ))}
          </div>
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