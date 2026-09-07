import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { validateAdminForm } from './validateAdminForm.js';

const valid = { username: 'audit_test', password: 'TestOnly@123', name: 'Audit Test', role: 'audit', email: '', phone: '', marketId: '27' };

test('all supported roles pass with valid create fields', () => {
  for (const role of ['audit', 'admin', 'accounting', 'supervisor']) {
    assert.equal(validateAdminForm({ ...valid, role }), '');
  }
});

test('invalid fields and weak passwords are rejected', () => {
  for (const fields of [{ username: 'ab' }, { name: ' ' }, { email: 'invalid' },
    ...['', 'Short@1', 'lowercase@123', 'NoNumberHere@', 'NoSpecial123'].map(password => ({ password }))]) {
    assert.notEqual(validateAdminForm({ ...valid, ...fields }), '');
  }
});

test('edit permits unchanged password but validates a replacement', () => {
  const options = { requireUsername: false, requirePassword: false };
  assert.equal(validateAdminForm({ ...valid, username: '', password: '' }, options), '');
  assert.notEqual(validateAdminForm({ ...valid, password: 'weak' }, options), '');
});

// Exercise the actual submit handler without issuing a real account-creation request.
const app = readFileSync(new URL('../../App.jsx', import.meta.url), 'utf8');
const page = app.slice(app.indexOf('function AdminsPage('));
const submitSource = page.slice(page.indexOf('  async function submit('), page.indexOf('  function openCreateModal('));

test('AdminsPage imports the validator from the dedicated module', () => {
  assert.match(app, /import\s*\{\s*validateAdminForm\s*\}\s*from\s*'\.\/features\/admins\/validateAdminForm\.js'/);
});

test('audit submit posts the account, closes the modal and reloads the list', async () => {
  const calls = [];
  const submit = runInNewContext(`${submitSource}; submit`, {
    validateAdminForm, form: valid, editingAdmin: null, marketRows: [{ id: 27 }],
    mutate: async (...args) => calls.push(['request', ...args]),
    setFormError: () => assert.fail('valid form rejected'),
    setMessage: () => {},
    setModalOpen: value => calls.push(['modal', value]),
    resetForm: () => calls.push(['reset']),
    reloadAdmins: () => calls.push(['reload']),
  });
  await submit({ preventDefault() {} });
  assert.equal(calls[0][1], '/admins');
  assert.equal(calls[0][2].role, 'audit');
  assert.equal(calls[0][2].marketIds[0], 27);
  assert.deepEqual(calls.slice(1), [['modal', false], ['reset'], ['reload']]);
});
