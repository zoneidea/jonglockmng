import { useEffect, useRef, useState } from 'react';
import BankSelect from '../../components/BankSelect.jsx';
import GatewayPaymentTerms from './GatewayPaymentTerms.jsx';
import { Card } from '../../components/Card.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { FileInput, FileSummary, TextInput } from '../../components/ManagementUi.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { showAlert, showConfirm } from '../../utils/alerts.js';

const manualDefaults = { bankCode: '', bankName: '', accountName: '', accountNumber: '', promptpayId: '', qrCodeImageUrl: '', instructions: '' };
const gatewayDefaults = { bankCode: '', accountName: '', accountNumber: '', email: '', phone: '' };

export default function OrganizationPaymentSettings() {
  const path = '/organization-settings/payments';
  const { data, loading, error, reload } = useApi(path);
  const { data: banks = [], loading: banksLoading, error: banksError, reload: reloadBanks } = useApi('/master-data/banks', { initialData: [] });
  const { mutate, loading: saving } = useMutation();
  const [mode, setMode] = useState('manual');
  const [manual, setManual] = useState(manualDefaults);
  const [gateway, setGateway] = useState(gatewayDefaults);
  const [image, setImage] = useState(null);
  const [candidateId, setCandidateId] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    if (!data) return;
    setMode(data.mode === 'gateway' || data.contactId || (data.syncState === 'error' && data.recipientDetails?.accountNumber) ? 'gateway' : 'manual');
    setManual({ ...manualDefaults, ...(data.mode === 'manual' ? data.details : {}) });
    setGateway({ ...gatewayDefaults, ...data.recipientDetails });
    setImage(null);
  }, [data]);
  useEffect(() => { if (error) showAlert({ icon: 'error', title: 'โหลดการตั้งค่าไม่สำเร็จ', text: error }); }, [error]);
  useEffect(() => { if (banksError) showAlert({ icon: 'error', title: 'โหลดรายชื่อธนาคารไม่สำเร็จ', text: banksError }); }, [banksError]);
  const bankLocked = Boolean(data?.contactId);
  const manualBankCode = manual.bankCode || banks.find(bank => bank.nameTh === manual.bankName || bank.shortName === manual.bankName)?.code || '';
  const bankLoadingBlocksSave = mode === 'gateway' && !bankLocked && (banksLoading || Boolean(banksError));
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
      let body = { mode, details: mode === 'manual' ? { ...manual, bankCode: manualBankCode } : gateway };
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
  async function adopt() {
    if (lock.current || !candidateId) return;
    lock.current = true;
    try {
      if (!await showConfirm({ title: 'ใช้การตั้งค่านี้ทั้งองค์กร', text: 'ยืนยันใช้ช่องทางและบัญชีชุดนี้กับทุกตลาด? ข้อมูลรายตลาดเดิมจะยังเก็บไว้', confirmButtonText: 'ยืนยันใช้ร่วมกัน' })) return;
      await mutate(`${path}/adopt`, { sourceMarketId: Number(candidateId), confirmed: true });
      await reload();
    } catch { await reload(); } finally { lock.current = false; }
  }
  async function disable() {
    if (lock.current) return;
    lock.current = true;
    try {
      const confirmed = await showConfirm({ title: 'ยกเลิกใช้ Payment Gateway', text: 'ยืนยันนำผู้ติดต่อขององค์กรนี้ออกจาก ReservePay? ประวัติการชำระเงินในระบบของเราจะยังคงอยู่ และต้องตั้งค่าโอนเงินก่อนรับชำระครั้งต่อไป', confirmButtonText: 'ยืนยันยกเลิก' });
      if (!confirmed) return;
      await mutate(`${path}/disable`, { confirmed: true });
      await reload();
    } catch { await reload(); } finally { lock.current = false; }
  }
  return <Card className="mt-6">
    <h2 className="text-lg font-black text-slate-950">ช่องทางรับชำระเงินขององค์กร</h2>
    <p className="mt-2 text-sm text-slate-600">ทุกตลาดในองค์กรใช้ช่องทางและบัญชีรับเงินชุดเดียวกัน การเปลี่ยนแปลงมีผลกับทุกตลาด</p>
    {data?.migrationConflict ? <div className="mt-4 space-y-3">
      <p className="text-sm text-slate-700">พบการตั้งค่ารายตลาดเดิมหลายชุด กรุณาเลือกชุดที่จะใช้ร่วมกันทั้งองค์กร</p>
      <select aria-label="เลือกการตั้งค่าเดิม" value={candidateId} onChange={event => setCandidateId(event.target.value)} className="w-full rounded-xl border p-3">
        <option value="">เลือกการตั้งค่า</option>
        {(data.candidates || []).map(item => <option key={item.marketId} value={item.marketId}>{item.marketName} • {item.mode === 'gateway' ? 'Payment Gateway' : 'โอนเงิน'} • {item.accountLast4 ? `บัญชีลงท้าย ${item.accountLast4}` : 'ไม่ได้ระบุบัญชี'}</option>)}
      </select>
      <button type="button" disabled={!candidateId || saving} onClick={adopt} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">ใช้การตั้งค่านี้ทั้งองค์กร</button>
    </div> : null}
    {loading ? <LoadingBlock /> : error ? <button type="button" onClick={reload} className="mt-4 rounded-xl border px-4 py-2">ลองโหลดอีกครั้ง</button> : <form onSubmit={submit} className="mt-4 space-y-5">
      {data?.mode === 'legacy' ? <p className="text-sm text-slate-600">เลือกช่องทางรับชำระเงินที่จะใช้ร่วมกันทุกตลาดในองค์กร</p> : null}
      <fieldset disabled={saving || data?.migrationConflict} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-3 sm:grid-cols-2">
          {[['manual', 'โอนเงิน / อัปโหลด QR Code'], ['gateway', 'Payment Gateway (ReservePay)']].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-bold ${mode === value ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}>
            <input type="radio" name="organization-payment-mode" value={value} disabled={value === 'manual' && Boolean(data?.contactId)} checked={mode === value} onChange={() => setMode(value)} />{label}
          </label>)}
        </div>
        {banksError ? <button type="button" onClick={reloadBanks} className="rounded-xl border px-4 py-2 text-sm font-bold">โหลดรายชื่อธนาคารอีกครั้ง</button> : null}
        {mode === 'manual' ? <div className="grid gap-4 md:grid-cols-2">
          <BankSelect banks={banks} loading={banksLoading} value={manualBankCode} legacyName={manual.bankName}
            required={Boolean(manual.accountNumber && !manual.bankName)} onChange={code => setManual(current => ({ ...current, bankCode: code, bankName: banks.find(bank => bank.code === code)?.nameTh || '' }))} />
          <TextInput label="ชื่อบัญชี" value={manual.accountName} onChange={change(setManual, 'accountName')} />
          <TextInput label="เลขบัญชี" value={manual.accountNumber} onChange={change(setManual, 'accountNumber')} />
          <TextInput label="หมายเลขพร้อมเพย์" value={manual.promptpayId} onChange={change(setManual, 'promptpayId')} />
          <FileInput label="รูปภาพ QR Code สำหรับโอนเงิน" onChange={setImage} />
          {image ? <FileSummary file={image} /> : manual.qrCodeImageUrl ? <img src={manual.qrCodeImageUrl} alt="QR Code รับโอนเงิน" className="h-40 w-40 rounded-xl border object-contain" /> : null}
          <div className="md:col-span-2"><TextInput label="คำแนะนำการโอนเงิน" value={manual.instructions} onChange={change(setManual, 'instructions')} /></div>
        </div> : <>
          <GatewayPaymentTerms />
          <p className="text-sm text-slate-600">ข้อมูลบัญชีรับเงินจะถูกจัดเก็บแบบเข้ารหัสและลงทะเบียนกับ ReservePay</p>
          {bankLocked ? <p className="text-sm text-slate-600">ลงทะเบียนข้อมูลผู้รับเงินแล้ว หากต้องการเปลี่ยนบัญชี ให้ยกเลิก Payment Gateway ก่อนลงทะเบียนใหม่</p> : null}
          <fieldset disabled={bankLocked} className="grid gap-4 md:grid-cols-2 disabled:opacity-70">
            <BankSelect label="ธนาคารรับเงิน" banks={banks} loading={banksLoading} value={gateway.bankCode} onChange={change(setGateway, 'bankCode')} required />
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
        <button type="submit" disabled={saving || data?.migrationConflict || bankLoadingBlocksSave} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'กำลังบันทึก…' : 'บันทึกช่องทางรับเงิน'}</button>
        {data?.contactId || data?.mode === 'gateway' ? <button type="button" disabled={saving} onClick={disable} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold disabled:opacity-50">ยกเลิกใช้ Payment Gateway</button> : null}
      </div>
    </form>}
  </Card>;
}
