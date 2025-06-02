// app/dashboard/reports/components/ReportTypeSelector.tsx
import React from 'react';
import { FiBarChart, FiCreditCard, FiUsers, FiDollarSign, FiFilter } from 'react-icons/fi';

interface ReportType {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface ReportTypeSelectorProps {
  selectedReport: string;
  onReportChange: (reportId: string) => void;
}

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  selectedReport,
  onReportChange
}) => {
  const reportTypes: ReportType[] = [
    { id: 'summary', title: 'ສະຫຼຸບລວມ', icon: <FiBarChart />, description: 'ພາບລວມສະຖິຕິ' },
    { id: 'sales', title: 'ຍອດຂາຍ', icon: <FiCreditCard />, description: 'ສະຫຼຸບຍອດຂາຍ' },
    { id: 'drivers', title: 'ຄົນຂັບ', icon: <FiUsers />, description: 'ສະຖິຕິຄົນຂັບ' },
    { id: 'financial', title: 'ການເງິນ', icon: <FiDollarSign />, description: 'ແບ່ງລາຍຮັບ' }
  ];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3 flex items-center">
        <FiFilter className="mr-2" />
        ເລືອກປະເພດບົດລາຍງານ
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => onReportChange(report.id)}
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
    </>
  );
};

export default ReportTypeSelector;