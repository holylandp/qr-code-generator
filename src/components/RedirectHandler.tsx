import { useEffect, useState } from 'react';
import { getDynamicQRCodeByShortCode, recordScan } from '../lib/supabase';
import '../redirect.css';

export function RedirectHandler() {
  const [status, setStatus] = useState<'loading' | 'not-found'>('loading');

  useEffect(() => {
    const handleRedirect = async () => {
      const path = window.location.pathname;
      const match = path.match(/^\/r\/([A-Za-z0-9]+)$/);

      if (!match) {
        setStatus('not-found');
        return;
      }

      const shortCode = match[1];
      console.log('Looking up short code:', shortCode);

      const code = await getDynamicQRCodeByShortCode(shortCode);

      if (code) {
        console.log('Found code:', code);
        await recordScan(shortCode);
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
          <h1 className="minecraft-title">
            <span className="char" style={{animationDelay: '0s'}}>澳</span>
            <span className="char" style={{animationDelay: '0.1s'}}>門</span>
            <span className="char" style={{animationDelay: '0.2s'}}>培</span>
            <span className="char" style={{animationDelay: '0.3s'}}>華</span>
            <span className="char" style={{animationDelay: '0.4s'}}>中</span>
            <span className="char" style={{animationDelay: '0.5s'}}>學</span>
          </h1>
          <p className="error-message">抱歉，您訪問的活碼連結未找到或已被刪除。</p>
          <button onClick={() => window.location.href = '/'}>
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="redirect-container">
      <div className="redirect-content">
        <div className="loading-spinner"></div>
        <h1 className="minecraft-title">
          <span className="char" style={{animationDelay: '0s'}}>澳</span>
          <span className="char" style={{animationDelay: '0.1s'}}>門</span>
          <span className="char" style={{animationDelay: '0.2s'}}>培</span>
          <span className="char" style={{animationDelay: '0.3s'}}>華</span>
          <span className="char" style={{animationDelay: '0.4s'}}>中</span>
          <span className="char" style={{animationDelay: '0.5s'}}>學</span>
        </h1>
        <p className="redirect-message">正在跳轉...</p>
      </div>
    </div>
  );
}

export default RedirectHandler;