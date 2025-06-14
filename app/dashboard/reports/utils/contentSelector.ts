// app/dashboard/reports/utils/contentSelector.ts - สำหรับเลือก content generator

import { ReportData, ReportType } from './types';
import { formatCurrency } from './helpers';
import { generateSummaryContent } from './generators/summaryGenerator';
import { generateDriversContent } from './generators/driversGenerator';
import { 
  generateSalesContent, 
  generateFinancialContent, 
  generateVehiclesContent, 
  generateStaffContent 
} from './generators/otherGenerators';

/**
 * เลือก content generator ตาม report type
 */
export const generateContentByType = (reportData: ReportData, reportType: ReportType): string => {
  switch (reportType) {
    case 'summary':
      return generateSummaryContent(reportData, formatCurrency);
    case 'sales':
      return generateSalesContent(reportData, formatCurrency);
    case 'drivers':
      return generateDriversContent(reportData, formatCurrency);
    case 'financial':
      return generateFinancialContent(reportData, formatCurrency);
    case 'vehicles':
      return generateVehiclesContent(reportData);
    case 'staff':
      return generateStaffContent(reportData);
    default:
      return '<div class="content-section">ບໍ່ມີຂໍ້ມູນ</div>';
  }
};