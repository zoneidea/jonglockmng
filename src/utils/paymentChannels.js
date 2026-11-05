const labels = {MANUAL_TRANSFER: 'โอนเงิน / แนบสลิป', PROMPTPAY: 'PromptPay QR', K_PLUS: 'K PLUS', CARD: 'บัตรเครดิต / เดบิต', BBL: 'Bangkok Bank', TTB_TOUCH: 'ttb touch', MAKE: 'MAKE by KBank', KRUNGTHAI_NEXT: 'Krungthai NEXT', SCB_EASY: 'SCB EASY', KMA: 'krungsri', PAOTANG: 'Paotang'};
export function providerLabel(provider) {return ({reservepay: 'ReservePay', manual: 'โอนเงิน / แนบสลิป', ksher: 'Ksher', mock: 'ทดสอบ'})[provider] || provider || '-';}
export function paymentChannelLabel(row) {return row.payment_method_display_name || labels[row.payment_method] || row.payment_method || (row.provider === 'manual' ? labels.MANUAL_TRANSFER : 'ไม่ระบุช่องทาง');}
export function paymentChannelOptions(rows) {
  const options = new Map(Object.entries(labels));
  rows.forEach(row => {if(row.payment_method) options.set(row.payment_method, paymentChannelLabel(row));});
  return [...options];
}
export function summarizePaymentChannels(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (row.status !== 'paid') continue;
    const key = `${row.provider}:${row.payment_method || ''}`;
    if (!groups.has(key)) groups.set(key, {key, label: paymentChannelLabel(row), provider: providerLabel(row.provider), amountMinor: 0, transactions: new Set()});
    const group = groups.get(key);
    group.amountMinor += Math.round(Number(row.amount || 0) * 100);
    group.transactions.add(row.payment_attempt_public_id || row.public_id);
  }
  return [...groups.values()].map(({transactions, amountMinor, ...group}) => ({...group, amount: amountMinor / 100, transactions: transactions.size}));
}
