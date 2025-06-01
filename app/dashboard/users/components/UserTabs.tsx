// app/dashboard/users/components/UserTabs.tsx - Low Quality Version (Lao)
import React from 'react';

interface UserTabsProps {
  activeTab: 'drivers' | 'staff' | 'admin' | 'station';
  onTabChange: (tab: 'drivers' | 'staff' | 'admin' | 'station') => void;
  shouldShowTab: (tab: 'drivers' | 'staff' | 'admin' | 'station') => boolean;
}

const UserTabs: React.FC<UserTabsProps> = ({ activeTab, onTabChange, shouldShowTab }) => {
  const tabs = [
    { key: 'drivers', label: 'ຄົນຂັບລົດ' },
    { key: 'staff', label: 'ພະນັກງານຂາຍປີ້' },
    { key: 'admin', label: 'ແອດມິນ' },
    { key: 'station', label: 'ສະຖານີ' }
  ];
  
  return (
    <div className="mb-4">
      {tabs.map(tab => {
        if (!shouldShowTab(tab.key as any)) return null;
        
        return (
          <button
            key={tab.key}
            className={`mr-2 px-3 py-2 border rounded ${
              activeTab === tab.key 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => onTabChange(tab.key as any)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default UserTabs;