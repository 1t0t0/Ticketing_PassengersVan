// แก้ไขไฟล์ app/dashboard/tickets/history/components/TicketFilters.tsx (เฉพาะส่วน style)

import React from 'react';
import { TicketFilter } from '../../types';
import { FiSearch, FiCalendar } from 'react-icons/fi'; // เพิ่ม import icon

interface TicketFiltersProps {
  filters: TicketFilter;
  onSearch: () => void;
  onClear: () => void;
  onFilterChange: (filters: TicketFilter) => void;
}

const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters,
  onSearch,
  onClear,
  onFilterChange
}) => {
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, startDate: e.target.value });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1">
          <label className="block text-gray-600 font-medium mb-2">ຄົ້ນຫາ</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md pl-10 py-2.5 pr-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="ຄົ້ນຫາໂດຍເລກປີ້"
              value={filters.searchQuery || ''}
              onChange={handleSearchQueryChange}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-gray-600 font-medium mb-2">ວັນເວລາ</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiCalendar className="text-gray-400" />
            </div>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md pl-10 py-2.5 pr-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              value={filters.startDate || ''}
              onChange={handleDateChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFilters;