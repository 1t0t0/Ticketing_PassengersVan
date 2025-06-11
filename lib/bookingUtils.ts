// lib/bookingUtils.ts - ฟังก์ชันช่วยเหลือสำหรับระบบจอง
import QRCode from 'qrcode';

// ประเภทข้อมูล
export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TravelDateInfo {
  date: string;
  dayName: string;
  isWeekend: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  daysFromNow: number;
}

export interface BookingQRData {
  booking_id: string;
  ticket_code: string;
  passenger_order: number;
  passenger_email: string;
  travel_date: string;
  total_passengers: number;
  price: number;
  validation_key: string;
  expires_at: string;
  type: 'booking_ticket';
}

export interface BookingPricing {
  pricePerTicket: number;
  totalPrice: number;
  currency: string;
  discountApplied?: {
    type: string;
    amount: number;
    description: string;
  };
}

// ค่าคงที่
export const BOOKING_CONSTANTS = {
  MAX_ADVANCE_DAYS: 7,          // จองล่วงหน้าได้สูงสุด 7 วัน
  MIN_TICKETS: 1,               // จองขั้นต่ำ 1 ตั๋ว
  MAX_TICKETS: 10,              // จองสูงสุด 10 ตั๋วต่อครั้ง
  DEFAULT_PRICE: 45000,         // ราคาเริ่มต้น 45,000 กีบ
  EXPIRY_HOURS: 24,             // หมดอายุภายใน 24 ชั่วโมง
  PAYMENT_WINDOW_HOURS: 24,     // ช่วงเวลาชำระเงิน 24 ชั่วโมง
} as const;

// ====================================
// 📅 Date & Time Utilities
// ====================================

/**
 * ตรวจสอบว่าวันที่สามารถจองได้หรือไม่
 */
