/**
 * ฟอร์แมตวันที่และเวลาสำหรับแสดงผล
 * @param date วันที่ที่ต้องการฟอร์แมต
 * @returns วันที่และเวลาที่ฟอร์แมตแล้ว
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString(); // ปี ค.ศ.
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * ฟอร์แมตวันที่สำหรับแสดงผล (ไม่มีเวลา)
 * @param date วันที่ที่ต้องการฟอร์แมต
 * @returns วันที่ที่ฟอร์แมตแล้ว
 */
export function formatDateOnly(date: Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString(); // ปี ค.ศ.
  return `${day}/${month}/${year}`;
}

/**
 * ฟอร์แมตเวลาสำหรับแสดงผล
 * @param date วันที่และเวลาที่ต้องการฟอร์แมต
 * @returns เวลาที่ฟอร์แมตแล้ว
 */
export function formatTime(date: Date): string {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * ฟอร์แมตจำนวนเงินเป็นรูปแบบที่มีเครื่องหมายคั่นหลักพัน
 * @param amount จำนวนเงิน
 * @returns จำนวนเงินที่ฟอร์แมตแล้ว
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString();
}

/**
 * แปลง payment method เป็นภาษาลาว
 * @param method วิธีการชำระเงิน
 * @returns วิธีการชำระเงินเป็นภาษาลาว
 */
export function formatPaymentMethod(method: string): string {
  switch (method) {
    case 'cash':
      return 'ເງິນສົດ';
    case 'qr':
      return 'QR';
    default:
      return method;
  }
}