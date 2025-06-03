// app/dashboard/reports/components/StaffReportComponent.tsx - แก้ไขแล้ว
import React from 'react';
import { FiUserCheck, FiUsers, FiClock, FiDollarSign } from 'react-icons/fi';

interface StaffReportComponentProps {
  reportData: any;
  loading: boolean;
}

const StaffReportComponent: React.FC<StaffReportComponentProps> = ({ reportData, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!reportData) {
    return <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນພະນັກງານ</div>;
  }

  const summary = reportData.summary || {};
  const staff = reportData.staff || [];

  // Debug: ตรวจสอบข้อมูลที่ได้รับ
  console.log('Staff Report Data:', reportData);
  console.log('Summary:', summary);
  console.log('Staff Array:', staff);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<FiUsers />} 
          title="ພະນັກງານທັງໝົດ" 
          value={summary.totalStaff || 0} 
          color="blue" 
        />
        <StatCard 
          icon={<FiUserCheck />} 
          title="ເຂົ້າວຽກວັນນີ້" 
          value={summary.activeStaff || 0} 
          color="green" 
        />
        <StatCard 
          icon={<FiDollarSign />} 
          title="ປີ້ທີ່ຂາຍລວມ" 
          value={summary.totalTicketsSold || 0} 
          color="purple" 
        />
        <StatCard 
          icon={<FiClock />} 
          title="ຊົ່ວໂມງທຳງານ" 
          value={`${summary.totalWorkHours || 0}h`} 
          color="orange" 
        />
      </div>

      {/* Performance Overview */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">
          ພາບລວມການປະຕິບັດງານ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.averageTicketsPerStaff || 0}</div>
            <div className="text-sm text-gray-600">ປີ້ຕໍ່ຄົນເຊລີ່ຍ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.topPerformerTickets || 0}</div>
            <div className="text-sm text-gray-600">ປີ້ສູງສຸດ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round(summary.averageWorkHours || 0)}h</div>
            <div className="text-sm text-gray-600">ຊົ່ວໂມງເຊລີ່ຍ</div>
          </div>
        </div>
      </div>

      {/* Staff Performance Table */}
      {staff.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">ລາຍລະອຽດການປະຕິບັດງານພະນັກງານ</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ຊື່</th>
                  <th className="text-left p-2">ລະຫັດ</th>
                  <th className="text-center p-2">ສະຖານະ</th>
                  <th className="text-center p-2">ປີ້ທີ່ຂາຍ</th>
                  <th className="text-center p-2">ຊົ່ວໂມງທຳງານ</th>
                  <th className="text-center p-2">ປີ້/ຊົ່ວໂມງ</th>
                  <th className="text-center p-2">ເຂົ້າວຽກ</th>
                  <th className="text-center p-2">ອອກວຽກ</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member: any, index: number) => {
                  return (
                    <tr key={member.id || index} className="border-b">
                      <td className="p-2 font-medium">{member.name || 'N/A'}</td>
                      <td className="p-2 text-gray-600">{member.employeeId || 'N/A'}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.checkInStatus === 'checked-in' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
                        </span>
                      </td>
                      <td className="p-2 text-center font-bold text-blue-600">
                        {member.ticketsSold || 0}
                      </td>
                      <td className="p-2 text-center">
                        {member.workHours ? `${Math.round(member.workHours)}h` : '0h'}
                      </td>
                      <td className="p-2 text-center">
                        {member.workHours > 0 
                          ? Math.round((member.ticketsSold || 0) / member.workHours) 
                          : 0}
                      </td>
                      <td className="p-2 text-center text-sm text-gray-600">
                        {member.lastCheckIn 
                          ? new Date(member.lastCheckIn).toLocaleTimeString('lo-LA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : '-'
                        }
                      </td>
                      <td className="p-2 text-center text-sm text-gray-600">
                        {member.lastCheckOut 
                          ? new Date(member.lastCheckOut).toLocaleTimeString('lo-LA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : '-'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
}> = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200'
  };

  const textClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-lg p-3 text-center`}>
      {icon && (
        <div className={`${textClasses[color as keyof typeof textClasses]} mb-2 flex justify-center`}>
          {icon}
        </div>
      )}
      <p className={`text-xl font-bold ${textClasses[color as keyof typeof textClasses]}`}>{value}</p>
      <p className={`text-sm ${textClasses[color as keyof typeof textClasses]}`}>{title}</p>
    </div>
  );
};

export default StaffReportComponent;