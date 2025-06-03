// app/dashboard/reports/components/StaffReportComponent.tsx
import React from 'react';
import { FiUserCheck, FiUsers, FiClock, FiDollarSign, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import { BarChart } from 'recharts';

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
  const workHours = reportData.workHours || [];

  // Prepare chart data for tickets sold by staff
  const ticketsSoldChartData = {
    labels: staff.slice(0, 10).map((s: any) => s.name || 'N/A'),
    datasets: [{
      label: 'ປີ້ທີ່ຂາຍ',
      data: staff.slice(0, 10).map((s: any) => s.ticketsSold || 0),
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      borderWidth: 1
    }]
  };

  // Prepare chart data for work hours
  const workHoursChartData = {
    labels: workHours.map((h: any) => `${h.hour}:00`),
    datasets: [{
      label: 'ປີ້ທີ່ຂາຍ',
      data: workHours.map((h: any) => h.ticketCount || 0),
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.1
    }]
  };

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
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiTrendingUp className="mr-2" />
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets Sold by Staff */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FiDollarSign className="mr-2" />
            ປີ້ທີ່ຂາຍໂດຍພະນັກງານ (10 ອັນດັບ)
          </h3>
          {staff.length > 0 ? (
            <div className="h-64">
              <BarChart 
                data={ticketsSoldChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນການຂາຍ</div>
          )}
        </div>

        {/* Hourly Sales Trend */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FiClock className="mr-2" />
            ແນວໂນ້ມການຂາຍຕາມຊົ່ວໂມງ
          </h3>
          {workHours.length > 0 ? (
            <div className="h-64">
              <Line 
                data={workHoursChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນຊົ່ວໂມງການຂາຍ</div>
          )}
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
                  <th className="text-center p-2">ການປະຕິບັດ</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member: any, index: number) => {
                  const performance = getPerformanceLevel(member.ticketsSold || 0, summary.averageTicketsPerStaff || 0);
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
                      <td className="p-2 text-center">
                        <span className={`flex items-center justify-center text-xs font-medium ${
                          performance.color
                        }`}>
                          {performance.icon}
                          <span className="ml-1">{performance.label}</span>
                        </span>
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

// Helper function to determine performance level
const getPerformanceLevel = (ticketsSold: number, average: number) => {
  if (ticketsSold >= average * 1.5) {
    return {
      label: 'ດີເລີດ',
      color: 'text-green-600',
      icon: <FiTrendingUp />
    };
  } else if (ticketsSold >= average) {
    return {
      label: 'ດີ',
      color: 'text-blue-600',
      icon: <FiTrendingUp />
    };
  } else if (ticketsSold >= average * 0.5) {
    return {
      label: 'ປົກກະຕິ',
      color: 'text-yellow-600',
      icon: <FiUserCheck />
    };
  } else {
    return {
      label: 'ຕ້ອງປັບປຸງ',
      color: 'text-red-600',
      icon: <FiTrendingDown />
    };
  }
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