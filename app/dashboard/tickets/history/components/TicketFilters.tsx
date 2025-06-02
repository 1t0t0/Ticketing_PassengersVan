// TicketFilters.tsx - Reduced
import React from 'react';
import { TicketFilter } from '../../types';
import { FiSearch, FiCalendar } from 'react-icons/fi';

interface TicketFiltersProps {
  filters: TicketFilter;
  onSearch: () => void;
  onClear: () => void;
  onFilterChange: (filters: TicketFilter) => void;
}

const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters, onSearch, onClear, onFilterChange
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-gray-600 font-medium mb-2">ຄົ້ນຫາ</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full border rounded-md pl-10 py-2 pr-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ຄົ້ນຫາໂດຍເລກປີ້"
              value={filters.searchQuery || ''}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-gray-600 font-medium mb-2">ວັນເວລາ</label>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              className="w-full border rounded-md pl-10 py-2 pr-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFilters;