// ค่าตั๋วเริ่มต้น
export const DEFAULT_TICKET_PRICE = 45000;

// วิธีการชำระเงิน
export const PAYMENT_METHODS = {
  CASH: 'cash',
  QR: 'qr'
};

// ตัวเลือกจำนวนรายการต่อหน้า
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ตัวเลือกการเรียงลำดับ
export const SORT_OPTIONS = [
  { value: 'newest', label: 'ລ່າສຸດ' },
  { value: 'oldest', label: 'ເກົ່າສຸດ' },
  { value: 'price_high', label: 'ລາຄາສູງ-ຕໍ່າ' },
  { value: 'price_low', label: 'ລາຄາຕໍ່າ-ສູງ' }
];

// ตัวเลือกวิธีการชำระเงิน
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'all', label: 'ທັງໝົດ' },
  { value: 'cash', label: 'ເງິນສົດ' },
  { value: 'qr', label: 'QR' }
];

// จำนวนตั๋วล่าสุดที่แสดงในหน้าขายตั๋ว
export const RECENT_TICKETS_COUNT = 3;

// รูปแบบประเภทการชำระเงิน
export const PAYMENT_METHOD_COLORS = {
  cash: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  qr: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  }
};