export function canBookForDate(dateString: string): BookingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const targetDate = new Date(dateString + 'T00:00:00.000Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // ตรวจสอบว่าเป็นวันในอดีต
    if (diffDays < 0) {
      errors.push('ไม่สามารถจองวันที่ผ่านมาแล้ว');
    }
    
    // ตรวจสอบว่าเป็นวันนี้
    if (diffDays === 0) {
      const currentHour = new Date().getHours();
      if (currentHour >= 18) {  // หลัง 6 โมงเย็น
        errors.push('ไม่สามารถจองสำหรับวันนี้หลัง 18:00 น.');
      } else {
        warnings.push('การจองสำหรับวันนี้ต้องชำระภายใน 2 ชั่วโมง');
      }
    }
    
    // ตรวจสอบว่าเกิน 7 วันหรือไม่
    if (diffDays > BOOKING_CONSTANTS.MAX_ADVANCE_DAYS) {
      errors.push(`สามารถจองล่วงหน้าได้สูงสุด ${BOOKING_CONSTANTS.MAX_ADVANCE_DAYS} วันเท่านั้น`);
    }
    
    // ตรวจสอบว่าเป็นวันหยุดหรือไม่ (ไม่มีเส้นทาง)
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0) {  // วันอาทิตย์
      warnings.push('วันอาทิตย์อาจไม่มีเส้นทาง กรุณาตรวจสอบก่อนจอง');
    }
    
  } catch (error) {
    errors.push('รูปแบบวันที่ไม่ถูกต้อง');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * ดึงข้อมูลวันที่เดินทาง
 */
export function getTravelDateInfo(dateString: string): TravelDateInfo {
  const targetDate = new Date(dateString + 'T00:00:00.000Z');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const dayNames = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'];
  const dayOfWeek = targetDate.getDay();
  
  return {
    date: dateString,
    dayName: dayNames[dayOfWeek],
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    isToday: daysFromNow === 0,
    isTomorrow: daysFromNow === 1,
    daysFromNow
  };
}

/**
 * สร้างรายการวันที่ที่สามารถจองได้
 */
export function getAvailableDates(): TravelDateInfo[] {
  const dates: TravelDateInfo[] = [];
  const today = new Date();
  
  for (let i = 0; i <= BOOKING_CONSTANTS.MAX_ADVANCE_DAYS; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const dateString = date.toISOString().split('T')[0];
    const validation = canBookForDate(dateString);
    
    if (validation.isValid) {
      dates.push(getTravelDateInfo(dateString));
    }
  }
  
  return dates;
}

// ====================================
// 💰 Pricing Utilities
// ====================================

/**
 * คำนวณราคาการจอง
 */
export function calculateBookingPrice(
  ticketCount: number, 
  travelDate: string,
  discountCode?: string
): BookingPricing {
  const basePrice = BOOKING_CONSTANTS.DEFAULT_PRICE;
  let pricePerTicket = basePrice;
  let discountApplied: BookingPricing['discountApplied'];
  
  // ตรวจสอบส่วนลด (ถ้ามี)
  if (discountCode) {
    const discount = applyDiscountCode(discountCode, ticketCount, travelDate);
    if (discount) {
      pricePerTicket = Math.max(0, basePrice - discount.amount);
      discountApplied = discount;
    }
  }
  
  return {
    pricePerTicket,
    totalPrice: pricePerTicket * ticketCount,
    currency: 'LAK',
    discountApplied
  };
}

/**
 * ใช้รหัสส่วนลด (สำหรับอนาคต)
 */
function applyDiscountCode(
  code: string, 
  ticketCount: number, 
  travelDate: string
): BookingPricing['discountApplied'] | null {
  // TODO: Implement discount code logic
  // ตัวอย่าง:
  // - EARLY_BIRD: ลด 5,000 กีบ ถ้าจองล่วงหน้า 5 วัน
  // - GROUP5: ลด 2,000 กีบ/ตั๋ว ถ้าจอง 5 ตั๋วขึ้นไป
  
  const discountCodes: Record<string, any> = {
    'EARLY_BIRD': {
      type: 'early_booking',
      amount: 5000,
      description: 'ส่วนลดจองล่วงหน้า',
      condition: (ticketCount: number, travelDate: string) => {
        const days = getTravelDateInfo(travelDate).daysFromNow;
        return days >= 5;
      }
    },
    'GROUP5': {
      type: 'group_discount',
      amount: 2000,
      description: 'ส่วนลดกลุ่ม 5 คนขึ้นไป',
      condition: (ticketCount: number) => ticketCount >= 5
    }
  };
  
  const discount = discountCodes[code.toUpperCase()];
  if (discount && discount.condition(ticketCount, travelDate)) {
    return {
      type: discount.type,
      amount: discount.amount,
      description: discount.description
    };
  }
  
  return null;
}

// ====================================
// ✅ Validation Utilities
// ====================================

/**
 * ตรวจสอบข้อมูลการจอง
 */
export function validateBookingData(data: {
  travelDate: string;
  ticketCount: number;
  bookerEmail: string;
  passengerEmails: string[];
  bookerName?: string;
  bookerPhone?: string;
}): BookingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // ตรวจสอบวันที่เดินทาง
  const dateValidation = canBookForDate(data.travelDate);
  errors.push(...dateValidation.errors);
  warnings.push(...dateValidation.warnings);
  
  // ตรวจสอบจำนวนตั๋ว
  if (data.ticketCount < BOOKING_CONSTANTS.MIN_TICKETS) {
    errors.push(`จำนวนตั๋วขั้นต่ำ ${BOOKING_CONSTANTS.MIN_TICKETS} ใบ`);
  }
  if (data.ticketCount > BOOKING_CONSTANTS.MAX_TICKETS) {
    errors.push(`จำนวนตั๋วสูงสุด ${BOOKING_CONSTANTS.MAX_TICKETS} ใบต่อการจอง`);
  }
  
  // ตรวจสอบ Email ผู้จอง
  if (!isValidEmail(data.bookerEmail)) {
    errors.push('Email ผู้จองไม่ถูกต้อง');
  }
  
  // ตรวจสอบจำนวน Email ผู้โดยสาร
  if (data.passengerEmails.length !== data.ticketCount) {
    errors.push(`จำนวน Email ผู้โดยสารต้องเท่ากับจำนวนตั๋ว (${data.ticketCount} อีเมล)`);
  }
  
  // ตรวจสอบ Email ผู้โดยสารแต่ละอัน
  data.passengerEmails.forEach((email, index) => {
    if (!isValidEmail(email)) {
      errors.push(`Email ผู้โดยสารคนที่ ${index + 1} ไม่ถูกต้อง`);
    }
  });
  
  // ตรวจสอบ Email ซ้ำ
  const uniqueEmails = new Set(data.passengerEmails.map(e => e.toLowerCase()));
  if (uniqueEmails.size !== data.passengerEmails.length) {
    errors.push('พบ Email ผู้โดยสารซ้ำกัน');
  }
  
  // ตรวจสอบเบอร์โทร (ถ้ามี)
  if (data.bookerPhone && !isValidPhoneNumber(data.bookerPhone)) {
    warnings.push('รูปแบบเบอร์โทรศัพท์อาจไม่ถูกต้อง');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * ตรวจสอบรูปแบบ Email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * ตรวจสอบรูปแบบเบอร์โทร
 */
export function isValidPhoneNumber(phone: string): boolean {
  // รองรับเบอร์ลาว: +856, 856, 020, 030 ฯลฯ
  const phoneRegex = /^(\+?856|0)[2-9]\d{7,8}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// ====================================
// 🎫 QR Code Utilities
// ====================================

/**
 * สร้างข้อมูล QR Code สำหรับตั๋วจอง
 */
export function generateBookingQRData(ticket: {
  booking_id: string;
  ticket_code: string;
  passenger_order: number;
  passenger_email: string;
  travel_date: string;
  total_passengers: number;
  price: number;
  expires_at: Date;
}): string {
  const qrData: BookingQRData = {
    booking_id: ticket.booking_id,
    ticket_code: ticket.ticket_code,
    passenger_order: ticket.passenger_order,
    passenger_email: ticket.passenger_email,
    travel_date: ticket.travel_date,
    total_passengers: ticket.total_passengers,
    price: ticket.price,
    validation_key: `BT-${ticket.ticket_code}-${ticket.expires_at.getTime()}`,
    expires_at: ticket.expires_at.toISOString(),
    type: 'booking_ticket'
  };
  
  return JSON.stringify(qrData);
}

/**
 * สร้าง QR Code เป็น Data URL
 */
export async function generateQRCodeImage(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('ไม่สามารถสร้าง QR Code ได้');
  }
}

/**
 * ตรวจสอบความถูกต้องของ QR Code ตั๋วจอง
 */
export function validateBookingQR(qrDataString: string): {
  isValid: boolean;
  data?: BookingQRData;
  error?: string;
} {
  try {
    const data: BookingQRData = JSON.parse(qrDataString);
    
    // ตรวจสอบประเภท QR Code
    if (data.type !== 'booking_ticket') {
      return {
        isValid: false,
        error: 'QR Code นี้ไม่ใช่ตั๋วจอง'
      };
    }
    
    // ตรวจสอบฟิลด์ที่จำเป็น
    const requiredFields: (keyof BookingQRData)[] = [
      'booking_id', 'ticket_code', 'passenger_order', 
      'travel_date', 'validation_key', 'expires_at'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return {
          isValid: false,
          error: `ข้อมูล QR Code ไม่ครบถ้วน: ${field}`
        };
      }
    }
    
    // ตรวจสอบวันหมดอายุ
    const expiresAt = new Date(data.expires_at);
    if (isNaN(expiresAt.getTime())) {
      return {
        isValid: false,
        error: 'วันหมดอายุไม่ถูกต้อง'
      };
    }
    
    if (new Date() > expiresAt) {
      return {
        isValid: false,
        error: 'QR Code นี้หมดอายุแล้ว'
      };
    }
    
    // ตรวจสอบรูปแบบ validation key
    const expectedKeyPrefix = `BT-${data.ticket_code}-`;
    if (!data.validation_key.startsWith(expectedKeyPrefix)) {
      return {
        isValid: false,
        error: 'รหัสตรวจสอบไม่ถูกต้อง'
      };
    }
    
    return {
      isValid: true,
      data
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'รูปแบบ QR Code ไม่ถูกต้อง'
    };
  }
}

// ====================================
// 🔢 Utility Functions
// ====================================

/**
 * ฟอร์แมตเงิน
 */
export function formatCurrency(amount: number, currency: string = 'LAK'): string {
  return new Intl.NumberFormat('lo-LA', {
    style: 'currency',
    currency: currency === 'LAK' ? 'LAK' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * ฟอร์แมตวันที่แบบลาว
 */
export function formatDateLao(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date.toLocaleDateString('lo-LA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

/**
 * คำนวณเวลาที่เหลือในรูปแบบอ่านง่าย
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'หมดเวลาแล้ว';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours} ຊົ່ວໂມງ ${minutes} ນາທີ`;
  } else {
    return `${minutes} ນາທີ`;
  }
}

/**
 * สร้างข้อความสรุปการจอง
 */
export function generateBookingSummary(booking: {
  booking_id: string;
  travel_date: string;
  total_tickets: number;
  total_price: number;
  passenger_emails: string[];
}): string {
  const dateInfo = getTravelDateInfo(booking.travel_date);
  const formattedPrice = formatCurrency(booking.total_price);
  
  return `
📋 สรุปการจอง: ${booking.booking_id}

📅 วันเดินทาง: ${formatDateLao(booking.travel_date)} (${dateInfo.dayName})
👥 จำนวนผู้โดยสาร: ${booking.total_tickets} คน
💰 ยอดรวม: ${formattedPrice}

👥 รายชื่อผู้โดยสาร:
${booking.passenger_emails.map((email, index) => 
  `${index + 1}. ${email}`
).join('\n')}
  `.trim();
}