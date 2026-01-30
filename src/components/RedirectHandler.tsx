import { useEffect, useState } from 'react';
import { getDynamicQRCodeByShortCode, recordScan } from '../lib/supabase';

export function RedirectHandler() {
  const [status, setStatus] = useState<'loading' | 'not-found'>('loading');

  useEffect(() => {
    const handleRedirect = async () => {
      // Get the short code from URL path
      const path = window.location.pathname;
      const match = path.match(/^\/r\/([A-Za-z0-9]+)$/);

      if (!match) {
        setStatus('not-found');
        return;
      }

      const shortCode = match[1];
      console.log('Looking up short code:', shortCode);

      // Fetch from Supabase
      const code = await getDynamicQRCodeByShortCode(shortCode);

      if (code) {
        console.log('Found code:', code);

        // Record the scan
        await recordScan(shortCode);

        // Redirect immediately
        window.location.href = code.target_url;
      } else {
        console.log('Code not found for:', shortCode);
        setStatus('not-found');
      }
    };

    handleRedirect();
  }, []);

  if (status === 'not-found') {
    return (
      <div className="redirect-container">
        <div className="redirect-content">
          <div className="error-icon">✕</div>
          <h1>链接不存在</h1>
          <p>抱歉,您访问的活码链接未找到或已被删除。</p>
          <button onClick={() => window.location.href = '/'}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="redirect-container">
      <div className="redirect-content">
        <div className="loading-spinner"></div>
        <p>正在跳转...</p>
      </div>
    </div>
  );
}

export default RedirectHandler;
