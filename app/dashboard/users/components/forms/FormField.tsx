// FormField.tsx - Fixed TypeScript types and properly structured
import React, { useState } from 'react';
import { FiRefreshCw, FiCamera, FiX } from 'react-icons/fi';

// Main FormField Component
interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  icon?: React.ReactNode;
  options?: Array<{ value: string; label: string }>;
  as?: 'input' | 'select' | 'textarea';
  rows?: number;
  disabled?: boolean;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required, 
  min,
  icon,
  options,
  as = 'input',
  rows = 3,
  disabled,
  className = ''
}) => {
  const baseClasses = `w-full border-2 border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none ${icon ? 'pl-10' : ''} ${className}`;

  const renderInput = (): JSX.Element => {
    if (as === 'select') {
      return (
        <select className={baseClasses} value={value} onChange={onChange} required={required} disabled={disabled}>
          {options?.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }
    
    if (as === 'textarea') {
      return (
        <textarea 
          className={baseClasses} 
          placeholder={placeholder}
          value={value} 
          onChange={onChange} 
          required={required}
          rows={rows}
          disabled={disabled}
        />
      );
    }

    return (
      <input
        type={type}
        className={baseClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        disabled={disabled}
      />
    );
  };

  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        {renderInput()}
      </div>
    </div>
  );
};

// Password Reset API Function Type
interface PasswordResetResponse {
  temporaryPassword: string;
  message?: string;
}

// Mock API function - replace with actual implementation
const resetUserPassword = async (userId: string): Promise<PasswordResetResponse> => {
  // This should be imported from your actual API module
  const response = await fetch(`/api/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to reset password');
  }
  
  return response.json();
};

// Mock notification service - replace with actual implementation
const notificationService = {
  success: (message: string): void => {
    console.log('Success:', message);
    // Replace with your actual notification implementation
  },
  error: (message: string): void => {
    console.error('Error:', message);
    // Replace with your actual notification implementation
  }
};

// Password Reset Hook
interface UsePasswordResetReturn {
  showTempPassword: boolean;
  tempPassword: string;
  loading: boolean;
  handleReset: () => Promise<void>;
}

export const usePasswordReset = (
  userId: string | undefined, 
  updateUser: (field: string, value: string) => void
): UsePasswordResetReturn => {
  const [showTempPassword, setShowTempPassword] = useState<boolean>(false);
  const [tempPassword, setTempPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleReset = async (): Promise<void> => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await resetUserPassword(userId);
      setTempPassword(response.temporaryPassword);
      setShowTempPassword(true);
      updateUser('password', response.temporaryPassword);
      notificationService.success('ລີເຊັດລະຫັດຜ່ານສຳເລັດ');
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return { showTempPassword, tempPassword, loading, handleReset };
};

// Password Field Component
interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  isEditing?: boolean;
  onReset?: () => void;
  loading?: boolean;
  showTempPassword?: boolean;
  tempPassword?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  value, 
  onChange, 
  isEditing = false, 
  onReset, 
  loading = false, 
  showTempPassword = false, 
  tempPassword = ''
}) => (
  <div>
    <label className="block text-sm font-bold mb-2">ລະຫັດຜ່ານ</label>
    <div className="relative">
      <input
        type="text"
        className="w-full border-2 border-gray-300 rounded p-2 pr-10 focus:border-blue-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isEditing ? "ໃສ່ລະຫັດຜ່ານໃໝ່ ຫຼື ປ່ອຍວ່າງຄືເກົ່າ" : "ລະຫັດຜ່ານ"}
      />
      {isEditing && onReset && (
        <button
          type="button"
          className="absolute right-2 top-2 text-blue-500 hover:text-blue-700 transition-colors"
          onClick={onReset}
          disabled={loading}
        >
          <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
    {showTempPassword && tempPassword && (
      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
        <p className="text-sm text-yellow-800">
          ລະຫັດຜ່ານຊົ່ວຄາວ: <strong>{tempPassword}</strong>
        </p>
      </div>
    )}
  </div>
);

// Image Upload Component
interface ImageUploadProps {
  label: string;
  file: File | null;
  preview?: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  id: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label, 
  file, 
  preview, 
  onFileChange, 
  onRemove, 
  id
}) => {
  const getImageSrc = (): string => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return preview || '';
  };

  const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    onRemove();
  };

  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        id={id} 
        onChange={onFileChange} 
      />
      <label
        htmlFor={id}
        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
      >
        {file || preview ? (
          <div className="relative w-full h-full">
            <img 
              src={getImageSrc()}
              alt={`${label} Preview`} 
              className="w-full h-full object-contain p-2 rounded"
            />
            <button 
              type="button"
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              onClick={handleRemoveClick}
            >
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <FiCamera className="mx-auto text-3xl text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        )}
      </label>
    </div>
  );
};

export default FormField;