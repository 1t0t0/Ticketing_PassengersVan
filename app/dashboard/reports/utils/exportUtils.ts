// app/dashboard/reports/utils/exportUtils.ts - แก้ไข syntax errors

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
      'financial': 'ບົດລາຍງານການເງິນ',
      'vehicles': 'ບົດລາຍງານຂໍ້ມູນລົດ',
      'staff': 'ບົດລາຍງານພະນັກງານຂາຍປີ້'
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
          font-size: 16px;
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
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #2563EB;
        }
        
        .report-subtitle {
          font-size: 18px;
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
          font-size: 18px;
          font-weight: bold;
        }
        
        .content-section {
          margin: 30px 0;
        }
        
        .section-title {
          font-size: 22px;
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
          font-size: 16px;
          color: #666;
          margin-bottom: 8px;
          font-weight: bold;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #2563EB;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 16px;
        }
        
        table th, table td {
          border: 2px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        
        table th {
          background: #f1f3f4;
          font-weight: bold;
          font-size: 18px;
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
    case 'vehicles':
      return generateVehiclesContent(reportData, formatCurrency);
    case 'staff':
      return generateStaffContent(reportData, formatCurrency);
    default:
      return '<div class="content-section">ບໍ່ມີຂໍ້ມູນ</div>';
  }
};

