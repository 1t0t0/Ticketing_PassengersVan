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
  // ฟังก์ชันแปลงวันที่
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString(); // ปี ค.ศ.
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div 
      id="printable-content"
      className="mx-auto bg-white border border-black"
      style={{ 
        fontFamily: 'Phetsarath, sans-serif',
        width: '80mm',
        padding: '0',
        margin: '0 auto',
        boxSizing: 'border-box',
        // กำหนดความสูงที่แน่นอนหรือสัดส่วนความสูงอัตโนมัติ
        height: 'auto',
        // ป้องกันไม่ให้เกิดพื้นที่ว่างที่ไม่ต้องการ
        pageBreakInside: 'avoid',
        pageBreakAfter: 'avoid',
        // ปิดคุณสมบัติขยายความสูงอัตโนมัติ
        minHeight: '0',
        maxHeight: 'fit-content'
      }}
    >
      {/* ส่วนหัว - ชื่อตั๋ว */}
      <div className="text-center p-2 border-b border-black">
        <div className="text-base font-bold">ປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ</div>
        <div className="text-base font-bold">ລາວ-ຈີນ</div>
      </div>

      {/* ส่วนรายละเอียดตั๋ว */}
      <div className="p-2 border-b border-black">
        <table className="w-full text-sm" style={{ borderSpacing: '0 3px' }}>
          <tbody>
            <tr>
              <td className="align-top font-bold">ໝາຍເລກປີ້/Ticket No:</td>
              <td>{ticketNumber}</td>
            </tr>
            <tr>
              <td className="align-top font-bold">ວັນ-ເວລາ/Date-Time:</td>
              <td>{formatDate(soldAt)}</td>
            </tr>
            <tr>
              <td className="align-top font-bold">ລາຄາ/Price:</td>
              <td>{price.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="align-top font-bold">ຊຳລະ/Payment:</td>
              <td className="text-blue-600">{paymentMethod.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ส่วนเส้นทาง */}
      <div className="border-b border-black">
        <table className="w-full text-center">
          <tbody>
            <tr>
              <td className="p-1 w-1/2">
                <div className="text-xs text-yellow-800">ຈາກ/FROM</div>
                <div className="font-bold">ສະຖານີ</div>
                <div className="font-bold">ລົດໄຟ/TRAIN</div>
                <div className="font-bold">STATION</div>
              </td>
              <td className="p-1 w-1/2">
                <div className="text-xs text-yellow-800">ເຖິງ/TO</div>
                <div className="font-bold">ຕົວ</div>
                <div className="font-bold">ເມືອງ/DOWNTOWN</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ส่วนผู้ขาย */}
      <div className="py-1 px-2 text-center border-b border-black">
        <div className="text-sm">
          ອອກໂດຍ/Sold By:<br/>
          {soldBy}
        </div>
      </div>

      {/* ส่วนขอบคุณ */}
      <div className="py-1 px-2 text-center">
        <p className="text-xs text-blue-600 my-0">*** THANK YOU ***</p>
        <p className="text-xs my-0">ກາລຸນາຮັກສາປີ້ນີ້ໄວ້ເພື່ອກວດກາ/PLEASE KEEP THIS TICKET</p>
        <p className="text-xs my-0 mb-0 pb-0">ຂະນະເດີນທາງ/DURING YOUR JOURNEY</p>
      </div>
    </div>
  );
}