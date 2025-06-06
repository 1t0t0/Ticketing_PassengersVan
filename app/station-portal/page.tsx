// app/station-portal/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { toast } from 'react-hot-toast';
import { 
  FiDollarSign, 
  FiCalendar, 
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiMapPin
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StationDashboardData {
  station: {
    id: string;
    name: string;
    stationId: string;
    stationName: string;
    location: string;
  };
  totalRevenue: number;
  totalTickets: number;
  todayRevenue: number;
  companyRevenue: number;
  stationRevenue: number;
  driverRevenue: number;
  workingDriversCount: number;
  stationShare: number;
  averagePerTicket: number;
  chartData: {
    company: number;
    station: number;
    drivers: number;
  };
  calculation: {
    totalRevenue: number;
    companyPercent: number;
    stationPercent: number;
    driversPercent: number;
    stationShare: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
}

// Type for html2canvas options
interface Html2CanvasOptions {
  scale?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

// Type for jsPDF
interface JSPDF {
  addImage(
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void;
  addPage(): void;
  save(filename: string): void;
}

// Type for html2canvas function
type Html2Canvas = (
  element: HTMLElement,
  options?: Html2CanvasOptions
) => Promise<HTMLCanvasElement>;

export default function StationPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<StationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('ວັນນີ້');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [pdfLibraryLoaded, setPdfLibraryLoaded] = useState(false);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'station') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Format currency
  const formatCurrency = (amount: number): string => `₭${amount.toLocaleString()}`;

  // Export PDF function
  const handleExportPDF = async (): Promise<void> => {
    if (!dashboardData) {
      toast.error('ບໍ່ມີຂໍ້ມູນສຳລັບສົ່ງອອກ PDF');
      return;
    }

    if (!pdfLibraryLoaded) {
      toast('ກຳລັງໂຫລດ PDF library, ກະລຸນາລໍຖ້າ...');
      return;
    }

    // แสดง loading toast
    const loadingToastId = toast.loading('ກຳລັງສ້າງ PDF... 📄');

    try {
      // Import jsPDF และ html2canvas with proper typing
      const jsPDFModule = await import('jspdf');
      const html2canvasModule = await import('html2canvas');
      
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default as Html2Canvas;

      // สร้างเนื้อหา HTML สำหรับ PDF
      const htmlContent = generateStationPDFContent(dashboardData, selectedPeriod, startDate, endDate);
      
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
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: tempDiv.scrollHeight + 80
      });

      // สร้าง PDF
      const pdf = new jsPDF('p', 'mm', 'a4') as JSPDF;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = 210;
      const pageHeight = 297;
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
      const fileName = `ລາຍງານລາຍຮັບສະຖານີ_${dashboardData.station.stationName}_${dateStr}.pdf`;

      // ดาวน์โหลด PDF
      pdf.save(fileName);

      // ลบ element ชั่วคราว
      document.body.removeChild(tempDiv);
      
      // แสดงข้อความสำเร็จ
      toast.success('ດາວໂຫຼດ PDF ສຳເລັດແລ້ວ! 🎉');

    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ PDF ❌');
    } finally {
      toast.dismiss(loadingToastId);
    }
  };

  // สร้างเนื้อหา PDF
  const generateStationPDFContent = (
    data: StationDashboardData, 
    period: string, 
    start: string, 
    end: string
  ): string => {
    const formatDate = (dateStr: string): string => new Date(dateStr).toLocaleDateString('lo-LA');
    const getDisplayPeriod = (): string => {
      switch (period) {
        case 'ວັນນີ້': return `ວັນນີ້ - ${formatDate(start)}`;
        case 'ມື້ວານ': return `ມື້ວານ - ${formatDate(start)}`;
        case 'ອາທິດນີ້': return `ອາທິດນີ້ - ${formatDate(start)} ຫາ ${formatDate(end)}`;
        case 'ເດືອນນີ້': return `ເດືອນນີ້ - ${formatDate(start)} ຫາ ${formatDate(end)}`;
        case 'ກຳໜົດເອງ': return `ຊ່ວງທີ່ເລືອກ - ${formatDate(start)} ຫາ ${formatDate(end)}`;
        default: return formatDate(start);
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ລາຍງານລາຍຮັບສະຖານີ</title>
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
            border-bottom: 3px solid #10B981;
            padding-bottom: 20px;
          }
          
          .report-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #10B981;
          }
          
          .station-info {
            background: #f0fdf4;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            border: 2px solid #bbf7d0;
          }
          
          .period-info {
            background: #ecfdf5;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            border-radius: 8px;
            border: 2px solid #10b981;
            font-size: 16px;
            font-weight: bold;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          
          .stat-card {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 5px;
          }
          
          .stat-label {
            font-size: 12px;
            color: #666;
            font-weight: bold;
          }
          
          .breakdown-section {
            margin: 20px 0;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 20px;
          }
          
          .breakdown-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #ddd;
            padding-bottom: 8px;
          }
          
          .breakdown-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          
          .station-share-highlight {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .currency {
            font-weight: bold;
            color: #059669;
          }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-success { color: #10b981; }
          .text-danger { color: #dc3545; }
          .text-primary { color: #059669; }
          
          .report-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 2px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <div class="report-title">ລາຍງານລາຍຮັບສະຖານີ</div>
            <div style="font-size: 16px; color: #666;">ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງ</div>
            <div style="font-size: 14px; color: #888;">ລົດໄຟ ລາວ-ຈີນ</div>
          </div>
          
          <div class="station-info">
            <h3 style="margin-bottom: 10px;">ຂໍ້ມູນສະຖານີ</h3>
            <p><strong>ຊື່ສະຖານີ:</strong> ${data.station.stationName}</p>
            <p><strong>ລະຫັດສະຖານີ:</strong> ${data.station.stationId}</p>
            ${data.station.location ? `<p><strong>ທີ່ຕັ້ງ:</strong> ${data.station.location}</p>` : ''}
          </div>
          
          <div class="period-info">
            📅 <strong>ໄລຍະເວລາ:</strong> ${getDisplayPeriod()}
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${formatCurrency(data.totalRevenue)}</div>
              <div class="stat-label">💰 ລາຍຮັບລວມ</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.totalTickets}</div>
              <div class="stat-label">🎫 ຈຳນວນປີ້</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.workingDriversCount}</div>
              <div class="stat-label">👥 ພະນັກງານຂັບລົດທີ່ເຮັດວຽກ</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${formatCurrency(data.averagePerTicket)}</div>
              <div class="stat-label">📊 ເຉລ່ຍຕໍ່ປີ້</div>
            </div>
          </div>
          
          <div class="breakdown-section">
            <div class="breakdown-title">📋 ການແບ່ງລາຍຮັບ</div>
            
            <div class="breakdown-item">
              <span><strong>🏢 ບໍລິສັດ (10%)</strong></span>
              <span class="currency">${formatCurrency(data.companyRevenue)}</span>
            </div>
            
            <div class="breakdown-item">
              <span><strong>🚉 ສະຖານີ (5%)</strong></span>
              <span class="currency">${formatCurrency(data.stationRevenue)}</span>
            </div>
            
            <div class="breakdown-item">
              <span><strong>👥 ພະນັກງານຂັບລົດລວມ (85%)</strong></span>
              <span class="currency">${formatCurrency(data.driverRevenue)}</span>
            </div>
          </div>
          
          <div class="station-share-highlight">
            <h3 style="margin-bottom: 15px; color: #059669;">🏢 ລາຍຮັບສະຖານີ</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 16px;">ສ່ວນແບ່ງຂອງສະຖານີ (5%):</span>
              <span style="font-size: 24px; font-weight: bold; color: #059669;">${formatCurrency(data.stationShare)}</span>
            </div>
            <div style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
              💡 <strong>ວິທີຄິດໄລ່:</strong> ລາຍຮັບລວມ ${formatCurrency(data.totalRevenue)} × 5% = ${formatCurrency(data.stationShare)}
            </div>
          </div>
          
          <div class="report-footer">
            <p><strong>ສ້າງເມື່ອ:</strong> ${new Date().toLocaleString('lo-LA')}</p>
            <p>🚌 ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Fetch dashboard data
  const fetchDashboardData = async (queryStartDate?: string, queryEndDate?: string): Promise<void> => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);
      
      let url = `/api/station/income?type=dashboard`;
      
      if (queryStartDate && queryEndDate) {
        url += `&startDate=${queryStartDate}&endDate=${queryEndDate}`;
      } else if (queryStartDate) {
        url += `&date=${queryStartDate}`;
      } else {
        url += `&date=${selectedDate}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    
    if (selectedPeriod === 'ກຳໜົດເອງ') {
      await fetchDashboardData(startDate, endDate);
    } else {
      await fetchDashboardData(selectedDate);
    }
  };

  // Calculate date range based on period
  const calculateDateRange = (period: string): { startDate: string; endDate: string } | null => {
    const today = new Date();
    const newStartDate = new Date(today);
    const newEndDate = new Date(today);
    
    switch (period) {
      case 'ວັນນີ້':
        break;
      case 'ມື້ວານ':
        newStartDate.setDate(today.getDate() - 1);
        newEndDate.setDate(today.getDate() - 1);
        break;
      case 'ອາທິດນີ້':
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        newStartDate.setDate(today.getDate() - daysToMonday);
        break;
      case 'ເດືອນນີ້':
        newStartDate.setDate(1);
        break;
      default:
        return null;
    }
    
    return {
      startDate: newStartDate.toISOString().split('T')[0],
      endDate: newEndDate.toISOString().split('T')[0]
    };
  };

  // Handle period change
  const handlePeriodChange = async (period: string): Promise<void> => {
    setSelectedPeriod(period);
    
    if (period === 'ກຳໜົດເອງ') {
      return;
    }
    
    const dateRange = calculateDateRange(period);
    if (dateRange) {
      setStartDate(dateRange.startDate);
      setEndDate(dateRange.endDate);
      setSelectedDate(dateRange.startDate);
      
      if (dateRange.startDate === dateRange.endDate) {
        await fetchDashboardData(dateRange.startDate);
      } else {
        await fetchDashboardData(dateRange.startDate, dateRange.endDate);
      }
    }
  };

  // Handle custom date range update
  const handleCustomDateUpdate = async (): Promise<void> => {
    if (!startDate || !endDate) {
      toast.error('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
      return;
    }
    
    await fetchDashboardData(startDate, endDate);
  };

  // Simulate data fetch for now (replace with actual API call)
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'station') {
      // Simulate fetching dashboard data for station
      const simulatedData: StationDashboardData = {
        station: {
          id: session.user.id,
          name: session.user.name || '',
          stationId: 'ST-250101-001',
          stationName: 'ສະຖານີລົດໄຟ',
          location: 'ຫຼວງພະບາງ, ລາວ'
        },
        totalRevenue: 4500000,
        totalTickets: 100,
        todayRevenue: 4500000,
        companyRevenue: 450000,
        stationRevenue: 225000,
        driverRevenue: 3825000,
        workingDriversCount: 15,
        stationShare: 225000,
        averagePerTicket: 45000,
        chartData: {
          company: 450000,
          station: 225000,
          drivers: 3825000
        },
        calculation: {
          totalRevenue: 4500000,
          companyPercent: 10,
          stationPercent: 5,
          driversPercent: 85,
          stationShare: 225000,
        }
      };
      
      setTimeout(() => {
        setDashboardData(simulatedData);
        setLoading(false);
      }, 1000);
    }
  }, [status, session]);

  // Format date for Lao display
  const formatDateLao = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get display text for current period
  const getDisplayPeriod = (): string => {
    switch (selectedPeriod) {
      case 'ວັນນີ້':
        return `ວັນນີ້ - ${formatDateLao(selectedDate)}`;
      case 'ມື້ວານ':
        return `ມື້ວານ - ${formatDateLao(selectedDate)}`;
      case 'ອາທິດນີ້':
        return `ອາທິດນີ້ - ${formatDateLao(startDate)} ຫາ ${formatDateLao(endDate)}`;
      case 'ເດືອນນີ້':
        return `ເດືອນນີ້ - ${formatDateLao(startDate)} ຫາ ${formatDateLao(endDate)}`;
      case 'ກຳໜົດເອງ':
        return `ຊ່ວງທີ່ເລືອກ - ${formatDateLao(startDate)} ຫາ ${formatDateLao(endDate)}`;
      default:
        return formatDateLao(selectedDate);
    }
  };

  // Prepare chart data
  const chartData = dashboardData ? {
    labels: ['ບໍລິສັດ (10%)', 'ສະຖານີ (5%)', 'ພະນັກງານຂັບລົດ (85%)'],
    datasets: [
      {
        data: [
          dashboardData.chartData.company,
          dashboardData.chartData.station,
          dashboardData.chartData.drivers
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            return context.label + ': ' + formatCurrency(context.parsed as number);
          }
        }
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'station') {
    return null;
  }

  return (
    <>
      {/* โหลด html2pdf.js library */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        onLoad={() => {
          setPdfLibraryLoaded(true);
          console.log('html2pdf library loaded successfully');
        }}
        onError={() => {
          console.error('Failed to load html2pdf library');
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ລາຍຮັບສະຖານີ</h1>
                <p className="text-gray-600">ສະບາຍດີ, {session?.user?.name}</p>
                {dashboardData && (
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      <FiMapPin className="mr-1" />
                      {dashboardData.station.location}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  ອັບເດດ
                </button>
                
                <button 
                  onClick={handleExportPDF}
                  disabled={!dashboardData || !pdfLibraryLoaded}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  title={!pdfLibraryLoaded ? 'ກຳລັງໂຫລດ PDF library...' : 'ດາວໂຫຼດ PDF'}
                >
                  <FiDownload className="mr-2" />
                  PDF {!pdfLibraryLoaded && <span className="ml-1 text-xs">(ໂຫລດ...)</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* แสดงสถานะการโหลด PDF library */}
        {!pdfLibraryLoaded && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-700 p-2 text-center">
              ⏳ ກຳລັງໂຫລດ PDF library... ກະລຸນາລໍຖ້າ
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
                <button 
                  onClick={handleRefresh}
                  className="ml-auto text-red-600 hover:text-red-800 underline"
                >
                  ລອງໃໝ່
                </button>
              </div>
            </div>
          )}

          {/* Period Selector */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <FiCalendar className="mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">ເລືອກຊ່ວງເວລາ</h2>
            </div>
            
            {/* Period Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                'ວັນນີ້', 
                'ມື້ວານ', 
                'ອາທິດນີ້', 
                'ເດືອນນີ້', 
                'ກຳໜົດເອງ'
              ].map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    selectedPeriod === period
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-300'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Custom Date Range Selector */}
            {selectedPeriod === 'ກຳໜົດເອງ' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">ຈາກ:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">ຫາ:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleCustomDateUpdate}
                    disabled={loading}
                    className="px-4 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'ກຳລັງໂຫລດ...' : 'ອັບເດດ'}
                  </button>
                </div>
              </div>
            )}

            {/* Current Period Display */}
            <div className="mt-3 text-sm text-gray-600">
              <strong>ຊ່ວງເວລາປັດຈຸບັນ:</strong> {getDisplayPeriod()}
              {dashboardData && dashboardData.totalTickets > 0 && (
                <span className="ml-2">({dashboardData.totalTickets} ໃບ)</span>
              )}
            </div>
          </div>

          {loading && !dashboardData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
              <span className="text-gray-600">ກຳລັງໂຫລດຂໍ້ມູນ...</span>
            </div>
          ) : dashboardData ? (
            <>
              {/* Revenue Summary Cards */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ລາຍຮັບລວມ</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <RevenueCard
                    title="ລາຍຮັບລວມ"
                    amount={dashboardData.totalRevenue}
                    color="blue"
                  />
                  <RevenueCard
                    title="ບໍລິສັດ (10%)"
                    amount={dashboardData.companyRevenue}
                    color="purple"
                  />
                  <RevenueCard
                    title="ສະຖານີ (5%)"
                    amount={dashboardData.stationRevenue}
                    color="green"
                  />
                  <RevenueCard
                    title="ພະນັກງານຂັບລົດ (85%)"
                    amount={dashboardData.driverRevenue}
                    color="orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Distribution Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ການແບ່ງລາຍຮັບ</h3>
                  {chartData && dashboardData.totalRevenue > 0 ? (
                    <div className="h-80">
                      <Doughnut data={chartData} options={chartOptions} />
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <FiDollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p>ຍັງບໍ່ມີຂໍ້ມູນລາຍຮັບ</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Station Revenue Details */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ລາຍຮັບສະຖານີ</h3>
                  
                  {/* Station Share Highlight */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">ສ່ວນແບ່ງຂອງສະຖານີ</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(dashboardData.stationShare)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600">ຈາກ {dashboardData.totalTickets} ໃບ</p>
                        <p className="text-xs text-green-600">5% ຂອງລາຍຮັບລວມ</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <RevenueBreakdownItem
                      label="ບໍລິສັດ (10%)"
                      amount={dashboardData.companyRevenue}
                      transactions={dashboardData.totalTickets > 0 ? 1 : 0}
                      color="blue"
                    />
                    <RevenueBreakdownItem
                      label="ສະຖານີ (5%)"
                      amount={dashboardData.stationRevenue}
                      transactions={dashboardData.totalTickets > 0 ? 1 : 0}
                      color="green"
                    />
                    <RevenueBreakdownItem
                      label="ພະນັກງານຂັບລົດ (85%)"
                      amount={dashboardData.driverRevenue}
                      transactions={dashboardData.totalTickets > 0 ? 1 : 0}
                      color="orange"
                    />
                  </div>

                  {/* Calculation Info */}
                  <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-800">
                      <strong>💡 ວິທີຄິດໄລ່:</strong> ລາຍຮັບລວມ {formatCurrency(dashboardData.totalRevenue)} × 5% = {formatCurrency(dashboardData.stationShare)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">ບໍ່ສາມາດໂຫລດຂໍ້ມູນໄດ້</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Revenue Card Component
interface RevenueCardProps {
  title: string;
  amount: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const RevenueCard: React.FC<RevenueCardProps> = ({ title, amount, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700'
  };

  const textColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4 text-center`}>
      <p className={`text-2xl font-bold ${textColorClasses[color]}`}>
        ₭{amount.toLocaleString()}
      </p>
      <p className={`text-sm ${textColorClasses[color]} mt-1`}>{title}</p>
    </div>
  );
};

// Revenue Breakdown Item Component
interface RevenueBreakdownItemProps {
  label: string;
  amount: number;
  transactions: number;
  color: 'blue' | 'green' | 'orange';
}

const RevenueBreakdownItem: React.FC<RevenueBreakdownItemProps> = ({ 
  label, 
  amount, 
  transactions, 
  color 
}) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div>
        <p className={`font-medium ${colorClasses[color]}`}>{label}</p>
        <p className="text-xs text-gray-500">{transactions} ລາຍການ</p>
      </div>
      <p className={`font-bold ${colorClasses[color]} text-lg`}>
        ₭{amount.toLocaleString()}
      </p>
    </div>
  );
};