// app/dashboard/tickets/history/page.tsx - Optimized
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
  
  const [editPaymentModal, setEditPaymentModal] = useState({
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
    const pmMethod = searchParams.get('paymentMethod');
    const date = searchParams.get('date');
    
    if (page) setFilters(prev => ({ ...prev, page: parseInt(page) }));
    if (pmMethod && ['cash', 'qr'].includes(pmMethod)) {
      setFilters(prev => ({ ...prev, paymentMethod: pmMethod as 'cash' | 'qr' }));
    }
    if (date) setFilters(prev => ({ ...prev, startDate: date }));
  }, [searchParams, setFilters]);

  const handleEditPaymentMethod = (ticketId: string, ticketNumber: string, currentMethod: string) => {
    setEditPaymentModal({ isOpen: true, ticketId, ticketNumber, currentMethod });
  };
  
  const handleSavePaymentMethod = async (ticketId: string, newMethod: string) => {
    try {
      await updateTicketPaymentMethod(ticketId, newMethod);
      notificationService.success('ອັບເດດວິທີການຊຳລະເງິນສຳເລັດແລ້ວ');
      refreshTickets();
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການອັບເດດວິທີການຊຳລະເງິນ');
    }
  };
  
  const closeEditModal = () => {
    setEditPaymentModal(prev => ({ ...prev, isOpen: false }));
  };

  const PaymentFilterButton = ({ method, label, colorClass, isActive }: {
    method: string;
    label: string;
    colorClass: string;
    isActive: boolean;
  }) => (
    <button 
      className={`px-4 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-blue-500 text-white' 
          : `bg-${colorClass}-50 text-${colorClass}-700 border border-${colorClass}-300 hover:bg-${colorClass}-100`
      }`}
      onClick={() => handlePaymentMethodChange(method as any)}
    >
      {label}
    </button>
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ລາຍການປີ້</h1>
      
      <TicketFilters 
        filters={filters}
        onSearch={handleSearch}
        onClear={handleClear}
        onFilterChange={setFilters}
      />
      
      <NeoCard className="p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="font-medium text-gray-600">ຮູບແບບການຊຳລະ:</div>
          
          <div className="flex items-center space-x-2">
            <PaymentFilterButton
              method="all"
              label="ທັງໝົດ"
              colorClass="gray"
              isActive={filters.paymentMethod === 'all'}
            />
            <PaymentFilterButton
              method="cash"
              label="ເງິນສົດ"
              colorClass="blue"
              isActive={filters.paymentMethod === 'cash'}
            />
            <PaymentFilterButton
              method="qr"
              label="ເງິນໂອນ"
              colorClass="green"
              isActive={filters.paymentMethod === 'qr'}
            />
          </div>
          
          <div className='text-sm text-gray-500'>
            ທັງໝົດ {pagination?.totalItems || 0} ລາຍການ
          </div>
        </div>
        
        <TicketTable 
          tickets={tickets}
          loading={loading}
          onDeleteTicket={handleDeleteTicket}
          onEditPaymentMethod={handleEditPaymentMethod}
        />
        
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination 
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </NeoCard>
      
      <ConfirmationDialog 
        isOpen={isConfirmDialogOpen}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      <EditPaymentMethodModal 
        isOpen={editPaymentModal.isOpen}
        ticketId={editPaymentModal.ticketId}
        ticketNumber={editPaymentModal.ticketNumber}
        currentMethod={editPaymentModal.currentMethod}
        onClose={closeEditModal}
        onSave={handleSavePaymentMethod}
      />
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const renderPageNumbers = () => {
    const buttonsToShow = 2;
    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - buttonsToShow);
    const endPage = Math.min(totalPages, currentPage + buttonsToShow);

    if (startPage > 1) {
      pageNumbers.push(
        <button key={1} onClick={() => onPageChange(1)} className="px-1 py-1 text-sm rounded-md">
          1
        </button>
      );
      if (startPage > 2) {
        pageNumbers.push(<span key="ellipsis1" className="px-1 py-1 text-sm">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`${
            i === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } px-3 py-1 text-sm rounded-md`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<span key="ellipsis2" className="px-1 py-1 text-sm">...</span>);
      }
      pageNumbers.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)} className="px-1 py-1 text-sm rounded-md">
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-center space-x-1">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`${
          currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } px-2 py-1 text-sm rounded-md`}
      >
        &laquo;
      </button>
      
      {renderPageNumbers()}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`${
          currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } px-2 py-1 text-sm rounded-md`}
      >
        &raquo;
      </button>
    </div>
  );
}