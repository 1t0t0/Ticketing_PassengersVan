// app/dashboard/reports/page.tsx - Enhanced with working PDF export
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { 
  FiCalendar, 
  FiDownload, 
  FiUsers,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
  FiCreditCard,
  FiBarChart,
  FiFileText,
  FiPrinter
} from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ReportData {
  type: string;
  period: { startDate: string; endDate: string };
  summary: any;
  [key: string]: any;
}

// PDF Export utility functions
const generatePDFContent = (reportData: ReportData, reportType: string) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('lo-LA');
  };

  const formatCurrency = (amount: number) => {
    return `₭${amount.toLocaleString()}`;
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
        
        .header .subtitle {
          color: #666;
          margin: 5px 0;
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
        
        .summary-card .title {
          font-size: 12px;
          color: #64748B;
          margin-bottom: 5px;
        }
        
        .summary-card .value {
          font-size: 20px;
          font-weight: bold;
          color: #1E293B;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section h2 {
          color: #374151;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 10px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        table th,
        table td {
          border: 1px solid #E5E7EB;
          padding: 8px;
          text-align: left;
        }
        
        table th {
          background: #F9FAFB;
          font-weight: bold;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
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
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ລະບົບບົດລາຍງານ - ${getReportTitle(reportType)}</h1>
        <div class="subtitle">ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</div>
      </div>
      
      <div class="period">
        <strong>ໄລຍະເວລາ:</strong> ${formatDate(reportData.period.startDate)} - ${formatDate(reportData.period.endDate)}
      </div>
  `;

  // Generate content based on report type
  switch (reportType) {
    case 'summary':
      content += generateSummaryPDFContent(reportData, formatCurrency);
      break;
    case 'sales':
      content += generateSalesPDFContent(reportData, formatCurrency);
      break;
    case 'drivers':
      content += generateDriversPDFContent(reportData, formatCurrency);
      break;
    case 'financial':
      content += generateFinancialPDFContent(reportData, formatCurrency);
      break;
  }

  content += `
      <div class="footer">
        <p>ສ້າງເມື່ອ: ${new Date().toLocaleString('lo-LA')}</p>
        <p>ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</p>
      </div>
    </body>
    </html>
  `;

  return content;
};

const generateSummaryPDFContent = (reportData: any, formatCurrency: (amount: number) => string) => {
  const stats = reportData.quickStats || {};
  
  return `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="title">ປີ້ທີ່ຂາຍ</div>
        <div class="value">${stats.totalTickets || 0}</div>
      </div>
      <div class="summary-card">
        <div class="title">ລາຍຮັບລວມ</div>
        <div class="value">${formatCurrency(stats.totalRevenue || 0)}</div>
      </div>
      <div class="summary-card">
        <div class="title">ຄົນຂັບເຂົ້າວຽກ</div>
        <div class="value">${stats.activeDrivers || 0}</div>
      </div>
      <div class="summary-card">
        <div class="title">ລາຄາເຊລີ່ຍ</div>
        <div class="value">${formatCurrency(stats.avgTicketPrice || 0)}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>ສະຫຼຸບລາຍລະອຽດ</h2>
      <table>
        <tr>
          <th>ປະເພດ</th>
          <th class="text-right">ຈຳນວນ/ມູນຄ່າ</th>
        </tr>
        <tr>
          <td>ຍອດຂາຍທັງໝົດ</td>
          <td class="text-right">${reportData.sales?.totalTickets || 0} ປີ້</td>
        </tr>
        <tr>
          <td>ລາຍຮັບຍອດຂາຍ</td>
          <td class="text-right">${formatCurrency(reportData.sales?.totalRevenue || 0)}</td>
        </tr>
        <tr>
          <td>ຄົນຂັບທັງໝົດ</td>
          <td class="text-right">${reportData.drivers?.totalDrivers || 0} ຄົນ</td>
        </tr>
        <tr>
          <td>ຄົນຂັບເຂົ້າວຽກ</td>
          <td class="text-right">${reportData.drivers?.activeDrivers || 0} ຄົນ</td>
        </tr>
        <tr>
          <td>ສ່ວນແບ່ງຄົນຂັບ (85%)</td>
          <td class="text-right">${formatCurrency(reportData.financial?.driverShare || 0)}</td>
        </tr>
      </table>
    </div>
  `;
};

const generateSalesPDFContent = (reportData: any, formatCurrency: (amount: number) => string) => {
  return `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="title">ປີ້ທີ່ຂາຍ</div>
        <div class="value">${reportData.summary?.totalTickets || 0}</div>
      </div>
      <div class="summary-card">
        <div class="title">ລາຍຮັບລວມ</div>
        <div class="value">${formatCurrency(reportData.summary?.totalRevenue || 0)}</div>
      </div>
      <div class="summary-card">
        <div class="title">ລາຄາເຊລີ່ຍ</div>
        <div class="value">${formatCurrency(reportData.summary?.averagePrice || 0)}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>ການຊຳລະເງິນ</h2>
      <table>
        <tr>
          <th>ວິທີການຊຳລະ</th>
          <th class="text-center">ຈຳນວນ</th>
          <th class="text-right">ລາຍຮັບ</th>
        </tr>
        ${(reportData.paymentMethods || []).map((pm: any) => `
          <tr>
            <td>${pm._id === 'cash' ? 'ເງິນສົດ' : pm._id === 'qr' ? 'ເງິນໂອນ' : pm._id}</td>
            <td class="text-center">${pm.count}</td>
            <td class="text-right">${formatCurrency(pm.revenue || 0)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
    
    <div class="section">
      <h2>ຍອດຂາຍລາຍຊົ່ວໂມງ</h2>
      <table>
        <tr>
          <th>ເວລາ</th>
          <th class="text-center">ຈຳນວນປີ້</th>
          <th class="text-right">ລາຍຮັບ</th>
        </tr>
        ${(reportData.hourlySales || []).map((hour: any) => `
          <tr>
            <td>${hour._id}:00</td>
            <td class="text-center">${hour.count}</td>
            <td class="text-right">${formatCurrency(hour.revenue || 0)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
};

const generateDriversPDFContent = (reportData: any, formatCurrency: (amount: number) => string) => {
  const summary = reportData.summary || {};
  const metadata = reportData.metadata || {};
  
  return `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="title">ຄົນຂັບທັງໝົດ</div>
        <div class="value">${summary.totalDrivers || 0}</div>
      </div>
      <div class="summary-card">
        <div class="title">ຄົນຂັບທີ່ທຳງານ</div>
        <div class="value">${summary.workingDriversInPeriod || 0}</div>
      </div>
      <div class="summary-card">
        <div class="title">ວັນທຳວຽກລວມ</div>
        <div class="value">${summary.totalWorkDays || 0}</div>
      </div>
      <div class="summary-card">
        <div class="title">ລາຍຮັບຕໍ່ຄົນ</div>
        <div class="value">${formatCurrency(metadata.revenuePerDriver || 0)}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>ການຄິດໄລ່ລາຍຮັບ</h2>
      <table>
        <tr>
          <th>ລາຍການ</th>
          <th class="text-right">ມູນຄ່າ</th>
        </tr>
        <tr>
          <td>ລາຍຮັບລວມ</td>
          <td class="text-right">${formatCurrency(metadata.totalRevenue || 0)}</td>
        </tr>
        <tr>
          <td>ສ່ວນແບ່ງຄົນຂັບ (85%)</td>
          <td class="text-right">${formatCurrency(summary.totalIncome || 0)}</td>
        </tr>
        <tr>
          <td>ຄົນຂັບທີ່ທຳງານ</td>
          <td class="text-right">${metadata.workingDriversCount || 0} ຄົນ</td>
        </tr>
        <tr>
          <td><strong>ລາຍຮັບຕໍ່ຄົນ</strong></td>
          <td class="text-right"><strong>${formatCurrency(metadata.revenuePerDriver || 0)}</strong></td>
        </tr>
      </table>
    </div>
    
    <div class="section">
      <h2>ລາຍລະອຽດຄົນຂັບ (20 ອັນດັບແຮກ)</h2>
      <table>
        <tr>
          <th>ຊື່</th>
          <th>ລະຫັດ</th>
          <th class="text-center">ສະຖານະ</th>
          <th class="text-center">ວັນທຳງານ</th>
          <th class="text-right">ລາຍຮັບ (KIP)</th>
        </tr>
        ${(reportData.drivers || []).slice(0, 20).map((driver: any) => `
          <tr>
            <td>${driver.name || 'N/A'}</td>
            <td>${driver.employeeId || 'N/A'}</td>
            <td class="text-center">${driver.performance === 'Active' ? 'ເຂົ້າວຽກ' : 'ບໍ່ເຂົ້າວຽກ'}</td>
            <td class="text-center">${driver.workDays || 0}</td>
            <td class="text-right">${formatCurrency(driver.totalIncome || 0)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
};

const generateFinancialPDFContent = (reportData: any, formatCurrency: (amount: number) => string) => {
  const breakdown = reportData.breakdown || {};
  
  return `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="title">ລາຍຮັບລວມ</div>
        <div class="value">${formatCurrency(reportData.summary?.totalRevenue || 0)}</div>
      </div>
      <div class="summary-card">
        <div class="title">ບໍລິສັດ (10%)</div>
        <div class="value">${formatCurrency(reportData.summary?.companyShare || 0)}</div>
      </div>
      <div class="summary-card">
        <div class="title">ສະຖານີ (5%)</div>
        <div class="value">${formatCurrency(reportData.summary?.stationShare || 0)}</div>
      </div>
      <div class="summary-card">
        <div class="title">ຄົນຂັບ (85%)</div>
        <div class="value">${formatCurrency(reportData.summary?.driverShare || 0)}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>ລາຍລະອຽດການແບ່ງລາຍຮັບ</h2>
      <table>
        <tr>
          <th>ປະເພດ</th>
          <th class="text-center">ຈຳນວນລາຍການ</th>
          <th class="text-right">ມູນຄ່າ</th>
          <th class="text-right">ເປີເຊັນ</th>
        </tr>
        <tr>
          <td>ບໍລິສັດ</td>
          <td class="text-center">${breakdown.company?.transactionCount || 0}</td>
          <td class="text-right">${formatCurrency(breakdown.company?.totalAmount || 0)}</td>
          <td class="text-right">10%</td>
        </tr>
        <tr>
          <td>ສະຖານີ</td>
          <td class="text-center">${breakdown.station?.transactionCount || 0}</td>
          <td class="text-right">${formatCurrency(breakdown.station?.totalAmount || 0)}</td>
          <td class="text-right">5%</td>
        </tr>
        <tr>
          <td>ຄົນຂັບ</td>
          <td class="text-center">${breakdown.driver?.transactionCount || 0}</td>
          <td class="text-right">${formatCurrency(breakdown.driver?.totalAmount || 0)}</td>
          <td class="text-right">85%</td>
        </tr>
        <tr style="background: #F3F4F6; font-weight: bold;">
          <td>ລວມທັງໝົດ</td>
          <td class="text-center">${(breakdown.company?.transactionCount || 0) + (breakdown.station?.transactionCount || 0) + (breakdown.driver?.transactionCount || 0)}</td>
          <td class="text-right">${formatCurrency(reportData.summary?.totalRevenue || 0)}</td>
          <td class="text-right">100%</td>
        </tr>
      </table>
    </div>
  `;
};

const getReportTitle = (reportType: string) => {
  const titles = {
    'summary': 'ສະຫຼຸບລວມ',
    'sales': 'ບົດລາຍງານຍອດຂາຍ',
    'drivers': 'ບົດລາຍງານຄົນຂັບ',
    'financial': 'ບົດລາຍງານການເງິນ'
  };
  return titles[reportType as keyof typeof titles] || 'ບົດລາຍງານ';
};

const exportToPDF = (reportData: ReportData, reportType: string) => {
  try {
    const htmlContent = generatePDFContent(reportData, reportType);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups for this site.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        
        // Close window after printing (optional)
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    };
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ PDF: ' + (error as Error).message);
  }
};

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [selectedReport, setSelectedReport] = useState('summary');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchReport();
  }, [status, selectedReport, selectedPeriod, startDate, endDate]);

  const reportTypes = [
    { id: 'summary', title: 'ສະຫຼຸບລວມ', icon: <FiBarChart />, description: 'ພາບລວມສະຖິຕິ' },
    { id: 'sales', title: 'ຍອດຂາຍ', icon: <FiCreditCard />, description: 'ສະຫຼຸບຍອດຂາຍ' },
    { id: 'drivers', title: 'ຄົນຂັບ', icon: <FiUsers />, description: 'ສະຖິຕິຄົນຂັບ' },
    { id: 'financial', title: 'ການເງິນ', icon: <FiDollarSign />, description: 'ແບ່ງລາຍຮັບ' }
  ];

  const timeRanges = [
    { value: 'today', label: 'ມື້ນີ້' },
    { value: 'yesterday', label: 'ມື້ວານ' },
    { value: 'thisWeek', label: 'ອາທິດນີ້' },
    { value: 'thisMonth', label: 'ເດືອນນີ້' },
    { value: 'custom', label: 'ກຳນົດເອງ' }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      let actualStartDate = startDate;
      let actualEndDate = endDate;

      if (selectedPeriod !== 'custom') {
        const today = new Date();
        switch (selectedPeriod) {
          case 'today':
            actualStartDate = actualEndDate = today.toISOString().split('T')[0];
            break;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            actualStartDate = actualEndDate = yesterday.toISOString().split('T')[0];
            break;
          case 'thisWeek':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            actualStartDate = weekStart.toISOString().split('T')[0];
            actualEndDate = today.toISOString().split('T')[0];
            break;
          case 'thisMonth':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            actualStartDate = monthStart.toISOString().split('T')[0];
            actualEndDate = today.toISOString().split('T')[0];
            break;
        }
      }

      const response = await fetch(
        `/api/reports?type=${selectedReport}&startDate=${actualStartDate}&endDate=${actualEndDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (reportData) {
      exportToPDF(reportData, selectedReport);
    } else {
      alert('ບໍ່ມີຂໍ້ມູນບົດລາຍງານສຳລັບສົ່ງອອກ');
    }
  };

  const renderSummaryReport = () => {
    if (!reportData?.quickStats) return null;
    const stats = reportData.quickStats;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiCreditCard className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">ປີ້ທີ່ຂາຍ</p>
                <p className="text-xl font-bold text-blue-900">{stats.totalTickets}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiDollarSign className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600">ລາຍຮັບລວມ</p>
                <p className="text-xl font-bold text-green-900">₭{stats.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiUsers className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-600">ຄົນຂັບເຂົ້າວຽກ</p>
                <p className="text-xl font-bold text-purple-900">{stats.activeDrivers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-6 w-6 text-orange-600 mr-2">📊</div>
              <div>
                <p className="text-sm text-orange-600">ລາຄາເຊລີ່ຍ</p>
                <p className="text-xl font-bold text-orange-900">₭{stats.avgTicketPrice?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NeoCard className="p-4">
            <h3 className="text-lg font-semibold mb-3">ຍອດຂາຍ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ປີ້ທັງໝົດ:</span>
                <span className="font-semibold">{reportData.sales?.totalTickets || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>ລາຍຮັບ:</span>
                <span className="font-semibold">₭{reportData.sales?.totalRevenue?.toLocaleString() || 0}</span>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-4">
            <h3 className="text-lg font-semibold mb-3">ຄົນຂັບ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ທັງໝົດ:</span>
                <span className="font-semibold">{reportData.drivers?.totalDrivers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>ເຂົ້າວຽກ:</span>
                <span className="font-semibold">{reportData.drivers?.activeDrivers || 0}</span>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-4">
            <h3 className="text-lg font-semibold mb-3">ການເງິນ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ລາຍຮັບລວມ:</span>
                <span className="font-semibold">₭{reportData.financial?.totalRevenue?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>ສ່ວນແບ່ງຄົນຂັບ:</span>
                <span className="font-semibold">₭{reportData.financial?.driverShare?.toLocaleString() || 0}</span>
              </div>
            </div>
          </NeoCard>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    if (!reportData?.paymentMethods) return null;

    const paymentData = {
      labels: reportData.paymentMethods.map((pm: any) => 
        pm._id === 'cash' ? 'ເງິນສົດ' : pm._id === 'qr' ? 'ເງິນໂອນ' : pm._id
      ),
      datasets: [{
        data: reportData.paymentMethods.map((pm: any) => pm.count),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      }]
    };

    const hourlyData = {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'ຈຳນວນປີ້',
        data: Array.from({length: 24}, (_, i) => {
          const hourData = reportData.hourlySales?.find((h: any) => h._id === i);
          return hourData ? hourData.count : 0;
        }),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }]
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NeoCard className="p-4">
            <h3 className="text-lg font-semibold mb-3">ການຊຳລະເງິນ</h3>
            <div className="h-48">
              <Doughnut data={paymentData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>

          <NeoCard className="p-4">
            <h3 className="text-lg font-semibold mb-3">ຍອດຂາຍລາຍຊົ່ວໂມງ</h3>
            <div className="h-48">
              <Line data={hourlyData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>
        </div>

        <NeoCard className="p-4">
          <h3 className="text-lg font-semibold mb-3">ສະຫຼຸບຍອດຂາຍ</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-blue-600">{reportData.summary?.totalTickets || 0}</p>
              <p className="text-sm text-gray-600">ປີ້ທີ່ຂາຍ</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">₭{reportData.summary?.totalRevenue?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">ລາຍຮັບລວມ</p>
            </div>
            <div>
              <p className="text-xl font-bold text-purple-600">₭{reportData.summary?.averagePrice?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">ລາຄາເຊລີ່ຍ</p>
            </div>
          </div>
        </NeoCard>
      </div>
    );
  };

  const renderDriverReport = () => {
    if (!reportData || !reportData.drivers || !Array.isArray(reportData.drivers)) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">ບໍ່ມີຂໍ້ມູນຄົນຂັບ</p>
        </div>
      );
    }

    const summary = reportData.summary || {};
    const metadata = reportData.metadata || {};
    const drivers = reportData.drivers || [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{summary.totalDrivers || 0}</p>
            <p className="text-sm text-blue-600">ຄົນຂັບທັງໝົດ</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-600">{summary.workingDriversInPeriod || 0}</p>
            <p className="text-sm text-green-600">ຄົນຂັບທີ່ທຳງານ</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-purple-600">{summary.totalWorkDays || 0}</p>
            <p className="text-sm text-purple-600">ວັນທຳວຽກລວມ</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-orange-600">₭{metadata.revenuePerDriver?.toLocaleString() || 0}</p>
            <p className="text-sm text-orange-600">ລາຍຮັບຕໍ່ຄົນ</p>
          </div>
        </div>

        <NeoCard className="p-4">
          <h3 className="text-lg font-semibold mb-3">ການຄິດໄລ່ລາຍຮັບ</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-blue-600">ລາຍຮັບລວມ</p>
                <p className="text-xl font-bold">₭{metadata.totalRevenue?.toLocaleString() || 0}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-green-600">ສ່ວນແບ່ງຄົນຂັບ (85%)</p>
                <p className="text-xl font-bold">₭{summary.totalIncome?.toLocaleString() || 0}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-orange-600">ຄົນຂັບທີ່ທຳງານ</p>
                <p className="text-xl font-bold">{metadata.workingDriversCount || 0} ຄົນ</p>
              </div>
            </div>
            <div className="mt-3 text-center text-sm text-gray-600">
              <p>ລາຍຮັບຕໍ່ຄົນ = ສ່ວນແບ່ງຄົນຂັບ ÷ ຈຳນວນຄົນຂັບທີ່ທຳງານ</p>
              <p className="font-bold text-lg text-purple-600">
                ₭{metadata.revenuePerDriver?.toLocaleString() || 0} ຕໍ່ຄົນ
              </p>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-lg font-semibold mb-3">ລາຍລະອຽດຄົນຂັບ</h3>
          
          {drivers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">ບໍ່ມີຂໍ້ມູນຄົນຂັບໃນຊ່ວງເວລານີ້</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ຊື່</th>
                      <th className="text-left p-2">ລະຫັດ</th>
                      <th className="text-center p-2">ສະຖານະ</th>
                      <th className="text-center p-2">ວັນທຳງານ</th>
                      <th className="text-right p-2">ລາຍຮັບ (KIP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.slice(0, 20).map((driver: any, index: number) => (
                      <tr key={driver.id || index} className="border-b">
                        <td className="p-2 font-medium">{driver.name || 'N/A'}</td>
                        <td className="p-2 text-gray-600">{driver.employeeId || 'N/A'}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            driver.performance === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {driver.performance === 'Active' ? 'ເຂົ້າວຽກ' : 'ບໍ່ເຂົ້າວຽກ'}
                          </span>
                        </td>
                        <td className="p-2 text-center">{driver.workDays || 0}</td>
                        <td className="p-2 text-right">
                          <span className={`font-bold ${
                            (driver.totalIncome || 0) > 0 ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            ₭{(driver.totalIncome || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {drivers.length > 20 && (
                <div className="mt-3 text-center text-sm text-gray-500">
                  ແສດງ 20 ລາຍການແຮກ ຈາກທັງໝົດ {drivers.length} ຄົນ
                </div>
              )}
            </>
          )}
        </NeoCard>
      </div>
    );
  };

  const renderFinancialReport = () => {
    if (!reportData?.breakdown) return null;

    const breakdown = reportData.breakdown;
    const chartData = {
      labels: ['ບໍລິສັດ (10%)', 'ສະຖານີ (5%)', 'ຄົນຂັບ (85%)'],
      datasets: [{
        data: [
          breakdown.company?.totalAmount || 0,
          breakdown.station?.totalAmount || 0,
          breakdown.driver?.totalAmount || 0
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      }]
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-600">₭{reportData.summary?.totalRevenue?.toLocaleString() || 0}</p>
            <p className="text-sm text-blue-600">ລາຍຮັບລວມ</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-600">₭{reportData.summary?.companyShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-green-600">ບໍລິສັດ</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-purple-600">₭{reportData.summary?.stationShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-purple-600">ສະຖານີ</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-orange-600">₭{reportData.summary?.driverShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-orange-600">ຄົນຂັບ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NeoCard className="p-4">
            <h3 className="text-lg font-semibold mb-3">ການແບ່ງລາຍຮັບ</h3>
            <div className="h-48">
              <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>

          <NeoCard className="p-4">
            <h3 className="text-lg font-semibold mb-3">ລາຍລະອຽດ</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <div>
                  <p className="font-medium text-blue-900">ບໍລິສັດ (10%)</p>
                  <p className="text-sm text-blue-600">{breakdown.company?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="font-bold text-blue-600">₭{breakdown.company?.totalAmount?.toLocaleString() || 0}</p>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <div>
                  <p className="font-medium text-green-900">ສະຖານີ (5%)</p>
                  <p className="text-sm text-green-600">{breakdown.station?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="font-bold text-green-600">₭{breakdown.station?.totalAmount?.toLocaleString() || 0}</p>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <div>
                  <p className="font-medium text-orange-900">ຄົນຂັບ (85%)</p>
                  <p className="text-sm text-orange-600">{breakdown.driver?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="font-bold text-orange-600">₭{breakdown.driver?.totalAmount?.toLocaleString() || 0}</p>
              </div>
            </div>
          </NeoCard>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">ບໍ່ມີຂໍ້ມູນບົດລາຍງານ</p>
        </div>
      );
    }

    switch (selectedReport) {
      case 'summary': return renderSummaryReport();
      case 'sales': return renderSalesReport();
      case 'drivers': return renderDriverReport();
      case 'financial': return renderFinancialReport();
      default: return <div>ປະເພດບົດລາຍງານບໍ່ຖືກຕ້ອງ</div>;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 ລະບົບບົດລາຍງານ</h1>
        <p className="text-gray-600">ຈັດການແລະສ້າງບົດລາຍງານສຳລັບທຸລະກິດຂາຍປີ້ລົດໂດຍສານ</p>
      </div>

      <NeoCard className="p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <FiFilter className="mr-2" />
          ເລືອກປະເພດບົດລາຍງານ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className={`p-2 rounded-full mr-2 text-sm ${
                  selectedReport === report.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {report.icon}
                </div>
                <h3 className="font-semibold text-sm">{report.title}</h3>
              </div>
              <p className="text-xs text-gray-600">{report.description}</p>
            </button>
          ))}
        </div>
      </NeoCard>

      <NeoCard className="p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center">
            <FiCalendar className="mr-2" />
            ເລືອກຊ່ວງເວລາ
          </h2>
          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              disabled={loading}
            >
              <FiRefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} size={14} />
              ອັບເດດ
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!reportData || loading}
              title={!reportData ? 'ກະລຸນາສ້າງບົດລາຍງານກ່ອນສົ່ງອອກ' : 'ສົ່ງອອກເປັນ PDF'}
            >
              <FiDownload className="mr-1" size={14} />
              PDF
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!reportData || loading}
              title="ພິມບົດລາຍງານ"
            >
              <FiPrinter className="mr-1" size={14} />
              ພິມ
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedPeriod(range.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                selectedPeriod === range.value
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        
        {selectedPeriod === 'custom' && (
          <div className="flex gap-3 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ເລີ່ມ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ສິ້ນສຸດ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </NeoCard>

      <NeoCard className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {reportTypes.find(r => r.id === selectedReport)?.title || 'ບົດລາຍງານ'}
          </h2>
          {reportData && (
            <div className="text-sm text-gray-500">
              {new Date(reportData.period.startDate).toLocaleDateString('lo-LA')} - {new Date(reportData.period.endDate).toLocaleDateString('lo-LA')}
            </div>
          )}
        </div>
        
        {renderReportContent()}
      </NeoCard>
    </div>
  );
}