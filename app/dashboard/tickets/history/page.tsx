'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

// Components
import { TicketTable, TicketFilters } from './components';

// Hooks
import useTicketHistory from '../hooks/useTicketHistory';
import useConfirmation from '@/hooks/useConfirmation';

export default function TicketHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
    handleDeleteTicket
  } = useTicketHistory(showConfirmation);
  
  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // ดึงค่า page และ paymentMethod จาก URL
  // ในไฟล์ app/dashboard/tickets/history/page.tsx (ส่วนของ useEffect)

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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-black mb-6">ລາຍການປີ້</h1>
      
      {/* ส่วนค้นหาและกรอง */}
      <NeoCard className="p-6 mb-6">
        <TicketFilters 
          filters={filters}
          onSearch={handleSearch}
          onClear={handleClear}
          onFilterChange={setFilters}
        />
      </NeoCard>
      
      {/* ตารางตั๋ว */}
      <NeoCard className="p-6">
        <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold">ຮູບແບບການຊຳລະ:</div>
          
          <div className="flex gap-2">
            <button 
              className={`px-3 py-1 rounded ${filters.paymentMethod === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => handlePaymentMethodChange('all')}
            >
              ທັງໝົດ
            </button>
            <button 
              className={`px-3 py-1 rounded flex items-center ${
                filters.paymentMethod === 'cash' 
                  ? 'bg-blue-500 text-white' 
                  : 'border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
              }`}
              onClick={() => handlePaymentMethodChange('cash')}
            >
              <span></span>
              ເງິນສົດ
            </button>
            <button 
              className={`px-3 py-1 rounded flex items-center ${
                filters.paymentMethod === 'qr' 
                  ? 'bg-blue-500 text-white' 
                  : 'border border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
              }`}
              onClick={() => handlePaymentMethodChange('qr')}
            >
              <span ></span>
              ເງິນໂອນ
            </button>
          </div>
          <div className='text-sm text-gray-600'>
            ທັງໝົດ {pagination?.totalItems || 0} ລາຍການ
          </div>
        </div>
        
        <TicketTable 
          tickets={tickets}
          loading={loading}
          onDeleteTicket={handleDeleteTicket}
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