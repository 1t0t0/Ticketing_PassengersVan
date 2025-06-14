// app/dashboard/reports/utils/generators/driversGenerator.ts - สำหรับ drivers report

import { ReportData, FormatCurrencyFunction, Driver } from '../types';

/**
 * สร้างเนื้อหา Drivers Report
 */
export const generateDriversContent = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  const summary = reportData.summary || {};
  const metadata = reportData.metadata || {};
  
  // แยก drivers ที่มีสิทธิ์ กับ ไม่มีสิทธิ์
  const qualifiedDrivers = (reportData.drivers || []).filter((d: Driver) => (d.totalIncome || 0) > 0);
  const nonQualifiedDrivers = (reportData.drivers || []).filter((d: Driver) => (d.totalIncome || 0) === 0);
  
  return `
    <div class="content-section">
      <div class="section-title">👥 ລາຍງານພະນັກງານຂັບລົດ</div>
      
      ${generateDriversStatsGrid(summary, metadata, qualifiedDrivers, formatCurrency)}
      
      ${generateRevenueBox(summary, qualifiedDrivers, nonQualifiedDrivers, metadata, formatCurrency)}
      
      ${generateQualifiedDriversTable(qualifiedDrivers, formatCurrency)}
      
      ${generateNonQualifiedDriversTable(nonQualifiedDrivers, formatCurrency)}
      
      ${generateDriversExplanation()}
    </div>
  `;
};

/**
 * สร้าง Stats Grid สำหรับคนขับ
 */
