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
  const XLSX = await import('xlsx');
  const rows = [
    {
      customer_identifier: 'MB000001 หรือ user@email.com หรือ 0812345678',
      booking_date: '2026-05-31',
      booth_code: 'B01',
      product_name: 'ข้าวกล่อง',
      note: 'หมายเหตุไม่บังคับ',
    },
  ];
  const guideRows = [
    ['คอลัมน์', 'จำเป็น', 'รายละเอียด'],
    ['customer_identifier', 'ใช่', 'รหัสลูกค้า mobile_users.public_id หรือ username/email/phone ที่มีอยู่ในระบบ'],
    ['booking_date', 'ใช่', 'วันที่จอง รูปแบบ YYYY-MM-DD เช่น 2026-05-31'],
    ['booth_code', 'ใช่', 'รหัสบูธในตลาดที่เลือก เช่น B01'],
    ['product_name', 'ใช่', 'ชื่อสินค้าที่มีอยู่ในตลาด และประเภทสินค้าต้องตรงกับประเภทของบูธ'],
    ['note', 'ไม่', 'หมายเหตุสำหรับตรวจสอบไฟล์ ไม่ถูกบันทึกในใบจอง'],
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'bookings');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(guideRows), 'format');
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'booking-import-format.xlsx');
}
