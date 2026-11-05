import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentChannelLabel, summarizePaymentChannels} from '../src/utils/paymentChannels.js';
test('allocated booking payments sum once and paid transactions count distinct attempts', () => {
  const rows = [
    {provider:'reservepay', payment_method:'PROMPTPAY', status:'paid', amount:'100.10', payment_attempt_public_id:'RPA1'},
    {provider:'reservepay', payment_method:'PROMPTPAY', status:'paid', amount:'250.20', payment_attempt_public_id:'RPA1'},
    {provider:'reservepay', payment_method:'PROMPTPAY', status:'failed', amount:'999.00', payment_attempt_public_id:'RPA2'},
    {provider:'manual', status:'paid', amount:'30.00', public_id:'PAY3'},
  ];
  const result = summarizePaymentChannels(rows);
  assert.equal(result[0].amount,350.3); assert.equal(result[0].transactions,1);
  assert.equal(result[1].amount,30); assert.equal(result[1].transactions,1);
  assert.equal(paymentChannelLabel({provider:'reservepay'}),'ไม่ระบุช่องทาง');
});
