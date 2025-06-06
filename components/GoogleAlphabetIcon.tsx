// components/GoogleAlphabetIcon.tsx - Fixed for hydration
import React from 'react';

interface GoogleAlphabetIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
}

const GoogleAlphabetIcon: React.FC<GoogleAlphabetIconProps> = ({ 
  name, 
  size = 'md', 
  className = '' 
}) => {
  // Get first letter of name, fallback to 'U' for User
  const getInitial = (name: string): string => {
    if (!name || typeof name !== 'string') return 'U';
    return name.charAt(0).toUpperCase();
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    xxl: 'w-16 h-16 text-2xl'
  };
  
  // Color classes based on first letter
  const getColorClass = (letter: string): string => {
    const colors = [
      'bg-red-500 text-white',
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-yellow-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-gray-500 text-white',
    ];
    
    const index = letter.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const initial = getInitial(name);
  const colorClass = getColorClass(initial);
  const sizeClass = sizeClasses[size];
  
  return (
    <div 
      className={`
        ${sizeClass} 
        ${colorClass} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-semibold 
        select-none
        ${className}
      `}
      role="img"
      aria-label={`Avatar for ${name}`}
    >
      <span className="leading-none">
        {initial}
      </span>
    </div>
  );
};

export default GoogleAlphabetIcon;