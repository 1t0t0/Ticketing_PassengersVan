// app/dashboard/users/components/EnhancedPagination.tsx - Full Size Version
import React from 'react';

interface EnhancedPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  currentPage, totalPages, onPageChange, className = ''
}) => {
  if (totalPages <= 1) return null;
  
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className={`flex items-center justify-center py-6 ${className}`}>
      <div className="flex border border-gray-300 rounded-lg overflow-hidden">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 border-r border-gray-300 ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          ← ກ່ອນໜ້າ
        </button>
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className="px-4 py-2 border-r border-gray-300 bg-white text-gray-500"
              >
                ...
              </span>
            );
          }
          
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(Number(page))}
              className={`px-4 py-2 border-r border-gray-300 ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          );
        })}
        
        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          ຖັດໄປ →
        </button>
      </div>
    </div>
  );
};

export default EnhancedPagination;