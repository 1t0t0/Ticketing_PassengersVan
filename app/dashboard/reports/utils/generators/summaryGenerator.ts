// app/dashboard/reports/utils/generators/summaryGenerator.ts - สำหรับสร้างเนื้อหา summary report

import { ReportData, FormatCurrencyFunction } from '../types';

/**
 * สร้างเนื้อหา Summary Report พร้อมข้อมูลตั๋วกลุ่ม
 */
export const generateSummaryContent = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  const stats = reportData.quickStats || {};
  const sales = reportData.sales || {};
  const ticketBreakdown = sales.ticketBreakdown || {};
  
  return `
    <div class="content-section">
      <div class="section-title">📊 ສະຫຼຸບລວມ</div>
      
      <!-- สถิติหลักที่เพิ่มข้อมูลผู้โดยสาร -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">🎫 ປີ້ທີ່ຂາຍ</div>
          <div class="stat-value">${stats.totalTickets || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">👥 ຜູ້ໂດຍສານລວມ</div>
          <div class="stat-value">${stats.totalPassengers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💰 ລາຍຮັບລວມ</div>
          <div class="stat-value currency">${formatCurrency(stats.totalRevenue || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">👨‍✈️ ພະນັກງານຂັບລົດເຂົ້າວຽກ</div>
          <div class="stat-value">${stats.activeDrivers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📈 ລາຄາເຊລີ່ຍ/ໃບ</div>
          <div class="stat-value currency">${formatCurrency(stats.avgTicketPrice || 0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🧮 ລາຄາເຊລີ່ຍ/ຄົນ</div>
          <div class="stat-value currency">${formatCurrency(stats.avgPricePerPassenger || 0)}</div>
        </div>
      </div>
      
      ${generateTicketBreakdownTable(ticketBreakdown, stats, formatCurrency)}
      
      ${generateGeneralSummaryTable(reportData, formatCurrency)}
      
      ${generateGroupTicketNotes(ticketBreakdown, stats)}
    </div>
  `;
};

/**
 * สร้างตารางข้อมูลตั๋วแยกประเภท
 */
const generateTicketBreakdownTable = (ticketBreakdown: any, stats: any, formatCurrency: FormatCurrencyFunction): string => {
  return `
    <div class="section-title" style="margin-top: 30px;">🎫 ລາຍລະອຽດປີ້ແຍກປະເພດ</div>
    <table class="no-break">
      <tr class="table-highlight">
        <th style="width: 20%;">ປະເພດປີ້</th>
        <th class="text-center" style="width: 15%;">ຈຳນວນໃບ</th>
        <th class="text-center" style="width: 15%;">ຜູ້ໂດຍສານ</th>
        <th class="text-center" style="width: 20%;">ລາຍຮັບ</th>
        <th class="text-center" style="width: 15%;">ສັດສ່ວນ</th>
        <th class="text-center" style="width: 15%;">ເຊລີ່ຍ/ກະລຸ່ມ</th>
      </tr>
      <tr>
        <td><strong>👤 ປີ້ບຸກຄົນ</strong></td>
        <td class="text-center">${ticketBreakdown.individual?.count || 0}</td>
        <td class="text-center">${ticketBreakdown.individual?.passengers || 0}</td>
        <td class="text-center currency">${formatCurrency(ticketBreakdown.individual?.revenue || 0)}</td>
        <td class="text-center"><strong>${ticketBreakdown.individual?.percentage || 0}%</strong></td>
        <td class="text-center">1 ຄົນ</td>
      </tr>
      <tr>
        <td><strong>👥 ປີ້ກະລຸ່ມ</strong></td>
        <td class="text-center">${ticketBreakdown.group?.count || 0}</td>
        <td class="text-center">${ticketBreakdown.group?.passengers || 0}</td>
        <td class="text-center currency">${formatCurrency(ticketBreakdown.group?.revenue || 0)}</td>
        <td class="text-center"><strong>${ticketBreakdown.group?.percentage || 0}%</strong></td>
        <td class="text-center">${ticketBreakdown.group?.averageGroupSize || 0} ຄົນ</td>
      </tr>
      <tr style="background: #f8f9fa; font-weight: bold;">
        <td><strong>📊 ລວມທັງໝົດ</strong></td>
        <td class="text-center">${stats.totalTickets || 0}</td>
        <td class="text-center">${stats.totalPassengers || 0}</td>
        <td class="text-center currency">${formatCurrency(stats.totalRevenue || 0)}</td>
        <td class="text-center">100%</td>
        <td class="text-center">${stats.totalTickets > 0 ? Math.round((stats.totalPassengers || 0) / stats.totalTickets) : 0} ຄົນ</td>
      </tr>
    </table>
  `;
};

