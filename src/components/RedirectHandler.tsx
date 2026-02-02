import { useEffect, useState } from 'react';
import { getDynamicQRCodeByShortCode, recordScan } from '../lib/supabase';
import TransitionScene from './TransitionScene';
import '../redirect.css';

export function RedirectHandler() {
  const [status, setStatus] = useState<'loading' | 'not-found'>('loading');

  useEffect(() => {
    const handleRedirect = async () => {
      const path = window.location.pathname;
      const match = path.match(/^\/r\/([A-Za-z0-9]+)$/);
      if (!match) { setStatus('not-found'); return; }
      const shortCode = match[1];
      const code = await getDynamicQRCodeByShortCode(shortCode);
      if (code) {
        await recordScan(shortCode);
        window.location.href = code.target_url;
      } else { setStatus('not-found'); }
    };
    handleRedirect();
  }, []);

  if (status === 'not-found') {
    return (
      <div className="redirect-container">
        <TransitionScene title="PUIVA MACAU" />
        <div className="redirect-overlay">
          <div className="error-card">
            <div className="error-icon">✕</div>
            <p className="error-message">抱歉，您訪問的活碼連結未找到或已被刪除。</p>
            <button onClick={() => window.location.href = '/'}>返回首頁</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="redirect-container">
      <TransitionScene title="PUIVA MACAU" subtitle="正在跳轉..." />
    </div>
  );
}

export default RedirectHandler;
