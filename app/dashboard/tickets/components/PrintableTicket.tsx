// PrintableTicket.tsx - Reduced
import { LuBus } from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa6";

interface TicketTemplateProps {
  ticketNumber: string;
  price: number;
  soldAt: Date;
  soldBy: string;
  paymentMethod: string;
}

export default function TicketTemplate({
  ticketNumber, price, soldAt, soldBy, paymentMethod
}: TicketTemplateProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getPaymentText = (method: string) => method === 'cash' ? 'ເງິນສົດ' : 'ເງິນໂອນ';

  return (
    <div 
      id="printable-content"
      className="w-[99mm] h-[150mm] mx-auto bg-white border-2 border-black flex flex-col" 
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', pageBreakInside: 'avoid' }}
    >
      <div className="bg-black text-white p-4 text-center">
        <h1 className="text-3xl text-black font-extrabold uppercase">ປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</h1>
      </div>

      <div className="p-4 border-b-2">
        <div className="grid grid-cols-2 gap-2">
          <span className="font-bold">ໝາຍເລກປີ້/Ticket No:</span>
          <span>{ticketNumber}</span>
          <span className="font-bold">ວັນ-ເວລາ/Date-Time:</span>
          <span>{formatDate(soldAt)}</span>
          <span className="font-bold">ລາຄາ/Price:</span>
          <span className="font-bold">{price.toLocaleString()}</span>
          <span className="font-bold">ຊຳລະ/Payment:</span>
          <span>{getPaymentText(paymentMethod)}</span>
        </div>
      </div>

      <div className="p-6 border-b-2 text-center">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold">ສະຖານີລົດໄຟ<br/>TRAIN STATION</span>
          </div>
          <FaArrowRight className="text-2xl" />
          <div className="flex flex-col items-center mx-4">
            <span className="text-sm font-bold">ຕົວເມືອງ<br/>DOWNTOWN</span>
          </div>
        </div>
      </div>

      <div className="p-4 text-center flex-grow flex flex-col justify-between">
        <div className="flex justify-center items-center my-4">
          <p className="text-xl">ອອກໂດຍ<br/>Sold By:<br/> {soldBy}</p>
        </div>

        <div className="flex justify-center items-center my-4">
          <LuBus className="text-9xl text-gray-200 opacity-60" />
        </div>

        <div>
          <p className="text-xs">*** THANK YOU ***</p>
          <p className="text-xs">PLEASE KEEP THIS TICKET</p>
          <p className="text-xs">DURING YOUR JOURNEY</p>
          <p className="text-xs">ກາລຸນາຮັກສາປີ້ນີ້ໄວ້ເພື່ອກວດກາ</p>
          <p className="text-xs">ຂະນະເດີນທາງ</p>
        </div>
      </div>
    </div>
  );
}