// app/dashboard/reports/utils/helpers.ts - Helper functions สำหรับ export

import { ReportType, FormatCurrencyFunction } from './types';

/**
 * แปลงวันที่เป็นรูปแบบที่อ่านได้
 */
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('lo-LA');
};

/**
 * แปลงตัวเลขเป็นรูปแบบเงินตรา
 */
export const formatCurrency: FormatCurrencyFunction = (amount: number): string => {
  return `₭${amount.toLocaleString()}`;
};

/**
 * แปลง ReportType เป็นชื่อภาษาลาว
 */
export const getReportTypeName = (type: ReportType): string => {
  const titles: Record<ReportType, string> = {
    'summary': 'ສະຫຼຸບລວມ',
    'sales': 'ລາຍງານຍອດຂາຍ',
    'drivers': 'ລາຍງານພະນັກງານຂັບລົດ',
    'financial': 'ລາຍງານການເງິນ',
    'vehicles': 'ລາຍງານຂໍ້ມູນລົດ',
    'staff': 'ລາຍງານພະນັກງານຂາຍປີ້'
  };
  return titles[type];
};

/**
 * แปลง ReportType เป็นชื่อไฟล์
 */
export const getReportFileName = (reportType: ReportType): string => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('lo-LA').replace(/\//g, '-');
  const reportTypeName = getReportTypeName(reportType);
  return `${reportTypeName}_${dateStr}.pdf`;
};

/**
 * สร้าง CSS styles สำหรับ PDF
 */
export const generatePDFStyles = (): string => {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Lao', 'Arial', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 20px;
    }
    
    .report-container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
    }
    
    .report-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2563EB;
      padding-bottom: 20px;
    }
    
    .report-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #2563EB;
    }
    
    .report-subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .system-name {
      font-size: 14px;
      color: #888;
    }
    
    .period-info {
      background: #f8f9fa;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
      border-radius: 8px;
      border: 2px solid #e9ecef;
      font-size: 16px;
      font-weight: bold;
    }
    
    .content-section {
      margin: 20px 0;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #333;
      border-bottom: 2px solid #ddd;
      padding-bottom: 8px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin: 15px 0;
    }
    
    .stat-card {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .stat-value {
      font-size: 18px;
      font-weight: bold;
      color: #2563EB;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12px;
    }
    
    table th, table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    table th {
      background: #f1f3f4;
      font-weight: bold;
      font-size: 13px;
      color: #333;
    }
    
    .table-highlight {
      background: #e3f2fd !important;
      font-weight: bold;
    }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-success { color: #28a745; }
    .text-danger { color: #dc3545; }
    .text-primary { color: #2563EB; }
    .text-warning { color: #ffc107; }
    
    .report-footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 2px solid #ddd;
      padding-top: 15px;
    }
    
    .currency {
      font-weight: bold;
      color: #2563EB;
    }
    
    .status-active {
      color: #28a745;
      font-weight: bold;
    }
    
    .status-inactive {
      color: #dc3545;
      font-weight: bold;
    }
    
    .no-break {
      page-break-inside: avoid;
    }
  `;
};

/**
 * สร้าง header สำหรับ PDF
 */
export const generatePDFHeader = (reportType: ReportType): string => {
  return `
    <div class="report-header">
      <div class="report-title">ລະບົບລາຍງານ - ${getReportTypeName(reportType)}</div>
      <div class="report-subtitle">ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງ</div>
      <div class="system-name">ລົດໄຟ ລາວ-ຈີນ</div>
    </div>
  `;
};

/**
 * สร้าง footer สำหรับ PDF
 */
export const generatePDFFooter = (): string => {
  return `
    <div class="report-footer">
      <p><strong>ສ້າງເມື່ອ:</strong> ${new Date().toLocaleString('lo-LA')}</p>
      <p>🚌 ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</p>
    </div>
  `;
};

/**
 * สร้างข้อมูลช่วงเวลาสำหรับ PDF
 */
export const generatePeriodInfo = (startDate: string, endDate: string): string => {
  return `
    <div class="period-info">
      📅 <strong>ໄລຍະເວລາ:</strong> ${formatDate(startDate)} - ${formatDate(endDate)}
    </div>
  `;
};