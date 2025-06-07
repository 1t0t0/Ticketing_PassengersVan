// lib/qrCodeUtils.ts - QR Code utilities for Driver Verification
import QRCode from 'qrcode';

export interface TicketQRData {
  ticketNumber: string;
  price: number;
  soldAt: string;
  paymentMethod: string;
  soldBy: string;
  route: string;
  forDriverOnly: boolean;
  validationKey: string;
}

/**
 * สร้างข้อมูล QR Code สำหรับตั๋ว
 * @param ticket ข้อมูลตั๋ว
 * @returns ข้อมูล QR Code ในรูปแบบ JSON string
 */
export function generateTicketQRData(ticket: {
  ticketNumber: string;
  price: number;
  soldAt: Date | string;
  paymentMethod: string;
  soldBy: string;
}): string {
  const soldAtDate = new Date(ticket.soldAt);
  
  const qrData: TicketQRData = {
    ticketNumber: ticket.ticketNumber,
    price: ticket.price,
    soldAt: soldAtDate.toISOString(),
    paymentMethod: ticket.paymentMethod,
    soldBy: ticket.soldBy,
    route: "ສະຖານີລົດໄຟ-ຕົວເມືອງ",
    forDriverOnly: true,
    validationKey: `DRV-${ticket.ticketNumber}-${soldAtDate.getTime()}`
  };
  
  return JSON.stringify(qrData);
}

/**
 * สร้าง QR Code เป็น Data URL
 * @param data ข้อมูลที่จะใส่ใน QR Code
 * @param options ตัวเลือกการสร้าง QR Code
 * @returns Promise ที่ resolve เป็น Data URL
 */
export async function generateQRCodeDataURL(
  data: string,
  options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> {
  const defaultOptions = {
    width: 120,
    margin: 2,
    errorCorrectionLevel: 'M' as const,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    return await QRCode.toDataURL(data, qrOptions);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * สร้าง QR Code เป็น SVG
 * @param data ข้อมูลที่จะใส่ใน QR Code
 * @param options ตัวเลือกการสร้าง QR Code
 * @returns Promise ที่ resolve เป็น SVG string
 */
export async function generateQRCodeSVG(
  data: string,
  options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> {
  const defaultOptions = {
    width: 120,
    margin: 2,
    errorCorrectionLevel: 'M' as const,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    return await QRCode.toString(data, { 
      ...qrOptions, 
      type: 'svg' 
    });
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

/**
 * ตรวจสอบความถูกต้องของข้อมูล QR Code
 * @param qrData ข้อมูล QR Code ที่ decode แล้ว
 * @returns true ถ้าข้อมูลถูกต้อง
 */
export function validateTicketQRData(qrData: string): {
  isValid: boolean;
  data?: TicketQRData;
  error?: string;
} {
  try {
    const parsedData: TicketQRData = JSON.parse(qrData);
    
    // ตรวจสอบว่ามีฟิลด์ที่จำเป็นครบหรือไม่
    const requiredFields: (keyof TicketQRData)[] = [
      'ticketNumber', 'price', 'soldAt', 'paymentMethod', 
      'soldBy', 'route', 'forDriverOnly', 'validationKey'
    ];
    
    for (const field of requiredFields) {
      if (parsedData[field] === undefined || parsedData[field] === null) {
        return {
          isValid: false,
          error: `Missing required field: ${field}`
        };
      }
    }
    
    // ตรวจสอบว่าเป็น QR Code สำหรับ Driver
    if (!parsedData.forDriverOnly) {
      return {
        isValid: false,
        error: 'This QR code is not for driver verification'
      };
    }
    
    // ตรวจสอบรูปแบบ validation key
    const expectedKeyPrefix = `DRV-${parsedData.ticketNumber}-`;
    if (!parsedData.validationKey.startsWith(expectedKeyPrefix)) {
      return {
        isValid: false,
        error: 'Invalid validation key format'
      };
    }
    
    // ตรวจสอบวันที่
    const soldAtDate = new Date(parsedData.soldAt);
    if (isNaN(soldAtDate.getTime())) {
      return {
        isValid: false,
        error: 'Invalid date format'
      };
    }
    
    // ตรวจสอบราคา
    if (typeof parsedData.price !== 'number' || parsedData.price <= 0) {
      return {
        isValid: false,
        error: 'Invalid price'
      };
    }
    
    return {
      isValid: true,
      data: parsedData
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid QR code format'
    };
  }
}

/**
 * สร้าง QR Code สำหรับตั๋วพร้อมตรวจสอบข้อผิดพลาด
 * @param ticket ข้อมูลตั๋ว
 * @param format รูปแบบที่ต้องการ ('dataURL' หรือ 'svg')
 * @returns Promise ที่ resolve เป็น QR Code ในรูปแบบที่ระบุ
 */
export async function generateTicketQRCode(
  ticket: {
    ticketNumber: string;
    price: number;
    soldAt: Date | string;
    paymentMethod: string;
    soldBy: string;
  },
  format: 'dataURL' | 'svg' = 'dataURL',
  options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> {
  try {
    const qrData = generateTicketQRData(ticket);
    
    if (format === 'svg') {
      return await generateQRCodeSVG(qrData, options);
    } else {
      return await generateQRCodeDataURL(qrData, options);
    }
  } catch (error) {
    console.error('Error generating ticket QR code:', error);
    throw new Error(`Failed to generate QR code in ${format} format`);
  }
}

/**
 * Helper function สำหรับ decode QR code จาก canvas หรือ image
 * Note: จำเป็นต้องใช้ library เพิ่มเติมเช่น jsQR สำหรับ decode
 */
export function decodeQRCodeFromImage(imageData: ImageData): string | null {
  // TODO: Implement QR code decoding using jsQR or similar library
  // This would be used in a driver verification app
  console.warn('QR code decoding not implemented yet');
  return null;
}

/**
 * สร้างข้อความแสดงข้อมูลตั๋วจาก QR Code
 * @param qrData ข้อมูล QR Code ที่ validate แล้ว
 * @returns ข้อความแสดงข้อมูลตั๋ว
 */
export function formatTicketInfo(qrData: TicketQRData): string {
  const soldAtDate = new Date(qrData.soldAt);
  const formattedDate = soldAtDate.toLocaleDateString('lo-LA');
  const formattedTime = soldAtDate.toLocaleTimeString('lo-LA', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `
ເລກທີ່ປີ້: ${qrData.ticketNumber}
ລາຄາ: ₭${qrData.price.toLocaleString()}
ວັນທີ່: ${formattedDate}
ເວລາ: ${formattedTime}
ການຊຳລະ: ${qrData.paymentMethod === 'cash' ? 'ເງິນສົດ' : 'ເງິນໂອນ'}
ອອກໂດຍ: ${qrData.soldBy}
ເສັ້ນທາງ: ${qrData.route}
  `.trim();
}