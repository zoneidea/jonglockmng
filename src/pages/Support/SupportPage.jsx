import { useEffect, useState } from 'react';
import { ImagePlus, MessageSquareText, Plus, RefreshCw, Send, Tag, X } from 'lucide-react';
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

const defaultTicketForm = {
  category: 'issue',
  topic: 'booking',
  priority: 'normal',
  subject: '',
  message: '',
  tagOrganization: true,
};

const defaultChatForm = {
  subject: '',
  message: '',
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

function SupportModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function statusLabel(value) {
  const labels = {
    opened: 'opened',
    processing: 'processing',
    reply: 'reply',
    closed: 'closed',
  };
  return labels[value] || value || '-';
}

export function SupportPage({ mode = 'ticket' }) {
  const { token, user } = useAuth();
  const isChatMode = mode === 'chat';
  const { data: categoryData = {}, loading: categoriesLoading } = useApi('/support/categories', { initialData: {} });
  const listPath = isChatMode ? '/support/chats' : '/support/tickets?category=ticket';
  const { data: tickets = [], loading: ticketsLoading, reload: reloadTickets } = useApi(listPath, { initialData: [] });
  const [ticketForm, setTicketForm] = useState(defaultTicketForm);
  const [chatForm, setChatForm] = useState(defaultChatForm);
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatAttachments, setChatAttachments] = useState([]);
  const [chatSaving, setChatSaving] = useState(false);

  const categories = (categoryData.categories || []).filter((category) => category.value !== 'inquiry');
  const topics = categoryData.topics || [];
  const priorities = categoryData.priorities || [];
  const rows = normalizeRows(tickets);
  const pageTitle = isChatMode ? 'แชทกับเจ้าหน้าที่' : 'แจ้งปัญหา/สอบถาม';
  const pageDescription = isChatMode
    ? 'สอบถามทั่วไปแบบแชทปกติ ไม่ผูกกับ ticket'
    : 'เปิด ticket สำหรับแจ้งปัญหา ข้อเสนอแนะ และขอฟีเจอร์เพิ่มเติม';

  useEffect(() => {
    setTicketForm(defaultTicketForm);
    setChatForm(defaultChatForm);
    setAttachments([]);
    setSelectedItemId('');
    setSelectedItem(null);
    setMessages([]);
    setTicketModalOpen(false);
  }, [mode]);

  async function loadItem(itemId = selectedItemId) {
    if (!itemId) return;
    const detail = await request(isChatMode ? `/support/chats/${itemId}` : `/support/tickets/${itemId}`, { token });
    setSelectedItem(detail.data);
    const messagePayload = await request(isChatMode ? `/support/chats/${itemId}/messages` : `/support/tickets/${itemId}/messages`, { token });
    setMessages(normalizeRows(messagePayload.data));
  }

  useEffect(() => {
    if (!selectedItemId) return;
    loadItem(selectedItemId).catch((err) => setError(err.message || 'โหลดข้อมูลไม่สำเร็จ'));
  }, [selectedItemId]);

  useEffect(() => {
    if (!selectedItemId || !isChatMode) return undefined;
    const timer = setInterval(async () => {
      const lastId = messages[messages.length - 1]?.id || 0;
      const payload = await request(`/support/chats/${selectedItemId}/messages?afterId=${lastId}`, { token });
      const newMessages = normalizeRows(payload.data);
      if (newMessages.length) {
        setMessages((current) => current.concat(newMessages.filter((item) => !current.some((existing) => existing.id === item.id))));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedItemId, isChatMode, messages, token]);

  async function submitTicket(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('category', ticketForm.category);
      body.append('topic', ticketForm.topic);
      body.append('priority', ticketForm.category === 'issue' ? ticketForm.priority : '');
      body.append('subject', ticketForm.subject);
      body.append('message', ticketForm.message);
      body.append('tagOrganization', ticketForm.tagOrganization ? 'true' : 'false');
      body.append('taggedOrganizationId', ticketForm.tagOrganization ? String(user?.organizationId || '') : '');
      attachments.forEach((file) => body.append('attachments', file));
      const payload = await request('/support/tickets', { method: 'POST', body, token });
      setTicketForm(defaultTicketForm);
      setAttachments([]);
      setTicketModalOpen(false);
      await reloadTickets();
      setSelectedItemId(String(payload.data.id));
    } catch (err) {
      setError(err.message || 'ส่งข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function submitChatStart(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('subject', chatForm.subject || 'สอบถามทั่วไป');
      body.append('message', chatForm.message);
      attachments.forEach((file) => body.append('attachments', file));
      const payload = await request('/support/chats', { method: 'POST', body, token });
      setChatForm(defaultChatForm);
      setAttachments([]);
      await reloadTickets();
      setSelectedItemId(String(payload.data.id));
    } catch (err) {
      setError(err.message || 'เริ่มแชทไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function submitChatMessage(event) {
    event.preventDefault();
    if (!selectedItemId || !chatMessage.trim()) return;
    setChatSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('message', chatMessage);
      chatAttachments.forEach((file) => body.append('attachments', file));
      await request(isChatMode ? `/support/chats/${selectedItemId}/messages` : `/support/tickets/${selectedItemId}/messages`, { method: 'POST', body, token });
      setChatMessage('');
      setChatAttachments([]);
      await loadItem(selectedItemId);
      await reloadTickets();
    } catch (err) {
      setError(err.message || 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setChatSaving(false);
    }
  }

  const ticketFormContent = (
    <form onSubmit={submitTicket} className="space-y-4">
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="หมวดหมู่" value={ticketForm.category} onChange={(value) => setTicketForm((current) => ({ ...current, category: value }))} options={categories} />
        <SelectField label="หัวข้อ" value={ticketForm.topic} onChange={(value) => setTicketForm((current) => ({ ...current, topic: value }))} options={topics} />
      </div>
      <SelectField label="ระดับความสำคัญ (เฉพาะแจ้งปัญหา)" value={ticketForm.priority} onChange={(value) => setTicketForm((current) => ({ ...current, priority: value }))} options={priorities} disabled={ticketForm.category !== 'issue'} />
      <label className="block">
        <FieldLabel>หัวเรื่อง</FieldLabel>
        <input value={ticketForm.subject} onChange={(event) => setTicketForm((current) => ({ ...current, subject: event.target.value }))} required className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
      </label>
      <label className="block">
        <FieldLabel>รายละเอียด</FieldLabel>
        <textarea value={ticketForm.message} onChange={(event) => setTicketForm((current) => ({ ...current, message: event.target.value }))} required rows={6} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
      </label>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={ticketForm.tagOrganization} onChange={(event) => setTicketForm((current) => ({ ...current, tagOrganization: event.target.checked }))} />
        <Tag size={16} className="text-cyan-700" />
        แท็กองค์กรนี้ #{user?.organizationId || '-'}
      </label>
      <label className="block">
        <FieldLabel>แนบรูปภาพ</FieldLabel>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => setAttachments(Array.from(event.target.files || []))} className="block w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-cyan-700" />
        {attachments.length ? <p className="mt-2 text-sm font-semibold text-slate-600">เลือกแล้ว {attachments.length} รูป</p> : null}
      </label>
      <ActionButton type="submit" tone="cyan" disabled={saving}>{saving ? 'กำลังส่ง...' : 'เปิด Ticket'}</ActionButton>
    </form>
  );

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={(
          <div className="flex flex-wrap gap-2">
            {!isChatMode ? <ActionButton tone="cyan" onClick={() => setTicketModalOpen(true)}><Plus size={16} /> เปิด Ticket</ActionButton> : null}
            <ActionButton onClick={reloadTickets}><RefreshCw size={16} /> โหลดใหม่</ActionButton>
          </div>
        )}
      />

      {!isChatMode ? (
        <SupportModal open={ticketModalOpen} title="เปิด Ticket" onClose={() => setTicketModalOpen(false)}>
          {categoriesLoading ? <LoadingBlock /> : ticketFormContent}
        </SupportModal>
      ) : null}

      {isChatMode ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card>
            <SectionTitle icon={MessageSquareText} title="เริ่มแชทใหม่" description="สอบถามทั่วไปแบบแชทปกติ ไม่ผูกกับ ticket" />
            {error ? <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <form onSubmit={submitChatStart} className="space-y-4">
              <label className="block">
                <FieldLabel>หัวเรื่อง</FieldLabel>
                <input value={chatForm.subject} onChange={(event) => setChatForm((current) => ({ ...current, subject: event.target.value }))} placeholder="สอบถามทั่วไป" className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <FieldLabel>ข้อความ</FieldLabel>
                <textarea value={chatForm.message} onChange={(event) => setChatForm((current) => ({ ...current, message: event.target.value }))} required rows={6} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <FieldLabel>แนบรูปภาพ</FieldLabel>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => setAttachments(Array.from(event.target.files || []))} className="block w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-cyan-700" />
              </label>
              <ActionButton type="submit" tone="cyan" disabled={saving}>{saving ? 'กำลังเริ่มแชท...' : 'เริ่มแชท'}</ActionButton>
            </form>
          </Card>
          <SupportList
            isChatMode
            rows={rows}
            loading={ticketsLoading}
            onOpen={(item) => setSelectedItemId(String(item.id))}
          />
        </div>
      ) : (
        <SupportList
          rows={rows}
          loading={ticketsLoading}
          onOpen={(item) => setSelectedItemId(String(item.id))}
        />
      )}

      {selectedItem ? (
        <Card className="mt-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">{isChatMode ? 'Chat' : 'Ticket'} #{selectedItem.id}</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-950">{selectedItem.subject}</h2>
              {!isChatMode ? <p className="mt-1 text-sm text-slate-500">{selectedItem.category} / {selectedItem.topic} / {selectedItem.priority || '-'}</p> : null}
            </div>
            <StatusBadge value={statusLabel(selectedItem.status)} />
          </div>
          {!isChatMode ? <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{selectedItem.message}</div> : null}
          {selectedItem.attachments?.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {selectedItem.attachments.map((attachment) => (
                <a key={attachment.id} href={attachment.file_url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <img src={attachment.file_url} alt={attachment.file_name || 'attachment'} className="h-28 w-full object-cover" />
                </a>
              ))}
            </div>
          ) : null}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-extrabold text-slate-950">{isChatMode ? 'แชท' : 'ข้อความเพิ่มเติม'}</p>
              {isChatMode ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">polling ทุก 3 วินาที</span> : null}
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
              {messages.length ? messages.map((message) => (
                <div key={message.id} className={classNames('rounded-2xl px-4 py-3 text-sm', message.sender_type === 'management' ? 'bg-slate-950 text-white' : 'bg-cyan-50 text-slate-800')}>
                  <p className="whitespace-pre-wrap">{message.message}</p>
                  <p className={classNames('mt-2 text-xs', message.sender_type === 'management' ? 'text-slate-300' : 'text-slate-500')}>{formatDate(message.created_at)}</p>
                </div>
              )) : <EmptyState title="ยังไม่มีข้อความ" description={isChatMode ? 'เริ่มส่งข้อความในห้องแชทนี้' : 'ข้อความแรกถูกบันทึกจากรายละเอียด ticket แล้ว'} />}
            </div>
            <form onSubmit={submitChatMessage} className="mt-4 space-y-3">
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
    </>
  );
}

function SupportList({ rows, loading, onOpen, isChatMode = false }) {
  return (
    <Card>
      <SectionTitle icon={Tag} title={isChatMode ? 'ห้องแชทของฉัน' : 'Ticket ที่เปิดแล้ว'} description={isChatMode ? 'แสดงรายการแชทสอบถามทั่วไป' : 'สถานะ ticket: opened, processing, reply, closed'} />
      {loading ? <LoadingBlock /> : rows.length ? (
        <DataTable
          columns={isChatMode ? ['ห้องแชท', 'หัวข้อ', 'จำนวนข้อความ', 'สถานะ', 'อัปเดต', 'จัดการ'] : ['เลขที่', 'ประเภท', 'หัวข้อ', 'ความสำคัญ', 'สถานะ', 'อัปเดต', 'จัดการ']}
          rows={rows.map((item) => (isChatMode ? [
            `#${item.id}`,
            item.subject || 'สอบถามทั่วไป',
            Number(item.message_count || 0),
            <StatusBadge value={item.status} />,
            formatDate(item.updated_at || item.last_message_at || item.created_at),
            <ActionButton onClick={() => onOpen(item)} tone="emerald">เปิด</ActionButton>,
          ] : [
            `#${item.id}`,
            item.category,
            item.subject,
            item.priority || '-',
            <StatusBadge value={statusLabel(item.status)} />,
            formatDate(item.updated_at || item.created_at),
            <ActionButton onClick={() => onOpen(item)} tone="emerald">เปิด</ActionButton>,
          ]))}
        />
      ) : <EmptyState title="ยังไม่มีรายการ" description={isChatMode ? 'เริ่มแชทใหม่เพื่อสอบถามเจ้าหน้าที่' : 'เปิด ticket แรกเพื่อเริ่มบันทึกข้อมูล'} />}
    </Card>
  );
}
