// แก้ไขไฟล์ app/dashboard/tickets/history/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

// Components
import { TicketTable, TicketFilters } from './components';
import EditPaymentMethodModal from './components/EditPaymentMethodModal'; // เพิ่ม import

// Hooks
import useTicketHistory from '../hooks/useTicketHistory';
import useConfirmation from '@/hooks/useConfirmation';

// API
import { updateTicketPaymentMethod } from '../api/ticket'; // เพิ่ม import

import notificationService from '@/lib/notificationService';

export default function TicketHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State สำหรับแก้ไขวิธีการชำระเงิน
  const [editPaymentModal, setEditPaymentModal] = useState({
    isOpen: false,
    ticketId: '',
    ticketNumber: '',
    currentMethod: 'cash'
  });
  
  // Confirmation hooks
  const {
    isConfirmDialogOpen,
    confirmMessage,
    showConfirmation,
    handleConfirm,
    handleCancel
  } = useConfirmation();
  
  // Custom hooks
  const {
    tickets,
    pagination,
    loading,
    filters,
    setFilters,
    handleSearch,
    handleClear,
    handlePageChange,
    handlePaymentMethodChange,
    handleDeleteTicket,
    refreshTickets // เพิ่ม refreshTickets เพื่อโหลดข้อมูลใหม่หลังการแก้ไข
  } = useTicketHistory(showConfirmation);
  
  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // ดึงค่า page และ paymentMethod จาก URL
  useEffect(() => {
    const page = searchParams.get('page');
    if (page) {
      setFilters(prev => ({ ...prev, page: parseInt(page) }));
    }
    
    const pmMethod = searchParams.get('paymentMethod');
    if (pmMethod && (pmMethod === 'cash' || pmMethod === 'qr')) {
      setFilters(prev => ({ ...prev, paymentMethod: pmMethod as 'cash' | 'qr' }));
    }

    // หาวันที่จาก URL หรือใช้วันที่ปัจจุบัน
    const date = searchParams.get('date');
    if (date) {
      setFilters(prev => ({ ...prev, startDate: date }));
    }
  }, [searchParams, setFilters]);

  // ฟังก์ชันเปิด modal แก้ไขวิธีการชำระเงิน
  const handleEditPaymentMethod = (ticketId: string, ticketNumber: string, currentMethod: string) => {
    setEditPaymentModal({
      isOpen: true,
      ticketId,
      ticketNumber,
      currentMethod
    });
  };
  
  // ฟังก์ชันบันทึกการแก้ไขวิธีการชำระเงิน
  const handleSavePaymentMethod = async (ticketId: string, newMethod: string) => {
    try {
      await updateTicketPaymentMethod(ticketId, newMethod);
      notificationService.success('ອັບເດດວິທີການຊຳລະເງິນສຳເລັດແລ້ວ');
      
      // รีเฟรชข้อมูลตั๋วหลังจากอัปเดต
      refreshTickets();
      
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການອັບເດດວິທີການຊຳລະເງິນ');
    }
  };
  
  // ปิด modal แก้ไขวิธีการชำระเงิน
  const closeEditModal = () => {
    setEditPaymentModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ລາຍການປີ້</h1>
      
      {/* ส่วนค้นหาและกรอง */}
      <TicketFilters 
        filters={filters}
        onSearch={handleSearch}
        onClear={handleClear}
        onFilterChange={setFilters}
      />
      
      {/* ตาราง Ticket */}
      <NeoCard className="p-6 mt-6">
        {/* ตัวกรองวิธีการชำระเงิน */}
        <div className="flex justify-between items-center mb-4">
          <div className="font-medium text-gray-600">ຮູບແບບການຊຳລະ:</div>
          
          <div className="flex items-center space-x-2">
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                filters.paymentMethod === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handlePaymentMethodChange('all')}
            >
              ທັງໝົດ
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                filters.paymentMethod === 'cash' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100'
              }`}
              onClick={() => handlePaymentMethodChange('cash')}
            >
              ເງິນສົດ
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                filters.paymentMethod === 'qr' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
              }`}
              onClick={() => handlePaymentMethodChange('qr')}
            >
              ເງິນໂອນ
            </button>
          </div>
          <div className='text-sm text-gray-500'>
            ທັງໝົດ {pagination?.totalItems || 0} ລາຍການ
          </div>
        </div>
        
        <TicketTable 
          tickets={tickets}
          loading={loading}
          onDeleteTicket={handleDeleteTicket}
          onEditPaymentMethod={handleEditPaymentMethod} // เพิ่มฟังก์ชันแก้ไข
        />
        
        {/* Pagination */}
        {pagination && (
          <div className="mt-4 flex justify-center">
            <Pagination 
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              className="text-xs"
            />
          </div>
        )}
      </NeoCard>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={isConfirmDialogOpen}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      {/* Edit Payment Method Modal */}
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



// Pagination component (ย้ายมาไว้ในไฟล์เดียวกันเพื่อให้ทำงานได้ทันที)
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  // ถ้ามีแค่หน้าเดียวไม่ต้องแสดง pagination
  if (totalPages <= 1) {
    return null;
  }

  const renderPageNumbers = () => {
    const buttonsToShow = 2; // จำนวนปุ่มที่แสดงแต่ละข้างของหน้าปัจจุบัน
    
    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - buttonsToShow);
    const endPage = Math.min(totalPages, currentPage + buttonsToShow);

    // ปุ่มหน้าแรก
    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className="px-1 py-1 text-sm rounded-md"
        >
          1
        </button>
      );
      
      // เพิ่ม "..." ถ้าหน้าแรกไม่ติดกับช่วงที่แสดงผล
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis1" className="px-1 py-1 text-sm">
            ...
          </span>
        );
      }
    }

    // สร้างปุ่มตามช่วงที่ต้องการแสดงผล
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`${
            i === currentPage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } px-3 py-1 text-sm rounded-md`}
        >
          {i}
        </button>
      );
    }

    // ปุ่มหน้าสุดท้าย
    if (endPage < totalPages) {
      // เพิ่ม "..." ถ้าหน้าสุดท้ายไม่ติดกับช่วงที่แสดงผล
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis2" className="px-1 py-1 text-sm">
            ...
          </span>
        );
      }
      
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-1 py-1 text-sm rounded-md"
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* ปุ่มก่อนหน้า */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`${
          currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } px-2 py-1 text-sm rounded-md`}
      >
        &laquo;
      </button>
      
      {/* ปุ่มเลขหน้า */}
      {renderPageNumbers()}
      
      {/* ปุ่มถัดไป */}
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