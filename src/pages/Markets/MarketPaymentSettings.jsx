import { useEffect, useRef, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { FileInput, FileSummary, TextInput } from '../../components/ManagementUi.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { showAlert, showConfirm } from '../../utils/alerts.js';

const manualDefaults = { bankName: '', accountName: '', accountNumber: '', promptpayId: '', qrCodeImageUrl: '', instructions: '' };
const gatewayDefaults = { bankCode: '', accountName: '', accountNumber: '', email: '', phone: '' };

export default function MarketPaymentSettings({ marketId }) {
  const path = `/markets/${marketId}/payment-settings`;
  const { data, loading, error, reload } = useApi(path);
  const { mutate, loading: saving } = useMutation();
  const [mode, setMode] = useState('manual');
  const [manual, setManual] = useState(manualDefaults);
  const [gateway, setGateway] = useState(gatewayDefaults);
  const [image, setImage] = useState(null);
  const lock = useRef(false);
  useEffect(() => {
    if (!data) return;
    setMode(data.mode === 'gateway' || data.contactId || (data.syncState === 'error' && data.recipientDetails?.accountNumber) ? 'gateway' : 'manual');
    setManual({ ...manualDefaults, ...(data.mode === 'manual' ? data.details : {}) });
    setGateway({ ...gatewayDefaults, ...data.recipientDetails });
    setImage(null);
  }, [data]);
  useEffect(() => { if (error) showAlert({ icon: 'error', title: 'โหลดการตั้งค่าไม่สำเร็จ', text: error }); }, [error]);
  const bankLocked = Boolean(data?.contactId);
  const change = (setter, key) => value => setter(current => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    try {
      if (mode === 'gateway' && !gateway.email.trim() && !gateway.phone.trim()) {
        await showAlert({ icon: 'warning', text: 'กรุณากรอกอีเมลหรือเบอร์โทรติดต่อผู้รับเงิน' });
        return;
      }
      if (mode === 'gateway' && !data?.contactId) {
        const confirmed = await showConfirm({ title: 'เปิดใช้ Payment Gateway', text: 'ยืนยันส่งข้อมูลผู้ติดต่อและบัญชีรับเงินนี้ไปลงทะเบียนกับ ReservePay?', confirmButtonText: 'ยืนยันลงทะเบียน' });
        if (!confirmed) return;
      }
      let body = { mode, details: mode === 'manual' ? manual : gateway };
      if (mode === 'manual' && image) {
        const form = new FormData();
        form.append('settings', JSON.stringify(body));
        form.append('paymentQrCodeImage', image);
        body = form;
      }
      await mutate(path, body, 'PUT');
      await reload();
    } catch {
      // The API client reports errors with an Alert; keep the form for correction/retry.
      await reload();
    } finally { lock.current = false; }
  }
  async function disable() {
    if (lock.current) return;
    lock.current = true;
    try {
      const confirmed = await showConfirm({ title: 'ยกเลิกใช้ Payment Gateway', text: 'ยืนยันนำผู้ติดต่อของตลาดนี้ออกจาก ReservePay? ประวัติการชำระเงินในระบบของเราจะยังคงอยู่ และต้องตั้งค่าโอนเงินก่อนรับชำระครั้งต่อไป', confirmButtonText: 'ยืนยันยกเลิก' });
      if (!confirmed) return;
      await mutate(`${path}/disable`, { confirmed: true });
      await reload();
    } catch { await reload(); } finally { lock.current = false; }
  }
  return <Card className="mt-6">
    <h2 className="text-lg font-black text-slate-950">ช่องทางรับชำระเงินของตลาด</h2>
    {loading ? <LoadingBlock /> : error ? <button type="button" onClick={reload} className="mt-4 rounded-xl border px-4 py-2">ลองโหลดอีกครั้ง</button> : <form onSubmit={submit} className="mt-4 space-y-5">
      {data?.mode === 'legacy' ? <p className="text-sm text-slate-600">ตลาดยังใช้การตั้งค่าเดิม เลือกช่องทางและบันทึกเพื่อใช้การตั้งค่าเฉพาะตลาด</p> : null}
      <fieldset disabled={saving} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-3 sm:grid-cols-2">
          {[['manual', 'โอนเงิน / อัปโหลด QR Code'], ['gateway', 'Payment Gateway (ReservePay)']].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-bold ${mode === value ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}>
            <input type="radio" name={`payment-mode-${marketId}`} value={value} disabled={value === 'manual' && Boolean(data?.contactId)} checked={mode === value} onChange={() => setMode(value)} />{label}
          </label>)}
        </div>
        {mode === 'manual' ? <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="ธนาคาร" value={manual.bankName} onChange={change(setManual, 'bankName')} />
          <TextInput label="ชื่อบัญชี" value={manual.accountName} onChange={change(setManual, 'accountName')} />
          <TextInput label="เลขบัญชี" value={manual.accountNumber} onChange={change(setManual, 'accountNumber')} />
          <TextInput label="หมายเลขพร้อมเพย์" value={manual.promptpayId} onChange={change(setManual, 'promptpayId')} />
          <FileInput label="รูปภาพ QR Code สำหรับโอนเงิน" onChange={setImage} />
          {image ? <FileSummary file={image} /> : manual.qrCodeImageUrl ? <img src={manual.qrCodeImageUrl} alt="QR Code รับโอนเงิน" className="h-40 w-40 rounded-xl border object-contain" /> : null}
          <div className="md:col-span-2"><TextInput label="คำแนะนำการโอนเงิน" value={manual.instructions} onChange={change(setManual, 'instructions')} /></div>
        </div> : <>
          <p className="text-sm text-slate-600">บัญชีนี้ใช้ลงทะเบียนผู้รับเงินกับ ReservePay ข้อมูลในระบบจัดเก็บแบบเข้ารหัส การจ่ายเงินออกเป็นอีกขั้นตอนหนึ่ง</p>
          {bankLocked ? <p className="text-sm text-slate-600">ลงทะเบียนข้อมูลผู้รับเงินแล้ว หากต้องการเปลี่ยนบัญชี ให้ยกเลิก Payment Gateway ก่อนลงทะเบียนใหม่</p> : null}
          <fieldset disabled={bankLocked} className="grid gap-4 md:grid-cols-2 disabled:opacity-70">
            <TextInput label="รหัสธนาคาร 3 หลัก" value={gateway.bankCode} onChange={change(setGateway, 'bankCode')} required />
            <TextInput label="ชื่อผู้ถือบัญชี" value={gateway.accountName} onChange={change(setGateway, 'accountName')} required />
            <TextInput label="เลขบัญชีรับเงิน" value={gateway.accountNumber} onChange={change(setGateway, 'accountNumber')} required />
          </fieldset>
          <fieldset disabled={bankLocked} className="grid gap-4 md:grid-cols-2 disabled:opacity-70">
            <TextInput label="อีเมลผู้ติดต่อรับเงิน" value={gateway.email} onChange={change(setGateway, 'email')} type="email" />
            <TextInput label="เบอร์โทรผู้ติดต่อรับเงิน" value={gateway.phone} onChange={change(setGateway, 'phone')} type="tel" />
          </fieldset>
          <p className="text-sm font-bold text-slate-700">สถานะ: {data?.syncState === 'ready' ? 'พร้อมใช้งาน' : data?.syncState === 'syncing' ? 'กำลังเชื่อมต่อ' : data?.syncState === 'error' ? 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบข้อมูลและบันทึกอีกครั้ง' : 'ยังไม่ลงทะเบียน'}</p>
        </>}
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'กำลังบันทึก…' : 'บันทึกช่องทางรับเงิน'}</button>
        {data?.contactId || data?.mode === 'gateway' ? <button type="button" disabled={saving} onClick={disable} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold disabled:opacity-50">ยกเลิกใช้ Payment Gateway</button> : null}
      </div>
    </form>}
  </Card>;
}
