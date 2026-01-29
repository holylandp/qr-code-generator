import { useEffect, useState } from 'react';
import { getDynamicQRCodeByShortCode, recordScan } from './lib/supabase';

function RedirectPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      // 从URL路径获取短码
      const pathParts = window.location.pathname.split('/');
      const shortCode = pathParts[pathParts.length - 1];

      if (!shortCode || shortCode === 'r') {
        setError('无效的短码');
        setLoading(false);
        return;
      }

      try {
        // 查询数据库获取目标URL
        const qrCode = await getDynamicQRCodeByShortCode(shortCode);

        if (!qrCode) {
          setError('活码不存在或已失效');
          setLoading(false);
          return;
        }

        // 记录扫描
        await recordScan(shortCode);

        // 跳转到目标URL
        window.location.href = qrCode.target_url;
      } catch (err) {
        console.error('Redirect error:', err);
        setError('跳转失败，请重试');
        setLoading(false);
      }
    };

    handleRedirect();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>⏳</div>
          <div>正在跳转...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '20px'
      }}>
        <div style={{ 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.1)',
          padding: '40px',
          borderRadius: '16px',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ marginBottom: '10px' }}>跳转失败</h2>
          <p style={{ marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 32px',
              background: '#fff',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default RedirectPage;