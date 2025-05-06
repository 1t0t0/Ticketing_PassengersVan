import { ButtonHTMLAttributes } from 'react';

interface NotionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export default function NotionButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}: NotionButtonProps) {
  const baseStyles = 'font-medium rounded-sm transition-all duration-150 focus:outline-none';
  
  const variants = {
    primary: 'bg-[#2383E2] text-white hover:bg-[#1b6ac4]',
    secondary: 'bg-white border border-[#E9E9E8] text-[#37352F] hover:bg-[#F7F6F3]',
    danger: 'bg-[#E03E3E] text-white hover:bg-[#c13636]',
    success: 'bg-[#0F7B0F] text-white hover:bg-[#0d690d]',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-sm',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}