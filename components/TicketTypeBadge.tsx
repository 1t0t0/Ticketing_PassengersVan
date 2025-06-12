// components/TicketTypeBadge.tsx - Reusable Ticket Type Indicator
'use client';

interface TicketTypeBadgeProps {
  isFromBooking: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function TicketTypeBadge({ 
  isFromBooking, 
  size = 'sm', 
  showIcon = true,
  className = '' 
}: TicketTypeBadgeProps) {
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (isFromBooking) {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} bg-blue-500 text-white rounded-full font-medium ${className}`}>
        {showIcon && (
          <svg className={`${iconSizes[size]} mr-1`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )}
        ປີ້ຈອງ
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} bg-gray-500 text-white rounded-full font-medium ${className}`}>
      {showIcon && (
        <svg className={`${iconSizes[size]} mr-1`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
      ປີ້ປົກກະຕິ
    </span>
  );
}