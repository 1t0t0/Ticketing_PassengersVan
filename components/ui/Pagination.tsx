// components/ui/Pagination.tsx
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  size?: 'sm' | 'md' | 'lg'; // เพิ่ม prop สำหรับขนาด
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  size = 'md', // ค่าเริ่มต้นเป็นขนาดกลาง
  className = ''
}) => {
  // ฟังก์ชันสร้างปุ่มเลขหน้า
  const renderPageNumbers = () => {
    // จำนวนปุ่มแต่ละข้างของหน้าปัจจุบัน
    const buttonsToShow = size === 'sm' ? 1 : (size === 'lg' ? 3 : 2);
    
    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - buttonsToShow);
    const endPage = Math.min(totalPages, currentPage + buttonsToShow);

    // ปุ่มหน้าแรก
    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className={`px-1 ${size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-sm'} rounded-md`}
        >
          1
        </button>
      );
      
      // เพิ่ม "..." ถ้าหน้าแรกไม่ติดกับช่วงที่แสดงผล
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis1" className={`px-1 ${size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-sm'}`}>
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
          } ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-md`}
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
          <span key="ellipsis2" className={`px-1 ${size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-sm'}`}>
            ...
          </span>
        );
      }
      
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`px-1 ${size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-sm'} rounded-md`}
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  // ถ้ามีแค่หน้าเดียวไม่ต้องแสดง pagination
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* ปุ่มก่อนหน้า */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`${
          currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } ${size === 'sm' ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-sm'} rounded-md`}
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
        } ${size === 'sm' ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-sm'} rounded-md`}
      >
        &raquo;
      </button>
    </div>
  );
};

export default Pagination;