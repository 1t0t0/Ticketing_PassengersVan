// app/dashboard/reports/utils/exportUtils.ts - แก้ไข TypeScript errors

// ===== TYPE DEFINITIONS =====
interface Period {
  startDate: string;
  endDate: string;
}

interface QuickStats {
  totalTickets?: number;
  totalRevenue?: number;
  activeDrivers?: number;
  avgTicketPrice?: number;
}

interface PaymentMethod {
  _id: string;
  count: number;
  revenue: number;
}

interface CarType {
  carType_name: string;
  count: number;
  activeCars?: number;
}

interface User {
  name: string;
  employeeId: string;
  checkInStatus?: 'checked-in' | 'checked-out';
}

interface Car {
  car_id?: string;
  car_name?: string;
  car_registration?: string;
  carType?: CarType;
  car_capacity?: number;
  user_id?: User;
}

interface Driver {
  name?: string;
  employeeId?: string;
  workDays?: number;
  totalIncome?: number;
  performance?: string;
  lastCheckIn?: string;
  lastCheckOut?: string;
}

interface Staff {
  name?: string;
  employeeId?: string;
  checkInStatus?: 'checked-in' | 'checked-out';
  ticketsSold?: number;
  workDays?: number;
  lastCheckIn?: string;
  lastCheckOut?: string;
}

interface FinancialBreakdownItem {
  totalAmount?: number;
  transactionCount?: number;
}

interface FinancialBreakdown {
  company?: FinancialBreakdownItem;
  station?: FinancialBreakdownItem;
  driver?: FinancialBreakdownItem;
}

interface SummaryData {
  totalTickets?: number;
  totalRevenue?: number;
  averagePrice?: number;
  totalDrivers?: number;
  workingDriversInPeriod?: number;
  revenuePerDriver?: number;
  totalIncome?: number;
  activeDrivers?: number;
  totalCars?: number;
  activeCars?: number;
  totalCarTypes?: number;
  driversWithCars?: number;
  totalStaff?: number;
  activeStaff?: number;
  totalTicketsSold?: number;
  totalWorkDays?: number;
}

interface ReportData {
  period: Period;
  quickStats?: QuickStats;
  summary?: SummaryData;
  paymentMethods?: PaymentMethod[];
  carTypes?: CarType[];
  cars?: Car[];
  drivers?: Driver[];
  staff?: Staff[];
  breakdown?: FinancialBreakdown;
  sales?: SummaryData;
  financial?: FinancialBreakdown;
}

type ReportType = 'summary' | 'sales' | 'drivers' | 'financial' | 'vehicles' | 'staff';

type FormatCurrencyFunction = (amount: number) => string;

// ===== MAIN EXPORT FUNCTIONS =====

// ฟังก์ชันสร้าง PDF จริงโดยใช้ jsPDF
export const exportToPDF = async (reportData: ReportData, reportType: ReportType): Promise<void> => {
  try {
    // Import jsPDF และ html2canvas
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    // สร้างเนื้อหา HTML สำหรับ PDF
    const htmlContent = generatePDFContent(reportData, reportType);
    
    // สร้าง element ชั่วคราวสำหรับ render
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '794px'; // A4 width in pixels (210mm)
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    document.body.appendChild(tempDiv);

    // รอให้ fonts โหลดเสร็จ
    await document.fonts.ready;

    // แปลงเป็น canvas - เอา scale ออกและปรับ options
    const canvas = await html2canvas(tempDiv, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight + 80
    });

    // สร้าง PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // เพิ่มหน้าแรก
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // เพิ่มหน้าถัดไปถ้าเนื้อหายาว
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // ตั้งชื่อไฟล์
    const today = new Date();
    const dateStr = today.toLocaleDateString('lo-LA').replace(/\//g, '-');
    const reportTypeName = getReportTypeName(reportType);
    const fileName = `${reportTypeName}_${dateStr}.pdf`;

    // ดาวน์โหลด PDF
    pdf.save(fileName);

    // ลบ element ชั่วคราว
    document.body.removeChild(tempDiv);
    
    console.log('PDF exported successfully:', fileName);

  } catch (error) {
    console.error('Error exporting PDF:', error);
    
    // Fallback: ใช้วิธี browser print
    try {
      await exportToPDFBrowserFallback(reportData, reportType);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      alert('ເກີດຂໍ້ຜິດພາດໃນການສ້າງ PDF กรุณาลองใหม่อีกครั้ງ');
    }
  }
};

