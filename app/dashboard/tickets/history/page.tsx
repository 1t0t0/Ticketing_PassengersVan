// app/dashboard/tickets/history/page.tsx - Simplified version
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

import { TicketTable, TicketFilters } from './components';
import EditPaymentMethodModal from './components/EditPaymentMethodModal';
import useTicketHistory from '../hooks/useTicketHistory';
import useConfirmation from '@/hooks/useConfirmation';
import { updateTicketPaymentMethod } from '../api/ticket';
import notificationService from '@/lib/notificationService';

export default function TicketHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [editModal, setEditModal] = useState({
    isOpen: false,
    ticketId: '',
    ticketNumber: '',
    currentMethod: 'cash'
  });
  
  const { isConfirmDialogOpen, confirmMessage, showConfirmation, handleConfirm, handleCancel } = useConfirmation();
  
  const {
    tickets, pagination, loading, filters, setFilters,
    handleSearch, handleClear, handlePageChange, handlePaymentMethodChange,
    handleDeleteTicket, refreshTickets
  } = useTicketHistory(showConfirmation);
  
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);
  
  useEffect(() => {
    const page = searchParams.get('page');
    const method = searchParams.get('paymentMethod');
    const ticketType = searchParams.get('ticketType');
    const date = searchParams.get('date');
    
    if (page) setFilters(prev => ({ ...prev, page: parseInt(page) }));
    if (method && ['cash', 'qr'].includes(method)) {
      setFilters(prev => ({ ...prev, paymentMethod: method as 'cash' | 'qr' }));
    }
    if (ticketType && ['individual', 'group'].includes(ticketType)) {
      setFilters(prev => ({ ...prev, ticketType: ticketType as 'individual' | 'group' }));
    }
    if (date) setFilters(prev => ({ ...prev, startDate: date }));
  }, [searchParams, setFilters]);

  const handleEditPaymentMethod = (ticketId: string, ticketNumber: string, currentMethod: string) => {
    setEditModal({ isOpen: true, ticketId, ticketNumber, currentMethod });
  };
  
  const handleSavePaymentMethod = async (ticketId: string, newMethod: string) => {
    try {
      await updateTicketPaymentMethod(ticketId, newMethod);
      notificationService.success('ອັບເດດວິທີການຊຳລະເງິນສຳເລັດແລ້ວ');
      refreshTickets();
    } catch (error: any) {
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const canDeleteTickets = session?.user?.role === 'admin';

  const handleDeleteWithPermissionCheck = (ticketId: string, ticketNumber: string) => {
    if (!canDeleteTickets) {
      notificationService.error('ທ່ານບໍ່ມີສິດທິ່ໃນການລົບປີ້ - ເຉພາະແອດມິນເທົ່ານັ້ນ');
      return;
    }
    handleDeleteTicket(ticketId, ticketNumber);
  };

  const paymentButtons = [
    { method: 'all', label: 'ທັງໝົດ', color: 'gray' },
    { method: 'cash', label: 'ເງິນສົດ', color: 'blue' },
    { method: 'qr', label: 'ເງິນໂອນ', color: 'green' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ລາຍການປີ້</h1>
        <p className="text-gray-600">ຈັດການແລະເບິ່ງປະຫວັດການຂາຍປີ້ລົດໂດຍສານ</p>
        
        {session?.user?.role === 'staff' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">ໝາຍເຫດ:</span> ທ່ານສາມາດແກ້ໄຂວິທີການຊຳລະເງິນໄດ້ ແຕ່ບໍ່ສາມາດລົບປີ້ໄດ້
            </p>
          </div>
        )}
      </div>
      
      <NeoCard className="p-4 mb-4">
        <TicketFilters 
          filters={filters}
          onSearch={handleSearch}
          onClear={handleClear}
          onFilterChange={setFilters}
        />
      </NeoCard>
      
      <NeoCard className="p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium text-gray-600">ຮູບແບບການຊຳລະ:</span>
          
          <div className="flex gap-2">
            {paymentButtons.map(({ method, label, color }) => (
              <button 
                key={method}
                className={`px-4 py-2 rounded transition ${
                  filters.paymentMethod === method 
                    ? 'bg-blue-500 text-white' 
                    : `bg-${color}-50 text-${color}-700 border hover:bg-${color}-100`
                }`}
                onClick={() => handlePaymentMethodChange(method as any)}
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <span className='text-sm text-gray-500'>
              ທັງໝົດ {pagination?.totalItems || 0} ລາຍການ
            </span>
            {canDeleteTickets && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Admin: ສາມາດລົບປີ້ໄດ້
              </span>
            )}
          </div>
        </div>
        
        <TicketTable 
          tickets={tickets}
          loading={loading}
          onDeleteTicket={handleDeleteWithPermissionCheck}
          onEditPaymentMethod={handleEditPaymentMethod}
        />
        
        {pagination && pagination.totalPages > 1 && (
          <Pagination 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </NeoCard>
      
      <ConfirmationDialog 
        isOpen={isConfirmDialogOpen}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      <EditPaymentMethodModal 
        isOpen={editModal.isOpen}
        ticketId={editModal.ticketId}
        ticketNumber={editModal.ticketNumber}
        currentMethod={editModal.currentMethod}
        onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSavePaymentMethod}
      />
    </div>
  );
}

// Simple Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        ‹
      </button>
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded ${
            page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        ›
      </button>
    </div>
  );
}