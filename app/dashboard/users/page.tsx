'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import useConfirmation from '@/hooks/useConfirmation';
import { FiSearch } from 'react-icons/fi';

// Components - เปลี่ยนเส้นทาง imports
import UserTabs from '@/app/dashboard/users/components/UserTabs';
import DriverList from '@/app/dashboard/users/components/lists/DriverList';
import StaffList from '@/app/dashboard/users/components/lists/StaffList';
import AdminList from '@/app/dashboard/users/components/lists/AdminList';
import StationList from '@/app/dashboard/users/components/lists/StationList';
import AddUserModal from '@/app/dashboard/users/components/AddUserModal';
import Pagination from '@/components/ui/Pagination';

// Hooks
import useUserData from '@/app/dashboard/users/hooks/useUserData';
import useUserPermissions from '@/app/dashboard/users/hooks/useUserPermissions';

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
  
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Show 5 items per page
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  // Custom hooks
  const { loading, drivers, ticketSellers, admins, stations, fetchUsers } = useUserData();
  const { canAddUser, shouldShowTab } = useUserPermissions();

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, router, session]);
  
  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'staff'].includes(session?.user?.role || '')) {
      fetchUsers();
    }
  }, [status, session, fetchUsers]);

  // Handle search and filtering
  useEffect(() => {
    let result: any[] = [];
    
    // Get users based on active tab
    switch(activeTab) {
      case 'drivers':
        result = drivers;
        break;
      case 'staff':
        result = ticketSellers;
        break;
      case 'admin':
        result = admins;
        break;
      case 'station':
        result = stations;
        break;
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      result = result.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const phoneMatch = user.phone?.includes(searchLower);
        const idMatch = (user.employeeId || user.stationId || '')?.toLowerCase().includes(searchLower);
        
        return nameMatch || emailMatch || phoneMatch || idMatch;
      });
    }
    
    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when search term or tab changes
  }, [searchTerm, activeTab, drivers, ticketSellers, admins, stations]);

  // Function to refresh data after update
  const refreshData = useCallback(() => {
    console.log('Refreshing user data...');
    fetchUsers();
  }, [fetchUsers]);

  // Tab change handler
  const handleTabChange = (tab: 'drivers' | 'staff' | 'admin' | 'station') => {
    setActiveTab(tab);
    setSearchTerm(''); // Clear search when changing tabs
  };

  // Get paginated users
  const getPaginatedUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Render users based on active tab
  const renderUsersList = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      );
    }

    // Get current page users
    const currentUsers = getPaginatedUsers();
    
    if (currentUsers.length === 0) {
      return (
        <div className="text-center py-8">
          <p>{searchTerm ? 'ບໍ່ພົບຂໍ້ມູນທີ່ຄົ້ນຫາ' : 'ບໍ່ມີຂໍ້ມູນຜູ້ໃຊ້'}</p>
        </div>
      );
    }

    switch(activeTab) {
      case 'drivers':
        return <DriverList drivers={currentUsers} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'staff':
        return <StaffList staff={currentUsers} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'admin':
        return <AdminList admins={currentUsers} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'station':
        return <StationList stations={currentUsers} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      default:
        return null;
    }
  };

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
          
          {/* Search box */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="ຄົ້ນຫາຜູ້ໃຊ້ລະບົບ"
                className="w-full p-3 pl-10 border-2 border-gray-300 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
          
          <UserTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            shouldShowTab={shouldShowTab}
          />
          
          {/* User List */}
          <div>{renderUsersList()}</div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
          
          {/* Display count info */}
          <div className="mt-4 text-sm text-gray-500 text-center">
            ສະແດງ {Math.min(filteredUsers.length, currentPage * itemsPerPage)} ຈາກທັງໝົດ {filteredUsers.length} ລາຍການ
          </div>
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