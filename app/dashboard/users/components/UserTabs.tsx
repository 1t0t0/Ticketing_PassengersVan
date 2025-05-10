import React from 'react';
import { TABS } from '../config/constants';

interface UserTabsProps {
  activeTab: 'drivers' | 'staff' | 'admin' | 'station';
  onTabChange: (tab: 'drivers' | 'staff' | 'admin' | 'station') => void;
  shouldShowTab: (tab: 'drivers' | 'staff' | 'admin' | 'station') => boolean;
}

// คอมโพเนนต์แท็บสำหรับเลือกประเภทผู้ใช้
export default function UserTabs({
  activeTab,
  onTabChange,
  shouldShowTab
}: UserTabsProps) {
  // แท็บทั้งหมด
  const allTabs = Object.keys(TABS) as Array<'drivers' | 'staff' | 'admin' | 'station'>;
  
  return (
    <div className="flex flex-wrap border-b border-gray-200 mb-6">
      {allTabs.map(tab => {
        // ข้ามแท็บที่ไม่ควรแสดง
        if (!shouldShowTab(tab)) {
          return null;
        }
        
        return (
          <button
            key={tab}
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
            }`}
            onClick={() => onTabChange(tab)}
          >
            {TABS[tab]}
          </button>
        );
      })}
    </div>
  );
}