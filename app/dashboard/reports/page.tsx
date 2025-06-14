// app/dashboard/reports/page.tsx - กลับไปใช้ไฟล์เดียวที่ทำงานได้

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import Script from 'next/script';

// Import components
import ReportTypeSelector from './components/ReportTypeSelector';
import DateRangeSelector from './components/DateRangeSelector';
import ReportContent from './components/ReportContent';

// ✅ ใช้ไฟล์เดียวที่ทำงานได้แน่นอน
import { exportToPDF, printReport } from './utils/exportUtils';

interface ReportData {
  period: { startDate: string; endDate: string };
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
  const [pdfLibraryLoaded, setPdfLibraryLoaded] = useState(false);

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
            const todayDate = new Date();
            const year = todayDate.getFullYear();
            const month = todayDate.getMonth();
            const todayDateNum = todayDate.getDate();
            
            const startOfMonth = new Date(Date.UTC(year, month, 1));
            const endOfPeriod = new Date(Date.UTC(year, month, todayDateNum));
            
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
      } else {
        console.error('Failed to fetch report:', response.status, response.statusText);
        setReportData(null);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ใช้ฟังก์ชันจากไฟล์ที่ทำงานได้แน่นอน
  const handleExportPDF = async () => {
    if (!reportData) {
      alert('ບໍ່ມີຂໍ້ມູນບົດລາຍງານສຳລັບສົ່ງອອກ PDF');
      return;
    }

    if (!pdfLibraryLoaded) {
      alert('ກຳລັງໂຫລດ PDF library, ກະລຸນາລໍຖ້າ...');
      return;
    }

    try {
      await exportToPDF(reportData, selectedReport as any);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ PDF');
    }
  };

  // ✅ ใช้ฟังก์ชันจากไฟล์ที่ทำงานได้แน่นอน
  const handlePrintReport = () => {
    if (reportData) {
      printReport(reportData, selectedReport as any);
    } else {
      alert('ບໍ່ມີຂໍ້ມູນບົດລາຍງານສຳລັບພິມ');
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

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

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ລະບົບບົດລາຍງານ</h1>
          <p className="text-gray-600">ຈັດການແລະສ້າງບົດລາຍງານສຳລັບທຸລະກິດຂາຍປີ້ລົດໂດຍສານ</p>
          
          {/* แสดงสถานะการโหลด PDF library */}
          {!pdfLibraryLoaded && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-700">
              ⏳ ກຳລັງໂຫລດ PDF library... ກະລຸນາລໍຖ້າ
            </div>
          )}
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
    </>
  );
}