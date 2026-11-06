import { useId, useRef, useState } from 'react';
import { useMutation } from '../../hooks/useApi.js';
import MarketCollectionField from './MarketCollectionField.jsx';
import {DEFAULT_OPEN_DAYS, normalizeOpenDays, OpenDaysCheckboxGroup} from './MarketOpenDaysField.jsx';
import { FileInput, FileSummary, FormPanel, Modal, TextInput } from '../../components/ManagementUi.jsx';

export default function MarketBasicDialog({ market, onClose, onSaved }) {
  const statusId = useId();
  const [name, setName] = useState(market.name || '');
  const [status, setStatus] = useState(market.status || 'active');
  const [collectionMode, setCollectionMode] = useState(market.collection_mode || 'system');
  const [openDays, setOpenDays] = useState(() => { const days = normalizeOpenDays(market.open_days_json); return days.length ? days : DEFAULT_OPEN_DAYS; });
  const [mainImage, setMainImage] = useState(null);
  const { mutate, loading, error } = useMutation();
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current || !name.trim()) return;
    lock.current = true;
    try {
      const payload = new FormData();
      payload.append('name', name.trim());
      payload.append('status', status);
      payload.append('collectionMode', collectionMode);
      payload.append('openDays', JSON.stringify(openDays));
      if (mainImage) payload.append('mainImage', mainImage);
      await mutate(`/markets/${market.id}/basic`, payload, 'PATCH');
      onSaved();
    } catch {
      // The shared request layer displays the failure; keep the form open.
    } finally { lock.current = false; }
  }
  return <Modal open title="แก้ไขข้อมูลเบื้องต้นตลาด" onClose={() => { if (!lock.current) onClose(); }}>
    <FormPanel onSubmit={submit} loading={loading} error={error}>
      <TextInput label="ชื่อตลาด" value={name} onChange={setName} required />
      <MarketCollectionField value={collectionMode} onChange={setCollectionMode} disabled={loading} />
      <div className="space-y-3">
        {market.main_image_url ? <img src={market.main_image_url} alt={market.name} className="h-40 w-full rounded-xl object-cover" /> : null}
        <FileInput label="รูปภาพตลาด" onChange={setMainImage} />
        {mainImage ? <FileSummary file={mainImage} /> : null}
      </div>
      <fieldset disabled={loading}>
        <legend className="mb-2 text-sm font-bold text-slate-600">วันเปิดตลาด</legend>
        <OpenDaysCheckboxGroup value={openDays} onChange={setOpenDays} />
      </fieldset>
      <div>
        <label htmlFor={statusId} className="mb-1.5 block text-sm font-bold text-slate-600">สถานะ</label>
        <select id={statusId} value={status} onChange={(event) => setStatus(event.target.value)} disabled={loading} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60">
          <option value="active">เปิดใช้งาน</option>
          <option value="inactive">ปิดใช้งาน</option>
        </select>
      </div>
    </FormPanel>
  </Modal>;
}
