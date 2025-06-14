// app/dashboard/reports/utils/exportUtils.ts - เวอร์ชันเดียวที่ทำงานได้แน่นอน

// ===== TYPE DEFINITIONS =====
interface Period {
  startDate: string;
  endDate: string;
}

interface QuickStats {
  totalTickets?: number;
  totalRevenue?: number;
  totalPassengers?: number;
  activeDrivers?: number;
  avgTicketPrice?: number;
  avgPricePerPassenger?: number;
  groupTicketPercentage?: number;
  individualTicketPercentage?: number;
}

interface TicketBreakdown {
  individual?: {
    count: number;
    revenue: number;
    passengers: number;
    percentage: number;
  };
  group?: {
    count: number;
    revenue: number;
    passengers: number;
    percentage: number;
    averageGroupSize: number;
  };
}

interface PaymentMethod {
  _id: string;
  count: number;
  revenue: number;
}

interface SummaryData {
  totalTickets?: number;
  totalRevenue?: number;
  totalPassengers?: number;
  averagePrice?: number;
  averagePricePerPassenger?: number;
  ticketBreakdown?: TicketBreakdown;
  [key: string]: any;
}

interface ReportData {
  period: Period;
  quickStats?: QuickStats;
  summary?: SummaryData;
  sales?: SummaryData;
  paymentMethods?: PaymentMethod[];
  [key: string]: any;
}

type ReportType = 'summary' | 'sales' | 'drivers' | 'financial' | 'vehicles' | 'staff';

// ===== HELPER FUNCTIONS =====
const formatDate = (dateStr: string): string => new Date(dateStr).toLocaleDateString('lo-LA');
const formatCurrency = (amount: number): string => `₭${amount.toLocaleString()}`;

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

// ===== MAIN EXPORT FUNCTIONS =====
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
    tempDiv.style.width = '794px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    document.body.appendChild(tempDiv);

    // รอให้ fonts โหลดเสร็จ
    await document.fonts.ready;

    // แปลงเป็น canvas
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
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // เพิ่มหน้าแรก
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // เพิ่มหน้าถัดไป
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // ตั้งชื่อไฟล์และดาวน์โหลด
    const today = new Date();
    const dateStr = today.toLocaleDateString('lo-LA').replace(/\//g, '-');
    const reportTypeName = getReportTypeName(reportType);
    const fileName = `${reportTypeName}_${dateStr}.pdf`;

    pdf.save(fileName);

    // ลบ element ชั่วคราว
    document.body.removeChild(tempDiv);
    
    console.log('PDF exported successfully:', fileName);

  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ PDF');
  }
};

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

// ===== PDF CONTENT GENERATION =====
const generatePDFContent = (reportData: ReportData, reportType: ReportType): string => {
  const styles = generatePDFStyles();
  const header = generatePDFHeader(reportType);
  const footer = generatePDFFooter();
  const periodInfo = generatePeriodInfo(reportData.period.startDate, reportData.period.endDate);
  const content = generateContentByType(reportData, reportType);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ລາຍງານ - ${getReportTypeName(reportType)}</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="report-container">
        ${header}
        ${periodInfo}
        ${content}
        ${footer}
      </div>
    </body>
    </html>
  `;
};

const generatePDFStyles = (): string => {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Noto Sans Lao', 'Arial', sans-serif;
      font-size: 14px; line-height: 1.6; color: #333;
      background: white; padding: 20px;
    }
    
    .report-container { max-width: 100%; margin: 0 auto; background: white; }
    
    .report-header {
      text-align: center; margin-bottom: 30px;
      border-bottom: 3px solid #2563EB; padding-bottom: 20px;
    }
    
    .report-title {
      font-size: 24px; font-weight: bold;
      margin-bottom: 8px; color: #2563EB;
    }
    
    .report-subtitle { font-size: 16px; color: #666; margin-bottom: 5px; }
    .system-name { font-size: 14px; color: #888; }
    
    .period-info {
      background: #f8f9fa; padding: 15px; margin: 20px 0;
      text-align: center; border-radius: 8px; border: 2px solid #e9ecef;
      font-size: 16px; font-weight: bold;
    }
    
    .content-section { margin: 20px 0; }
    
    .section-title {
      font-size: 18px; font-weight: bold; margin-bottom: 15px;
      color: #333; border-bottom: 2px solid #ddd; padding-bottom: 8px;
    }
    
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px; margin: 15px 0;
    }
    
    .stat-card {
      background: #f8f9fa; border: 2px solid #e9ecef;
      border-radius: 8px; padding: 15px; text-align: center;
    }
    
    .stat-label {
      font-size: 12px; color: #666; margin-bottom: 5px; font-weight: bold;
    }
    
    .stat-value { font-size: 18px; font-weight: bold; color: #2563EB; }
    
    table {
      width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px;
    }
    
    table th, table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    
    table th {
      background: #f1f3f4; font-weight: bold; font-size: 13px; color: #333;
    }
    
    .table-highlight { background: #e3f2fd !important; font-weight: bold; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .currency { font-weight: bold; color: #2563EB; }
    
    .report-footer {
      margin-top: 30px; text-align: center; font-size: 12px; color: #666;
      border-top: 2px solid #ddd; padding-top: 15px;
    }
    
    .no-break { page-break-inside: avoid; }
  `;
};

