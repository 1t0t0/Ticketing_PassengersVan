import React from 'react';

interface FormFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  icon?: React.ReactNode;
}

// คอมโพเนนต์ FormField ที่ใช้ซ้ำในแต่ละฟอร์ม
const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  required, 
  min,
  icon
}) => {
  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={`w-full border-2 border-gray-300 rounded p-2 ${icon ? 'pl-10' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
        />
      </div>
    </div>
  );
};

export default FormField;