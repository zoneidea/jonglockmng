import { useState } from 'react';

export function marketStorageKey(user) {
  return `jonglock.market.v1:${user?.organizationId || ''}:${user?.id || ''}`;
}

function readMarket(key) {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}

export function useSelectedMarket(user, markets) {
  const key = marketStorageKey(user);
  const [selection, setSelection] = useState(() => ({ key, id: readMarket(key) }));
  const savedId = selection.key === key ? selection.id : readMarket(key);
  const market = markets.find((item) => String(item.id) === String(savedId)) || markets[0] || null;
  function selectMarket(id) {
    setSelection({ key, id: String(id) });
    try { localStorage.setItem(key, String(id)); } catch { /* Storage may be disabled. */ }
  }
  return [market?.id || '', selectMarket, market];
}