const generatePDFHeader = (reportType: ReportType): string => {
  return `
    <div class="report-header">
      <div class="report-title">ລະບົບລາຍງານ - ${getReportTypeName(reportType)}</div>
      <div class="report-subtitle">ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງ</div>
      <div class="system-name">ລົດໄຟ ລາວ-ຈີນ</div>
    </div>
  `;
};

const generatePDFFooter = (): string => {
  return `
    <div class="report-footer">
      <p><strong>ສ້າງເມື່ອ:</strong> ${new Date().toLocaleString('lo-LA')}</p>
      <p>🚌 ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</p>
    </div>
  `;
};

const generatePeriodInfo = (startDate: string, endDate: string): string => {
  return `
    <div class="period-info">
      📅 <strong>ໄລຍະເວລາ:</strong> ${formatDate(startDate)} - ${formatDate(endDate)}
    </div>
  `;
};

const generateContentByType = (reportData: ReportData, reportType: ReportType): string => {
  switch (reportType) {
    case 'summary':
      return generateSummaryContent(reportData);
    case 'sales':
      return generateSalesContent(reportData);
    case 'financial':
      return generateFinancialContent(reportData);
    default:
      return '<div class="content-section">ບໍ່ມີຂໍ້ມູນ</div>';
  }
};

// ===== CONTENT GENERATORS =====
const generateSummaryContent = (reportData: ReportData): string => {
  const stats = reportData.quickStats || {};
  const sales = reportData.sales || {};
  const ticketBreakdown = sales.ticketBreakdown || {};
  
  return `
    <div class="content-section">
      <div class="section-title">📊 ສະຫຼຸບລວມ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍ</div>
          <div class="stat-value">${stats.totalTickets || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">👥 ຜູ້ໂດຍສານລວມ</div>
          <div class="stat-value">${stats.totalPassengers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(stats.totalRevenue || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">👨‍✈️ ພະນັກງານຂັບລົດເຂົ້າວຽກ</div>
          <div class="stat-value">${stats.activeDrivers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📈 ລາຄາເຊລີ່ຍ/ໃບ</div>
          <div class="stat-value currency">${formatCurrency(stats.avgTicketPrice || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🧮 ລາຄາເຊລີ່ຍ/ຄົນ</div>
          <div class="stat-value currency">${formatCurrency(stats.avgPricePerPassenger || 0)}</div>
        </div>
      </div>
      
      <div class="section-title" style="margin-top: 30px;">🎫 ລາຍລະອຽດປີ້ແຍກປະເພດ</div>
      <table class="no-break">
        <tr class="table-highlight">
          <th style="width: 20%;">ປະເພດປີ້</th>
          <th class="text-center" style="width: 15%;">ຈຳນວນໃບ</th>
          <th class="text-center" style="width: 15%;">ຜູ້ໂດຍສານ</th>
          <th class="text-center" style="width: 20%;">ລາຍຮັບ</th>
          <th class="text-center" style="width: 15%;">ສັດສ່ວນ</th>
          <th class="text-center" style="width: 15%;">ເຊລີ່ຍ/ກະລຸ່ມ</th>
        </tr>
        <tr>
          <td><strong>👤 ປີ້ບຸກຄົນ</strong></td>
          <td class="text-center">${ticketBreakdown.individual?.count || 0}</td>
          <td class="text-center">${ticketBreakdown.individual?.passengers || 0}</td>
          <td class="text-center currency">${formatCurrency(ticketBreakdown.individual?.revenue || 0)}</td>
          <td class="text-center"><strong>${ticketBreakdown.individual?.percentage || 0}%</strong></td>
          <td class="text-center">1 ຄົນ</td>
        </tr>
        <tr>
          <td><strong>👥 ປີ້ກະລຸ່ມ</strong></td>
          <td class="text-center">${ticketBreakdown.group?.count || 0}</td>
          <td class="text-center">${ticketBreakdown.group?.passengers || 0}</td>
          <td class="text-center currency">${formatCurrency(ticketBreakdown.group?.revenue || 0)}</td>
          <td class="text-center"><strong>${ticketBreakdown.group?.percentage || 0}%</strong></td>
          <td class="text-center">${ticketBreakdown.group?.averageGroupSize || 0} ຄົນ</td>
        </tr>
        <tr style="background: #f8f9fa; font-weight: bold;">
          <td><strong>📊 ລວມທັງໝົດ</strong></td>
          <td class="text-center">${stats.totalTickets || 0}</td>
          <td class="text-center">${stats.totalPassengers || 0}</td>
          <td class="text-center currency">${formatCurrency(stats.totalRevenue || 0)}</td>
          <td class="text-center">100%</td>
          <td class="text-center">${stats.totalTickets > 0 ? Math.round((stats.totalPassengers || 0) / stats.totalTickets) : 0} ຄົນ</td>
        </tr>
      </table>
      
      <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; font-size: 12px;">
        <h4 style="color: #1976d2; margin-bottom: 10px; font-size: 14px;">📋 ຂໍ້ມູນປີ້ກະລຸ່ມ:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #1976d2;">
          <li style="margin-bottom: 5px;">ປີ້ກະລຸ່ມ 1 ໃບ ສາມາດມີຜູ້ໂດຍສານ <strong>2-10 ຄົນ</strong></li>
          <li style="margin-bottom: 5px;">ລາຄາປີ້ກະລຸ່ມ = <strong>ລາຄາຕໍ່ຄົນ × ຈຳນວນຜູ້ໂດຍສານ</strong></li>
          <li style="margin-bottom: 5px;">ການນັບຍອດຂາຍ = <strong>ຈຳນວນໃບປີ້</strong> (ບໍ່ແມ່ນຈຳນວນຜູ້ໂດຍສານ)</li>
          <li style="margin-bottom: 5px;">ເຊລີ່ຍຜູ້ໂດຍສານຕໍ່ກະລຸ່ມ = <strong>${ticketBreakdown.group?.averageGroupSize || 0} ຄົນ</strong></li>
          <li>ປີ້ກະລຸ່ມຄິດເປັນ <strong>${stats.groupTicketPercentage || 0}%</strong> ຂອງຍອດຂາຍທັງໝົດ</li>
        </ul>
      </div>
    </div>
  `;
};

const generateSalesContent = (reportData: ReportData): string => {
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

const generateFinancialContent = (reportData: ReportData): string => {
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
          <td class="text-center"><strong>10%</strong></td>
          <td class="text-center">${breakdown.company?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr>
          <td><strong>🚉 ສະຖານີ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.station?.totalAmount || 0)}</td>
          <td class="text-center"><strong>5%</strong></td>
          <td class="text-center">${breakdown.station?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr>
          <td><strong>👥 ພະນັກງານຂັບລົດ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.driver?.totalAmount || 0)}</td>
          <td class="text-center"><strong>85%</strong></td>
          <td class="text-center">${breakdown.driver?.transactionCount || 0} ລາຍການ</td>
        </tr>
      </table>
    </div>
  `;
};