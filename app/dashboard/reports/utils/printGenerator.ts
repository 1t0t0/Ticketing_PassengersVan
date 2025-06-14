// app/dashboard/reports/utils/printGenerator.ts - สำหรับ print report

import { ReportData, ReportType } from './types';
import { generatePDFContent } from './pdfGenerator';

/**
 * พิมพ์รายงานโดยใช้ iframe
 */
export const printReport = (reportData: ReportData, reportType: ReportType): void => {
  try {
    const htmlContent = generatePDFContent(reportData, reportType);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (error) {
            console.error('Print error:', error);
            // Fallback to new window
            printReportFallback(htmlContent);
          }
          
          // ลบ iframe หลังจาก print
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
        }, 500);
      };
    }
  } catch (error) {
    console.error('Error printing report:', error);
    alert('ເກີດຂໍ້ຜິດພາດໃນການພິມລາຍງານ');
  }
};

/**
 * Fallback: เปิด window ใหม่สำหรับ print
 */
const printReportFallback = (htmlContent: string): void => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
};