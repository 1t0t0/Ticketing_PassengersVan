// app/dashboard/reports/utils/exportUtils.ts - Unified content with larger fonts

// ฟังก์ชันสร้าง PDF จากเนื้อหาเดียวกับ Print
export const exportToPDF = async (reportData: any, reportType: string) => {
  try {
    // สร้างเนื้อหา HTML เดียวกับการพิมพ์
    const htmlContent = generateUnifiedContent(reportData, reportType);
    
    // สร้าง blob จาก HTML
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    
    // สร้าง URL สำหรับดาวน์โหลด
    const url = window.URL.createObjectURL(blob);
    
    // สร้าง link element สำหรับดาวน์โหลด
    const link = document.createElement('a');
    link.href = url;
    
    // ตั้งชื่อไฟล์ตามประเภทรายงานและวันที่
    const today = new Date();
    const dateStr = today.toLocaleDateString('lo-LA').replace(/\//g, '-');
    const reportTypeName = getReportTypeName(reportType);
    link.download = `${reportTypeName}_${dateStr}.html`;
    
    // เพิ่ม link เข้า DOM, คลิก, แล้วลบออก
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // ล้าง URL object
    window.URL.revokeObjectURL(url);
    
    console.log('Report file downloaded successfully');
    
  } catch (error) {
    console.error('Error exporting report:', error);
    alert('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກລາຍງານ');
  }
};

// ฟังก์ชันพิมพ์เหมือนระบบ ticket sales แต่ขนาดใหญ่ขึ้น
export const printReport = (reportData: any, reportType: string) => {
  try {
    // สร้างเนื้อหา HTML เดียวกับ PDF
    const htmlContent = generateUnifiedContent(reportData, reportType);
    
    // สร้าง iframe สำหรับพิมพ์ (เหมือนระบบ ticket sales)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    // เขียนเนื้อหา HTML ลง iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // รอให้โหลดเสร็จแล้วพิมพ์
      iframe.onload = () => {
        setTimeout(() => {
          try {
            // Focus iframe และพิมพ์
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (error) {
            console.error('Print error:', error);
            // Fallback: ใช้วิธีเปิดหน้าต่างใหม่
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
          
          // ลบ iframe หลังพิมพ์
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

// ฟังก์ชันสร้างเนื้อหาเดียวกันสำหรับทั้ง PDF และ Print (ขนาดใหญ่ขึ้น)
const generateUnifiedContent = (reportData: any, reportType: string) => {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('lo-LA');
  const formatCurrency = (amount: number) => `₭${amount.toLocaleString()}`;
  const getReportTitle = (type: string) => {
    const titles = {
      'summary': 'ສະຫຼຸບລວມ',
      'sales': 'ບົດລາຍງານຍອດຂາຍ', 
      'drivers': 'ບົດລາຍງານຄົນຂັບ',
      'financial': 'ບົດລາຍງານການເງິນ'
    };
    return titles[type as keyof typeof titles] || 'ບົດລາຍງານ';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ບົດລາຍງານ - ${getReportTitle(reportType)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Phetsarath:wght@400;700&display=swap');
        
        * {
          font-family: "Phetsarath", serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body {
          width: 210mm;
          margin: 0;
          padding: 20px;
          background: white;
          font-size: 16px; /* เพิ่มขนาดจาก 12px เป็น 16px */
          line-height: 1.6;
          color: black;
        }
        
        .report-container {
          width: 100%;
          margin: 0;
          padding: 0;
          background: white;
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
        }
        
        .report-title {
          font-size: 28px; /* เพิ่มขนาดจาก 20px */
          font-weight: bold;
          margin-bottom: 8px;
          color: #2563EB;
        }
        
        .report-subtitle {
          font-size: 18px; /* เพิ่มขนาดจาก 14px */
          color: #666;
          margin-bottom: 5px;
        }
        
        .system-name {
          font-size: 16px;
          color: #888;
        }
        
        .period-info {
          background: #f8f9fa;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
          border-radius: 8px;
          border: 2px solid #e9ecef;
          font-size: 18px; /* เพิ่มขนาด */
          font-weight: bold;
        }
        
        .content-section {
          margin: 30px 0;
        }
        
        .section-title {
          font-size: 22px; /* เพิ่มขนาดจาก 16px */
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
          border-bottom: 2px solid #ddd;
          padding-bottom: 8px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        
        .stat-card {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-label {
          font-size: 16px; /* เพิ่มขนาดจาก 12px */
          color: #666;
          margin-bottom: 8px;
          font-weight: bold;
        }
        
        .stat-value {
          font-size: 24px; /* เพิ่มขนาดจาก 18px */
          font-weight: bold;
          color: #2563EB;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 16px; /* เพิ่มขนาดตาราง */
        }
        
        table th, table td {
          border: 2px solid #ddd;
          padding: 12px; /* เพิ่ม padding จาก 8px */
          text-align: left;
        }
        
        table th {
          background: #f1f3f4;
          font-weight: bold;
          font-size: 18px; /* หัวตารางใหญ่ขึ้น */
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
        
        .report-footer {
          margin-top: 40px;
          text-align: center;
          font-size: 14px;
          color: #666;
          border-top: 2px solid #ddd;
          padding-top: 20px;
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
        
        @media print {
          body { 
            margin: 0; 
            padding: 15mm;
          }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">ລະບົບບົດລາຍງານ - ${getReportTitle(reportType)}</div>
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

const generateContentByType = (reportData: any, reportType: string, formatCurrency: any) => {
  switch (reportType) {
    case 'summary':
      return generateSummaryContent(reportData, formatCurrency);
    case 'sales':
      return generateSalesContent(reportData, formatCurrency);
    case 'drivers':
      return generateDriversContent(reportData, formatCurrency);
    case 'financial':
      return generateFinancialContent(reportData, formatCurrency);
    default:
      return '<div class="content-section">ບໍ່ມີຂໍ້ມູນ</div>';
  }
};

const generateSummaryContent = (reportData: any, formatCurrency: any) => {
  const stats = reportData.quickStats || {};
  
  return `
    <div class="content-section">
      <div class="section-title">📊 ສະຫຼຸບລວມ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍ</div>
          <div class="stat-value">${stats.totalTickets || 0}</div>
          <div style="font-size: 14px; color: #888;">ໃບ</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(stats.totalRevenue || 0)}</div>
          <div style="font-size: 14px; color: #888;">ກີບ</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">👥 ຄົນຂັບເຂົ້າວຽກ</div>
          <div class="stat-value">${stats.activeDrivers || 0}</div>
          <div style="font-size: 14px; color: #888;">ຄົນ</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📈 ລາຄາເຊລີ່ຍ</div>
          <div class="stat-value currency">${formatCurrency(stats.avgTicketPrice || 0)}</div>
          <div style="font-size: 14px; color: #888;">ກີບ/ໃບ</div>
        </div>
      </div>
      
      <table>
        <tr class="table-highlight">
          <th style="width: 30%;">ປະເພດ</th>
          <th>ລາຍລະອຽດ</th>
        </tr>
        <tr>
          <td><strong>🎯 ຍອດຂາຍ</strong></td>
          <td>${reportData.sales?.totalTickets || 0} ໃບ (<span class="currency">${formatCurrency(reportData.sales?.totalRevenue || 0)}</span>)</td>
        </tr>
        <tr>
          <td><strong>🚗 ຄົນຂັບ</strong></td>
          <td>${reportData.drivers?.totalDrivers || 0} ຄົນທັງໝົດ, <span class="text-success">${reportData.drivers?.activeDrivers || 0} ຄົນເຂົ້າວຽກ</span></td>
        </tr>
        <tr>
          <td><strong>💼 ການເງິນ</strong></td>
          <td>
            ບໍລິສັດ <span class="currency">${formatCurrency(reportData.financial?.companyShare || 0)}</span> | 
            ສະຖານີ <span class="currency">${formatCurrency(reportData.financial?.stationShare || 0)}</span> | 
            ຄົນຂັບ <span class="currency">${formatCurrency(reportData.financial?.driverShare || 0)}</span>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const generateSalesContent = (reportData: any, formatCurrency: any) => {
  const summary = reportData.summary || {};
  let paymentTable = '';
  
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    const paymentRows = reportData.paymentMethods.map((pm: any) => `
      <tr>
        <td><strong>${pm._id === 'cash' ? '💵 ເງິນສົດ' : '📱 ເງິນໂອນ'}</strong></td>
        <td class="text-center">${pm.count}</td>
        <td class="text-right currency">${formatCurrency(pm.revenue)}</td>
        <td class="text-center">${Math.round((pm.count / summary.totalTickets) * 100)}%</td>
      </tr>
    `).join('');
    
    paymentTable = `
      <table>
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
          <td class="text-right currency">${formatCurrency(summary.totalRevenue)}</td>
          <td class="text-center">100%</td>
        </tr>
      </table>
    `;
  }
  
  return `
    <div class="content-section">
      <div class="section-title">🎯 ບົດລາຍງານຍອດຂາຍ</div>
      
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
      
      ${paymentTable || '<p style="text-align: center; color: #666; font-size: 18px;">ບໍ່ມີຂໍ້ມູນການຊຳລະເງິນ</p>'}
    </div>
  `;
};

const generateDriversContent = (reportData: any, formatCurrency: any) => {
  const summary = reportData.summary || {};
  let driversTable = '';
  
  if (reportData.drivers && reportData.drivers.length > 0) {
    const activeDrivers = reportData.drivers.filter((d: any) => d.totalIncome > 0).slice(0, 15);
    
    if (activeDrivers.length > 0) {
      const driverRows = activeDrivers.map((driver: any, index: number) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td><strong>${driver.name || 'ບໍ່ລະບຸ'}</strong></td>
          <td class="text-center">${driver.employeeId || '-'}</td>
          <td class="text-center">${driver.workDays || 0}</td>
          <td class="text-right currency">${formatCurrency(driver.totalIncome || 0)}</td>
          <td class="text-center">
            <span class="${driver.performance === 'Active' ? 'status-active' : 'status-inactive'}">
              ${driver.performance === 'Active' ? '✅ ເຂົ້າວຽກ' : '❌ ບໍ່ເຂົ້າວຽກ'}
            </span>
          </td>
        </tr>
      `).join('');
      
      driversTable = `
        <table>
          <tr class="table-highlight">
            <th class="text-center">#</th>
            <th>ຊື່</th>
            <th class="text-center">ລະຫັດ</th>
            <th class="text-center">ວັນທຳງານ</th>
            <th class="text-center">ລາຍຮັບ</th>
            <th class="text-center">ສະຖານະ</th>
          </tr>
          ${driverRows}
        </table>
      `;
    }
  }
  
  return `
    <div class="content-section">
      <div class="section-title">👥 ບົດລາຍງານຄົນຂັບ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">👥 ຄົນຂັບທັງໝົດ</div>
          <div class="stat-value">${summary.totalDrivers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🏃 ຄົນຂັບທີ່ທຳງານ</div>
          <div class="stat-value">${summary.workingDriversInPeriod || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບຕໍ່ຄົນ</div>
          <div class="stat-value currency">${formatCurrency(summary.revenuePerDriver || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💵 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(summary.totalIncome || 0)}</div>
        </div>
      </div>
      
      ${driversTable || '<p style="text-align: center; color: #666; font-size: 18px;">ບໍ່ມີຂໍ້ມູນຄົນຂັບທີ່ມີລາຍຮັບໃນຊ່ວງນີ້</p>'}
    </div>
  `;
};

const generateFinancialContent = (reportData: any, formatCurrency: any) => {
  const breakdown = reportData.breakdown || {};
  
  return `
    <div class="content-section">
      <div class="section-title">💼 ບົດລາຍງານການເງິນ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(reportData.summary?.totalRevenue || 0)}</div>
        </div>
      </div>
      
      <table>
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
          <td><strong>👥 ຄົນຂັບ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.driver?.totalAmount || 0)}</td>
          <td class="text-center text-primary"><strong>85%</strong></td>
          <td class="text-center">${breakdown.driver?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr style="background: #f8f9fa; font-weight: bold; font-size: 18px;">
          <td><strong>📊 ລວມທັງໝົດ</strong></td>
          <td class="text-right currency">${formatCurrency(reportData.summary?.totalRevenue || 0)}</td>
          <td class="text-center"><strong>100%</strong></td>
          <td class="text-center">-</td>
        </tr>
      </table>
      
      <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
        <p style="font-size: 16px; margin-bottom: 10px;"><strong>📋 ໝາຍເຫດການແບ່ງລາຍຮັບ:</strong></p>
        <ul style="margin-left: 20px; font-size: 14px;">
          <li>ບໍລິສັດໄດ້ຮັບ <strong>10%</strong> ຈາກລາຍຮັບລວມ</li>
          <li>ສະຖານີໄດ້ຮັບ <strong>5%</strong> ຈາກລາຍຮັບລວມ</li>
          <li>ຄົນຂັບໄດ້ຮັບ <strong>85%</strong> ແບ່ງກັນຕາມຈຳນວນຄົນທີ່ເຂົ້າວຽກ</li>
        </ul>
      </div>
    </div>
  `;
};

// Helper function to get report type name in Lao
const getReportTypeName = (type: string) => {
  const titles = {
    'summary': 'ສະຫຼຸບລວມ',
    'sales': 'ບົດລາຍງານຍອດຂາຍ',
    'drivers': 'ບົດລາຍງານຄົນຂັບ',
    'financial': 'ບົດລາຍງານການເງິນ'
  };
  return titles[type as keyof typeof titles] || 'ບົດລາຍງານ';
};