// components/PrintableTicket.tsx
import React from 'react';
import TicketTemplate from './TicketTemplate';

interface PrintableTicketProps {
  ticket: {
    ticketNumber: string;
    price: number;
    soldAt: Date | string;
    soldBy: string;
    paymentMethod: 'cash' | 'card' | 'qr';
  } | null;
}

const PrintableTicket = React.forwardRef<HTMLDivElement, PrintableTicketProps>(
  ({ ticket }, ref) => {
    if (!ticket) return null;

    return (
      <div ref={ref} style={{ width: '80mm', margin: 0, padding: 0 }}>
        <TicketTemplate
          ticketNumber={ticket.ticketNumber}
          price={ticket.price}
          soldAt={new Date(ticket.soldAt)}
          soldBy={ticket.soldBy}
          paymentMethod={ticket.paymentMethod}
        />
      </div>
    );
  }
);

PrintableTicket.displayName = 'PrintableTicket';

export default PrintableTicket;