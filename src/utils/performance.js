const MAX_METRICS = 120;
const PERFORMANCE_EVENT = 'jonglock.performance.metric';
const ERROR_EVENT = 'jonglock.frontend.error';
let initialized = false;
let cumulativeLayoutShift = 0;

function getMetricStore() {
  if (typeof window === 'undefined') return [];
  if (!window.__JONGLOCK_PERFORMANCE__) window.__JONGLOCK_PERFORMANCE__ = [];
  return window.__JONGLOCK_PERFORMANCE__;
}

function sendMetric(metric) {
  const endpoint = import.meta.env.VITE_PERFORMANCE_ENDPOINT;
  if (!endpoint || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
  try {
    const blob = new Blob([JSON.stringify(metric)], { type: 'application/json' });
    navigator.sendBeacon(endpoint, blob);
  } catch {}
}

export function recordPerformanceMetric(name, value, detail = {}) {
  if (typeof window === 'undefined' || !Number.isFinite(Number(value))) return;
  const metric = {
    name,
    value: Math.round(Number(value)),
    detail,
    path: window.location.pathname,
    at: new Date().toISOString(),
  };
  const store = getMetricStore();
  store.push(metric);
  if (store.length > MAX_METRICS) store.splice(0, store.length - MAX_METRICS);
  window.dispatchEvent(new CustomEvent(PERFORMANCE_EVENT, { detail: metric }));
  sendMetric(metric);
}

export function recordFrontendError(error, detail = {}) {
  if (typeof window === 'undefined') return;
  const payload = {
    name: error?.name || 'Error',
    message: error?.message || String(error || 'Unknown frontend error'),
    stack: error?.stack || '',
    detail,
    path: window.location.pathname,
    at: new Date().toISOString(),
  };
  window.dispatchEvent(new CustomEvent(ERROR_EVENT, { detail: payload }));
  sendMetric({ name: 'frontend_error', value: 1, detail: payload, path: payload.path, at: payload.at });
}

function observePerformanceEntry(type, callback) {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(callback);
    });
    observer.observe({ type, buffered: true });
  } catch {}
}

function recordNavigationTiming() {
  const navigation = performance.getEntriesByType?.('navigation')?.[0];
  if (!navigation) return;
  recordPerformanceMetric('navigation_duration', navigation.duration);
  recordPerformanceMetric('ttfb', navigation.responseStart - navigation.requestStart);
  recordPerformanceMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.startTime);
  recordPerformanceMetric('window_load', navigation.loadEventEnd - navigation.startTime);
}

export function initPerformanceMonitoring() {
  if (initialized || typeof window === 'undefined' || typeof performance === 'undefined') return;
  initialized = true;

  if (document.readyState === 'complete') {
    recordNavigationTiming();
  } else {
    window.addEventListener('load', recordNavigationTiming, { once: true });
  }

  observePerformanceEntry('paint', (entry) => {
    recordPerformanceMetric(entry.name, entry.startTime);
  });

  observePerformanceEntry('largest-contentful-paint', (entry) => {
    recordPerformanceMetric('largest_contentful_paint', entry.startTime);
  });

  observePerformanceEntry('layout-shift', (entry) => {
    if (entry.hadRecentInput) return;
    cumulativeLayoutShift += entry.value || 0;
    recordPerformanceMetric('cumulative_layout_shift', cumulativeLayoutShift * 1000);
  });

  observePerformanceEntry('longtask', (entry) => {
    recordPerformanceMetric('long_task', entry.duration, { startTime: Math.round(entry.startTime) });
  });
}
