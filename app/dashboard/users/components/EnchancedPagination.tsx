// app/dashboard/users/components/EnhancedPagination.tsx
import React from 'react';

interface EnhancedPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
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
      const leftRange = Array.from({ length: Math.min(leftItemCount, totalPages) }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }
    
    // กรณีมีจุดด้านซ้ายเท่านั้น
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingsCount;
      const rightRange = Array.from(
        { length: Math.min(rightItemCount, totalPages) },
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
    <div className={`flex items-center justify-center py-4 ${className}`}>
      <div className="flex border border-gray-300 rounded-md overflow-hidden">
        {/* ปุ่มก่อนหน้า */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`
            px-3 py-2 border-r border-gray-300
            ${currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'}
          `}
          aria-label="Previous Page"
        >
          «
        </button>
        
        {/* ปุ่มหน้าต่างๆ */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className="px-3 py-2 border-r border-gray-300 bg-white text-gray-500"
              >
                ...
              </span>
            );
          }
          
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(Number(page))}
              className={`
                px-3 py-2 border-r border-gray-300
                ${currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'}
              `}
            >
              {page}
            </button>
          );
        })}
        
        {/* ปุ่มถัดไป */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`
            px-3 py-2
            ${currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'}
          `}
          aria-label="Next Page"
        >
          »
        </button>
      </div>
    </div>
  );
};

export default EnhancedPagination;