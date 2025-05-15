'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import useConfirmation from '@/hooks/useConfirmation';

// Components
import { 
  UserTabs, 
  UserSearchComponent, 
  EnhancedPagination 
} from './components';
import { DriverList, StaffList, AdminList, StationList } from './components/lists';
import AddUserModal from './components/AddUserModal';

// Hooks
import useUserData from './hooks/useUserData';
import useUserPermissions from './hooks/useUserPermissions';
import useUserSearch from './hooks/useUserSearch';

export default function UserManagementPage() {
  // Hooks
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    isConfirmDialogOpen,
    confirmMessage,
    showConfirmation,
    handleConfirm,
    handleCancel
  } = useConfirmation();

  // State - UI
  const [activeTab, setActiveTab] = useState<'drivers' | 'staff' | 'admin' | 'station'>('drivers');
  const [showAddModal, setShowAddModal] = useState(false);

  // Custom hooks
  const { loading: loadingUsers, drivers, ticketSellers, admins, stations, fetchUsers } = useUserData();
  const { canAddUser, shouldShowTab } = useUserPermissions();

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, router, session]);
  
  // Initial data fetch - fetch only once on component mount
  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'staff'].includes(session?.user?.role || '')) {
      fetchUsers();
    }
  }, [status, session]); // removed fetchUsers from dependencies to prevent multiple calls

  // ฟังก์ชันสำหรับรีโหลดข้อมูลหลังจากอัพเดท - ใช้เมื่อมีการแก้ไขข้อมูล
  const refreshData = useCallback(() => {
    console.log('Refreshing user data...');
    fetchUsers();
  }, [fetchUsers]);

  // ดึงข้อมูลผู้ใช้ตามประเภทที่เลือกด้วย useMemo เพื่อลดการคำนวณซ้ำ
  const activeUsers = useMemo(() => {
    switch(activeTab) {
      case 'drivers': return drivers;
      case 'staff': return ticketSellers;
      case 'admin': return admins;
      case 'station': return stations;
      default: return [];
    }
  }, [activeTab, drivers, ticketSellers, admins, stations]);

  // เรียกใช้ hook สำหรับค้นหาผู้ใช้
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    pagination,
    handleSearch,
    handleClearSearch,
    handlePageChange
  } = useUserSearch(activeUsers, fetchUsers);

  // Tab change handler
  const handleTabChange = (tab: 'drivers' | 'staff' | 'admin' | 'station') => {
    setActiveTab(tab);
    handleClearSearch(); // ล้างผลการค้นหาเมื่อเปลี่ยนแท็บ
  };

  // คำนวณรายการที่จะแสดงตาม pagination ด้วย useMemo
  const paginatedItems = useMemo(() => {
    const items = searchResults.length > 0 ? searchResults : activeUsers;
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    
    return items.slice(startIndex, endIndex);
  }, [searchResults, activeUsers, pagination.currentPage, pagination.itemsPerPage]);

  // Render users based on active tab
  const renderUsersList = () => {
    if (loadingUsers || isSearching) {
      return (
        <div className="text-center py-8">
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      );
    }
    
    if (paginatedItems.length === 0) {
      if (searchResults.length === 0 && searchTerm) {
        return (
          <div className="text-center py-8">
            <p>ບໍ່ພົບຂໍ້ມູນຈາກການຄົ້ນຫາ</p>
          </div>
        );
      }
      
      return (
        <div className="text-center py-8">
          <p>ບໍ່ມີຂໍ້ມູນ</p>
        </div>
      );
    }

    switch(activeTab) {
      case 'drivers':
        return <DriverList drivers={paginatedItems} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'staff':
        return <StaffList staff={paginatedItems} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'admin':
        return <AdminList admins={paginatedItems} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'station':
        return <StationList stations={paginatedItems} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      default:
        return null;
    }
  };

  // ส่วนสถิติแสดงจำนวนรายการ - คำนวณด้วย useMemo
  const statsInfo = useMemo(() => {
    const totalItems = searchResults.length > 0 ? searchResults.length : activeUsers.length;
    const startItem = pagination.currentPage === 1 ? 1 : (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    const endItem = Math.min(startItem + pagination.itemsPerPage - 1, totalItems);
    
    return {
      startItem,
      endItem,
      totalItems
    };
  }, [searchResults, activeUsers, pagination.currentPage, pagination.itemsPerPage]);

  // Main render
  if (status === 'unauthenticated' || (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || ''))) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ຈັດການຜູ້ໃຊ້ລະບົບ</h1>
        <div className="flex gap-2">
          {canAddUser() && (
            <NeoButton onClick={() => setShowAddModal(true)}>
              ເພີ່ມຜູ້ໃຊ້ລະບົບ
            </NeoButton>
          )}
          <NeoButton variant="secondary" onClick={refreshData}>
            ໂຫລດຂໍ້ມູນໃໝ່
          </NeoButton>
        </div>
      </div>
      
      <NeoCard className="overflow-hidden mb-6">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">User Directory</h2>
          
          <UserTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            shouldShowTab={shouldShowTab}
          />

          {/* User Search Component - Auto Search */}
          <UserSearchComponent
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            loading={isSearching}
          />
          
          {/* Stats Info */}
          <div className="text-sm text-gray-500 mb-4">
            ສະແດງລາຍການ {statsInfo.startItem}-{statsInfo.endItem} ຈາກທັງໝົດ {statsInfo.totalItems} ລາຍການ
          </div>
          
          {/* Users List */}
          <div>{renderUsersList()}</div>
          
          {/* Pagination Component */}
          <EnhancedPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </NeoCard>
      
      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          activeTab={activeTab}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchUsers();
            setShowAddModal(false);
          }}
        />
      )}

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