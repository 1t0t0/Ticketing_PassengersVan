import React from 'react';
import NeoButton from '@/components/ui/NotionButton';
import { TicketFilter } from '../../types';

interface TicketFiltersProps {
  filters: TicketFilter;
  onSearch: () => void;
  onClear: () => void;
  onFilterChange: (filters: TicketFilter) => void;
}

/**
 * คอมโพเนนต์สำหรับกรองและค้นหาตั๋ว
 */
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
    <div className="flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1">
        <label className="block text-sm font-bold mb-2">ຄົ້ນຫາ</label>
        <input
          type="text"
          className="w-full border-2 border-black p-2"
          placeholder="ຄົ້ນຫາໂດຍເລກປີ້"
          value={filters.searchQuery || ''}
          onChange={handleSearchQueryChange}
          onKeyPress={handleKeyPress}
        />
      </div>
      
      <div className="flex-1">
        <label className="block text-sm font-bold mb-2">ວັນເວລາ</label>
        <input
          type="date"
          className="w-full border-2 border-black p-2"
          value={filters.startDate || ''}
          onChange={handleDateChange}
        />
      </div>
      
      <div className="flex gap-2">
        <NeoButton onClick={onSearch}>ຄົ້ນຫາ</NeoButton>
        <NeoButton variant="secondary" onClick={onClear}>ແກ້ໄຂ</NeoButton>
      </div>
    </div>
  );
};

export default TicketFilters;