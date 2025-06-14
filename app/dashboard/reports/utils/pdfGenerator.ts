// app/dashboard/reports/utils/pdfGenerator.ts - สำหรับสร้าง PDF

import { ReportData, ReportType } from './types';
import { 
  formatDate, 
  getReportTypeName, 
  getReportFileName, 
  generatePDFStyles, 
  generatePDFHeader, 
  generatePDFFooter, 
  generatePeriodInfo 
} from './helpers';
import { generateContentByType } from './contentSelector';

/**
 * สร้าง HTML สำหรับ PDF
 */
export const generatePDFContent = (reportData: ReportData, reportType: ReportType): string => {
  const styles = generatePDFStyles();
  const header = generatePDFHeader(reportType);
  const footer = generatePDFFooter();
  const periodInfo = generatePeriodInfo(reportData.period.startDate, reportData.period.endDate);
  const content = generateContentByType(reportData, reportType);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ລາຍງານ - ${getReportTypeName(reportType)}</title>
      <style>
        ${styles}
      </style>
    </head>
    <body>
      <div class="report-container">
        ${header}
        ${periodInfo}
        ${content}
        ${footer}
      </div>
    </body>
    </html>
  `;
};

/**
 * สร้าง PDF หลักโดยใช้ jsPDF
 */
export const createPDF = async (reportData: ReportData, reportType: ReportType): Promise<void> => {
  try {
    // Import libraries
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    // สร้างเนื้อหา HTML
    const htmlContent = generatePDFContent(reportData, reportType);
    
    // สร้าง element ชั่วคราว
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '794px'; // A4 width in pixels
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    document.body.appendChild(tempDiv);

    // รอให้ fonts โหลด
    await document.fonts.ready;

    // แปลงเป็น canvas
    const canvas = await html2canvas(tempDiv, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight + 80
    });

    // สร้าง PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // เพิ่มหน้าแรก
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // เพิ่มหน้าถัดไป
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // ดาวน์โหลด
    const fileName = getReportFileName(reportType);
    pdf.save(fileName);

    // ลบ element ชั่วคราว
    document.body.removeChild(tempDiv);
    
    console.log('PDF exported successfully:', fileName);

  } catch (error) {
    console.error('Error creating PDF:', error);
    throw error;
  }
};

/**
 * Fallback: ใช้ browser print dialog
 */
export const createPDFBrowserFallback = async (reportData: ReportData, reportType: ReportType): Promise<void> => {
  const htmlContent = generatePDFContent(reportData, reportType);
  
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // แจ้งให้ผู้ใช้เลือก "Save as PDF"
        alert('กรุณาเลือก "Save as PDF" ใน print dialog');
      }, 500);
    };
  } else {
    throw new Error('Cannot open print window');
  }
};