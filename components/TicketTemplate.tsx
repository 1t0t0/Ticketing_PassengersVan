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
        className="w-[99mm] h-[150mm] mx-auto bg-white border-2 border-black flex flex-col" 
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '12px', 
          pageBreakInside: 'avoid',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}
      >
        {/* Top Section */}
        <div className="bg-black text-white p-4 text-center">
          <h1 className="text-3xl text-black font-extrabold uppercase">ປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</h1>
        </div>
  
        {/* Ticket Details */}
        <div className=" p-4 border-b-2">
          <div className="grid grid-cols-2 gap-2">
            <span className="font-bold">ໝາຍເລກປີ້/Ticket No:</span>
            <span>{ticketNumber}</span>
            <span className="font-bold">ວັນ-ເວລາ/Date-Time:</span>
            <span>{formatDate(soldAt)}</span>
            <span className="font-bold">ລາຄາ/Price:</span>
            <span className="font-bold">₭{price.toLocaleString()}</span>
            <span className="font-bold">ຊຳລະ/Payment:</span>
            <span>{paymentMethod.toUpperCase()}</span>
          </div>
        </div>
  
        {/* Route Information */}
        <div className=" p-4 border-b-2 text-center">
          <div className="flex justify-between items-center">
            <div>
              <span className="block text-sm">ຈາກ/FROM</span>
              <span className="text-xl font-bold">ສະຖານີລົດໄຟ/TRAIN STATION</span>
            </div>
           
            <div>
              <span className="block text-sm">ເຖິງ/TO</span>
              <span className="text-xl font-bold">ຕົວເມືອງ/DOWNTOWN</span>
            </div>
          </div>
        </div>
  
  
        {/* Bottom Section */}
        <div className=" p-4 text-center flex-grow flex flex-col justify-between">
          <div>
            <p className="text-sm">ອອກໂດຍ/Sold By:<br/> {soldBy}</p>
            
          </div>
  
          <div className="">
            <p className="text-xs">*** THANK YOU ***</p>
            <p className="text-xs">ກາລຸນາຮັກສາປີ້ນີ້ໄວ້ເພື່ອກວດກາ/PLEASE KEEP THIS TICKET</p>
            <p className="text-xs">ຂະນະເດີນທາງ/DURING YOUR JOURNEY</p>
          </div>
        </div>
      </div>
    );
  }