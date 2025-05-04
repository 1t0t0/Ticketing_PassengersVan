interface NeoCardProps {
    children: React.ReactNode;
    className?: string;
    color?: 'white' | 'blue' | 'yellow' | 'pink' | 'green';
  }
  
  export default function NeoCard({ 
    children, 
    className = '', 
    color = 'white' 
  }: NeoCardProps) {
    const colors = {
      white: 'bg-white',
      blue: 'bg-neo-blue',
      yellow: 'bg-neo-yellow',
      pink: 'bg-neo-pink',
      green: 'bg-neo-green',
    };
  
    return (
      <div className={`border-2 border-black shadow-neo ${colors[color]} ${className}`}>
        {children}
      </div>
    );
  }