// app/dashboard/reports/utils/generators/otherGenerators.ts - สำหรับรายงานอื่นๆ

import { ReportData, FormatCurrencyFunction, PaymentMethod, CarType, Car, Driver, Staff } from '../types';

/**
 * สร้างเนื้อหา Sales Report
 */
export const generateSalesContent = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  const summary = reportData.summary || {};
  let paymentTable = '';
  
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    const paymentRows = reportData.paymentMethods.map((pm: PaymentMethod) => `
      <tr>
        <td><strong>${pm._id === 'cash' ? '💵 ເງິນສົດ' : '📱 ເງິນໂອນ'}</strong></td>
        <td class="text-center">${pm.count}</td>
        <td class="text-right currency">${formatCurrency(pm.revenue)}</td>
        <td class="text-center">${summary.totalTickets ? Math.round((pm.count / summary.totalTickets) * 100) : 0}%</td>
      </tr>
    `).join('');
    
    paymentTable = `
      <table class="no-break">
        <tr class="table-highlight">
          <th>ວິທີຊຳລະ</th>
          <th class="text-center">ຈຳນວນ</th>
          <th class="text-center">ລາຍຮັບ</th>
          <th class="text-center">ສັດສ່ວນ</th>
        </tr>
        ${paymentRows}
        <tr style="background: #f8f9fa; font-weight: bold;">
          <td><strong>📊 ລວມທັງໝົດ</strong></td>
          <td class="text-center">${summary.totalTickets}</td>
          <td class="text-right currency">${formatCurrency(summary.totalRevenue || 0)}</td>
          <td class="text-center">100%</td>
        </tr>
      </table>
    `;
  }
  
  return `
    <div class="content-section">
      <div class="section-title">🎯 ລາຍງານຍອດຂາຍ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍ</div>
          <div class="stat-value">${summary.totalTickets || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(summary.totalRevenue || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📈 ລາຄາເຊລີ່ຍ</div>
          <div class="stat-value currency">${formatCurrency(summary.averagePrice || 0)}</div>
        </div>
      </div>
      
      ${paymentTable || '<p style="text-align: center; color: #666;">ບໍ່ມີຂໍ້ມູນການຊຳລະເງິນ</p>'}
    </div>
  `;
};

/**
 * สร้างเนื้อหา Financial Report
 */
export const generateFinancialContent = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  const breakdown = reportData.breakdown || {};
  
  return `
    <div class="content-section">
      <div class="section-title">💼 ລາຍງານການເງິນ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(reportData.summary?.totalRevenue || 0)}</div>
        </div>
      </div>
      
      <table class="no-break">
        <tr class="table-highlight">
          <th style="width: 20%;">ປະເພດ</th>
          <th class="text-center" style="width: 30%;">ມູນຄ່າ</th>
          <th class="text-center" style="width: 20%;">ເປີເຊັນ</th>
          <th class="text-center">ລາຍການ</th>
        </tr>
        <tr>
          <td><strong>🏢 ບໍລິສັດ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.company?.totalAmount || 0)}</td>
          <td class="text-center text-primary"><strong>10%</strong></td>
          <td class="text-center">${breakdown.company?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr>
          <td><strong>🚉 ສະຖານີ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.station?.totalAmount || 0)}</td>
          <td class="text-center text-success"><strong>5%</strong></td>
          <td class="text-center">${breakdown.station?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr>
          <td><strong>👥 ພະນັກງານຂັບລົດ</strong></td>
          <td class="text-right currency">${formatCurrency(breakdown.driver?.totalAmount || 0)}</td>
          <td class="text-center text-primary"><strong>85%</strong></td>
          <td class="text-center">${breakdown.driver?.transactionCount || 0} ລາຍການ</td>
        </tr>
        <tr style="background: #f8f9fa; font-weight: bold;">
          <td><strong>📊 ລວມທັງໝົດ</strong></td>
          <td class="text-right currency">${formatCurrency(reportData.summary?.totalRevenue || 0)}</td>
          <td class="text-center"><strong>100%</strong></td>
          <td class="text-center">-</td>
        </tr>
      </table>
    </div>
  `;
};

