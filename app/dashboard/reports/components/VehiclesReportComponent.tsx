// app/dashboard/reports/components/VehiclesReportComponent.tsx - ปรับปรุงแล้ว
import React from 'react';
import { FiTruck, FiTag, FiUser, FiCheck, FiX } from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';

interface VehiclesReportComponentProps {
  reportData: any;
  loading: boolean;
}

const VehiclesReportComponent: React.FC<VehiclesReportComponentProps> = ({ reportData, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  if (!reportData) {
    return <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນລົດ</div>;
  }

  const summary = reportData.summary || {};
  const carTypes = reportData.carTypes || [];
  const cars = reportData.cars || [];

  // Prepare chart data for car types
  const carTypeChartData = {
    labels: carTypes.map((type: any) => type.carType_name),
    datasets: [{
      data: carTypes.map((type: any) => type.count),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
      ],
    }]
  };

  // Prepare chart data for car status
  const statusChartData = {
    labels: ['ກຳລັງໃຊ້ງານ', 'ບໍ່ໃຊ້ງານ'],
    datasets: [{
      data: [summary.activeCars || 0, (summary.totalCars || 0) - (summary.activeCars || 0)],
      backgroundColor: ['#10B981', '#6B7280'],
    }]
  };

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
            icon={<FiTruck />} 
            title="ລົດທັງໝົດ" 
            value={summary.totalCars || 0} 
            color="blue" 
          />
          <StatCard 
            icon={<FiCheck />} 
            title="ລົດກຳລັງໃຊ້" 
            value={summary.activeCars || 0} 
            color="green" 
          />
          <StatCard 
            icon={<FiTag />} 
            title="ປະເພດລົດ" 
            value={summary.totalCarTypes || 0} 
            color="blue" 
          />
          <StatCard 
            icon={<FiUser />} 
            title="ພະນັກງານຂັບລົດທີ່ມີລົດ" 
            value={summary.driversWithCars || 0} 
            color="gray" 
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Car Types Distribution */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FiTag className="mr-2" />
            ການແຈກແຍງປະເພດລົດ
          </h3>
          {carTypes.length > 0 ? (
            <div className="h-64">
              <Doughnut 
                data={carTypeChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນປະເພດລົດ</div>
          )}
        </div>

        {/* Car Status */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FiTruck className="mr-2" />
            ສະຖານະການໃຊ້ງານລົດ
          </h3>
          <div className="h-64">
            <Doughnut 
              data={statusChartData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Car Types Summary - กระชับลง */}
      {carTypes.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">ສະຫຼຸບປະເພດລົດ</h3>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-w-[600px]">
              {carTypes.map((type: any, index: number) => (
                <div key={type._id || index} className="bg-gray-50 rounded-lg p-3 border flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{type.carType_name}</h4>
                      <p className="text-sm text-gray-600">
                        {type.count} ຄັນ ({summary.totalCars ? Math.round((type.count / summary.totalCars) * 100) : 0}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">{type.activeCars || 0}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-gray-600">{type.count}</span>
                      </div>
                      <p className="text-xs text-gray-500">ໃຊ້ງານ/ທັງໝົດ</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cars List - กระชับลง แสดง 5 คันแรก */}
      {cars.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold flex items-center">
              <FiTruck className="mr-2" />
              ລາຍການລົດ
            </h3>
            <span className="text-sm text-gray-500">({Math.min(cars.length, 5)} ຈາກ {cars.length} ຄັນ)</span>
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
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2 whitespace-nowrap">ລະຫັດລົດ</th>
                    <th className="text-left p-2 whitespace-nowrap">ຊື່ລົດ</th>
                    <th className="text-left p-2 whitespace-nowrap">ທະບຽນ</th>
                    <th className="text-left p-2 whitespace-nowrap">ປະເພດ</th>
                    <th className="text-center p-2 whitespace-nowrap">ຄວາມຈຸ</th>
                    <th className="text-left p-2 whitespace-nowrap">ພະນັກງານຂັບລົດ</th>
                    <th className="text-center p-2 whitespace-nowrap">ສະຖານະ</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.slice(0, 5).map((car: any, index: number) => (
                    <tr key={car._id || index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium text-blue-600 whitespace-nowrap">{car.car_id}</td>
                      <td className="p-2 whitespace-nowrap">{car.car_name}</td>
                      <td className="p-2 font-mono bg-gray-100 rounded px-2 whitespace-nowrap">{car.car_registration}</td>
                      <td className="p-2 whitespace-nowrap">{car.carType?.carType_name || 'ບໍ່ລະບຸ'}</td>
                      <td className="p-2 text-center whitespace-nowrap">{car.car_capacity} ຄົນ</td>
                      <td className="p-2 whitespace-nowrap">
                        {car.user_id ? (
                          <div>
                            <div className="font-medium">{car.user_id.name}</div>
                            <div className="text-xs text-gray-500">{car.user_id.employeeId}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">ບໍ່ມີພະນັກງານຂັບລົດ</span>
                        )}
                      </td>
                      <td className="p-2 text-center whitespace-nowrap">
                        {car.user_id?.checkInStatus === 'checked-in' ? (
                          <span className="flex items-center justify-center text-green-600 text-xs">
                            <FiCheck className="mr-1" size={12} />
                            ກຳລັງໃຊ້
                          </span>
                        ) : (
                          <span className="flex items-center justify-center text-gray-500 text-xs">
                            <FiX className="mr-1" size={12} />
                            ບໍ່ໃຊ້
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {cars.length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                ແລະອີກ {cars.length - 5} ຄັນ... (ເລື່ອນຊ້າຍ-ຂວາເພື່ອເບິ່ງລາຍລະອຽດ)
              </p>
            </div>
          )}
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

export default VehiclesReportComponent;