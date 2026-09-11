import test from 'node:test';
import assert from 'node:assert/strict';
import { isMutation, mutationFeedback } from './mutationFeedback.js';

test('only write requests notify, excluding authentication and opt-out', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.equal(isMutation('/markets/1', { method }), true);
  assert.equal(isMutation('/markets'), false);
  assert.equal(isMutation('/auth/login', { method: 'POST' }), false);
  assert.equal(isMutation('/markets', { method: 'POST', feedback: false }), false);
});

test('success auto-closes at two seconds and preview does not claim a save', () => {
  assert.equal(mutationFeedback({ method: 'PATCH' }, {}).timer, 2000);
  assert.equal(mutationFeedback({}, {}).showConfirmButton, false);
  assert.equal(mutationFeedback({ body: { action: 'preview' } }, {}), null);
  assert.equal(mutationFeedback({}, { data: { mode: 'preview' } }), null);
});

test('partial import remains a warning rather than a success', () => {
  const result = mutationFeedback({}, { data: { mode: 'confirmed', errorCount: 1, successCount: 2 } });
  assert.equal(result.icon, 'warning');
  assert.equal(result.timer, undefined);
});
