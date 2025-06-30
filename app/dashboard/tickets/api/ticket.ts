// app/dashboard/tickets/api/ticket.ts - FIXED Date Parameter Issue
import { Ticket, NewTicket } from '../types';

const API_BASE_URL = '/api/tickets';

// ✅ FIXED: Better error handling for fetch operations
export async function fetchTickets(page: number = 1, limit: number = 10): Promise<{
  tickets: Ticket[];
  pagination: any;
  statistics?: any;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch tickets failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch tickets: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from tickets API');
    }
    
    return {
      tickets: data.tickets || [],
      pagination: data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: limit
      },
      statistics: data.statistics || null
    };
  } catch (error) {
    console.error('Error in fetchTickets:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to tickets API');
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }
    
    throw new Error('Unknown error occurred while fetching tickets');
  }
}

// ✅ FIXED: Enhanced createTicket with proper error handling
export async function createTicket(ticketData: NewTicket): Promise<Ticket> {
  try {
    console.log('🎯 Creating ticket with data:', ticketData);
    
    // ✅ FIXED: Validate that selectedCarRegistration is included
    if (!ticketData.selectedCarRegistration) {
      console.warn('⚠️ No selectedCarRegistration provided in ticket data');
    } else {
      console.log('✅ selectedCarRegistration included:', ticketData.selectedCarRegistration);
    }
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    });
    
    console.log('📡 API Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error('❌ API Error response:', errorData);
        
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const createdTicket = await response.json();
    
    // ✅ FIXED: Log the created ticket for debugging
    console.log('✅ Ticket created successfully:', {
      ticketNumber: createdTicket.ticketNumber,
      assignedDriverId: createdTicket.assignedDriverId,
      isAssigned: createdTicket.isAssigned,
      assignmentInfo: createdTicket.assignmentInfo,
      selectedCarRegistration: ticketData.selectedCarRegistration
    });
    
    if (!createdTicket || !createdTicket.ticketNumber) {
      throw new Error('Invalid ticket data returned from server');
    }
    
    return createdTicket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ເຄືອຂ່າຍ');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຮູ້ຈັກໃນການສ້າງປີ້');
  }
}

// ✅ CRITICAL FIX: Enhanced searchTickets with proper date parameter handling
export async function searchTickets(params: {
  query?: string;
  date?: string;
  startDate?: string; // ✅ NEW: Support both date and startDate
  endDate?: string;
  paymentMethod?: string;
  ticketType?: string;
  page?: number;
  limit?: number;
}): Promise<{
  tickets: Ticket[];
  pagination: any;
  statistics?: any;
}> {
  try {
    const searchParams = new URLSearchParams();
    
    // ✅ CRITICAL FIX: Handle date parameters properly
    if (params.query) searchParams.append('query', params.query);
    
    // ✅ Priority: startDate > date > endDate
    const dateToUse = params.startDate || params.date || params.endDate;
    if (dateToUse) {
      searchParams.append('date', dateToUse);
      console.log('📅 Added date parameter to search:', dateToUse);
    } else {
      console.log('⚠️ No date parameter provided to searchTickets');
    }
    
    if (params.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params.ticketType) searchParams.append('ticketType', params.ticketType);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const searchUrl = `${API_BASE_URL}/search?${searchParams.toString()}`;
    console.log('🔍 Search URL:', searchUrl);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search tickets failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: searchUrl
      });
      throw new Error(`Failed to search tickets: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('🔍 Search response received:', {
      ticketCount: data.tickets?.length || 0,
      totalItems: data.pagination?.totalItems || 0,
      debug: data.debug
    });
    
    return {
      tickets: data.tickets || [],
      pagination: data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: params.limit || 10
      },
      statistics: data.statistics || null
    };
  } catch (error) {
    console.error('Error in searchTickets:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to search tickets');
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to search tickets: ${error.message}`);
    }
    
    throw new Error('Unknown error occurred while searching tickets');
  }
}

export async function deleteTicket(ticketId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/${ticketId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to delete ticket: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.warn('Could not parse delete error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      if (!result.success) {
        throw new Error('Delete operation was not successful');
      }
    }
  } catch (error) {
    console.error('Error deleting ticket:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to delete ticket');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while deleting ticket');
  }
}

export async function getTicketById(ticketId: string): Promise<Ticket> {
  try {
    const response = await fetch(`${API_BASE_URL}/${ticketId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Ticket not found');
      }
      throw new Error(`Failed to get ticket: ${response.status} ${response.statusText}`);
    }
    
    const ticket = await response.json();
    
    if (!ticket || !ticket.ticketNumber) {
      throw new Error('Invalid ticket data received');
    }
    
    return ticket;
  } catch (error) {
    console.error('Error getting ticket by ID:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to get ticket');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while getting ticket');
  }
}

export async function updateTicketPaymentMethod(
  ticketId: string, 
  paymentMethod: 'cash' | 'qr'
): Promise<Ticket> {
  try {
    const response = await fetch(`${API_BASE_URL}/${ticketId}/payment-method`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethod }),
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to update payment method: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.warn('Could not parse update error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const updatedTicket = await response.json();
    return updatedTicket;
  } catch (error) {
    console.error('Error updating ticket payment method:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to update ticket');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while updating ticket');
  }
}