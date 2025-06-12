// components/BookingNumber.tsx - Reusable Component
'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface BookingNumberProps {
  bookingNumber: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'card' | 'inline';
  className?: string;
}

export default function BookingNumber({ 
  bookingNumber, 
  size = 'md', 
  showLabel = true,
  variant = 'default',
  className = ''
}: BookingNumberProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = bookingNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Size variants
  const sizeClasses = {
    sm: {
      text: 'text-sm',
      font: 'font-medium',
      padding: 'px-2 py-1',
      icon: 'h-3 w-3',
      label: 'text-xs'
    },
    md: {
      text: 'text-base',
      font: 'font-bold',
      padding: 'px-3 py-2',
      icon: 'h-4 w-4',
      label: 'text-sm'
    },
    lg: {
      text: 'text-lg',
      font: 'font-bold',
      padding: 'px-4 py-3',
      icon: 'h-5 w-5',
      label: 'text-base'
    }
  };

  const sizeClass = sizeClasses[size];

  // Variant styles
  const variantClasses = {
    default: 'bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300',
    card: 'bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-400',
    inline: 'bg-transparent border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
  };

  if (variant === 'inline' && !showLabel) {
    return (
      <div className={`inline-flex items-center ${variantClasses[variant]} rounded-lg ${sizeClass.padding} group transition-colors ${className}`}>
        <span className={`font-mono ${sizeClass.font} ${sizeClass.text} text-blue-700 mr-2 select-all cursor-pointer`}>
          {bookingNumber}
        </span>
        <button
          onClick={handleCopy}
          className={`${copied ? 'text-green-600' : 'text-gray-400 hover:text-blue-600'} hover:bg-blue-100 rounded p-1 transition-colors`}
          title={copied ? 'ຄັດລອກແລ້ວ!' : 'ຄັດລອກເລກການຈອງ'}
        >
          {copied ? <Check className={sizeClass.icon} /> : <Copy className={sizeClass.icon} />}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center mb-2">
          <span className={`text-gray-600 ${sizeClass.label}`}>ການຈອງເລກທີ:</span>
        </div>
      )}
      <div className={`inline-flex items-center ${variantClasses[variant]} rounded-lg ${sizeClass.padding} group transition-colors`}>
        <span 
          className={`font-mono ${sizeClass.font} ${sizeClass.text} text-blue-700 mr-2 select-all cursor-pointer`}
          onClick={handleCopy}
        >
          {bookingNumber}
        </span>
        <button
          onClick={handleCopy}
          className={`${copied ? 'text-green-600' : 'text-gray-400 hover:text-blue-600'} hover:bg-blue-100 rounded p-1 transition-colors`}
          title={copied ? 'ຄັດລອກແລ້ວ!' : 'ຄັດລອກເລກການຈອງ'}
        >
          {copied ? <Check className={sizeClass.icon} /> : <Copy className={sizeClass.icon} />}
        </button>
      </div>
      
      {/* คำแนะนำเล็กๆ */}
      {variant === 'card' && (
        <p className="text-xs text-blue-600 mt-1 opacity-75">
          ກົດເພື່ອຄັດລອກ
        </p>
      )}
    </div>
  );
}