/**
 * สร้างเนื้อหา Vehicles Report
 */
export const generateVehiclesContent = (reportData: ReportData): string => {
  const summary = reportData.summary || {};
  const carTypes = reportData.carTypes || [];
  const cars = reportData.cars || [];
  
  let carTypesTable = '';
  if (carTypes.length > 0) {
    const carTypeRows = carTypes.map((type: CarType) => `
      <tr>
        <td><strong>${type.carType_name}</strong></td>
        <td class="text-center">${type.count}</td>
        <td class="text-center">${summary.totalCars ? Math.round((type.count / summary.totalCars) * 100) : 0}%</td>
        <td class="text-center text-success">${type.activeCars || 0}</td>
        <td class="text-center text-danger">${type.count - (type.activeCars || 0)}</td>
      </tr>
    `).join('');
    
    carTypesTable = `
      <table class="no-break">
        <tr class="table-highlight">
          <th>ປະເພດລົດ</th>
          <th class="text-center">ຈຳນວນ</th>
          <th class="text-center">ສັດສ່ວນ</th>
          <th class="text-center">ກຳລັງໃຊ້</th>
          <th class="text-center">ບໍ່ໃຊ້</th>
        </tr>
        ${carTypeRows}
      </table>
    `;
  }

  let carsTable = '';
  if (cars.length > 0) {
    const carRows = cars.slice(0, 15).map((car: Car, index: number) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td class="text-primary"><strong>${car.car_id || 'N/A'}</strong></td>
        <td>${car.car_name || 'N/A'}</td>
        <td class="text-center">${car.car_registration || 'N/A'}</td>
        <td>${car.carType?.carType_name || 'ບໍ່ລະບຸ'}</td>
        <td class="text-center">${car.car_capacity || 0}</td>
        <td>
          ${car.user_id ? `
            <div><strong>${car.user_id.name}</strong></div>
            <div style="font-size: 10px; color: #666;">${car.user_id.employeeId}</div>
          ` : '<span style="color: #999;">ບໍ່ມີພະນັກງານຂັບລົດ</span>'}
        </td>
        <td class="text-center">
          <span class="${car.user_id?.checkInStatus === 'checked-in' ? 'status-active' : 'status-inactive'}">
            ${car.user_id?.checkInStatus === 'checked-in' ? 'ໃຊ້ງານ' : 'ບໍ່ໃຊ້'}
          </span>
        </td>
      </tr>
    `).join('');
    
    carsTable = `
      <table>
        <tr class="table-highlight">
          <th class="text-center">#</th>
          <th>ລະຫັດລົດ</th>
          <th>ຊື່ລົດ</th>
          <th class="text-center">ປ້າຍທະບຽນ</th>
          <th>ປະເພດ</th>
          <th class="text-center">ຄວາມຈຸ</th>
          <th>ພະນັກງານຂັບລົດ</th>
          <th class="text-center">ສະຖານະ</th>
        </tr>
        ${carRows}
      </table>
    `;
  }
  
  return `
    <div class="content-section">
      <div class="section-title">🚗 ລາຍງານຂໍ້ມູນລົດ</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">🚛 ລົດທັງໝົດ</div>
          <div class="stat-value">${summary.totalCars || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">✅ ລົດກຳລັງໃຊ້</div>
          <div class="stat-value">${summary.activeCars || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🏷️ ປະເພດລົດ</div>
          <div class="stat-value">${summary.totalCarTypes || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">👨‍✈️ ພະນັກງານຂັບລົດທີ່ມີລົດ</div>
          <div class="stat-value">${summary.driversWithCars || 0}</div>
        </div>
      </div>
      
      <div class="section-title">📋 ລາຍລະອຽດປະເພດລົດ</div>
      ${carTypesTable || '<p style="text-align: center; color: #666;">ບໍ່ມີຂໍ້ມູນປະເພດລົດ</p>'}
      
      <div class="section-title">🚗 ລາຍການລົດ (15 ຄັນທຳອິດ)</div>
      ${carsTable || '<p style="text-align: center; color: #666;">ບໍ່ມີຂໍ້ມູນລົດ</p>'}
    </div>
  `;
};

/**
 * สร้างเนื้อหา Staff Report
 */
export const generateStaffContent = (reportData: ReportData): string => {
  const summary = reportData.summary || {};
  const staff = reportData.staff || [];
  
  let staffTable = '';
  if (staff.length > 0) {
    const activeStaff = staff.filter((s: Staff) => (s.ticketsSold || 0) > 0 || s.checkInStatus === 'checked-in').slice(0, 15);
    
    if (activeStaff.length > 0) {
      const staffRows = activeStaff.map((member: Staff, index: number) => {
        return `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td><strong>${member.name || 'ບໍ່ລະບຸ'}</strong></td>
            <td class="text-center">${member.employeeId || '-'}</td>
            <td class="text-center">
              <span class="${member.checkInStatus === 'checked-in' ? 'status-active' : 'status-inactive'}">
                ${member.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
              </span>
            </td>
            <td class="text-center currency">${member.ticketsSold || 0}</td>
            <td class="text-center"><strong>${member.workDays || 0} ວັນ</strong></td>
            <td class="text-center text-sm">
              ${member.lastCheckIn 
                ? new Date(member.lastCheckIn).toLocaleDateString('lo-LA') + '<br>' +
                  new Date(member.lastCheckIn).toLocaleTimeString('lo-LA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : '-'
              }
            </td>
            <td class="text-center text-sm">
              ${member.lastCheckOut 
                ? new Date(member.lastCheckOut).toLocaleDateString('lo-LA') + '<br>' +
                  new Date(member.lastCheckOut).toLocaleTimeString('lo-LA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : '-'
              }
            </td>
          </tr>
        `;
      }).join('');
      
      staffTable = `
        <table>
          <tr class="table-highlight">
            <th class="text-center">#</th>
            <th>ຊື່</th>
            <th class="text-center">ລະຫັດ</th>
            <th class="text-center">ສະຖານະ</th>
            <th class="text-center">ປີ້ທີ່ຂາຍ</th>
            <th class="text-center">ວັນທຳງານ</th>
            <th class="text-center">ເຂົ້າວຽກ (ລ່າສຸດ)</th>
            <th class="text-center">ອອກວຽກ (ລ່າສຸດ)</th>
          </tr>
          ${staffRows}
        </table>
      `;
    }
  }
  
  return `
    <div class="content-section">
      <div class="section-title">👥 ລາຍງານພະນັກງານຂາຍປີ້</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">👥 ພະນັກງານທັງໝົດ</div>
          <div class="stat-value">${summary.totalStaff || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">✅ ເຂົ້າວຽກ</div>
          <div class="stat-value">${summary.activeStaff || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍລວມ</div>
          <div class="stat-value">${summary.totalTicketsSold || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📅 ວັນທຳງານລວມ</div>
          <div class="stat-value">${summary.totalWorkDays || 0} ວັນ</div>
        </div>
      </div>
      
      <div class="section-title">👤 ລາຍລະອຽດການປະຕິບັດງານພະນັກງານ</div>
      ${staffTable || '<p style="text-align: center; color: #666;">ບໍ່ມີຂໍ້ມູນພະນັກງານທີ່ເຂົ້າວຽກໃນຊ່ວງນີ້</p>'}
      
      <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; font-size: 12px;">
        <strong>📝 ໝາຍເຫດ:</strong> ຂໍ້ມູນທີ່ສະແດງເປັນຂໍ້ມູນໃນຊ່ວງເວລາທີ່ເລືອກເທົ່ານັ້ນ 
        (ເຂົ້າ-ອອກວຽກແມ່ນຄັ້ງລ່າສຸດໃນຊ່ວງເວລານັ້ນ)
      </div>
    </div>
  `;
};