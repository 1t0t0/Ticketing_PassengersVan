// types/ticket.ts
export interface ITicket {
    _id: string;
    ticketNumber: string;
    price: number;
    soldBy: string;
    paymentMethod: 'cash' | 'card' | 'qr';
    soldAt: Date;
  }