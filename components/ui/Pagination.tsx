// components/ui/Pagination.tsx
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = ''
}) => {
  // ไม่แสดงถ้ามีเพียงหน้าเดียว
  if (totalPages <= 1) return null;
  
  // จำนวนปุ่มที่จะแสดงข้างๆ หน้าปัจจุบัน
  const siblingsCount = 1;
  
  // คำนวณว่าจะแสดงปุ่มหน้าไหนบ้าง
  const getPageNumbers = () => {
    // คำนวณช่วงปุ่มหลัก
    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages);
    
    // ควรแสดงจุดไหม
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    // กรณีไม่ต้องแสดงจุดทั้งซ้ายและขวา
    if (!shouldShowLeftDots && !shouldShowRightDots) {
      const range = Array.from({ length: totalPages }, (_, i) => i + 1);
      return range;
    }
    
    // กรณีมีจุดด้านขวาเท่านั้น
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingsCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }
    
    // กรณีมีจุดด้านซ้ายเท่านั้น
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingsCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, '...', ...rightRange];
    }
    
    // กรณีมีจุดทั้งซ้ายและขวา
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }
    
    return [];
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className={`flex items-center justify-center mt-4 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 mx-1 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        «
      </button>
      
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-1 mx-1">
              ...
            </span>
          );
        }
        
        return (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(Number(page))}
            className={`px-3 py-1 mx-1 rounded-md ${
              currentPage === page
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {page}
          </button>
        );
      })}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 mx-1 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        »
      </button>
    </div>
  );
};

export default Pagination;