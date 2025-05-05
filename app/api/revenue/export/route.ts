// app/api/revenue/export/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Driver from '@/models/Driver';
import Settings from '@/models/Settings';
import * as ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format') || 'excel'; // 'pdf' หรือ 'excel'
    
    // สร้าง query filter ตามวันที่
    const queryDate = new Date(dateParam);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // ดึงข้อมูลตั๋วทั้งหมดของวันนั้น
    const tickets = await Ticket.find({
      createdAt: { $gte: queryDate, $lt: nextDay }
    });

    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    // ดึงการตั้งค่าสำหรับการแบ่งรายได้
    const settings = await Settings.findOne();
    const revenueSharing = settings?.revenueSharing || { company: 10, station: 20, drivers: 70 };

    // คำนวณส่วนแบ่งรายได้
    const parentCompanyShare = totalRevenue * (revenueSharing.company / 100);
    const stationShare = totalRevenue * (revenueSharing.station / 100);
    const driversShare = totalRevenue * (revenueSharing.drivers / 70);

    // นับจำนวนคนขับที่เช็คอินในวันนี้
    const checkedInDrivers = await Driver.countDocuments({
      lastCheckIn: { $gte: queryDate, $lt: nextDay }
    });

    const numberOfDrivers = checkedInDrivers || 1; // ป้องกันการหารด้วย 0
    const perDriverIncome = driversShare / numberOfDrivers;

    if (format === 'excel') {
      // สร้างไฟล์ Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Revenue Report');
      
      // เพิ่มข้อมูลหัวรายงาน
      worksheet.addRow(['REVENUE REPORT', '', '', '']);
      worksheet.addRow(['Date', dateParam, '', '']);
      worksheet.addRow(['', '', '', '']);
      
      // เพิ่มข้อมูลสรุป
      worksheet.addRow(['SUMMARY', '', '', '']);
      worksheet.addRow(['Total Revenue', `฿${totalRevenue.toLocaleString()}`, '', '']);
      worksheet.addRow(['Parent Company Share (10%)', `฿${parentCompanyShare.toLocaleString()}`, '', '']);
      worksheet.addRow(['Station Share (20%)', `฿${stationShare.toLocaleString()}`, '', '']);
      worksheet.addRow(['Drivers Share (70%)', `฿${driversShare.toLocaleString()}`, '', '']);
      worksheet.addRow(['Number of Drivers', numberOfDrivers, '', '']);
      worksheet.addRow(['Per Driver Income', `฿${perDriverIncome.toLocaleString()}`, '', '']);
      worksheet.addRow(['Ticket Count', tickets.length, '', '']);
      worksheet.addRow(['', '', '', '']);
      
      // เพิ่มรายละเอียดตั๋ว
      worksheet.addRow(['TICKET DETAILS', '', '', '']);
      worksheet.addRow(['Ticket Number', 'Price', 'Payment Method', 'Sold At']);
      
      tickets.forEach(ticket => {
        worksheet.addRow([
          ticket.ticketNumber,
          `฿${ticket.price.toLocaleString()}`,
          ticket.paymentMethod.toUpperCase(),
          new Date(ticket.soldAt).toLocaleString()
        ]);
      });
      
      // ปรับแต่งสไตล์
      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 15;
      worksheet.getColumn(3).width = 15;
      worksheet.getColumn(4).width = 22;
      
      // สร้าง buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      // ส่งกลับเป็นไฟล์ Excel
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="revenue_report_${dateParam}.xlsx"`
        }
      });
    } else if (format === 'pdf') {
      // ในกรณีที่เป็น PDF ให้ส่งกลับเป็น JSON ก่อน
      // แล้วใช้ client-side library เช่น jsPDF ในการสร้าง PDF
      return NextResponse.json({
        date: dateParam,
        totalRevenue,
        parentCompanyShare,
        stationShare, 
        driversShare,
        numberOfDrivers,
        perDriverIncome,
        ticketCount: tickets.length,
        tickets: tickets.map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          price: ticket.price,
          paymentMethod: ticket.paymentMethod,
          soldAt: ticket.soldAt
        }))
      });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting revenue data:', error);
    return NextResponse.json({ error: 'Failed to export revenue data' }, { status: 500 });
  }
}