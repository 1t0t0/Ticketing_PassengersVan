// app/dashboard/reports/components/StaffReportComponent.tsx - ปรับปรุงแล้ว
import React from 'react';
import { FiUserCheck, FiUsers, FiCalendar, FiDollarSign } from 'react-icons/fi';

interface StaffReportComponentProps {
  reportData: any;
  loading: boolean;
}

const StaffReportComponent: React.FC<StaffReportComponentProps> = ({ reportData, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  if (!reportData) {
    return <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນພະນັກງານຂາຍປີ້</div>;
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
      <div 
        className="overflow-x-auto"
        style={{
          scrollbarWidth: 'auto',
          scrollbarColor: '#CBD5E1 #F1F5F9',
          paddingBottom: '8px'
        }}
        onScroll={(e) => {
          const target = e.target as HTMLElement;
          if (!target.dataset.scrollbarStyled) {
            const style = document.createElement('style');
            style.textContent = `
              .custom-scrollbar::-webkit-scrollbar {
                height: 12px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #F1F5F9;
                border-radius: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #CBD5E1;
                border-radius: 6px;
                border: 2px solid #F1F5F9;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #94A3B8;
              }
            `;
            document.head.appendChild(style);
            target.classList.add('custom-scrollbar');
            target.dataset.scrollbarStyled = 'true';
          }
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[600px]">
          <StatCard 
            icon={<FiUsers />} 
            title="ພະນັກງານຂາຍປີ້ທັງໝົດ" 
            value={summary.totalStaff || 0} 
            color="blue" 
          />
          <StatCard 
            icon={<FiUserCheck />} 
            title="ເຂົ້າວຽກ" 
            value={summary.activeStaff || 0} 
            color="green" 
          />
          <StatCard 
            icon={<FiDollarSign />} 
            title="ປີ້ທີ່ຂາຍລວມ" 
            value={summary.totalTicketsSold || 0} 
            color="green" 
          />
          <StatCard 
            icon={<FiCalendar />} 
            title="ວັນທຳງານລວມ" 
            value={summary.totalWorkDays || 0} 
            color="gray" 
          />
        </div>
      </div>

      {/* Staff Performance Table */}
      {staff.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">ລາຍລະອຽດການປະຕິບັດງານພະນັກງານຂາຍປີ້</h3>
            <span className="text-sm text-gray-500">
              ({Math.min(staff.length, 5)} ຈາກ {staff.length} ຄົນ)
            </span>
          </div>
          <div 
            className="overflow-x-auto"
            style={{
              scrollbarWidth: 'auto',
              scrollbarColor: '#CBD5E1 #F1F5F9',
              paddingBottom: '8px'
            }}
            onScroll={(e) => {
              const target = e.target as HTMLElement;
              if (!target.dataset.scrollbarStyled) {
                const style = document.createElement('style');
                style.textContent = `
                  .custom-scrollbar::-webkit-scrollbar {
                    height: 12px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: #F1F5F9;
                    border-radius: 6px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #CBD5E1;
                    border-radius: 6px;
                    border: 2px solid #F1F5F9;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94A3B8;
                  }
                `;
                document.head.appendChild(style);
                target.classList.add('custom-scrollbar');
                target.dataset.scrollbarStyled = 'true';
              }
            }}
          >
            <div className="min-w-full">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2 whitespace-nowrap">ຊື່</th>
                    <th className="text-left p-2 whitespace-nowrap">ລະຫັດ</th>
                    <th className="text-center p-2 whitespace-nowrap">ສະຖານະ</th>
                    <th className="text-center p-2 whitespace-nowrap">ປີ້ທີ່ຂາຍ</th>
                    <th className="text-center p-2 whitespace-nowrap">ວັນທຳງານ</th>
                    <th className="text-center p-2 whitespace-nowrap">ເຂົ້າວຽກ</th>
                    <th className="text-center p-2 whitespace-nowrap">ອອກວຽກ</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.slice(0, 5).map((member: any, index: number) => {
                    return (
                      <tr key={member.id || index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium whitespace-nowrap">{member.name || 'N/A'}</td>
                        <td className="p-2 text-gray-600 whitespace-nowrap">{member.employeeId || 'N/A'}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            member.checkInStatus === 'checked-in' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {member.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold text-green-600 whitespace-nowrap">
                          {member.ticketsSold || 0}
                        </td>
                        <td className="p-2 text-center font-bold text-gray-700 whitespace-nowrap">
                          {member.workDays || 0} ວັນ
                        </td>
                        <td className="p-2 text-center text-sm text-gray-600 whitespace-nowrap">
                          {member.lastCheckIn 
                            ? new Date(member.lastCheckIn).toLocaleDateString('lo-LA') + ' ' +
                              new Date(member.lastCheckIn).toLocaleTimeString('lo-LA', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : '-'
                          }
                        </td>
                        <td className="p-2 text-center text-sm text-gray-600 whitespace-nowrap">
                          {member.lastCheckOut 
                            ? new Date(member.lastCheckOut).toLocaleDateString('lo-LA') + ' ' +
                              new Date(member.lastCheckOut).toLocaleTimeString('lo-LA', { 
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
          
          {staff.length > 5 && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-500">
                ແລະອີກ {staff.length - 5} ຄົນ... (ເລື່ອນຊ້າຍ-ຂວາເພື່ອເບິ່ງລາຍລະອຽດ)
              </p>
            </div>
          )}
          
          {/* เพิ่มข้อความอธิบาย */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>ໝາຍເຫດ:</strong> ຂໍ້ມູນທີ່ສະແດງເປັນຂໍ້ມູນໃນຊ່ວງເວລາທີ່ເລືອກເທົ່ານັ້ນ 
              (ເຂົ້າ-ອອກວຽກແມ່ນຄັ້ງລ່າສຸດໃນຊ່ວງເວລານັ້ນ)
            </p>
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
    gray: 'bg-gray-50 border-gray-200'
  };

  const textClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-600'
  };

  const valueClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    gray: 'text-gray-800'
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-lg p-3 text-center`}>
      {icon && (
        <div className={`${textClasses[color as keyof typeof textClasses]} mb-2 flex justify-center`}>
          {icon}
        </div>
      )}
      <p className={`text-xl font-bold ${valueClasses[color as keyof typeof valueClasses]}`}>{value}</p>
      <p className={`text-sm ${textClasses[color as keyof typeof textClasses]}`}>{title}</p>
    </div>
  );
};

export default StaffReportComponent;