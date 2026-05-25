import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, MessageSquareText, RefreshCw, Send, Tag } from 'lucide-react';
import { request } from '../../api/client.js';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { SectionTitle } from '../../components/SectionTitle.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../state/auth.jsx';
import { classNames, formatDate, normalizeRows } from '../../utils/formatters.js';

const defaultForm = {
  category: 'issue',
  topic: 'booking',
  priority: 'normal',
  subject: '',
  message: '',
  tagOrganization: true,
  eventLogIds: [],
};

function FieldLabel({ children }) {
  return <span className="mb-1.5 block text-sm font-bold text-slate-600">{children}</span>;
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ActionButton({ children, tone = 'slate', disabled = false, onClick, type = 'button' }) {
  const tones = {
    slate: 'bg-slate-950 text-white hover:bg-slate-800',
    cyan: 'bg-cyan-600 text-white hover:bg-cyan-700',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classNames('inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50', tones[tone])}>
      {children}
    </button>
  );
}

function eventLogLabel(log) {
  if (!log) return '-';
  return `#${log.id} ${log.method} ${log.path} (${log.status_code})`;
}

export function SupportPage() {
  const { token, user } = useAuth();
  const { data: categoryData = {}, loading: categoriesLoading } = useApi('/support/categories', { initialData: {} });
  const { data: tickets = [], loading: ticketsLoading, reload: reloadTickets } = useApi('/support/tickets', { initialData: [] });
  const { data: eventLogs = [] } = useApi('/support/event-logs/recent?limit=30', { initialData: [] });
  const [form, setForm] = useState(defaultForm);
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatAttachments, setChatAttachments] = useState([]);
  const [chatSaving, setChatSaving] = useState(false);

  const categories = categoryData.categories || [];
  const topics = categoryData.topics || [];
  const priorities = categoryData.priorities || [];
  const ticketRows = normalizeRows(tickets);
  const eventLogRows = normalizeRows(eventLogs);
  const isInquiry = selectedTicket?.category === 'inquiry';

  const selectedEventLogLabels = useMemo(() => {
    const selected = new Set(form.eventLogIds.map(String));
    return eventLogRows.filter((eventLog) => selected.has(String(eventLog.id))).map(eventLogLabel);
  }, [eventLogRows, form.eventLogIds]);

  async function loadTicket(ticketId = selectedTicketId) {
    if (!ticketId) return;
    const detail = await request(`/support/tickets/${ticketId}`, { token });
    setSelectedTicket(detail.data);
    const messagePayload = await request(`/support/tickets/${ticketId}/messages`, { token });
    setMessages(normalizeRows(messagePayload.data));
  }

  useEffect(() => {
    if (!selectedTicketId) return;
    loadTicket(selectedTicketId).catch((err) => setError(err.message || 'โหลด ticket ไม่สำเร็จ'));
  }, [selectedTicketId]);

  useEffect(() => {
    if (!selectedTicketId || selectedTicket?.category !== 'inquiry') return undefined;
    const timer = setInterval(async () => {
      const lastId = messages[messages.length - 1]?.id || 0;
      const payload = await request(`/support/tickets/${selectedTicketId}/messages?afterId=${lastId}`, { token });
      const newMessages = normalizeRows(payload.data);
      if (newMessages.length) {
        setMessages((current) => current.concat(newMessages.filter((item) => !current.some((existing) => existing.id === item.id))));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedTicketId, selectedTicket?.category, messages, token]);

  async function submitTicket(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('category', form.category);
      body.append('topic', form.topic);
      body.append('priority', form.category === 'issue' ? form.priority : '');
      body.append('subject', form.subject);
      body.append('message', form.message);
      body.append('tagOrganization', form.tagOrganization ? 'true' : 'false');
      body.append('taggedOrganizationId', form.tagOrganization ? String(user?.organizationId || '') : '');
      body.append('eventLogIds', JSON.stringify(form.eventLogIds));
      attachments.forEach((file) => body.append('attachments', file));
      const payload = await request('/support/tickets', { method: 'POST', body, token });
      setForm(defaultForm);
      setAttachments([]);
      await reloadTickets();
      setSelectedTicketId(String(payload.data.id));
    } catch (err) {
      setError(err.message || 'ส่งข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function submitChat(event) {
    event.preventDefault();
    if (!selectedTicketId || !chatMessage.trim()) return;
    setChatSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('message', chatMessage);
      chatAttachments.forEach((file) => body.append('attachments', file));
      await request(`/support/tickets/${selectedTicketId}/messages`, { method: 'POST', body, token });
      setChatMessage('');
      setChatAttachments([]);
      await loadTicket(selectedTicketId);
      await reloadTickets();
    } catch (err) {
      setError(err.message || 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setChatSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="แจ้งปัญหา/ข้อเสนอแนะ/สอบถาม"
        description="บันทึกข้อมูลไว้เพื่อเตรียมต่อยอดเป็นระบบหลังบ้านของแพลตฟอร์ม และผูกกับ event log ได้"
        action={<ActionButton onClick={reloadTickets}><RefreshCw size={16} /> โหลดใหม่</ActionButton>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card>
          <SectionTitle icon={MessageSquareText} title="ส่งเรื่องใหม่" description="กรอกข้อมูลได้อย่างอิสระ พร้อมแนบรูปภาพประกอบหลายรูป" />
          {error ? <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {categoriesLoading ? <LoadingBlock /> : (
            <form onSubmit={submitTicket} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField label="หมวดหมู่" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} options={categories} />
                <SelectField label="หัวข้อ" value={form.topic} onChange={(value) => setForm((current) => ({ ...current, topic: value }))} options={topics} />
              </div>
              <SelectField label="ระดับความสำคัญ (เฉพาะแจ้งปัญหา)" value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} options={priorities} disabled={form.category !== 'issue'} />
              <label className="block">
                <FieldLabel>หัวเรื่อง</FieldLabel>
                <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <FieldLabel>รายละเอียด</FieldLabel>
                <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required rows={6} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.tagOrganization} onChange={(event) => setForm((current) => ({ ...current, tagOrganization: event.target.checked }))} />
                <Tag size={16} className="text-cyan-700" />
                แท็กองค์กรนี้ #{user?.organizationId || '-'}
              </label>
              <label className="block">
                <FieldLabel>ผูกกับ Event log ล่าสุด</FieldLabel>
                <select
                  multiple
                  value={form.eventLogIds.map(String)}
                  onChange={(event) => setForm((current) => ({ ...current, eventLogIds: Array.from(event.target.selectedOptions).map((option) => option.value) }))}
                  className="min-h-32 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                >
                  {eventLogRows.map((eventLog) => <option key={eventLog.id} value={eventLog.id}>{eventLogLabel(eventLog)}</option>)}
                </select>
                {selectedEventLogLabels.length ? <p className="mt-2 text-xs text-slate-500">{selectedEventLogLabels.length} event selected</p> : null}
              </label>
              <label className="block">
                <FieldLabel>แนบรูปภาพ</FieldLabel>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => setAttachments(Array.from(event.target.files || []))} className="block w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-cyan-700" />
                {attachments.length ? <p className="mt-2 text-sm font-semibold text-slate-600">เลือกแล้ว {attachments.length} รูป</p> : null}
              </label>
              <ActionButton type="submit" tone="cyan" disabled={saving}>{saving ? 'กำลังส่ง...' : 'ส่งเรื่อง'}</ActionButton>
            </form>
          )}
        </Card>

        <div className="grid gap-6">
          <Card>
            <SectionTitle icon={Tag} title="รายการที่ส่งแล้ว" description="ข้อมูลถูกเก็บใน MySQL พร้อม attachment, org tag และ event log ที่เกี่ยวข้อง" />
            {ticketsLoading ? <LoadingBlock /> : ticketRows.length ? (
              <DataTable
                columns={['เลขที่', 'ประเภท', 'หัวข้อ', 'ความสำคัญ', 'สถานะ', 'อัปเดต', 'จัดการ']}
                rows={ticketRows.map((ticket) => [
                  `#${ticket.id}`,
                  ticket.category,
                  ticket.subject,
                  ticket.priority || '-',
                  <StatusBadge value={ticket.status} />,
                  formatDate(ticket.updated_at || ticket.created_at),
                  <ActionButton onClick={() => setSelectedTicketId(String(ticket.id))} tone="emerald">เปิด</ActionButton>,
                ])}
              />
            ) : <EmptyState title="ยังไม่มีรายการ" description="ส่งเรื่องแรกเพื่อเริ่มบันทึกข้อมูลสำหรับระบบ support" />}
          </Card>

          {selectedTicket ? (
            <Card>
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">Ticket #{selectedTicket.id}</p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-950">{selectedTicket.subject}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedTicket.category} / {selectedTicket.topic} / {selectedTicket.priority || '-'}</p>
                </div>
                <StatusBadge value={selectedTicket.status} />
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{selectedTicket.message}</div>
              {selectedTicket.attachments?.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {selectedTicket.attachments.map((attachment) => (
                    <a key={attachment.id} href={attachment.file_url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img src={attachment.file_url} alt={attachment.file_name || 'attachment'} className="h-28 w-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : null}
              {selectedTicket.eventLogs?.length ? (
                <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                  <p className="text-sm font-extrabold text-cyan-900">Event logs ที่ผูกไว้</p>
                  <div className="mt-2 space-y-1 text-xs text-cyan-900">
                    {selectedTicket.eventLogs.map((log) => <p key={log.id}>#{log.id} {log.method} {log.path} ({log.status_code})</p>)}
                  </div>
                </div>
              ) : null}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-extrabold text-slate-950">{isInquiry ? 'Real-time chat' : 'ข้อความเพิ่มเติม'}</p>
                  {isInquiry ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">polling ทุก 3 วินาที</span> : null}
                </div>
                <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
                  {messages.length ? messages.map((message) => (
                    <div key={message.id} className={classNames('rounded-2xl px-4 py-3 text-sm', message.sender_type === 'management' ? 'bg-slate-950 text-white' : 'bg-cyan-50 text-slate-800')}>
                      <p className="whitespace-pre-wrap">{message.message}</p>
                      <p className={classNames('mt-2 text-xs', message.sender_type === 'management' ? 'text-slate-300' : 'text-slate-500')}>{formatDate(message.created_at)}</p>
                    </div>
                  )) : <EmptyState title="ยังไม่มีข้อความ" description="ข้อความแรกถูกบันทึกจากรายละเอียด ticket แล้ว" />}
                </div>
                <form onSubmit={submitChat} className="mt-4 space-y-3">
                  <textarea value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" placeholder="พิมพ์ข้อความเพิ่มเติม..." />
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-600">
                      <ImagePlus size={16} />
                      แนบรูป
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(event) => setChatAttachments(Array.from(event.target.files || []))} />
                    </label>
                    <ActionButton type="submit" tone="cyan" disabled={chatSaving || !chatMessage.trim()}><Send size={16} /> {chatSaving ? 'กำลังส่ง...' : 'ส่งข้อความ'}</ActionButton>
                  </div>
                  {chatAttachments.length ? <p className="text-xs font-semibold text-slate-500">แนบรูป {chatAttachments.length} รูป</p> : null}
                </form>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
