import { useEffect, useState } from 'react';
import { getDynamicQRCodeByShortCode, recordScan } from '../lib/supabase';

export function RedirectHandler() {
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found'>('loading');
  const [targetUrl, setTargetUrl] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleRedirect = async () => {
      const path = window.location.pathname;
      const match = path.match(/^\/r\/([A-Za-z0-9]+)$/);
      if (!match) { setStatus('not-found'); return; }
      const shortCode = match[1];
      const code = await getDynamicQRCodeByShortCode(shortCode);
      if (code) {
        setTargetUrl(code.target_url); setStatus('found');
        await recordScan(shortCode);
      } else { setStatus('not-found'); }
    };
    handleRedirect();
  }, []);

  useEffect(() => {
    if (status === 'found' && targetUrl && countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'found' && countdown === 0 && targetUrl) {
      window.location.href = targetUrl;
    }
  }, [status, targetUrl, countdown]);

  const handleRedirectNow = () => { if (targetUrl) window.location.href = targetUrl; };

  if (status === 'loading') {
    return (
      <div className="redirect-container">
        <div className="redirect-content">
          <div className="loading-spinner"></div>
          <p>正在查找链接...</p>
        </div>
      </div>
    );
  }
  if (status === 'not-found') {
    return (
      <div className="redirect-container">
        <div className="redirect-content">
          <div className="error-icon">✕</div>
          <h1>链接不存在</h1>
          <p>抱歉，您访问的活码链接未找到或已被删除。</p>
          <button onClick={() => window.location.href = '/'}>返回首页</button>
        </div>
      </div>
    );
  }
  return (
    <div className="redirect-container">
      <div className="redirect-content">
        <div className="redirect-icon">↗</div>
        <h1>即将跳转</h1>
        <p>您正在前往:</p>
        <div className="target-url">{targetUrl}</div>
        <p className="countdown">{countdown > 0 ? `${countdown} 秒后自动跳转...` : '正在跳转...'}</p>
        <button onClick={handleRedirectNow} className="redirect-now-btn">立即跳转</button>
      </div>
    </div>
  );
}

export default RedirectHandler;