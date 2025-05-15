// app/dashboard/users/hooks/useUserSearch.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { User } from '../types';
import notificationService from '@/lib/notificationService';

interface UseUserSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: User[];
  isSearching: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  handleSearch: (term?: string) => void;
  handleClearSearch: () => void;
  handlePageChange: (page: number) => void;
}

/**
 * Hook สำหรับจัดการการค้นหาผู้ใช้
 */
export default function useUserSearch(
  users: User[],
  fetchUsers: () => void
): UseUserSearchResult {
  // State สำหรับการค้นหา
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // State สำหรับ pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5, // แสดง 5 รายการต่อหน้า
  });

  // อ้างอิงไปยังผู้ใช้ล่าสุดเพื่อป้องกัน stale data
  const usersRef = useRef(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  // อ้างอิงไปยัง timeout เพื่อใช้ในการยกเลิก
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // รีเซ็ต pagination เมื่อ users เปลี่ยน
  useEffect(() => {
    if (!hasSearched) {
      setPagination({
        ...pagination,
        totalItems: users.length,
        totalPages: Math.ceil(users.length / pagination.itemsPerPage),
      });
    }
  }, [users, hasSearched, pagination.itemsPerPage]);

  // อัพเดทผลลัพธ์ตาม pagination
  useEffect(() => {
    if (searchResults.length > 0) {
      setPagination({
        ...pagination,
        totalItems: searchResults.length,
        totalPages: Math.ceil(searchResults.length / pagination.itemsPerPage),
      });
    }
  }, [searchResults]);

  // Effect สำหรับ Auto Search ที่มีการ debounce
  useEffect(() => {
    // ยกเลิก timeout เดิม (ถ้ามี)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // ถ้า searchTerm เป็นค่าว่าง และเคยมีการค้นหามาก่อน
    if (!searchTerm.trim() && hasSearched) {
      timeoutRef.current = setTimeout(() => {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
      }, 300);
      return;
    }

    // ข้ามการค้นหาเมื่อ searchTerm สั้นเกินไป
    if (searchTerm.trim().length < 2) {
      return;
    }

    // ตั้งค่า timeout สำหรับการค้นหา
    setIsSearching(true);
    timeoutRef.current = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);

    // ทำความสะอาด effect
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm]);

  // เรียกใช้ API ค้นหาผู้ใช้
  const searchUsers = useCallback(async (term: string) => {
    try {
      // ถ้า term เป็นค่าว่าง ให้แสดงข้อมูลทั้งหมด
      if (!term.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }
      
      // สำหรับเวอร์ชันนี้ เราจะทำการค้นหาจากข้อมูลที่มีในหน้า
      // ในอนาคตสามารถแก้ไขให้เรียกใช้ API search ได้
      const filtered = usersRef.current.filter((user) => {
        const searchableFields = [
          user.name,
          user.email,
          user.phone,
          user.employeeId,
          user.stationId,
        ];
        
        // ค้นหาใน field ต่างๆ แบบไม่สนใจตัวพิมพ์เล็ก/ใหญ่
        return searchableFields.some((field) => 
          field?.toString().toLowerCase().includes(term.toLowerCase())
        );
      });
      
      setSearchResults(filtered);
      setHasSearched(true);
      
      // รีเซ็ต pagination ไปที่หน้าแรก
      setPagination({
        ...pagination,
        currentPage: 1,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pagination.itemsPerPage),
      });
      
    } catch (error) {
      console.error('Error searching users:', error);
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາ');
    } finally {
      setIsSearching(false);
    }
  }, [pagination.itemsPerPage]);

  // ฟังก์ชันสำหรับการค้นหา
  const handleSearch = useCallback((term?: string) => {
    const termToSearch = term !== undefined ? term : searchTerm;
    searchUsers(termToSearch);
  }, [searchTerm, searchUsers]);

  // ฟังก์ชันสำหรับล้างการค้นหา
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
    setHasSearched(false);
    
    // รีเซ็ต pagination
    setPagination({
      ...pagination,
      currentPage: 1,
      totalItems: usersRef.current.length,
      totalPages: Math.ceil(usersRef.current.length / pagination.itemsPerPage),
    });
  }, [pagination.itemsPerPage]);

  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = useCallback((page: number) => {
    setPagination({
      ...pagination,
      currentPage: page,
    });
  }, [pagination]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    pagination,
    handleSearch,
    handleClearSearch,
    handlePageChange,
  };
}