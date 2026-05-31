function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadBookingImportTemplate() {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Jonglock';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('bookings');
  sheet.columns = [
    { header: 'customer_identifier', key: 'customer_identifier', width: 34 },
    { header: 'booking_date', key: 'booking_date', width: 16 },
    { header: 'booth_code', key: 'booth_code', width: 14 },
    { header: 'product_name', key: 'product_name', width: 28 },
    { header: 'note', key: 'note', width: 30 },
  ];
  sheet.addRow({
    customer_identifier: 'MB000001 หรือ user@email.com หรือ 0812345678',
    booking_date: '2026-05-31',
    booth_code: 'B01',
    product_name: 'ข้าวกล่อง',
    note: 'หมายเหตุไม่บังคับ',
  });
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const guide = workbook.addWorksheet('format');
  const guideRows = [
    ['คอลัมน์', 'จำเป็น', 'รายละเอียด'],
    ['customer_identifier', 'ใช่', 'รหัสลูกค้า mobile_users.public_id หรือ username/email/phone ที่มีอยู่ในระบบ'],
    ['booking_date', 'ใช่', 'วันที่จอง รูปแบบ YYYY-MM-DD เช่น 2026-05-31'],
    ['booth_code', 'ใช่', 'รหัสบูธในตลาดที่เลือก เช่น B01'],
    ['product_name', 'ใช่', 'ชื่อสินค้าที่มีอยู่ในตลาด และประเภทสินค้าต้องตรงกับประเภทของบูธ'],
    ['note', 'ไม่', 'หมายเหตุสำหรับตรวจสอบไฟล์ ไม่ถูกบันทึกในใบจอง'],
  ];
  guideRows.forEach((row) => guide.addRow(row));
  guide.columns = [{ width: 24 }, { width: 12 }, { width: 78 }];
  guide.getRow(1).font = { bold: true };
  guide.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

  const output = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'booking-import-format.xlsx');
}
