// app/dashboard/tickets/api/ticket.ts - Fixed error handling
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
    
    // ✅ Check if response is ok before trying to parse JSON
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
    
    // ✅ Validate that we got the expected data structure
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
    
    // ✅ Re-throw with more specific error message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to tickets API');
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }
    
    throw new Error('Unknown error occurred while fetching tickets');
  }
}

// ✅ FIXED: Better error handling for create ticket
export async function createTicket(ticketData: NewTicket): Promise<Ticket> {
  try {
    console.log('Creating ticket with data:', ticketData);
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    });
    
    // ✅ Better error handling
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const createdTicket = await response.json();
    
    // ✅ Validate created ticket structure
    if (!createdTicket || !createdTicket.ticketNumber) {
      throw new Error('Invalid ticket data returned from server');
    }
    
    console.log('Ticket created successfully:', createdTicket.ticketNumber);
    return createdTicket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    
    // ✅ Network error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ເຄືອຂ່າຍ');
    }
    
    // ✅ Re-throw known errors
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຮູ້ຈັກໃນການສ້າງປີ້');
  }
}

// ✅ FIXED: Better error handling for search tickets
export async function searchTickets(params: {
  query?: string;
  date?: string;
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
    
    // Build search parameters
    if (params.query) searchParams.append('query', params.query);
    if (params.date) searchParams.append('date', params.date);
    if (params.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params.ticketType) searchParams.append('ticketType', params.ticketType);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/search?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search tickets failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to search tickets: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
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

// ✅ FIXED: Better error handling for delete ticket
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
    
    // Check if response has content before trying to parse JSON
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

// ✅ NEW: Function to get ticket by ID
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

// ✅ NEW: Function to update ticket payment method
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