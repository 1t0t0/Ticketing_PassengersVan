import { Ticket, NewTicket, TicketFilter, TicketSearchResults } from '../types';

/**
 * สร้างตั๋วใหม่
 * @param ticketData ข้อมูลตั๋วใหม่
 * @returns ข้อมูลตั๋วที่สร้างเสร็จแล้ว
 */
// app/dashboard/tickets/api/ticket.ts (ปรับปรุงฟังก์ชัน createTicket)

/**
 * สร้างตั๋วใหม่
 * @param ticketData ข้อมูลตั๋วใหม่
 * @returns ข้อมูลตั๋วที่สร้างเสร็จแล้ว
 */
export async function createTicket(ticketData: NewTicket): Promise<Ticket> {
  const response = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create ticket');
  }

  return response.json();
}

/**
 * ดึงข้อมูลตั๋วทั้งหมด
 * @param page หน้าที่ต้องการดึงข้อมูล
 * @param limit จำนวนตั๋วต่อหน้า
 * @returns รายการตั๋วและข้อมูลการแบ่งหน้า
 */
export async function fetchTickets(page = 1, limit = 10): Promise<TicketSearchResults> {
  const response = await fetch(`/api/tickets?page=${page}&limit=${limit}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tickets');
  }

  return response.json();
}

/**
 * ดึงข้อมูลตั๋วตาม ID
 * @param id ID ของตั๋ว
 * @returns ข้อมูลตั๋ว
 */
export async function fetchTicketById(id: string): Promise<Ticket> {
  const response = await fetch(`/api/tickets/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch ticket');
  }

  return response.json();
}

/**
 * ลบตั๋ว
 * @param id ID ของตั๋วที่ต้องการลบ
 * @returns ผลการลบ
 */
export async function deleteTicket(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/tickets/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete ticket');
  }

  return response.json();
}

/**
 * ค้นหาตั๋ว
 * @param filter ตัวกรองสำหรับการค้นหา
 * @returns ผลการค้นหา
 */
export async function searchTickets(filter: TicketFilter): Promise<TicketSearchResults> {
  let url = '/api/tickets/search?';
  
  if (filter.searchQuery) {
    url += `query=${encodeURIComponent(filter.searchQuery)}&`;
  }
  
  if (filter.startDate) {
    url += `date=${encodeURIComponent(filter.startDate)}&`;
  }
  
  if (filter.paymentMethod && filter.paymentMethod !== 'all') {
    url += `paymentMethod=${filter.paymentMethod}&`;
  }
  
  // เพิ่ม pagination parameters
  url += `page=${filter.page}&limit=${filter.limit}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to search tickets');
  }
  
  return response.json();
}


export async function updateTicketPaymentMethod(id: string, paymentMethod: string): Promise<Ticket> {
  try {
    const response = await fetch(`/api/tickets/${id}/payment-method`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethod }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update ticket payment method');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating ticket payment method:', error);
    throw error;
  }
}