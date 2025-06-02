// app/dashboard/reports/components/DateRangeSelector.tsx - Updated with separate PDF and Print functions
import React from 'react';
import { FiCalendar, FiRefreshCw, FiDownload, FiPrinter } from 'react-icons/fi';

interface DateRangeSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onRefresh: () => void;
  loading: boolean;
  onExportPDF: () => void;
  onPrintReport: () => void;  // เพิ่ม prop ใหม่สำหรับ print
  reportData: any;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
  loading,
  onExportPDF,
  onPrintReport,  // รับ prop ใหม่
  reportData
}) => {
  const timeRanges = [
    { value: 'today', label: 'ມື້ນີ້' },
    { value: 'yesterday', label: 'ມື້ວານ' },
    { value: 'thisWeek', label: 'ອາທິດນີ້' },
    { value: 'thisMonth', label: 'ເດືອນນີ້' },
    { value: 'custom', label: 'ກຳນົດເອງ' }
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold flex items-center">
          <FiCalendar className="mr-2" />
          ເລືອກຊ່ວງເວລາ
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
            disabled={loading}
            title="ອັບເດດຂໍ້ມູນ"
          >
            <FiRefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} size={14} />
            ອັບເດດ
          </button>
          
          <button
            onClick={onExportPDF}
            className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm disabled:opacity-50 transition-colors"
            disabled={!reportData || loading}
            title="ດາວໂຫຼດເປັນໄຟລ໌ PDF"
          >
            <FiDownload className="mr-1" size={14} />
            PDF
          </button>
          
          <button
            onClick={onPrintReport}
            className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm disabled:opacity-50 transition-colors"
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
            onClick={() => onPeriodChange(range.value)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              selectedPeriod === range.value
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
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
              onChange={(e) => onStartDateChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ສິ້ນສຸດ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DateRangeSelector;