import { Component } from 'react';
import { recordFrontendError } from '../utils/performance.js';

function buildErrorMessage(error) {
  if (!error) return 'เกิดข้อผิดพลาดในการแสดงผล';
  if (String(error?.message || '').includes('Failed to fetch dynamically imported module')) {
    return 'โหลดหน้าระบบไม่สำเร็จ อาจเกิดจากไฟล์เวอร์ชันใหม่บนเซิร์ฟเวอร์';
  }
  return error.message || 'เกิดข้อผิดพลาดในการแสดงผล';
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    recordFrontendError(error, {
      boundary: this.props.name || 'default',
      componentStack: info?.componentStack || '',
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const title = this.props.title || 'ไม่สามารถแสดงผลหน้านี้ได้';
    const message = buildErrorMessage(this.state.error);
    return (
      <div className="rounded-3xl border border-rose-100 bg-white p-6 text-slate-900 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">Application Error</p>
        <h2 className="mt-2 text-2xl font-extrabold">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={this.handleRetry} className="h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">
            ลองอีกครั้ง
          </button>
          <button type="button" onClick={this.handleReload} className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700">
            โหลดหน้าใหม่
          </button>
        </div>
      </div>
    );
  }
}
