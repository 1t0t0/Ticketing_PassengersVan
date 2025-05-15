// app/dashboard/users/components/UserSearchComponent.tsx
import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

interface UserSearchComponentProps {
  onSearch: (searchTerm: string) => void;
  onClear: () => void;
  loading?: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const UserSearchComponent: React.FC<UserSearchComponentProps> = ({
  onSearch,
  onClear,
  loading = false,
  searchTerm,
  setSearchTerm
}) => {
  // ฟังก์ชันสำหรับล้างการค้นหา
  const handleClear = () => {
    setSearchTerm('');
    onClear();
  };

  // ฟังก์ชันจัดการเมื่อกด Enter ในช่องค้นหา
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="mb-4">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ຄົ້ນຫາໂດຍຊື່, ອີເມວ, ເບີໂທລະສັບ, ID..."
          className="w-full border-2 border-gray-300 rounded pl-10 pr-10 py-2 focus:border-blue-500 focus:outline-none transition duration-150"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          autoComplete="off"
        />
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </div>
      {loading && (
        <div className="text-sm text-blue-500 mt-1 ml-1 inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          ກຳລັງຄົ້ນຫາ...
        </div>
      )}
    </div>
  );
};

export default UserSearchComponent;