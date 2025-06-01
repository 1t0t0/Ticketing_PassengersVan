// app/dashboard/users/components/UserSearchComponent.tsx - Low Quality Version (Lao)
import React from 'react';

interface UserSearchComponentProps {
  onSearch: (searchTerm: string) => void;
  onClear: () => void;
  loading?: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const UserSearchComponent: React.FC<UserSearchComponentProps> = ({
  onSearch, onClear, loading = false, searchTerm, setSearchTerm
}) => {
  const handleClear = () => {
    setSearchTerm('');
    onClear();
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="ຄົ້ນຫາຜູ້ໃຊ້..."
        className="w-full p-2 border border-gray-300 rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && searchTerm.trim() && onSearch(searchTerm)}
      />
      {searchTerm && (
        <button className="mt-1 text-sm text-blue-500 underline" onClick={handleClear}>
          ລ້າງ
        </button>
      )}
      {loading && <div className="text-sm text-gray-500 mt-1">ກຳລັງຄົ້ນຫາ...</div>}
    </div>
  );
};

export default UserSearchComponent;