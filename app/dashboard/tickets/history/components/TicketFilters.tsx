// app/dashboard/tickets/history/components/TicketFilters.tsx - Optimized
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
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, startDate: e.target.value });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  const InputField = ({ 
    label, 
    type = "text", 
    placeholder, 
    value, 
    onChange, 
    onKeyPress, 
    icon 
  }: {
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    icon: React.ReactNode;
  }) => (
    <div className="flex-1">
      <label className="block text-gray-600 font-medium mb-2">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          type={type}
          className="w-full border border-gray-300 rounded-md pl-10 py-2.5 pr-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
        />
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row gap-6 items-end">
        <InputField
          label="ຄົ້ນຫາ"
          placeholder="ຄົ້ນຫາໂດຍເລກປີ້"
          value={filters.searchQuery || ''}
          onChange={handleSearchQueryChange}
          onKeyPress={handleKeyPress}
          icon={<FiSearch className="text-gray-400" />}
        />
        
        <InputField
          label="ວັນເວລາ"
          type="date"
          value={filters.startDate || ''}
          onChange={handleDateChange}
          icon={<FiCalendar className="text-gray-400" />}
        />
      </div>
    </div>
  );
};

export default TicketFilters;