interface TicketTemplateProps {
    ticketNumber: string;
    price: number;
    soldAt: Date;
    soldBy: string;
    paymentMethod: string;
  }
  
  export default function TicketTemplate({
    ticketNumber,
    price,
    soldAt,
    soldBy,
    paymentMethod,
  }: TicketTemplateProps) {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };
  
    return (
      <div 
        id="printable-content"
        className="w-[99mm] h-[210mm] mx-auto bg-white border-2 border-black flex flex-col" 
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '12px', 
          pageBreakInside: 'avoid',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}
      >
        {/* Top Section */}
        <div className="bg-black text-white p-4 text-center">
          <h1 className="text-2xl font-bold uppercase">Bus Ticket System</h1>
        </div>
  
        {/* Ticket Details */}
        <div className=" p-4 border-b-2 border-black">
          <div className="grid grid-cols-2 gap-2">
            <span className="font-bold">Ticket No:</span>
            <span>{ticketNumber}</span>
            <span className="font-bold">Date:</span>
            <span>{formatDate(soldAt)}</span>
            <span className="font-bold">Price:</span>
            <span className="font-bold">฿{price.toLocaleString()}</span>
            <span className="font-bold">Payment:</span>
            <span>{paymentMethod.toUpperCase()}</span>
          </div>
        </div>
  
        {/* Route Information */}
        <div className=" p-4 border-b-2 border-black text-center">
          <div className="flex justify-between items-center">
            <div>
              <span className="block text-sm">FROM</span>
              <span className="text-lg font-bold">BUS STATION</span>
            </div>
            <div className="text-black">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="30" 
                height="30" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
            <div>
              <span className="block text-sm">TO</span>
              <span className="text-lg font-bold">DESTINATION</span>
            </div>
          </div>
        </div>
  
  
        {/* Bottom Section */}
        <div className=" p-4 text-center flex-grow flex flex-col justify-between">
          <div>
            <p className="text-sm">Sold By: {soldBy}</p>
            
            {/* Barcode */}
            <div className="mt-4">
              <div 
                className="inline-block border-2 border-black px-4 py-1"
                style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '10px' 
                }}
              >
                {ticketNumber}
              </div>
            </div>
          </div>
  
          <div className="mt-4">
            <p className="text-xs">*** THANK YOU ***</p>
            <p className="text-xs">PLEASE KEEP THIS TICKET</p>
            <p className="text-xs">DURING YOUR JOURNEY</p>
          </div>
        </div>
      </div>
    );
  }