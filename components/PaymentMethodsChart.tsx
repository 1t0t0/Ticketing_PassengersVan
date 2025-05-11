import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const PaymentMethodsChart = ({ cashPercentage = 65, qrPercentage = 35 }) => {
  // สร้างข้อมูลสำหรับ Pie Chart
  const data = [
    { name: 'CASH', value: cashPercentage },
    { name: 'QR', value: qrPercentage }
  ];

  // กำหนดสีสำหรับแต่ละส่วน
  const COLORS = ['#1E90FF', '#2ECC71']; // น้ำเงิน, เขียว

  return (
    <div className="w-full">
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-around text-center">
        <div>
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">ເງິນສົດ</span>
          </div>
          <p className="text-lg font-bold">{cashPercentage}%</p>
        </div>
        
        <div>
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">ເງິນໂອນ</span>
          </div>
          <p className="text-lg font-bold">{qrPercentage}%</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsChart;