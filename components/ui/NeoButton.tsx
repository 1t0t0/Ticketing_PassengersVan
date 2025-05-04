import { ButtonHTMLAttributes } from 'react';

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export default function NeoButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}: NeoButtonProps) {
  const baseStyles = 'font-bold border-2 border-black transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none';
  
  const variants = {
    primary: 'bg-neo-blue hover:bg-blue-300',
    secondary: 'bg-white hover:bg-gray-100',
    danger: 'bg-neo-pink hover:bg-red-400',
    success: 'bg-neo-green hover:bg-green-300',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm shadow-neo',
    md: 'px-4 py-2 text-base shadow-neo',
    lg: 'px-6 py-3 text-lg shadow-neo-lg',
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