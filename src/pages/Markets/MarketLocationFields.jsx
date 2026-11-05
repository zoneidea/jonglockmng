import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { showAlert } from '../../utils/alerts.js';

export default function MarketLocationFields({ latitude, longitude, onChange }) {
  const [locating, setLocating] = useState(false);
  const requestId = useRef(0);
  useEffect(() => () => { requestId.current += 1; }, []);

  function locate() {
    if (!navigator.geolocation) {
      showAlert({ icon: 'error', text: 'เบราว์เซอร์นี้ไม่รองรับตำแหน่งปัจจุบัน กรุณากรอกพิกัดเอง' });
      return;
    }
    setLocating(true);
    const id = ++requestId.current;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (id !== requestId.current) return;
      onChange({ latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) });
      setLocating(false);
      showAlert({ text: `ได้รับพิกัดแล้ว (ความคลาดเคลื่อนประมาณ ${Math.round(coords.accuracy)} เมตร) กรุณาตรวจสอบว่าเป็นที่ตั้งตลาดก่อนกดบันทึก` });
    }, (error) => {
      if (id !== requestId.current) return;
      setLocating(false);
      showAlert({ icon: 'error', text: error.code === 1
        ? 'กรุณาอนุญาตตำแหน่งในเบราว์เซอร์ หรือกรอกพิกัดตลาดด้วยตนเอง'
        : 'ไม่สามารถหาตำแหน่งได้ กรุณาลองใหม่หรือกรอกพิกัดตลาดด้วยตนเอง' });
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  return <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
    <span className="text-sm font-bold text-slate-700">พิกัดตลาด</span>
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">ละติจูด<input className="mt-1 w-full rounded-xl border border-slate-200 p-3" type="number" step="any" min="-90" max="90" value={latitude} required={longitude !== ''} onChange={(e) => onChange({ latitude: e.target.value })} /></label>
        <label className="text-sm">ลองจิจูด<input className="mt-1 w-full rounded-xl border border-slate-200 p-3" type="number" step="any" min="-180" max="180" value={longitude} required={latitude !== ''} onChange={(e) => onChange({ longitude: e.target.value })} /></label>
      </div>
      <button type="button" onClick={locate} disabled={locating} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold disabled:opacity-50"><MapPin size={16} />{locating ? 'กำลังหาตำแหน่ง…' : 'ใช้ตำแหน่งปัจจุบัน'}</button>
      <p className="text-xs text-slate-500">ใช้พิกัดนี้แสดงสภาพอากาศของตลาด ปุ่มจะใช้ตำแหน่งเครื่องที่กำลังเปิดเว็บ ไม่ใช่ตำแหน่งตลาดโดยอัตโนมัติ</p>
    </div>
  </div>;
}
