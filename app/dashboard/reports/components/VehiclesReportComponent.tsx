// app/dashboard/reports/components/VehiclesReportComponent.tsx
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
      backgroundColor: ['#10B981', '#EF4444'],
    }]
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          color="purple" 
        />
        <StatCard 
          icon={<FiUser />} 
          title="ພະນັກງານຂັບລົດທີ່ມີລົດ" 
          value={summary.driversWithCars || 0} 
          color="orange" 
        />
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

      {/* Car Types Detail Table */}
      {carTypes.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">ລາຍລະອຽດປະເພດລົດ</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ປະເພດລົດ</th>
                  <th className="text-center p-2">ຈຳນວນ</th>
                  <th className="text-center p-2">ສັດສ່ວນ</th>
                  <th className="text-center p-2">ກຳລັງໃຊ້</th>
                  <th className="text-center p-2">ບໍ່ໃຊ້</th>
                </tr>
              </thead>
              <tbody>
                {carTypes.map((type: any, index: number) => (
                  <tr key={type._id || index} className="border-b">
                    <td className="p-2 font-medium">{type.carType_name}</td>
                    <td className="p-2 text-center">{type.count}</td>
                    <td className="p-2 text-center">
                      {summary.totalCars ? Math.round((type.count / summary.totalCars) * 100) : 0}%
                    </td>
                    <td className="p-2 text-center text-green-600">{type.activeCars || 0}</td>
                    <td className="p-2 text-center text-red-600">{type.count - (type.activeCars || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cars Detail Table */}
      {cars.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">ລາຍການລົດ (10 ຄັນທຳອິດ)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ລະຫັດລົດ</th>
                  <th className="text-left p-2">ຊື່ລົດ</th>
                  <th className="text-left p-2">ປ້າຍທະບຽນ</th>
                  <th className="text-left p-2">ປະເພດ</th>
                  <th className="text-center p-2">ຄວາມຈຸ</th>
                  <th className="text-left p-2">ພະນັກງານຂັບລົດ</th>
                  <th className="text-center p-2">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody>
                {cars.slice(0, 10).map((car: any, index: number) => (
                  <tr key={car._id || index} className="border-b">
                    <td className="p-2 font-medium text-blue-600">{car.car_id}</td>
                    <td className="p-2">{car.car_name}</td>
                    <td className="p-2 font-mono bg-gray-100 rounded px-2">{car.car_registration}</td>
                    <td className="p-2">{car.carType?.carType_name || 'ບໍ່ລະບຸ'}</td>
                    <td className="p-2 text-center">{car.car_capacity} ຄົນ</td>
                    <td className="p-2">
                      {car.user_id ? (
                        <div>
                          <div className="font-medium">{car.user_id.name}</div>
                          <div className="text-xs text-gray-500">{car.user_id.employeeId}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">ບໍ່ມີພະນັກງານຂັບລົດ</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {car.user_id?.checkInStatus === 'checked-in' ? (
                        <span className="flex items-center justify-center text-green-600">
                          <FiCheck className="mr-1" /> ກຳລັງໃຊ້
                        </span>
                      ) : (
                        <span className="flex items-center justify-center text-red-600">
                          <FiX className="mr-1" /> ບໍ່ໃຊ້
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
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

export default VehiclesReportComponent;