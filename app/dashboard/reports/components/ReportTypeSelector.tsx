// app/dashboard/reports/components/ReportTypeSelector.tsx - แก้ไขให้ Staff ไม่เห็นรายงานพนักงาน
import React from 'react';
import { useSession } from 'next-auth/react'; // เพิ่ม import
import { FiBarChart, FiCreditCard, FiUsers, FiDollarSign, FiFilter, FiTruck, FiTag, FiUserCheck } from 'react-icons/fi';

interface ReportType {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  roles?: string[]; // เพิ่ม field roles
}

interface ReportTypeSelectorProps {
  selectedReport: string;
  onReportChange: (reportId: string) => void;
}

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  selectedReport,
  onReportChange
}) => {
  const { data: session } = useSession(); // เพิ่ม session

  const reportTypes: ReportType[] = [
    { 
      id: 'summary', 
      title: 'ສະຫຼຸບລວມ', 
      icon: <FiBarChart />, 
      description: 'ພາບລວມສະຖິຕິ',
      roles: ['admin', 'staff', 'station'] 
    },
    { 
      id: 'sales', 
      title: 'ຍອດຂາຍ', 
      icon: <FiCreditCard />, 
      description: 'ສະຫຼຸບຍອດຂາຍ',
      roles: ['admin', 'staff', 'station'] 
    },
    { 
      id: 'drivers', 
      title: 'ພະນັກງານຂັບລົດ', 
      icon: <FiUsers />, 
      description: 'ສະຖິຕິພະນັກງານຂັບລົດ',
      roles: ['admin', 'staff', 'station'] 
    },
    { 
      id: 'financial', 
      title: 'ການເງິນ', 
      icon: <FiDollarSign />, 
      description: 'ແບ່ງລາຍຮັບ',
      roles: ['admin', 'staff', 'station'] 
    },
    { 
      id: 'vehicles', 
      title: 'ຂໍ້ມູນລົດ', 
      icon: <FiTruck />, 
      description: 'ສະຖິຕິລົດແລະປະເພດ',
      roles: ['admin', 'staff', 'station'] 
    },
    { 
      id: 'staff', 
      title: 'ພະນັກງານຂາຍປີ້', 
      icon: <FiUserCheck />, 
      description: 'ລາຍງານພະນັກງານຂາຍປີ້',
      roles: ['admin', 'station'] // ❌ ลบ 'staff' ออก - เฉพาะ admin และ station เท่านั้น
    }
  ];

  // กรองรายงานตาม role ของผู้ใช้
  const filteredReportTypes = reportTypes.filter(report => {
    if (!report.roles) return true; // ถ้าไม่มี roles กำหนดให้แสดงทุก role
    return report.roles.includes(session?.user?.role || '');
  });

  // ตรวจสอบว่า selectedReport ยังอยู่ใน filteredReportTypes หรือไม่
  // ถ้าไม่อยู่ให้เปลี่ยนไปเป็น summary
  React.useEffect(() => {
    const isSelectedReportAvailable = filteredReportTypes.some(report => report.id === selectedReport);
    if (!isSelectedReportAvailable && filteredReportTypes.length > 0) {
      onReportChange('summary'); // เปลี่ยนไปเป็น summary
    }
  }, [selectedReport, filteredReportTypes, onReportChange]);

  return (
    <>
      <h2 className="text-lg font-semibold mb-3 flex items-center">
        <FiFilter className="mr-2" />
        ເລືອກປະເພດບົດລາຍງານ
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {filteredReportTypes.map((report) => (
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
      
      {/* แสดงข้อความแจ้งเตือนสำหรับ Staff */}
      {session?.user?.role === 'staff' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <FiUserCheck className="text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              <strong>ໝາຍເຫດ:</strong> ທ່ານບໍ່ສາມາດເບິ່ງລາຍງານພະນັກງານໄດ້ເພື່ອປົກປ້ອງຄວາມເປັນສ່ວນຕົວ
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportTypeSelector;