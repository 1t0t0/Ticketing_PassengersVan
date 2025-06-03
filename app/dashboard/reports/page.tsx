// app/dashboard/reports/page.tsx - Updated with new report types
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';

// Import components
import ReportTypeSelector from './components/ReportTypeSelector';
import DateRangeSelector from './components/DateRangeSelector';
import ReportContent from './components/ReportContent';
import { exportToPDF, printReport } from './utils/exportUtils';

interface ReportData {
  type: string;
  period: { startDate: string; endDate: string };
  summary: any;
  [key: string]: any;
}

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
            // แก้ไขให้ได้วันที่ 1 ของเดือนปัจจุบันจริงๆ
            const todayDate = new Date();
            
            // ใช้วิธีสร้างวันที่แบบชัดเจน
            const year = todayDate.getFullYear();
            const month = todayDate.getMonth(); // 0-11 (0=มกราคม, 5=มิถุนายน)
            const todayDateNum = todayDate.getDate();
            
            // สร้างวันที่ 1 ของเดือนปัจจุบัน (ใช้ UTC เพื่อหลีกเลี่ยงปัญหา timezone)
            const startOfMonth = new Date(Date.UTC(year, month, 1));
            
            // สร้างวันที่ปัจจุบัน
            const endOfPeriod = new Date(Date.UTC(year, month, todayDateNum));
            
            // แปลงเป็นรูปแบบ YYYY-MM-DD
            actualStartDate = startOfMonth.getUTCFullYear() + '-' + 
                             String(startOfMonth.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                             String(startOfMonth.getUTCDate()).padStart(2, '0');
                             
            actualEndDate = endOfPeriod.getUTCFullYear() + '-' + 
                           String(endOfPeriod.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                           String(endOfPeriod.getUTCDate()).padStart(2, '0');
            
            break;
        }
      }

      console.log('Fetching report with dates:', { actualStartDate, actualEndDate, selectedPeriod });

      const response = await fetch(
        `/api/reports?type=${selectedReport}&startDate=${actualStartDate}&endDate=${actualEndDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        console.log('Report data received:', data.period);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับดาวน์โหลด PDF จริง
  const handleExportPDF = () => {
    if (reportData) {
      exportToPDF(reportData, selectedReport);
    } else {
      alert('ບໍ່ມີຂໍ້ມູນບົດລາຍງານສຳລັບສົ່ງອອກ PDF');
    }
  };

  // ฟังก์ชันสำหรับเปิด Print Dialog แบบ ticket sales
  const handlePrintReport = () => {
    if (reportData) {
      printReport(reportData, selectedReport);
    } else {
      alert('ບໍ່ມີຂໍ້ມູນບົດລາຍງານສຳລັບພິມ');
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // ฟังก์ชันสำหรับแสดงชื่อรายงาน
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 ລະບົບບົດລາຍງານ</h1>
        <p className="text-gray-600">ຈັດການແລະສ້າງບົດລາຍງານສຳລັບທຸລະກິດຂາຍປີ້ລົດໂດຍສານ</p>
      </div>

      {/* Report Type Selector */}
      <NeoCard className="p-4 mb-4">
        <ReportTypeSelector 
          selectedReport={selectedReport}
          onReportChange={setSelectedReport}
        />
      </NeoCard>

      {/* Date Range Selector */}
      <NeoCard className="p-4 mb-4">
        <DateRangeSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRefresh={fetchReport}
          loading={loading}
          onExportPDF={handleExportPDF}
          onPrintReport={handlePrintReport}
          reportData={reportData}
        />
      </NeoCard>

      {/* Report Content */}
      <NeoCard className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {getReportTitle(selectedReport)}
          </h2>
          {reportData && (
            <div className="text-sm text-gray-500">
              {new Date(reportData.period.startDate).toLocaleDateString('lo-LA')} - {new Date(reportData.period.endDate).toLocaleDateString('lo-LA')}
            </div>
          )}
        </div>
        
        <ReportContent 
          reportData={reportData}
          reportType={selectedReport}
          loading={loading}
        />
      </NeoCard>
    </div>
  );
}