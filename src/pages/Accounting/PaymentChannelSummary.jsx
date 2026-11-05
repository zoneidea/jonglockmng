import {formatMoney} from '../../utils/formatters.js';
import {summarizePaymentChannels} from '../../utils/paymentChannels.js';
export default function PaymentChannelSummary({payments}) {
  const channels = summarizePaymentChannels(payments);
  if (!channels.length) return null;
  return <section aria-label="สรุปยอดรับชำระตามช่องทางของรายการที่แสดง" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {channels.map(channel => <div key={channel.key} className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-bold text-slate-600">{channel.label}</p>
      <p className="mt-2 text-xl font-black text-slate-900">{formatMoney(channel.amount)} บาท</p>
      <p className="mt-1 text-xs text-slate-500">{channel.provider} · ชำระแล้ว {channel.transactions} ธุรกรรม</p>
    </div>)}
  </section>;
}