/**
 * สร้างตารางสรุปทั่วไป
 */
const generateGeneralSummaryTable = (reportData: ReportData, formatCurrency: FormatCurrencyFunction): string => {
  return `
    <table class="no-break" style="margin-top: 20px;">
      <tr class="table-highlight">
        <th style="width: 30%;">ປະເພດ</th>
        <th>ລາຍລະອຽດ</th>
      </tr>
      <tr>
        <td><strong>🎯 ຍອດຂາຍ</strong></td>
        <td>${reportData.sales?.totalTickets || 0} ໃບ ມີຜູ້ໂດຍສານ ${reportData.sales?.totalPassengers || 0} ຄົນ (<span class="currency">${formatCurrency(reportData.sales?.totalRevenue || 0)}</span>)</td>
      </tr>
      <tr>
        <td><strong>🚗 ພະນັກງານຂັບລົດ</strong></td>
        <td>${reportData.drivers?.length || 0} ຄົນທັງໝົດ, <span class="text-success">${reportData.summary?.activeDrivers || 0} ຄົນເຂົ້າວຽກ</span></td>
      </tr>
      <tr>
        <td><strong>💼 ການເງິນ</strong></td>
        <td>
          ບໍລິສັດ <span class="currency">${formatCurrency(reportData.financial?.company?.totalAmount || 0)}</span> | 
          ສະຖານີ <span class="currency">${formatCurrency(reportData.financial?.station?.totalAmount || 0)}</span> | 
          ພະນັກງານຂັບລົດ <span class="currency">${formatCurrency(reportData.financial?.driver?.totalAmount || 0)}</span>
        </td>
      </tr>
    </table>
  `;
};

/**
 * สร้างหมายเหตุเกี่ยวกับตั๋วกลุ่ม
 */
const generateGroupTicketNotes = (ticketBreakdown: any, stats: any): string => {
  return `
    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; font-size: 12px;">
      <h4 style="color: #1976d2; margin-bottom: 10px; font-size: 14px;">📋 ຂໍ້ມູນປີ້ກະລຸ່ມ:</h4>
      <ul style="margin: 0; padding-left: 20px; color: #1976d2;">
        <li style="margin-bottom: 5px;">ປີ້ກະລຸ່ມ 1 ໃບ ສາມາດມີຜູ້ໂດຍສານ <strong>2-10 ຄົນ</strong></li>
        <li style="margin-bottom: 5px;">ລາຄາປີ້ກະລຸ່ມ = <strong>ລາຄາຕໍ່ຄົນ × ຈຳນວນຜູ້ໂດຍສານ</strong></li>
        <li style="margin-bottom: 5px;">ການນັບຍອດຂາຍ = <strong>ຈຳນວນໃບປີ້</strong> (ບໍ່ແມ່ນຈຳນວນຜູ້ໂດຍສານ)</li>
        <li style="margin-bottom: 5px;">ເຊລີ່ຍຜູ້ໂດຍສານຕໍ່ກະລຸ່ມ = <strong>${ticketBreakdown.group?.averageGroupSize || 0} ຄົນ</strong></li>
        <li>ປີ້ກະລຸ່ມຄິດເປັນ <strong>${stats.groupTicketPercentage || 0}%</strong> ຂອງຍອດຂາຍທັງໝົດ</li>
      </ul>
    </div>
  `;
};