const generateDriversStatsGrid = (summary: any, metadata: any, qualifiedDrivers: Driver[], formatCurrency: FormatCurrencyFunction): string => {
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">👥 ພະນັກງານຂັບລົດທັງໝົດ</div>
        <div class="stat-value">${summary.totalDrivers || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🏃 ພະນັກງານຂັບລົດທີ່ທຳງານ</div>
        <div class="stat-value">${summary.workingDriversInPeriod || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🎯 ທີ່ມີສິທິ່ຮັບລາຍຮັບ</div>
        <div class="stat-value">${qualifiedDrivers.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">💰 ລາຍຮັບຕໍ່ຄົນທີ່ມີສິທິ່</div>
        <div class="stat-value currency">${formatCurrency(metadata.revenuePerDriver || 0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">💵 ລາຍຮັບລວມພະນັກງານຂັບລົດ</div>
        <div class="stat-value currency">${formatCurrency(summary.totalIncome || 0)}</div>
      </div>
    </div>
  `;
};

/**
 * สร้างกล่องสรุปรายได้
 */
const generateRevenueBox = (summary: any, qualifiedDrivers: Driver[], nonQualifiedDrivers: Driver[], metadata: any, formatCurrency: FormatCurrencyFunction): string => {
  return `
    <div style="background: linear-gradient(135deg, #e8f5e8 0%, #e3f2fd 100%); border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #2e7d32; margin-bottom: 15px; font-size: 18px;">💰 ສະຫຼຸບລາຍຮັບພະນັກງານຂັບລົດ</h3>
      <table style="width: 100%; border: none;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #2e7d32;">${formatCurrency(summary.totalIncome || 0)}</div>
            <div style="font-size: 12px; color: #666;">ລາຍຮັບລວມ (85%)</div>
          </td>
          <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${qualifiedDrivers.length}</div>
            <div style="font-size: 12px; color: #666;">ທຳຄົບ 2 ຮອບ</div>
          </td>
          <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #7b1fa2;">${formatCurrency(metadata.revenuePerDriver || 0)}</div>
            <div style="font-size: 12px; color: #666;">ລາຍຮັບເຊລີ່ຍຕໍ່ຄົນ</div>
          </td>
          <td style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${nonQualifiedDrivers.length}</div>
            <div style="font-size: 12px; color: #666;">ບໍ່ມີສິທິ່ຮັບລາຍຮັບ</div>
          </td>
        </tr>
      </table>
    </div>
  `;
};

/**
 * สร้างตารางคนขับที่มีสิทธิ์
 */
const generateQualifiedDriversTable = (qualifiedDrivers: Driver[], formatCurrency: FormatCurrencyFunction): string => {
  if (qualifiedDrivers.length === 0) {
    return `
      <h3 style="color: #2e7d32; margin: 20px 0 10px 0; font-size: 16px;">
        ✅ ພະນັກງານຂັບລົດທີ່ມີສິທິ່ຮັບລາຍຮັບ (ທຳຄົບ 2 ຮອບ) - 0 ຄົນ
      </h3>
      <p style="text-align: center; color: #666;">ບໍ່ມີພະນັກງານຂັບລົດທີ່ມີສິທິ່ຮັບລາຍຮັບໃນຊ່ວງເວລານີ້</p>
    `;
  }

  const qualifiedRows = qualifiedDrivers.slice(0, 15).map((driver: Driver, index: number) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td><strong>${driver.name || 'ບໍ່ລະບຸ'}</strong></td>
      <td class="text-center">${driver.employeeId || '-'}</td>
      <td class="text-center">${driver.workDays || 0}</td>
      <td class="text-center">
        <span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
          ≥2 ຮອບ ✓
        </span>
      </td>
      <td class="text-right">
        <span style="color: #2e7d32; font-weight: bold; font-size: 14px;">${formatCurrency(driver.totalIncome || 0)}</span>
      </td>
      <td class="text-center">
        <span style="background: #e8f5e8; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
          ມີສິທິ່ຮັບລາຍຮັບ
        </span>
      </td>
      <td class="text-center text-sm">
        ${driver.lastCheckIn 
          ? new Date(driver.lastCheckIn).toLocaleDateString('lo-LA') + '<br>' +
            new Date(driver.lastCheckIn).toLocaleTimeString('lo-LA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : '-'
        }
      </td>
      <td class="text-center text-sm">
        ${driver.lastCheckOut 
          ? new Date(driver.lastCheckOut).toLocaleDateString('lo-LA') + '<br>' +
            new Date(driver.lastCheckOut).toLocaleTimeString('lo-LA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : '-'
        }
      </td>
    </tr>
  `).join('');
  
  return `
    <h3 style="color: #2e7d32; margin: 20px 0 10px 0; font-size: 16px;">
      ✅ ພະນັກງານຂັບລົດທີ່ມີສິທິ່ຮັບລາຍຮັບ (ທຳຄົບ 2 ຮອບ) - ${qualifiedDrivers.length} ຄົນ
    </h3>
    <table>
      <tr class="table-highlight">
        <th class="text-center">#</th>
        <th>ຊື່</th>
        <th class="text-center">ລະຫັດ</th>
        <th class="text-center">ວັນທຳງານ</th>
        <th class="text-center">🎯 ສະຖານະຮອບ</th>
        <th class="text-center">💰 ລາຍຮັບ</th>
        <th class="text-center">ສິທິ່</th>
        <th class="text-center">ເຂົ້າວຽກ (ລ່າສຸດ)</th>
        <th class="text-center">ອອກວຽກ (ລ່າສຸດ)</th>
      </tr>
      ${qualifiedRows}
    </table>
  `;
};

/**
 * สร้างตารางคนขับที่ไม่มีสิทธิ์
 */
const generateNonQualifiedDriversTable = (nonQualifiedDrivers: Driver[], formatCurrency: FormatCurrencyFunction): string => {
  if (nonQualifiedDrivers.length === 0) {
    return '';
  }

  const nonQualifiedRows = nonQualifiedDrivers.slice(0, 10).map((driver: Driver, index: number) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td><strong>${driver.name || 'ບໍ່ລະບຸ'}</strong></td>
      <td class="text-center">${driver.employeeId || '-'}</td>
      <td class="text-center">${driver.workDays || 0}</td>
      <td class="text-center">
        <span style="background: #ffebee; color: #c62828; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
          &lt;2 ຮອບ ✗
        </span>
      </td>
      <td class="text-center">
        <span style="color: #c62828; font-weight: bold;">₭0</span>
      </td>
      <td class="text-center">
        <span style="background: #ffebee; color: #c62828; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
          ບໍ່ມີສິທິ່
        </span>
      </td>
      <td class="text-center text-sm">
        ${driver.lastCheckIn 
          ? new Date(driver.lastCheckIn).toLocaleDateString('lo-LA') + '<br>' +
            new Date(driver.lastCheckIn).toLocaleTimeString('lo-LA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : '-'
        }
      </td>
      <td class="text-center text-sm">
        ${driver.lastCheckOut 
          ? new Date(driver.lastCheckOut).toLocaleDateString('lo-LA') + '<br>' +
            new Date(driver.lastCheckOut).toLocaleTimeString('lo-LA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : '-'
        }
      </td>
    </tr>
  `).join('');
  
  return `
    <h3 style="color: #c62828; margin: 20px 0 10px 0; font-size: 16px;">
      ❌ ພະນັກງານຂັບລົດທີ່ບໍ່ມີສິທິ່ຮັບລາຍຮັບ (ທຳບໍ່ຄົບ 2 ຮອບ) - ${nonQualifiedDrivers.length} ຄົນ
    </h3>
    <table>
      <tr class="table-highlight">
        <th class="text-center">#</th>
        <th>ຊື່</th>
        <th class="text-center">ລະຫັດ</th>
        <th class="text-center">ວັນທຳງານ</th>
        <th class="text-center">🎯 ສະຖານະຮອບ</th>
        <th class="text-center">💰 ລາຍຮັບ</th>
        <th class="text-center">ສິທິ່</th>
        <th class="text-center">ເຂົ້າວຽກ (ລ່າສຸດ)</th>
        <th class="text-center">ອອກວຽກ (ລ່າສຸດ)</th>
      </tr>
      ${nonQualifiedRows}
    </table>
  `;
};

/**
 * สร้างคำอธิบายเงื่อนไขคนขับ
 */
const generateDriversExplanation = (): string => {
  return `
    <div style="margin-top: 20px; padding: 20px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; font-size: 13px;">
      <h4 style="color: #1976d2; margin-bottom: 10px; font-size: 14px;">📋 ເງື່ອນໄຂການຮັບລາຍຮັບສຳລັບພະນັກງານຂັບລົດ:</h4>
      <ul style="margin: 0; padding-left: 20px; color: #1976d2;">
        <li style="margin-bottom: 5px;">ຕ້ອງທຳການເດີນທາງຄົບ <strong>2 ຮອບຕໍ່ວັນ</strong></li>
        <li style="margin-bottom: 5px;">ແຕ່ລະຮອບຕ້ອງມີຜູ້ໂດຍສານ <strong>ອັງນ້ອຍ 80% ຂອງຄວາມຈຸລົດ</strong></li>
        <li style="margin-bottom: 5px;">ລາຍຮັບທັງໝົດ <strong>85%</strong> ຈະຖືກແບ່ງເທົ່າໆກັນລະຫວ່າງພະນັກງານຂັບລົດທີ່ມີສິທິ່</li>
        <li style="margin-bottom: 5px;">ພະນັກງານຂັບລົດທີ່ທຳບໍ່ຄົບ 2 ຮອບ ຈະບໍ່ໄດ້ຮັບລາຍຮັບ</li>
        <li>ຂໍ້ມູນທີ່ສະແດງເປັນຂໍ້ມູນໃນຊ່ວງເວລາທີ່ເລືອກເທົ່ານັ້ນ</li>
      </ul>
    </div>
  `;}