// ฟังก์ชัน fallback ใช้ browser print
const exportToPDFBrowserFallback = async (reportData: ReportData, reportType: ReportType): Promise<void> => {
  const htmlContent = generatePDFContent(reportData, reportType);
  
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // แจ้งให้ผู้ใช้เลือก "Save as PDF"
        alert('กรุณาเลือก "Save as PDF" ใน print dialog');
      }, 500);
    };
  } else {
    throw new Error('Cannot open print window');
  }
};

// ฟังก์ชันพิมพ์เหมือนเดิม
export const printReport = (reportData: ReportData, reportType: ReportType): void => {
  try {
    const htmlContent = generatePDFContent(reportData, reportType);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (error) {
            console.error('Print error:', error);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(htmlContent);
              printWindow.document.close();
              printWindow.onload = () => {
                printWindow.print();
                printWindow.close();
              };
            }
          }
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
        }, 500);
      };
    }
  } catch (error) {
    console.error('Error printing report:', error);
    alert('ເກີດຂໍ້ຜິດພາດໃນການພິມລາຍງານ');
  }
};

// ===== HELPER FUNCTIONS =====

// ฟังก์ชันสร้างเนื้อหา HTML ที่เหมาะสำหรับ PDF
const generatePDFContent = (reportData: ReportData, reportType: ReportType): string => {
  const formatDate = (dateStr: string): string => new Date(dateStr).toLocaleDateString('lo-LA');
  const formatCurrency = (amount: number): string => `₭${amount.toLocaleString()}`;
  const getReportTitle = (type: ReportType): string => {
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ລາຍງານ - ${getReportTitle(reportType)}</title>
      <style>
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
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">ລະບົບລາຍງານ - ${getReportTitle(reportType)}</div>
          <div class="report-subtitle">ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງ</div>
          <div class="system-name">ລົດໄຟ ລາວ-ຈີນ</div>
        </div>
        
        <div class="period-info">
          📅 <strong>ໄລຍະເວລາ:</strong> ${formatDate(reportData.period.startDate)} - ${formatDate(reportData.period.endDate)}
        </div>
        
        ${generateContentByType(reportData, reportType, formatCurrency)}
        
        <div class="report-footer">
          <p><strong>ສ້າງເມື່ອ:</strong> ${new Date().toLocaleString('lo-LA')}</p>
          <p>🚌 ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateContentByType = (reportData: ReportData, reportType: ReportType, formatCurrency: FormatCurrencyFunction): string => {
  switch (reportType) {
    case 'summary':
      return generateSummaryContent(reportData, formatCurrency);
    case 'sales':
      return generateSalesContent(reportData, formatCurrency);
    case 'drivers':
      return generateDriversContent(reportData, formatCurrency);
    case 'financial':
      return generateFinancialContent(reportData, formatCurrency);
    case 'vehicles':
      return generateVehiclesContent(reportData);
    case 'staff':
      return generateStaffContent(reportData);
    default:
      return '<div class="content-section">ບໍ່ມີຂໍ້ມູນ</div>';
  }
};

// ===== CONTENT GENERATORS =====

const generateVehiclesContent = (reportData: ReportData, ): string => {
  const summary = reportData.summary || {};
  const carTypes = reportData.carTypes || [];
  const cars = reportData.cars || [];
  
  let carTypesTable = '';
  if (carTypes.length > 0) {
    const carTypeRows = carTypes.map((type: CarType) => `
      <tr>
        <td><strong>${type.carType_name}</strong></td>
        <td class="text-center">${type.count}</td>
        <td class="text-center">${summary.totalCars ? Math.round((type.count / summary.totalCars) * 100) : 0}%</td>
        <td class="text-center text-success">${type.activeCars || 0}</td>
        <td class="text-center text-danger">${type.count - (type.activeCars || 0)}</td>
      </tr>
    `).join('');
    
    carTypesTable = `
      <table class="no-break">
        <tr class="table-highlight">
          <th>ປະເພດລົດ</th>
          <th class="text-center">ຈຳນວນ</th>
          <th class="text-center">ສັດສ່ວນ</th>
          <th class="text-center">ກຳລັງໃຊ້</th>
          <th class="text-center">ບໍ່ໃຊ້</th>
        </tr>
        ${carTypeRows}
      </table>
    `;
  }

  let carsTable = '';
  if (cars.length > 0) {
    const carRows = cars.slice(0, 15).map((car: Car, index: number) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td class="text-primary"><strong>${car.car_id || 'N/A'}</strong></td>
        <td>${car.car_name || 'N/A'}</td>
        <td class="text-center">${car.car_registration || 'N/A'}</td>
        <td>${car.carType?.carType_name || 'ບໍ່ລະບຸ'}</td>
        <td class="text-center">${car.car_capacity || 0}</td>
        <td>
          ${car.user_id ? `
            <div><strong>${car.user_id.name}</strong></div>
            <div style="font-size: 10px; color: #666;">${car.user_id.employeeId}</div>
          ` : '<span style="color: #999;">ບໍ່ມີພະນັກງານຂັບລົດ</span>'}
        </td>
        <td class="text-center">
          <span class="${car.user_id?.checkInStatus === 'checked-in' ? 'status-active' : 'status-inactive'}">
            ${car.user_id?.checkInStatus === 'checked-in' ? 'ໃຊ້ງານ' : 'ບໍ່ໃຊ້'}
          </span>
        </td>
      </tr>
    `).join('');
    
    carsTable = `
      <table>
        <tr class="table-highlight">
          <th class="text-center">#</th>
          <th>ລະຫັດລົດ</th>
          <th>ຊື່ລົດ</th>
          <th class="text-center">ປ້າຍທະບຽນ</th>
          <th>ປະເພດ</th>
          <th class="text-center">ຄວາມຈຸ</th>
          <th>ພະນັກງານຂັບລົດ</th>
          <th class="text-center">ສະຖານະ</th>
        </tr>
        ${carRows}
      </table>
    `;
  }
  
  return `
    <div class="content-section">
      <div class="section-title">🚗 ລາຍງານຂໍ້ມູນລົດ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">🚛 ລົດທັງໝົດ</div>
          <div class="stat-value">${summary.totalCars || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">✅ ລົດກຳລັງໃຊ້</div>
          <div class="stat-value">${summary.activeCars || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🏷️ ປະເພດລົດ</div>
          <div class="stat-value">${summary.totalCarTypes || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">👨‍✈️ ພະນັກງານຂັບລົດທີ່ມີລົດ</div>
          <div class="stat-value">${summary.driversWithCars || 0}</div>
        </div>
      </div>
      
      <div class="section-title">📋 ລາຍລະອຽດປະເພດລົດ</div>
      ${carTypesTable || '<p style="text-align: center; color: #666;">ບໍ່ມີຂໍ້ມູນປະເພດລົດ</p>'}
      
      <div class="section-title">🚗 ລາຍການລົດ (15 ຄັນທຳອິດ)</div>
      ${carsTable || '<p style="text-align: center; color: #666;">ບໍ່ມີຂໍ້ມູນລົດ</p>'}
    </div>
  `;
};

const generateSummaryContent = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  const stats = reportData.quickStats || {};
  
  return `
    <div class="content-section">
      <div class="section-title">📊 ສະຫຼຸບລວມ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍ</div>
          <div class="stat-value">${stats.totalTickets || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(stats.totalRevenue || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">👥 ພະນັກງານຂັບລົດເຂົ້າວຽກ</div>
          <div class="stat-value">${stats.activeDrivers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📈 ລາຄາເຊລີ່ຍ</div>
          <div class="stat-value currency">${formatCurrency(stats.avgTicketPrice || 0)}</div>
        </div>
      </div>
      
      <table class="no-break">
        <tr class="table-highlight">
          <th style="width: 30%;">ປະເພດ</th>
          <th>ລາຍລະອຽດ</th>
        </tr>
        <tr>
          <td><strong>🎯 ຍອດຂາຍ</strong></td>
          <td>${reportData.sales?.totalTickets || 0} ໃບ (<span class="currency">${formatCurrency(reportData.sales?.totalRevenue || 0)}</span>)</td>
        </tr>
        <tr>
          <td><strong>🚗 ພະນັກງານຂັບລົດ</strong></td>
          <td>${reportData.drivers?.length || 0} ຄົນທັງໝົດ, <span class="text-success">${reportData.summary?.activeDrivers || 0} ຄົນເຂົ້າວຽກ</span></td>
        </tr>
        <tr>
          <td><strong>💼 ການເງິນ</strong></td>
          <td>
            ບໍລິສັດ <span class="currency">${formatCurrency(reportData.financial?.company?.totalAmount || 0)}</span> | 
            ສະຖານີ <span class="currency">${formatCurrency(reportData.financial?.station?.totalAmount || 0)}</span> | 
            ພະນັກງານຂັບລົດ <span class="currency">${formatCurrency(reportData.financial?.driver?.totalAmount || 0)}</span>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const generateSalesContent = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  const summary = reportData.summary || {};
  let paymentTable = '';
  
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    const paymentRows = reportData.paymentMethods.map((pm: PaymentMethod) => `
      <tr>
        <td><strong>${pm._id === 'cash' ? '💵 ເງິນສົດ' : '📱 ເງິນໂອນ'}</strong></td>
        <td class="text-center">${pm.count}</td>
        <td class="text-right currency">${formatCurrency(pm.revenue)}</td>
        <td class="text-center">${summary.totalTickets ? Math.round((pm.count / summary.totalTickets) * 100) : 0}%</td>
      </tr>
    `).join('');
    
    paymentTable = `
      <table class="no-break">
        <tr class="table-highlight">
          <th>ວິທີຊຳລະ</th>
          <th class="text-center">ຈຳນວນ</th>
          <th class="text-center">ລາຍຮັບ</th>
          <th class="text-center">ສັດສ່ວນ</th>
        </tr>
        ${paymentRows}
        <tr style="background: #f8f9fa; font-weight: bold;">
          <td><strong>📊 ລວມທັງໝົດ</strong></td>
          <td class="text-center">${summary.totalTickets}</td>
          <td class="text-right currency">${formatCurrency(summary.totalRevenue || 0)}</td>
          <td class="text-center">100%</td>
        </tr>
      </table>
    `;
  }
  
  return `
    <div class="content-section">
      <div class="section-title">🎯 ລາຍງານຍອດຂາຍ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍ</div>
          <div class="stat-value">${summary.totalTickets || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(summary.totalRevenue || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📈 ລາຄາເຊລີ່ຍ</div>
          <div class="stat-value currency">${formatCurrency(summary.averagePrice || 0)}</div>
        </div>
      </div>
      
      ${paymentTable || '<p style="text-align: center; color: #666;">ບໍ່ມີຂໍ້ມູນການຊຳລະເງິນ</p>'}
    </div>
  `;
};

const generateDriversContent = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  const summary = reportData.summary || {};
  const metadata = reportData.metadata || {};
  
  // แยก drivers ที่มีสิทธิ์ กับ ไม่มีสิทธิ์
  const qualifiedDrivers = (reportData.drivers || []).filter((d: Driver) => (d.totalIncome || 0) > 0);
  const nonQualifiedDrivers = (reportData.drivers || []).filter((d: Driver) => (d.totalIncome || 0) === 0);
  
  // สร้างตารางสำหรับ drivers ที่มีสิทธิ์
  let qualifiedDriversTable = '';
  if (qualifiedDrivers.length > 0) {
    const qualifiedRows = qualifiedDrivers.slice(0, 15).map((driver: Driver, index: number) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><strong>${driver.name || 'ບໍ່ລະບຸ'}</strong></td>
        <td class="text-center">${driver.employeeId || '-'}</td>
        <td class="text-center">${driver.workDays || 0}</td>
        <td class="text-center">
          <span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
            ≥2 ຮອບ ✓
          </span>
        </td>
        <td class="text-right">
          <span style="color: #2e7d32; font-weight: bold; font-size: 14px;">${formatCurrency(driver.totalIncome || 0)}</span>
        </td>
        <td class="text-center">
          <span style="background: #e8f5e8; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
            ມີສິທິ່ຮັບລາຍຮັບ
          </span>
        </td>
        <td class="text-center text-sm">
          ${driver.lastCheckIn 
            ? new Date(driver.lastCheckIn).toLocaleDateString('lo-LA') + '<br>' +
              new Date(driver.lastCheckIn).toLocaleTimeString('lo-LA', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : '-'
          }
        </td>
        <td class="text-center text-sm">
          ${driver.lastCheckOut 
            ? new Date(driver.lastCheckOut).toLocaleDateString('lo-LA') + '<br>' +
              new Date(driver.lastCheckOut).toLocaleTimeString('lo-LA', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : '-'
          }
        </td>
      </tr>
    `).join('');
    
    qualifiedDriversTable = `
      <h3 style="color: #2e7d32; margin: 20px 0 10px 0; font-size: 16px;">
        ✅ ພະນັກງານຂັບລົດທີ່ມີສິທິ່ຮັບລາຍຮັບ (ທຳຄົບ 2 ຮອບ) - ${qualifiedDrivers.length} ຄົນ
      </h3>
      <table>
        <tr class="table-highlight">
          <th class="text-center">#</th>
          <th>ຊື່</th>
          <th class="text-center">ລະຫັດ</th>
          <th class="text-center">ວັນທຳງານ</th>
          <th class="text-center">🎯 ສະຖານະຮອບ</th>
          <th class="text-center">💰 ລາຍຮັບ</th>
          <th class="text-center">ສິທິ່</th>
          <th class="text-center">ເຂົ້າວຽກ (ລ່າສຸດ)</th>
          <th class="text-center">ອອກວຽກ (ລ່າສຸດ)</th>
        </tr>
        ${qualifiedRows}
      </table>
    `;
  }

  // สร้างตารางสำหรับ drivers ที่ไม่มีสิทธิ์
  let nonQualifiedDriversTable = '';
  if (nonQualifiedDrivers.length > 0) {
    const nonQualifiedRows = nonQualifiedDrivers.slice(0, 10).map((driver: Driver, index: number) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><strong>${driver.name || 'ບໍ່ລະບຸ'}</strong></td>
        <td class="text-center">${driver.employeeId || '-'}</td>
        <td class="text-center">${driver.workDays || 0}</td>
        <td class="text-center">
          <span style="background: #ffebee; color: #c62828; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
            &lt;2 ຮອບ ✗
          </span>
        </td>
        <td class="text-center">
          <span style="color: #c62828; font-weight: bold;">₭0</span>
        </td>
        <td class="text-center">
          <span style="background: #ffebee; color: #c62828; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
            ບໍ່ມີສິທິ່
          </span>
        </td>
        <td class="text-center text-sm">
          ${driver.lastCheckIn 
            ? new Date(driver.lastCheckIn).toLocaleDateString('lo-LA') + '<br>' +
              new Date(driver.lastCheckIn).toLocaleTimeString('lo-LA', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : '-'
          }
        </td>
        <td class="text-center text-sm">
          ${driver.lastCheckOut 
            ? new Date(driver.lastCheckOut).toLocaleDateString('lo-LA') + '<br>' +
              new Date(driver.lastCheckOut).toLocaleTimeString('lo-LA', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : '-'
          }
        </td>
      </tr>
    `).join('');
    
    nonQualifiedDriversTable = `
      <h3 style="color: #c62828; margin: 20px 0 10px 0; font-size: 16px;">
        ❌ ພະນັກງານຂັບລົດທີ່ບໍ່ມີສິທິ່ຮັບລາຍຮັບ (ທຳບໍ່ຄົບ 2 ຮອບ) - ${nonQualifiedDrivers.length} ຄົນ
      </h3>
      <table>
        <tr class="table-highlight">
          <th class="text-center">#</th>
          <th>ຊື່</th>
          <th class="text-center">ລະຫັດ</th>
          <th class="text-center">ວັນທຳງານ</th>
          <th class="text-center">🎯 ສະຖານະຮອບ</th>
          <th class="text-center">💰 ລາຍຮັບ</th>
          <th class="text-center">ສິທິ່</th>
          <th class="text-center">ເຂົ້າວຽກ (ລ່າສຸດ)</th>
          <th class="text-center">ອອກວຽກ (ລ່າສຸດ)</th>
        </tr>
        ${nonQualifiedRows}
      </table>
    `;
  }
  
  return `
    <div class="content-section">
      <div class="section-title">👥 ລາຍງານພະນັກງານຂັບລົດ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">👥 ພະນັກງານຂັບລົດທັງໝົດ</div>
          <div class="stat-value">${summary.totalDrivers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🏃 ພະນັກງານຂັບລົດທີ່ທຳງານ</div>
          <div class="stat-value">${summary.workingDriversInPeriod || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🎯 ທີ່ມີສິທິ່ຮັບລາຍຮັບ</div>
          <div class="stat-value">${qualifiedDrivers.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບຕໍ່ຄົນທີ່ມີສິທິ່</div>
          <div class="stat-value currency">${formatCurrency(metadata.revenuePerDriver || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💵 ລາຍຮັບລວມພະນັກງານຂັບລົດ</div>
          <div class="stat-value currency">${formatCurrency(summary.totalIncome || 0)}</div>
        </div>
      </div>
      
      <!-- Summary Revenue Box -->
      <div style="background: linear-gradient(135deg, #e8f5e8 0%, #e3f2fd 100%); border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-bottom: 15px; font-size: 18px;">💰 ສະຫຼຸບລາຍຮັບພະນັກງານຂັບລົດ</h3>
        <table style="width: 100%; border: none;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #2e7d32;">${formatCurrency(summary.totalIncome || 0)}</div>
              <div style="font-size: 12px; color: #666;">ລາຍຮັບລວມ (85%)</div>
            </td>
            <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${qualifiedDrivers.length}</div>
              <div style="font-size: 12px; color: #666;">ທຳຄົບ 2 ຮອບ</div>
            </td>
            <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #7b1fa2;">${formatCurrency(metadata.revenuePerDriver || 0)}</div>
              <div style="font-size: 12px; color: #666;">ລາຍຮັບເຊລີ່ຍຕໍ່ຄົນ</div>
            </td>
            <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${nonQualifiedDrivers.length}</div>
              <div style="font-size: 12px; color: #666;">ບໍ່ມີສິທິ່ຮັບລາຍຮັບ</div>
            </td>
          </tr>
        </table>
      </div>
      
      ${qualifiedDriversTable}
      ${nonQualifiedDriversTable}
      
      <!-- Enhanced explanation box -->
      <div style="margin-top: 20px; padding: 20px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; font-size: 13px;">
        <h4 style="color: #1976d2; margin-bottom: 10px; font-size: 14px;">📋 ເງື່ອນໄຂການຮັບລາຍຮັບສຳລັບພະນັກງານຂັບລົດ:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #1976d2;">
          <li style="margin-bottom: 5px;">ຕ້ອງທຳການເດີນທາງຄົບ <strong>2 ຮອບຕໍ່ວັນ</strong></li>
          <li style="margin-bottom: 5px;">ແຕ່ລະຮອບຕ້ອງມີຜູ້ໂດຍສານ <strong>ອັງນ້ອຍ 80% ຂອງຄວາມຈຸລົດ</strong></li>
          <li style="margin-bottom: 5px;">ລາຍຮັບທັງໝົດ <strong>85%</strong> ຈະຖືກແບ່ງເທົ່າໆກັນລະຫວ່າງພະນັກງານຂັບລົດທີ່ມີສິທິ່</li>
          <li style="margin-bottom: 5px;">ພະນັກງານຂັບລົດທີ່ທຳບໍ່ຄົບ 2 ຮອບ ຈະບໍ່ໄດ້ຮັບລາຍຮັບ</li>
          <li>ຂໍ້ມູນທີ່ສະແດງເປັນຂໍ້ມູນໃນຊ່ວງເວລາທີ່ເລືອກເທົ່ານັ້ນ</li>
        </ul>
      </div>
    </div>
  `;
};

const generateFinancialContent = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  const breakdown = reportData.breakdown || {};
  
  return `
    <div class="content-section">
      <div class="section-title">💼 ລາຍງານການເງິນ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(reportData.summary?.totalRevenue || 0)}</div>
        </div>
      </div>
      
      <table class="no-break">
        <tr class="table-highlight">
          <th style="width: 20%;">ປະເພດ</th>
          <th class="text-center" style="width: 30%;">ມູນຄ່າ</th>
          <th class="text-center" style="width: 20%;">ເປີເຊັນ</th>
          <th class="text-center">ລາຍການ</th>
        </tr>
        <tr>
          <td><strong>🏢 ບໍລິສັດ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.company?.totalAmount || 0)}</td>
          <td class="text-center text-primary"><strong>10%</strong></td>
          <td class="text-center">${breakdown.company?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr>
          <td><strong>🚉 ສະຖານີ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.station?.totalAmount || 0)}</td>
          <td class="text-center text-success"><strong>5%</strong></td>
          <td class="text-center">${breakdown.station?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr>
          <td><strong>👥 ພະນັກງານຂັບລົດ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.driver?.totalAmount || 0)}</td>
          <td class="text-center text-primary"><strong>85%</strong></td>
          <td class="text-center">${breakdown.driver?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr style="background: #f8f9fa; font-weight: bold;">
          <td><strong>📊 ລວມທັງໝົດ</strong></td>
          <td class="text-right currency">${formatCurrency(reportData.summary?.totalRevenue || 0)}</td>
          <td class="text-center"><strong>100%</strong></td>
          <td class="text-center">-</td>
        </tr>
      </table>
    </div>
  `;
};

const generateStaffContent = (reportData: ReportData): string => {
  const summary = reportData.summary || {};
  const staff = reportData.staff || [];
  
  let staffTable = '';
  if (staff.length > 0) {
    const activeStaff = staff.filter((s: Staff) => (s.ticketsSold || 0) > 0 || s.checkInStatus === 'checked-in').slice(0, 15);
    
    if (activeStaff.length > 0) {
      const staffRows = activeStaff.map((member: Staff, index: number) => {
        return `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td><strong>${member.name || 'ບໍ່ລະບຸ'}</strong></td>
            <td class="text-center">${member.employeeId || '-'}</td>
            <td class="text-center">
              <span class="${member.checkInStatus === 'checked-in' ? 'status-active' : 'status-inactive'}">
                ${member.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
              </span>
            </td>
            <td class="text-center currency">${member.ticketsSold || 0}</td>
            <td class="text-center"><strong>${member.workDays || 0} ວັນ</strong></td>
            <td class="text-center text-sm">
              ${member.lastCheckIn 
                ? new Date(member.lastCheckIn).toLocaleDateString('lo-LA') + '<br>' +
                  new Date(member.lastCheckIn).toLocaleTimeString('lo-LA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : '-'
              }
            </td>
            <td class="text-center text-sm">
              ${member.lastCheckOut 
                ? new Date(member.lastCheckOut).toLocaleDateString('lo-LA') + '<br>' +
                  new Date(member.lastCheckOut).toLocaleTimeString('lo-LA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : '-'
              }
            </td>
          </tr>
        `;
      }).join('');
      
      staffTable = `
        <table>
          <tr class="table-highlight">
            <th class="text-center">#</th>
            <th>ຊື່</th>
            <th class="text-center">ລະຫັດ</th>
            <th class="text-center">ສະຖານະ</th>
            <th class="text-center">ປີ້ທີ່ຂາຍ</th>
            <th class="text-center">ວັນທຳງານ</th>
            <th class="text-center">ເຂົ້າວຽກ (ລ່າສຸດ)</th>
            <th class="text-center">ອອກວຽກ (ລ່າສຸດ)</th>
          </tr>
          ${staffRows}
        </table>
      `;
    }
  }
  
  return `
    <div class="content-section">
      <div class="section-title">👥 ລາຍງານພະນັກງານຂາຍປີ້</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">👥 ພະນັກງານທັງໝົດ</div>
          <div class="stat-value">${summary.totalStaff || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">✅ ເຂົ້າວຽກ</div>
          <div class="stat-value">${summary.activeStaff || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍລວມ</div>
          <div class="stat-value">${summary.totalTicketsSold || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📅 ວັນທຳງານລວມ</div>
          <div class="stat-value">${summary.totalWorkDays || 0} ວັນ</div>
        </div>
      </div>
      
      <div class="section-title">👤 ລາຍລະອຽດການປະຕິບັດງານພະນັກງານ</div>
      ${staffTable || '<p style="text-align: center; color: #666;">ບໍ່ມີຂໍ້ມູນພະນັກງານທີ່ເຂົ້າວຽກໃນຊ່ວງນີ້</p>'}
      
      <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; font-size: 12px;">
        <strong>📝 ໝາຍເຫດ:</strong> ຂໍ້ມູນທີ່ສະແດງເປັນຂໍ້ມູນໃນຊ່ວງເວລາທີ່ເລືອກເທົ່ານັ້ນ 
        (ເຂົ້າ-ອອກວຽກແມ່ນຄັ້ງລ່າສຸດໃນຊ່ວງເວລານັ້ນ)
      </div>
    </div>
  `;
};

// Helper function to get report type name in Lao
const getReportTypeName = (type: ReportType): string => {
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