// เพิ่มฟังก์ชันสำหรับรายงานรถ
const generateVehiclesContent = (reportData: any, formatCurrency: any) => {
  const summary = reportData.summary || {};
  const carTypes = reportData.carTypes || [];
  const cars = reportData.cars || [];
  
  let carTypesTable = '';
  if (carTypes.length > 0) {
    const carTypeRows = carTypes.map((type: any) => `
      <tr>
        <td><strong>${type.carType_name}</strong></td>
        <td class="text-center">${type.count}</td>
        <td class="text-center">${summary.totalCars ? Math.round((type.count / summary.totalCars) * 100) : 0}%</td>
        <td class="text-center text-success">${type.activeCars || 0}</td>
        <td class="text-center text-danger">${type.count - (type.activeCars || 0)}</td>
      </tr>
    `).join('');
    
    carTypesTable = `
      <table>
        <tr class="table-highlight">
          <th>ປະເພດລົດ</th>
          <th class="text-center">ຈຳນວນ</th>
          <th class="text-center">ສັດສ່ວນ</th>
          <th class="text-center">ກຳລັງໃຊ້</th>
          <th class="text-center">ບໍ່ໃຊ້</th>
        </tr>
        ${carTypeRows}
        <tr style="background: #f8f9fa; font-weight: bold;">
          <td><strong>📊 ລວມທັງໝົດ</strong></td>
          <td class="text-center">${summary.totalCars || 0}</td>
          <td class="text-center">100%</td>
          <td class="text-center">${summary.activeCars || 0}</td>
          <td class="text-center">${(summary.totalCars || 0) - (summary.activeCars || 0)}</td>
        </tr>
      </table>
    `;
  }

  let carsTable = '';
  if (cars.length > 0) {
    const carRows = cars.slice(0, 15).map((car: any, index: number) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td class="text-primary"><strong>${car.car_id || 'N/A'}</strong></td>
        <td>${car.car_name || 'N/A'}</td>
        <td class="text-center" style="background: #f0f0f0; font-family: monospace;">${car.car_registration || 'N/A'}</td>
        <td>${car.carType?.carType_name || 'ບໍ່ລະບຸ'}</td>
        <td class="text-center">${car.car_capacity || 0} ຄົນ</td>
        <td>
          ${car.user_id ? `
            <div><strong>${car.user_id.name}</strong></div>
            <div style="font-size: 12px; color: #666;">${car.user_id.employeeId}</div>
          ` : '<span style="color: #999;">ບໍ່ມີຄົນຂັບ</span>'}
        </td>
        <td class="text-center">
          <span class="${car.user_id?.checkInStatus === 'checked-in' ? 'status-active' : 'status-inactive'}">
            ${car.user_id?.checkInStatus === 'checked-in' ? '✅ ກຳລັງໃຊ້' : '❌ ບໍ່ໃຊ້'}
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
          <th>ຄົນຂັບ</th>
          <th class="text-center">ສະຖານະ</th>
        </tr>
        ${carRows}
      </table>
    `;
  }
  
  return `
    <div class="content-section">
      <div class="section-title">🚗 ບົດລາຍງານຂໍ້ມູນລົດ</div>
      
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
          <div class="stat-label">👨‍✈️ ຄົນຂັບທີ່ມີລົດ</div>
          <div class="stat-value">${summary.driversWithCars || 0}</div>
        </div>
      </div>
      
      <div class="section-title">📋 ລາຍລະອຽດປະເພດລົດ</div>
      ${carTypesTable || '<p style="text-align: center; color: #666; font-size: 18px;">ບໍ່ມີຂໍ້ມູນປະເພດລົດ</p>'}
      
      <div class="section-title">🚗 ລາຍການລົດ (15 ຄັນທຳອິດ)</div>
      ${carsTable || '<p style="text-align: center; color: #666; font-size: 18px;">ບໍ່ມີຂໍ້ມູນລົດ</p>'}
    </div>
  `;
};

// เพิ่มฟังก์ชันสำหรับรายงานพนักงาน
const generateStaffContent = (reportData: any, formatCurrency: any) => {
  const summary = reportData.summary || {};
  const staff = reportData.staff || [];
  
  let staffTable = '';
  if (staff.length > 0) {
    const activeStaff = staff.filter((s: any) => s.ticketsSold > 0 || s.checkInStatus === 'checked-in').slice(0, 15);
    
    if (activeStaff.length > 0) {
      const staffRows = activeStaff.map((member: any, index: number) => {
        const performance = getPerformanceLevel(member.ticketsSold || 0, summary.averageTicketsPerStaff || 0);
        return `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td><strong>${member.name || 'ບໍ່ລະບຸ'}</strong></td>
            <td class="text-center">${member.employeeId || '-'}</td>
            <td class="text-center">
              <span class="${member.checkInStatus === 'checked-in' ? 'status-active' : 'status-inactive'}">
                ${member.checkInStatus === 'checked-in' ? '✅ ເຂົ້າວຽກ' : '❌ ອອກວຽກ'}
              </span>
            </td>
            <td class="text-center currency">${member.ticketsSold || 0}</td>
            <td class="text-center">${member.workHours ? `${Math.round(member.workHours)}h` : '0h'}</td>
            <td class="text-center">${member.workHours > 0 ? Math.round((member.ticketsSold || 0) / member.workHours) : 0}</td>
            <td class="text-center" style="font-size: 12px;">
              ${member.lastCheckIn ? new Date(member.lastCheckIn).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }) : '-'}
            </td>
            <td class="text-center" style="font-size: 12px;">
              ${member.lastCheckOut ? new Date(member.lastCheckOut).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }) : '-'}
            </td>
            <td class="text-center">
              <span class="${performance.color}">
                ${performance.label}
              </span>
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
            <th class="text-center">ຊົ່ວໂມງ</th>
            <th class="text-center">ປີ້/ຊົ່ວໂມງ</th>
            <th class="text-center">ເຂົ້າວຽກ</th>
            <th class="text-center">ອອກວຽກ</th>
            <th class="text-center">ການປະຕິບັດ</th>
          </tr>
          ${staffRows}
        </table>
      `;
    }
  }
  
  return `
    <div class="content-section">
      <div class="section-title">👥 ບົດລາຍງານພະນັກງານຂາຍປີ້</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">👥 ພະນັກງານທັງໝົດ</div>
          <div class="stat-value">${summary.totalStaff || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">✅ ເຂົ້າວຽກວັນນີ້</div>
          <div class="stat-value">${summary.activeStaff || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍລວມ</div>
          <div class="stat-value">${summary.totalTicketsSold || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">⏰ ຊົ່ວໂມງທຳງານ</div>
          <div class="stat-value">${summary.totalWorkHours || 0}h</div>
        </div>
      </div>
      
      <div class="content-section">
        <div class="section-title">📊 ພາບລວມການປະຕິບັດງານ</div>
        <table>
          <tr class="table-highlight">
            <th style="width: 33%;">ປີ້ຕໍ່ຄົນເຊລີ່ຍ</th>
            <th style="width: 33%;">ປີ້ສູງສຸດ</th>
            <th style="width: 34%;">ຊົ່ວໂມງເຊລີ່ຍ</th>
          </tr>
          <tr>
            <td class="text-center currency" style="font-size: 20px; font-weight: bold;">${summary.averageTicketsPerStaff || 0}</td>
            <td class="text-center text-success" style="font-size: 20px; font-weight: bold;">${summary.topPerformerTickets || 0}</td>
            <td class="text-center text-primary" style="font-size: 20px; font-weight: bold;">${Math.round(summary.averageWorkHours || 0)}h</td>
          </tr>
        </table>
      </div>
      
      <div class="section-title">👤 ລາຍລະອຽດການປະຕິບັດງານພະນັກງານ</div>
      ${staffTable || '<p style="text-align: center; color: #666; font-size: 18px;">ບໍ່ມີຂໍ້ມູນພະນັກງານທີ່ເຂົ້າວຽກໃນຊ່ວງນີ້</p>'}
    </div>
  `;
};

// Helper function สำหรับ performance level
const getPerformanceLevel = (ticketsSold: number, average: number) => {
  if (ticketsSold >= average * 1.5) {
    return {
      label: 'ດີເລີດ',
      color: 'text-success'
    };
  } else if (ticketsSold >= average) {
    return {
      label: 'ດີ',
      color: 'text-primary'
    };
  } else if (ticketsSold >= average * 0.5) {
    return {
      label: 'ປົກກະຕິ',
      color: 'text-warning'
    };
  } else {
    return {
      label: 'ຕ້ອງປັບປຸງ',
      color: 'text-danger'
    };
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
    'financial': 'ບົດລາຍງານການເງິນ',
    'vehicles': 'ບົດລາຍງານຂໍ້ມູນລົດ',
    'staff': 'ບົດລາຍງານພະນັກງານຂາຍປີ້'
  };
  return titles[type as keyof typeof titles] || 'ບົດລາຍງານ';
};