// app/dashboard/users/page.tsx - Updated to remove homepage link and note for Staff
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiClock } from 'react-icons/fi';

// Components
import UserTabs from './components/UserTabs';
import UserSearchComponent from './components/UserSearchComponent';
import { DriverList, StaffList, AdminList, StationList } from './components/lists';
import AddUserModal from './components/AddUserModal';
import AutoCheckoutModal from './components/AutoCheckoutModal';

// Hooks
import useUserData from './hooks/useUserData';
import useUserPermissions from './hooks/useUserPermissions';
import useUserSearch from './hooks/useUserSearch';

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<'drivers' | 'staff' | 'admin' | 'station'>('drivers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutoCheckoutModal, setShowAutoCheckoutModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{show: boolean, message: string, onConfirm?: () => void}>({
    show: false, message: '', onConfirm: undefined
  });

  // Custom hooks
  const { loading: loadingUsers, drivers, ticketSellers, admins, stations, fetchUsers } = useUserData();
  const { canAddUser, shouldShowTab, isAdmin } = useUserPermissions();

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, router, session]);
  
  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'staff'].includes(session?.user?.role || '')) {
      fetchUsers();
    }
  }, [status, session]);

  const refreshData = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const activeUsers = useMemo(() => {
    switch(activeTab) {
      case 'drivers': return drivers;
      case 'staff': return ticketSellers;
      case 'admin': return admins;
      case 'station': return stations;
      default: return [];
    }
  }, [activeTab, drivers, ticketSellers, admins, stations]);

  const {
    searchTerm, setSearchTerm, searchResults, isSearching,
    handleSearch, handleClearSearch
  } = useUserSearch(activeUsers, fetchUsers);

  const handleTabChange = (tab: 'drivers' | 'staff' | 'admin' | 'station') => {
    setActiveTab(tab);
    handleClearSearch();
  };

  const showConfirmation = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ show: true, message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog({ show: false, message: '', onConfirm: undefined });
  };

  const handleCancel = () => {
    setConfirmDialog({ show: false, message: '', onConfirm: undefined });
  };

  const displayItems = searchResults.length > 0 ? searchResults : activeUsers;

  const renderUsersList = () => {
    if (loadingUsers || isSearching) {
      return <div className="text-center py-8">Loading...</div>;
    }
    
    if (displayItems.length === 0) {
      return (
        <div className="text-center py-8">
          {searchResults.length === 0 && searchTerm ? 'No search results found' : 'No users found'}
        </div>
      );
    }

    switch(activeTab) {
      case 'drivers': return <DriverList drivers={displayItems} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'staff': return <StaffList staff={displayItems} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'admin': return <AdminList admins={displayItems} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      case 'station': return <StationList stations={displayItems} showConfirmation={showConfirmation} onRefresh={refreshData} />;
      default: return null;
    }
  };

  if (status === 'unauthenticated' || (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || ''))) {
    return null;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600">Manage all system users</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-gray-300 rounded p-4 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">User Management System</h2>
          <div className="space-x-2">
            {/* ปุ่ม Auto Checkout - แสดงเฉพาะ Admin */}
            {isAdmin() && (
              <button 
                onClick={() => setShowAutoCheckoutModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                title="ຕັ້ງຄ່າ Auto Checkout"
              >
                <FiClock className="inline mr-1" size={16} />
                ຕັ້ງເວລາ Checkout
              </button>
            )}
            
            {canAddUser() && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + ເພີ່ມຜູ້ໃຊ້
              </button>
            )}
            
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ອັບເດດ
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-white border border-gray-300 rounded p-4">
        <h2 className="text-xl font-bold mb-4">User Directory</h2>
        
        {/* Tabs - แสดงข้อความเฉพาะ Admin */}
        <UserTabs 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          shouldShowTab={shouldShowTab}
        />

        {/* Search */}
        <UserSearchComponent
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearch}
          onClear={handleClearSearch}
          loading={isSearching}
        />
        
        {/* Stats */}
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="text-sm">
            ສະແດງ {displayItems.length} {activeTab}
            {searchTerm && <span> (filtered by: "{searchTerm}")</span>}
          </p>
        </div>
        
        {/* Users List */}
        <div>
          {renderUsersList()}
        </div>
      </div>
      
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

      {/* Auto Checkout Modal */}
      {showAutoCheckoutModal && (
        <AutoCheckoutModal
          onClose={() => setShowAutoCheckoutModal(false)}
          onSuccess={() => {
            fetchUsers();
            setShowAutoCheckoutModal(false);
          }}
        />
      )}

      {/* Simple Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded border">
            <p className="mb-4">{confirmDialog.message}</p>
            <div className="flex space-x-2">
              <button 
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Confirm
              </button>
              <button 
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}