import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { classNames } from '../../utils/formatters.js';

const STATUS_LABELS = {
  ready: 'พร้อมนำเข้า',
  missing_product: 'รอสร้างสินค้า',
  imported: 'นำเข้าสำเร็จ',
  error: 'ไม่สำเร็จ',
};

const STATUS_STYLES = {
  ready: 'bg-emerald-100 text-emerald-700',
  missing_product: 'bg-amber-100 text-amber-800',
  imported: 'bg-cyan-100 text-cyan-700',
  error: 'bg-rose-100 text-rose-700',
};

function ImportStatus({ value }) {
  return (
    <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold', STATUS_STYLES[value] || 'bg-slate-100 text-slate-600')}>
      {STATUS_LABELS[value] || value || '-'}
    </span>
  );
}

export function BookingImportPanel({ result, confirming, onConfirm, onClose }) {
  if (!result) return null;
  const isPreview = result.mode === 'preview';
  const rows = Array.isArray(result.rows) ? result.rows : [];

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">
            {isPreview ? 'ตรวจสอบข้อมูลก่อนนำเข้า' : 'ผลการ Import Excel'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPreview
              ? `ทั้งหมด ${result.totalRows || 0} row, พร้อมนำเข้า ${result.readyCount || 0}, รอสร้างสินค้า ${result.missingProductCount || 0}, error ${result.errorCount || 0}`
              : `ทั้งหมด ${result.totalRows || 0} row, สำเร็จ ${result.successCount || 0} ใบจอง, สร้างสินค้า ${result.createdProductCount || 0}, error ${result.errorCount || 0} row`}
          </p>
          {isPreview && result.missingProducts?.length ? (
            <p className="mt-2 text-sm font-bold text-amber-700">
              พบสินค้าที่ยังไม่มีในระบบ: {result.missingProducts.map((item) => `${item.name}${item.categoryName ? ` (${item.categoryName})` : ''}`).join(', ')}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {isPreview ? (
            <button
              type="button"
              disabled={confirming || !rows.length || Number(result.errorCount || 0) > 0}
              onClick={onConfirm}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming ? 'กำลังบันทึก...' : 'ยืนยันการนำเข้าไฟล์'}
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
            ปิดผลลัพธ์
          </button>
        </div>
      </div>

      <DataTable
        columns={['Row', 'customer_identifier', 'booking_date', 'booth_code', 'product_name', 'note', 'สถานะ', 'สาเหตุ / เลขที่ใบจอง']}
        rows={rows.map((item) => [
          item.rowNumber,
          item.customerIdentifier || '-',
          item.bookingDate || '-',
          item.boothCode || '-',
          item.productName || '-',
          item.note || '-',
          <ImportStatus key={`status-${item.rowNumber}`} value={item.status} />,
          item.publicId || item.message || '-',
        ])}
      />
    </Card>
  );
}
