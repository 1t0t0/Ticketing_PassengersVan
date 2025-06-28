// app/driver-portal/page.tsx - แก้ไขให้แสดงเฉพาะคนขับที่มีสิทธิ์
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { toast } from 'react-toastify';
import { 
  FiDollarSign, 
  FiCalendar, 
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiTruck
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

interface DashboardData {
  driver: {
    id: string;
    name: string;
    employeeId: string;
    checkInStatus: 'checked-in' | 'checked-out';
  };
  totalRevenue: number;
  totalTickets: number;
  todayRevenue: number;
  companyRevenue: number;
  stationRevenue: number;
  driverRevenue: number;
  
  // ✅ ข้อมูลใหม่ที่เฉพาะเจาะจง
  qualifiedDriversCount: number; // คนขับที่ทำครบ 2 รอบ
  myQualifiedTrips: number; // รอบที่ตัวเองทำสำเร็จ
  myDailyIncome: number;
  myExpectedShare: number;
  myTicketsCount: number;
  
  monthlyIncome: number;
  monthlyDays: number;
  averagePerTicket: number;
  averageDriverShare: number;
  
  // ✅ ข้อมูลสิทธิ์
  hasRevenue: boolean;
  qualificationMessage: string;
  
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
    qualifiedDrivers: number; // ✅ เปลี่ยนจาก workingDrivers
    sharePerDriver: number;
    method: string;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
}

export default function EnhancedDriverPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Format currency
  const formatCurrency = (amount: number) => `₭${amount.toLocaleString()}`;

  // Fetch dashboard data with enhanced error handling
  const fetchDashboardData = async (queryStartDate?: string, queryEndDate?: string) => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);
      
      let url = `/api/driver/income?type=dashboard`;
      
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
  const handleRefresh = async () => {
    setRefreshing(true);
    
    if (selectedPeriod === 'ກຳໜົດເອງ') {
      await fetchDashboardData(startDate, endDate);
    } else {
      await fetchDashboardData(selectedDate);
    }
  };

  // Calculate date range based on period
  const calculateDateRange = (period: string) => {
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
  const handlePeriodChange = async (period: string) => {
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
  const handleCustomDateUpdate = async () => {
    if (!startDate || !endDate) {
      toast.error('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    await fetchDashboardData(startDate, endDate);
  };

  // Export PDF function
  const handleExportPDF = async () => {
    if (!dashboardData) {
      toast.error('ບໍ່ມີຂໍ້ມູນສຳລັບສົ່ງອອກ PDF');
      return;
    }

    if (!pdfLibraryLoaded) {
      toast.warn('ກຳລັງໂຫລດ PDF library, ກະລຸນາລໍຖ້າ...');
      return;
    }

    const loadingToast = toast.loading('ກຳລັງສ້າງ PDF... 📄');

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const htmlContent = generateDriverPDFContent(dashboardData, selectedPeriod, startDate, endDate);
      
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
      await document.fonts.ready;

      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
        width: 794,
        height: tempDiv.scrollHeight + 80
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const today = new Date();
      const dateStr = today.toLocaleDateString('lo-LA').replace(/\//g, '-');
      const fileName = `ລາຍງານລາຍຮັບພະນັກງານຂັບລົດ_${session?.user?.name}_${dateStr}.pdf`;

      pdf.save(fileName);
      document.body.removeChild(tempDiv);
      
      toast.update(loadingToast, {
        render: 'ດາວໂຫຼດ PDF ສຳເລັດແລ້ວ! 🎉',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

    } catch (error) {
      console.error('PDF export error:', error);
      toast.update(loadingToast, {
        render: 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ PDF ❌',
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // PDF content generator (enhanced with new data)
  const generateDriverPDFContent = (data: DashboardData, period: string, start: string, end: string) => {
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('lo-LA');
    const getDisplayPeriod = () => {
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
        <title>ລາຍງານລາຍຮັບພະນັກງານຂັບລົດ</title>
        <style>
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
          
          .driver-info {
            background: #f8f9fa; padding: 15px; margin: 20px 0;
            border-radius: 8px; border: 2px solid #e9ecef;
          }
          
          .period-info {
            background: #e3f2fd; padding: 15px; margin: 20px 0; text-align: center;
            border-radius: 8px; border: 2px solid #2196f3; font-size: 16px; font-weight: bold;
          }
          
          .stats-grid {
            display: grid; grid-template-columns: repeat(2, 1fr);
            gap: 15px; margin: 20px 0;
          }
          
          .stat-card {
            background: #f8f9fa; border: 2px solid #e9ecef;
            border-radius: 8px; padding: 15px; text-align: center;
          }
          
          .stat-value {
            font-size: 18px; font-weight: bold;
            color: #2563EB; margin-bottom: 5px;
          }
          
          .stat-label { font-size: 12px; color: #666; font-weight: bold; }
          
          .my-share-highlight {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border: 2px solid #2196f3; border-radius: 8px;
            padding: 20px; margin: 20px 0;
          }
          
          .qualification-box {
            background: ${data.hasRevenue ? '#d4edda' : '#f8d7da'};
            border: 2px solid ${data.hasRevenue ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 8px; padding: 15px; margin: 20px 0;
            color: ${data.hasRevenue ? '#155724' : '#721c24'};
          }
          
          .currency { font-weight: bold; color: #2563EB; }
          .text-center { text-align: center; }
          .text-success { color: #28a745; }
          .text-danger { color: #dc3545; }
          
          .report-footer {
            margin-top: 30px; text-align: center; font-size: 12px; color: #666;
            border-top: 2px solid #ddd; padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <div class="report-title">ລາຍງານລາຍຮັບພະນັກງານຂັບລົດ</div>
            <div style="font-size: 16px; color: #666;">ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງ</div>
            <div style="font-size: 14px; color: #888;">ລົດໄຟ ລາວ-ຈີນ</div>
          </div>
          
          <div class="driver-info">
            <h3 style="margin-bottom: 10px;">ຂໍ້ມູນພະນັກງານຂັບລົດ</h3>
            <p><strong>ຊື່:</strong> ${data.driver.name}</p>
            <p><strong>ລະຫັດພະນັກງານ:</strong> ${data.driver.employeeId}</p>
            <p><strong>ສະຖານະປັດຈຸບັນ:</strong> 
              <span class="${data.driver.checkInStatus === 'checked-in' ? 'text-success' : 'text-danger'}">
                ${data.driver.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
              </span>
            </p>
            <p><strong>ຮອບທີ່ທຳສຳເລັດ:</strong> ${data.myQualifiedTrips || 0} ຮອບ</p>
          </div>
          
          <div class="period-info">
            📅 <strong>ໄລຍະເວລາທີ່ເບິ່ງ:</strong> ${getDisplayPeriod()}
          </div>
          
          <div class="qualification-box">
            <h3 style="margin-bottom: 10px;">${data.hasRevenue ? '✅' : '❌'} ສະຖານະສິດຮັບລາຍຮັບ</h3>
            <p><strong>${data.qualificationMessage}</strong></p>
            ${!data.hasRevenue ? '<p style="font-size: 12px; margin-top: 10px;">💡 <strong>ເງື່ອນໄຂ:</strong> ຕ້ອງທຳຮອບການເດີນທາງສຳເລັດ 2 ຮອບຕໍ່ວັນ (ແຕ່ລະຮອບຕ້ອງມີຜູ້ໂດຍສານ ≥80% ຂອງຄວາມຈຸລົດ)</p>' : ''}
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
              <div class="stat-value">${data.qualifiedDriversCount}</div>
              <div class="stat-label">👥 ພະນັກງານຂັບລົດທີ່ມີສິດ</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${formatCurrency(data.averageDriverShare)}</div>
              <div class="stat-label">📊 ເຉລ່ຍຕໍ່ຄົນທີ່ມີສິດ</div>
            </div>
          </div>
          
          <div class="my-share-highlight">
            <h3 style="margin-bottom: 15px; color: #1976d2;">💎 ລາຍຮັບຂອງທ່ານ</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 16px;">ສ່ວນແບ່ງທີ່ໄດ້ຮັບ:</span>
              <span style="font-size: 24px; font-weight: bold; color: ${data.hasRevenue ? '#1976d2' : '#666'};">
                ${formatCurrency(data.myExpectedShare)}
              </span>
            </div>
            <div style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
              💡 <strong>ວິທີຄິດໄລ່:</strong> ລາຍຮັບພະນັກງານຂັບລົດ ${formatCurrency(data.driverRevenue)} ÷ ${data.qualifiedDriversCount} ຄົນທີ່ມີສິດ = ${formatCurrency(data.averageDriverShare)}
            </div>
            ${data.dateRange ? `
            <div style="font-size: 11px; color: #666; text-align: center; margin-top: 10px;">
              📅 <strong>ໄລຍະເວລາ:</strong> ${data.dateRange.totalDays} ວັນ
            </div>
            ` : ''}
          </div>
          
          <div class="report-footer">
            <p><strong>ສ້າງເມື່ອ:</strong> ${new Date().toLocaleString('lo-LA')}</p>
            <p>🚌 ລະບົບອອກປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</p>
            <p style="font-size: 10px; margin-top: 10px; color: #999;">
              ✅ ເງື່ອນໄຂການຮັບລາຍຮັບ: ທຳຮອບການເດີນທາງສຳເລັດ 2 ຮອບຕໍ່ວັນ (≥80% ຄວາມຈຸລົດ)
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Initial load
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'driver') {
      fetchDashboardData();
    }
  }, [status, session]);

  // Format date for Lao display
  const formatDateLao = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get display text for current period
  const getDisplayPeriod = () => {
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
          label: function(context: any) {
            return context.label + ': ' + formatCurrency(context.parsed);
          }
        }
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'driver') {
    return null;
  }

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        onLoad={() => setPdfLibraryLoaded(true)}
        onError={() => console.error('Failed to load html2pdf library')}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ລາຍຮັບພະນັກງານຂັບລົດ</h1>
                <p className="text-gray-600">ສະບາຍດີ, {session?.user?.name}</p>
                {dashboardData && (
                  <div className="mt-1 flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      dashboardData.driver.checkInStatus === 'checked-in' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dashboardData.driver.checkInStatus === 'checked-in' ? (
                        <>
                          <FiCheckCircle className="mr-1" />
                          ເຂົ້າວຽກແລ້ວ
                        </>
                      ) : (
                        <>
                          <FiClock className="mr-1" />
                          ເບິ່ງຂໍ້ມູນຍ້ອນຫລັງ
                        </>
                      )}
                    </span>
                    
                    {/* ✅ แสดงสถานะสิทธิ์ */}
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      dashboardData.hasRevenue 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {dashboardData.hasRevenue ? (
                        <>
                          <FiDollarSign className="mr-1" />
                          ມີສິດຮັບລາຍຮັບ
                        </>
                      ) : (
                        <>
                          <FiAlertCircle className="mr-1" />
                          ຍັງບໍ່ມີສິດຮັບ
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  ອັບເດດ
                </button>
                
                <button 
                  onClick={handleExportPDF}
                  disabled={!dashboardData || !pdfLibraryLoaded}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  title={!pdfLibraryLoaded ? 'ກຳລັງໂຫລດ PDF library...' : 'ດາວໂຫຼດ PDF'}
                >
                  <FiDownload className="mr-2" />
                  PDF {!pdfLibraryLoaded && <span className="ml-1 text-xs">(ໂຫລດ...)</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

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

          {/* ✅ แสดงข้อความสิทธิ์ */}
          {dashboardData && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              dashboardData.hasRevenue 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center">
                {dashboardData.hasRevenue ? (
                  <FiCheckCircle className="text-green-600 mr-3 h-6 w-6" />
                ) : (
                  <FiAlertCircle className="text-orange-600 mr-3 h-6 w-6" />
                )}
                <div>
                  <p className={`font-semibold ${
                    dashboardData.hasRevenue ? 'text-green-800' : 'text-orange-800'
                  }`}>
                    {dashboardData.qualificationMessage}
                  </p>
                  {!dashboardData.hasRevenue && (
                    <p className="text-sm text-orange-700 mt-1">
                      💡 <strong>ເງື່ອນໄຂ:</strong> ຕ້ອງທຳຮອບການເດີນທາງສຳເລັດ 2 ຮອບຕໍ່ວັນ (ແຕ່ລະຮອບຕ້ອງມີຜູ້ໂດຍສານ ≥80% ຂອງຄວາມຈຸລົດ)
                    </p>
                  )}
                </div>
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
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Custom Date Range Selector */}
            {selectedPeriod === 'ກຳໜົດເອງ' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">ຈາກ:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">ຫາ:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleCustomDateUpdate}
                    disabled={loading}
                    className="px-4 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
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

                {/* ✅ Revenue Breakdown ใหม่ */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ລາຍຮັບລະອຽດ</h3>
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

                  {/* ✅ รายรับต่อคนใหม่ */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <FiUsers className="mr-2 text-blue-600" />
                      ລາຍຮັບຕໍ່ຄົນທີ່ມີສິດ
                    </h4>
                    
                    <div className={`rounded-lg p-4 mb-4 ${
                      dashboardData.hasRevenue 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' 
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${
                            dashboardData.hasRevenue ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            ລາຍຮັບຂອງທ່ານ
                            {!dashboardData.hasRevenue && (
                              <span className="ml-1 text-xs text-red-500">(ບໍ່ມີສິດ)</span>
                            )}
                          </p>
                          <p className={`text-2xl font-bold ${
                            dashboardData.hasRevenue ? 'text-blue-900' : 'text-gray-500'
                          }`}>
                            {formatCurrency(dashboardData.myExpectedShare)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${
                            dashboardData.hasRevenue ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            ຮອບທຳສຳເລັດ: {dashboardData.myQualifiedTrips || 0}
                          </p>
                          <p className={`text-xs ${
                            dashboardData.hasRevenue ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            ແບ່ງກັບ: {dashboardData.qualifiedDriversCount} ຄົນທີ່ມີສິດ
                          </p>
                          {dashboardData.dateRange && (
                            <p className={`text-xs ${
                              dashboardData.hasRevenue ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {dashboardData.dateRange.totalDays} ວັນ
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span>ພະນັກງານຂັບລົດທີ່ມີສິດແບ່ງ:</span>
                          <span className="font-medium text-blue-600">
                            {dashboardData.qualifiedDriversCount} ຄົນ
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span>ລາຍຮັບສ່ວນພະນັກງານຂັບລົດລວມ:</span>
                          <span className="font-medium text-orange-600">{formatCurrency(dashboardData.driverRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span>ລາຍຮັບເຉລ່ຍຕໍ່ຄົນທີ່ມີສິດ:</span>
                          <span className="font-medium text-green-600">{formatCurrency(dashboardData.averageDriverShare)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className={`font-medium ${
                            dashboardData.hasRevenue ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            ສ່ວນແບ່ງຂອງທ່ານ:
                          </span>
                          <span className={`font-bold text-lg ${
                            dashboardData.hasRevenue ? 'text-blue-700' : 'text-gray-500'
                          }`}>
                            {formatCurrency(dashboardData.myExpectedShare)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ✅ คำอธิบายการคิดไล่ใหม่ */}
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-800">
                        <strong>💡 ວິທີຄິດໄລ່:</strong> ລາຍຮັບ 85% ({formatCurrency(dashboardData.driverRevenue)}) ÷ {dashboardData.qualifiedDriversCount} ພະນັກງານຂັບລົດທີ່ມີສິດ = {formatCurrency(dashboardData.averageDriverShare)} ຕໍ່ຄົນ
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        <strong>📊 ເງື່ອນໄຂສິດ:</strong> ຕ້ອງທຳຮອບການເດີນທາງສຳເລັດ 2 ຮອບຕໍ່ວັນ (ແຕ່ລະຮອບຕ້ອງມີຜູ້ໂດຍສານ ≥80% ຂອງຄວາມຈຸລົດ)
                      </p>
                    </div>
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

// Revenue Card Component (เดิม)
const RevenueCard: React.FC<{
  title: string;
  amount: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}> = ({ title, amount, color }) => {
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

// Revenue Breakdown Item Component (เดิม)
const RevenueBreakdownItem: React.FC<{
  label: string;
  amount: number;
  transactions: number;
  color: 'blue' | 'green' | 'orange';
}> = ({ label, amount, transactions, color }) => {
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