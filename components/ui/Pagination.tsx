'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationProps) {
  // ไม่แสดง pagination ถ้ามีหน้าเดียว
  if (totalPages <= 1) return null;

  // สร้างรายการหมายเลขหน้า
  const getPageNumbers = () => {
    const pages = [];
    
    // แสดงหน้าสูงสุด 5 หน้า
    const maxPageButtons = 5;
    
    // คำนวณหน้าแรกที่จะแสดง
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    // คำนวณหน้าสุดท้ายที่จะแสดง
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // ปรับหน้าแรกถ้าจำนวนหน้าที่แสดงน้อยกว่า maxPageButtons
    if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // เพิ่มหน้าทั้งหมดที่จะแสดง
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  return (
    <div className="flex justify-center items-center space-x-2">
      {/* ปุ่ม Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 border rounded ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white hover:bg-gray-50 text-gray-700'
        }`}
        aria-label="Previous page"
      >
        <span className="font-bold">◀</span> ກັບຄືນ
      </button>
      
      {/* ปุ่มไปหน้าแรก (ถ้าอยู่ห่างจากหน้าแรก) */}
      {getPageNumbers()[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 border rounded bg-white hover:bg-gray-50 text-gray-700"
          >
            1
          </button>
          {getPageNumbers()[0] > 2 && (
            <span className="px-2">...</span>
          )}
        </>
      )}
      
      {/* ปุ่มหมายเลขหน้า */}
      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 border rounded ${
            currentPage === page
              ? 'bg-blue-500 text-white'
              : 'bg-white hover:bg-gray-50 text-gray-700'
          }`}
        >
          {page}
        </button>
      ))}
      
      {/* ปุ่มไปหน้าสุดท้าย (ถ้าอยู่ห่างจากหน้าสุดท้าย) */}
      {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
        <>
          {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
            <span className="px-2">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 border rounded bg-white hover:bg-gray-50 text-gray-700"
          >
            {totalPages}
          </button>
        </>
      )}
      
      {/* ปุ่ม Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 border rounded ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white hover:bg-gray-50 text-gray-700'
        }`}
        aria-label="Next page"
      >
        ຕໍ່ໄປ <span className="font-bold">▶</span>
      </button>
    </div>
  );
}