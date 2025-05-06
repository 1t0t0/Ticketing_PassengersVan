interface NotionCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  withBorder?: boolean;
}

export default function NotionCard({ 
  children, 
  className = '',
  hover = false,
  withBorder = true,
}: NotionCardProps) {
  // Notion cards typically use subtle borders, white backgrounds, and minimal shadows
  return (
    <div 
      className={`
        bg-white 
        ${withBorder ? 'border border-[#E9E9E8]' : ''} 
        rounded-sm 
        ${hover ? 'hover:shadow-md transition-shadow duration-150' : 'shadow-sm'} 
        ${className}
      `}
    >
      {children}
    </div>
  );
}