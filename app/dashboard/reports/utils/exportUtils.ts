// app/dashboard/reports/utils/exportUtils.ts
export const exportToPDF = (reportData: any, reportType: string) => {
  try {
    const htmlContent = generatePDFContent(reportData, reportType);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 500);
    };
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ PDF');
  }
};

const generatePDFContent = (reportData: any, reportType: string) => {
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

  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ບົດລາຍງານ - ${getReportTitle(reportType)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Phetsarath:wght@400;700&display=swap');
        
        body {
          font-family: 'Phetsarath', serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #3B82F6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #3B82F6;
          margin: 0;
          font-size: 24px;
        }
        
        .period {
          background: #F3F4F6;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .summary-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        table th, table td {
          border: 1px solid #E5E7EB;
          padding: 8px;
          text-align: left;
        }
        
        table th {
          background: #F9FAFB;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6B7280;
          font-size: 12px;
          border-top: 1px solid #E5E7EB;
          padding-top: 15px;
        }
        
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ລະບົບບົດລາຍງານ - ${getReportTitle(reportType)}</h1>
        <div>ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</div>
      </div>
      
      <div class="period">
        <strong>ໄລຍະເວລາ:</strong> ${formatDate(reportData.period.startDate)} - ${formatDate(reportData.period.endDate)}
      </div>
  `;

  // Generate content based on report type
  switch (reportType) {
    case 'summary':
      content += generateSummaryContent(reportData, formatCurrency);
      break;
    case 'sales':
      content += generateSalesContent(reportData, formatCurrency);
      break;
    case 'drivers':
      content += generateDriversContent(reportData, formatCurrency);
      break;
    case 'financial':
      content += generateFinancialContent(reportData, formatCurrency);
      break;
  }

  content += `
      <div class="footer">
        <p>ສ້າງເມື່ອ: ${new Date().toLocaleString('lo-LA')}</p>
      </div>
    </body>
    </html>
  `;

  return content;
};

const generateSummaryContent = (reportData: any, formatCurrency: (amount: number) => string) => {
  const stats = reportData.quickStats || {};
  
  return `
    <div class="summary-grid">
      <div class="summary-card">
        <div>ປີ້ທີ່ຂາຍ</div>
        <div style="font-size: 20px; font-weight: bold;">${stats.totalTickets || 0}</div>
      </div>
      <div class="summary-card">
        <div>ລາຍຮັບລວມ</div>
        <div style="font-size: 20px; font-weight: bold;">${formatCurrency(stats.totalRevenue || 0)}</div>
      </div>
      <div class="summary-card">
        <div>ຄົນຂັບເຂົ້າວຽກ</div>
        <div style="font-size: 20px; font-weight: bold;">${stats.activeDrivers || 0}</div>
      </div>
      <div class="summary-card">
        <div>ລາຄາເຊລີ່ຍ</div>
        <div style="font-size: 20px; font-weight: bold;">${formatCurrency(stats.avgTicketPrice || 0)}</div>
      </div>
    </div>
  `;
};

const generateSalesContent = (reportData: any, formatCurrency: (amount: number) => string) => {
  return `
    <table>
      <tr>
        <th>ລາຍການ</th>
        <th>ຈຳນວນ/ມູນຄ່າ</th>
      </tr>
      <tr>
        <td>ປີ້ທີ່ຂາຍ</td>
        <td>${reportData.summary?.totalTickets || 0} ໃບ</td>
      </tr>
      <tr>
        <td>ລາຍຮັບລວມ</td>
        <td>${formatCurrency(reportData.summary?.totalRevenue || 0)}</td>
      </tr>
      <tr>
        <td>ລາຄາເຊລີ່ຍ</td>
        <td>${formatCurrency(reportData.summary?.averagePrice || 0)}</td>
      </tr>
    </table>
  `;
};

const generateDriversContent = (reportData: any, formatCurrency: (amount: number) => string) => {
  const summary = reportData.summary || {};
  const metadata = reportData.metadata || {};
  
  return `
    <table>
      <tr>
        <th>ລາຍການ</th>
        <th>ຈຳນວນ</th>
      </tr>
      <tr>
        <td>ຄົນຂັບທັງໝົດ</td>
        <td>${summary.totalDrivers || 0} ຄົນ</td>
      </tr>
      <tr>
        <td>ຄົນຂັບທີ່ທຳງານ</td>
        <td>${summary.workingDriversInPeriod || 0} ຄົນ</td>
      </tr>
      <tr>
        <td>ລາຍຮັບຕໍ່ຄົນ</td>
        <td>${formatCurrency(metadata.revenuePerDriver || 0)}</td>
      </tr>
    </table>
  `;
};

const generateFinancialContent = (reportData: any, formatCurrency: (amount: number) => string) => {
  const breakdown = reportData.breakdown || {};
  
  return `
    <table>
      <tr>
        <th>ປະເພດ</th>
        <th>ມູນຄ່າ</th>
        <th>ເປີເຊັນ</th>
      </tr>
      <tr>
        <td>ບໍລິສັດ</td>
        <td>${formatCurrency(breakdown.company?.totalAmount || 0)}</td>
        <td>10%</td>
      </tr>
      <tr>
        <td>ສະຖານີ</td>
        <td>${formatCurrency(breakdown.station?.totalAmount || 0)}</td>
        <td>5%</td>
      </tr>
      <tr>
        <td>ຄົນຂັບ</td>
        <td>${formatCurrency(breakdown.driver?.totalAmount || 0)}</td>
        <td>85%</td>
      </tr>
    </table>
  `;
};