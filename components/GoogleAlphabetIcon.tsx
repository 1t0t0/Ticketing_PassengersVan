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
  // ฟังก์ชันสำหรับสร้างสีจากชื่อ
  const getColorFromName = (name: string): string => {
    const colors = [
      'bg-red-500',     // Red
      'bg-pink-500',    // Pink  
      'bg-purple-500',  // Purple
      'bg-indigo-500',  // Indigo
      'bg-blue-500',    // Blue
      'bg-cyan-500',    // Cyan
      'bg-teal-500',    // Teal
      'bg-green-500',   // Green
      'bg-lime-500',    // Lime
      'bg-yellow-500',  // Yellow
      'bg-orange-500',  // Orange
      'bg-amber-500',   // Amber
      'bg-rose-500',    // Rose
      'bg-emerald-500', // Emerald
      'bg-sky-500',     // Sky
      'bg-violet-500'   // Violet
    ];
    
    // สร้าง hash จากชื่อ
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // เลือกสีจาก hash
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // ขนาดของ Avatar
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',      // 24px
    md: 'w-8 h-8 text-sm',      // 32px  
    lg: 'w-10 h-10 text-base',  // 40px
    xl: 'w-12 h-12 text-lg',    // 48px
    xxl: 'w-16 h-16 text-xl'    // 64px
  };

  // ดึงตัวอักษรตัวแรกของชื่อ
  const getInitial = (name: string): string => {
    if (!name || name.trim() === '') return '?';
    
    // ถ้าเป็นชื่อภาษาลาว หรือ ไทย ให้ใช้ตัวแรก
    const firstChar = name.trim().charAt(0).toUpperCase();
    
    // ถ้าเป็นตัวอักษรอังกฤษ ให้ใช้ตัวแรกของคำแรก
    if (/[A-Za-z]/.test(firstChar)) {
      return firstChar;
    }
    
    // สำหรับภาษาอื่นๆ ให้ใช้ตัวแรก
    return firstChar;
  };

  const backgroundColor = getColorFromName(name);
  const initial = getInitial(name);
  const sizeClass = sizeClasses[size];

  return (
    <div 
      className={`
        ${backgroundColor} 
        ${sizeClass}
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-medium
        ${className}
      `}
    >
      {initial}
    </div>
  );
};

export default GoogleAlphabetIcon;