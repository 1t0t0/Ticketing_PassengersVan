// app/dashboard/reports/page.tsx - Main Reports Page (Fixed Date Calculation)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { FiCalendar, FiDownload, FiRefreshCw, FiPrinter } from 'react-icons/fi';

// Import components
import ReportTypeSelector from './components/ReportTypeSelector';
import DateRangeSelector from './components/DateRangeSelector';
import ReportContent from './components/ReportContent';
import { exportToPDF } from './utils/exportUtils';

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
            // แก้ไขการคำนวณเดือนนี้ให้ถูกต้อง
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth(); // 0-11
            
            // วันที่ 1 ของเดือนปัจจุบัน
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
            
            // วันนี้ในเดือนปัจจุบัน
            const todayInCurrentMonth = new Date(currentYear, currentMonth, today.getDate());
            
            actualStartDate = firstDayOfMonth.toISOString().split('T')[0];
            actualEndDate = todayInCurrentMonth.toISOString().split('T')[0];
            
            // Debug log
            console.log('ເດືອນນີ້ Calculation:', {
              currentMonth: currentMonth + 1,
              currentYear,
              firstDay: actualStartDate,
              lastDay: actualEndDate
            });
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

  const handleExportPDF = () => {
    if (reportData) {
      exportToPDF(reportData, selectedReport);
    } else {
      alert('ບໍ່ມີຂໍ້ມູນບົດລາຍງານສຳລັບສົ່ງອອກ');
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
          reportData={reportData}
        />
      </NeoCard>

      {/* Report Content */}
      <NeoCard className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {selectedReport === 'summary' && 'ສະຫຼຸບລວມ'}
            {selectedReport === 'sales' && 'ບົດລາຍງານຍອດຂາຍ'}
            {selectedReport === 'drivers' && 'ບົດລາຍງານຄົນຂັບ'}
            {selectedReport === 'financial' && 'ບົດລາຍງານການເງິນ'}
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