import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QRGenerator } from './QRGenerator';
import type { QRCodeConfig } from './QRGenerator';
import {
  createDynamicQRCode,
  getAllDynamicQRCodes,
  updateDynamicQRCodeTarget,
  deleteDynamicQRCode,
  type DynamicQRCode,
} from '../lib/supabase';

// 活码二维码预览组件
function DynamicQRPreview({ code, baseUrl }: { code: DynamicQRCode; baseUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generate = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const config = code.qr_config as QRCodeConfig;
      const qrUrl = `${baseUrl}/r/${code.short_code}`;
      
      try {
        await QRCode.toCanvas(canvas, qrUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: config?.colorLight || '#ffffff',
          },
          errorCorrectionLevel: 'H',
        } as any);

        // 应用自定义样式
        if (config?.useGradient || config?.styleType !== 'square' || config?.logoImage) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const qrData = await QRCode.toDataURL(qrUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: config?.colorLight || '#ffffff',
            },
            errorCorrectionLevel: 'H',
          });

          const tempImg = new Image();
          tempImg.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;
            tempCtx.drawImage(tempImg, 0, 0);

            ctx.fillStyle = config?.colorLight || '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Find module size
            let moduleSize = 1;
            for (let x = 0; x < canvas.width; x++) {
              const idx = (2 * canvas.width + x) * 4;
              if (data[idx] < 128) {
                let darkCount = 0;
                for (let i = x; i < canvas.width && darkCount < 8; i++) {
                  const checkIdx = (2 * canvas.width + i) * 4;
                  if (data[checkIdx] < 128) {
                    darkCount++;
                  } else {
                    break;
                  }
                }
                moduleSize = darkCount;
                break;
              }
            }

            const gridSize = Math.floor((canvas.width - 4) / moduleSize);

            for (let row = 0; row < gridSize; row++) {
              for (let col = 0; col < gridSize; col++) {
                const x = 2 + col * moduleSize;
                const y = 2 + row * moduleSize;
                const centerX = x + moduleSize / 2;
                const centerY = y + moduleSize / 2;
                const idx = (Math.floor(centerY) * canvas.width + Math.floor(centerX)) * 4;

                if (data[idx] < 128) {
                  if (config?.useGradient) {
                    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                    gradient.addColorStop(0, config?.gradientStart || '#6366f1');
                    gradient.addColorStop(1, config?.gradientEnd || '#8b5cf6');
                    ctx.fillStyle = gradient;
                  } else {
                    ctx.fillStyle = config?.colorDark || '#000000';
                  }

                  const size = moduleSize - 0.5;
                  const radius = size * 0.45;

                  switch (config?.styleType) {
                    case 'rounded':
                      ctx.beginPath();
                      const r = size * 0.25;
                      ctx.moveTo(x + r, y);
                      ctx.lineTo(x + size - r, y);
                      ctx.quadraticCurveTo(x + size, y, x + size, y + r);
                      ctx.lineTo(x + size, y + size - r);
                      ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
                      ctx.lineTo(x + r, y + size);
                      ctx.quadraticCurveTo(x, y + size, x, y + size - r);
                      ctx.lineTo(x, y + r);
                      ctx.quadraticCurveTo(x, y, x + r, y);
                      ctx.closePath();
                      ctx.fill();
                      break;
                    case 'dot':
                      ctx.beginPath();
                      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                      ctx.fill();
                      break;
                    case 'liquid':
                      ctx.beginPath();
                      ctx.arc(centerX, centerY, radius * 1.15, 0, Math.PI * 2);
                      ctx.fill();
                      break;
                    default:
                      ctx.fillRect(x, y, size, size);
                  }
                }
              }
            }

            // 添加Logo
            if (config?.logoImage) {
              const logo = new Image();
              logo.crossOrigin = 'anonymous';
              logo.onload = () => {
                const logoW = Math.min(config?.logoWidth || 40, 60);
                const logoH = Math.min(config?.logoHeight || 40, 60);
                const x = (canvas.width - logoW) / 2;
                const y = (canvas.height - logoH) / 2;

                if (config?.logoBackgroundColor && config?.logoBackgroundColor !== 'transparent') {
                  ctx.fillStyle = config.logoBackgroundColor;
                  ctx.beginPath();
                  const lx = x - (config?.logoMargin || 3);
                  const ly = y - (config?.logoMargin || 3);
                  const lw = logoW + (config?.logoMargin || 3) * 2;
                  const lh = logoH + (config?.logoMargin || 3) * 2;
                  const lr = config?.logoCornerRadius || 6;
                  ctx.moveTo(lx + lr, ly);
                  ctx.lineTo(lx + lw - lr, ly);
                  ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + lr);
                  ctx.lineTo(lx + lw, ly + lh - lr);
                  ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - lr, ly + lh);
                  ctx.lineTo(lx + lr, ly + lh);
                  ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - lr);
                  ctx.lineTo(lx, ly + lr);
                  ctx.quadraticCurveTo(lx, ly, lx + lr, ly);
                  ctx.closePath();
                  ctx.fill();
                }

                ctx.drawImage(logo, x, y, logoW, logoH);
                setIsLoading(false);
              };
              logo.src = config.logoImage as string;
            } else {
              setIsLoading(false);
            }
          };
          tempImg.src = qrData;
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('QR preview error:', err);
        setIsLoading(false);
      }
    };

    generate();
  }, [code, baseUrl]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '20px',
      padding: '20px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px'
    }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          style={{ 
            display: isLoading ? 'none' : 'block',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        />
        {isLoading && (
          <div style={{
            width: '200px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            color: '#64748b'
          }}>
            載入中...
          </div>
        )}
      </div>
    </div>
  );
}

export function DynamicQR() {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [dynamicCodes, setDynamicCodes] = useState<DynamicQRCode[]>([]);
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedCode, setSelectedCode] = useState<DynamicQRCode | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrConfig, setQrConfig] = useState<QRCodeConfig>({
    text: '',
    width: 300,
    height: 300,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: 'H',
    margin: 2,
    logoImage: null,
    logoWidth: 60,
    logoHeight: 60,
    logoMargin: 5,
    logoCornerRadius: 8,
    logoBackgroundColor: '#ffffff',
    styleType: 'square',
    gradientStart: '#6366f1',
    gradientEnd: '#8b5cf6',
    useGradient: false,
    backgroundImage: null,
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    loadDynamicCodes();
  }, []);

  const loadDynamicCodes = async () => {
    setIsLoading(true);
    const codes = await getAllDynamicQRCodes();
    setDynamicCodes(codes);
    setIsLoading(false);
  };

  const createDynamicCode = async () => {
    if (!targetUrl.trim()) {
      setError('請輸入目標連結地址');
      return;
    }

    let validUrl = targetUrl;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = 'https://' + validUrl;
    }

    setIsLoading(true);
    setError('');

    const newCode = await createDynamicQRCode(validUrl, qrConfig);

    if (newCode) {
      setDynamicCodes((prev) => [newCode, ...prev]);
      setTargetUrl('');
      setActiveTab('manage');
      alert('活碼建立成功！');
    } else {
      setError('建立失敗，請重試');
    }

    setIsLoading(false);
  };

  const updateTargetUrl = async () => {
    if (!selectedCode || !editUrl.trim()) return;

    let validUrl = editUrl;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = 'https://' + validUrl;
    }

    setIsLoading(true);
    const success = await updateDynamicQRCodeTarget(selectedCode.id, validUrl as string);

    if (success) {
      setDynamicCodes((prev) =>
        prev.map((code) =>
          code.id === selectedCode.id
            ? { ...code, target_url: validUrl as string, updated_at: new Date().toISOString() }
            : code
        )
      );
      setShowEditModal(false);
      setSelectedCode(null);
      setEditUrl('');
      alert('連結地址更新成功！');
    } else {
      alert('更新失敗，請重試');
    }

    setIsLoading(false);
  };

  const deleteCode = async (id: string) => {
    if (!confirm('確定要刪除這個活碼嗎？此操作不可恢復。')) return;

    setIsLoading(true);
    const success = await deleteDynamicQRCode(id);

    if (success) {
      setDynamicCodes((prev) => prev.filter((code) => code.id !== id));
    } else {
      alert('刪除失敗，請重試');
    }

    setIsLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('已複製到剪貼簿！');
    } catch {
      alert('複製失敗');
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateQRCodeImage = async (code: DynamicQRCode): Promise<string> => {
    const canvas = document.createElement('canvas');
    const config = code.qr_config as QRCodeConfig;
    const qrUrl = `${baseUrl}/r/${code.short_code}`;
    const qrConfig = config || {
      width: 300,
      height: 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: 'H' as const,
      margin: 2,
      useGradient: false,
      styleType: 'square' as const,
      gradientStart: '#6366f1',
      gradientEnd: '#8b5cf6',
      logoImage: null,
      logoWidth: 60,
      logoHeight: 60,
      logoMargin: 5,
      logoCornerRadius: 8,
      logoBackgroundColor: '#ffffff',
      backgroundImage: null,
    };
    
    try {
      await QRCode.toCanvas(canvas, qrUrl, {
        width: qrConfig.width,
        margin: qrConfig.margin,
        color: {
          dark: '#000000',
          light: qrConfig.colorLight,
        },
        errorCorrectionLevel: qrConfig.correctLevel,
      } as any);

      if (qrConfig.useGradient || qrConfig.styleType !== 'square' || qrConfig.logoImage) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return canvas.toDataURL('image/png');

        const qrData = await QRCode.toDataURL(qrUrl, {
          width: qrConfig.width,
          margin: qrConfig.margin,
          color: {
            dark: '#000000',
            light: qrConfig.colorLight,
          },
          errorCorrectionLevel: qrConfig.correctLevel,
        });

        return new Promise((resolve) => {
          const tempImg = new Image();
          tempImg.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = qrConfig.width;
            tempCanvas.height = qrConfig.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) {
              resolve(canvas.toDataURL('image/png'));
              return;
            }
            tempCtx.drawImage(tempImg, 0, 0);

            const imageData = tempCtx.getImageData(0, 0, qrConfig.width, qrConfig.height);
            const data = imageData.data;

            let moduleSize = 1;
            for (let x = 0; x < qrConfig.width; x++) {
              const idx = (qrConfig.margin * qrConfig.width + x) * 4;
              if (data[idx] < 128) {
                let darkCount = 0;
                for (let i = x; i < qrConfig.width && darkCount < 8; i++) {
                  const checkIdx = (qrConfig.margin * qrConfig.width + i) * 4;
                  if (data[checkIdx] < 128) {
                    darkCount++;
                  } else {
                    break;
                  }
                }
                moduleSize = darkCount;
                break;
              }
            }

            ctx.fillStyle = qrConfig.colorLight;
            ctx.fillRect(0, 0, qrConfig.width, qrConfig.height);

            const gridSize = Math.floor((qrConfig.width - qrConfig.margin * 2) / moduleSize);

            for (let row = 0; row < gridSize; row++) {
              for (let col = 0; col < gridSize; col++) {
                const x = qrConfig.margin + col * moduleSize;
                const y = qrConfig.margin + row * moduleSize;
                const centerX = x + moduleSize / 2;
                const centerY = y + moduleSize / 2;
                const idx = (Math.floor(centerY) * qrConfig.width + Math.floor(centerX)) * 4;

                if (data[idx] < 128) {
                  if (qrConfig.useGradient) {
                    const gradient = ctx.createLinearGradient(0, 0, qrConfig.width, qrConfig.height);
                    gradient.addColorStop(0, qrConfig.gradientStart);
                    gradient.addColorStop(1, qrConfig.gradientEnd);
                    ctx.fillStyle = gradient;
                  } else {
                    ctx.fillStyle = qrConfig.colorDark;
                  }

                  const size = moduleSize - 0.5;
                  const radius = size * 0.45;

                  switch (qrConfig.styleType) {
                    case 'rounded':
                      ctx.beginPath();
                      const r = size * 0.25;
                      ctx.moveTo(x + r, y);
                      ctx.lineTo(x + size - r, y);
                      ctx.quadraticCurveTo(x + size, y, x + size, y + r);
                      ctx.lineTo(x + size, y + size - r);
                      ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
                      ctx.lineTo(x + r, y + size);
                      ctx.quadraticCurveTo(x, y + size, x, y + size - r);
                      ctx.lineTo(x, y + r);
                      ctx.quadraticCurveTo(x, y, x + r, y);
                      ctx.closePath();
                      ctx.fill();
                      break;
                    case 'dot':
                      ctx.beginPath();
                      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                      ctx.fill();
                      break;
                    case 'liquid':
                      ctx.beginPath();
                      ctx.arc(centerX, centerY, radius * 1.15, 0, Math.PI * 2);
                      ctx.fill();
                      break;
                    default:
                      ctx.fillRect(x, y, size, size);
                  }
                }
              }
            }

            if (qrConfig.logoImage) {
              const logo = new Image();
              logo.crossOrigin = 'anonymous';
              logo.onload = () => {
                const x = (qrConfig.width - qrConfig.logoWidth) / 2;
                const y = (qrConfig.height - qrConfig.logoHeight) / 2;

                if (qrConfig.logoBackgroundColor && qrConfig.logoBackgroundColor !== 'transparent') {
                  ctx.fillStyle = qrConfig.logoBackgroundColor;
                  ctx.beginPath();
                  const lx = x - qrConfig.logoMargin;
                  const ly = y - qrConfig.logoMargin;
                  const lw = qrConfig.logoWidth + qrConfig.logoMargin * 2;
                  const lh = qrConfig.logoHeight + qrConfig.logoMargin * 2;
                  const lr = qrConfig.logoCornerRadius;
                  ctx.moveTo(lx + lr, ly);
                  ctx.lineTo(lx + lw - lr, ly);
                  ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + lr);
                  ctx.lineTo(lx + lw, ly + lh - lr);
                  ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - lr, ly + lh);
                  ctx.lineTo(lx + lr, ly + lh);
                  ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - lr);
                  ctx.lineTo(lx, ly + lr);
                  ctx.quadraticCurveTo(lx, ly, lx + lr, ly);
                  ctx.closePath();
                  ctx.fill();
                }

                ctx.drawImage(logo, x, y, qrConfig.logoWidth, qrConfig.logoHeight);
                resolve(canvas.toDataURL('image/png'));
              };
              logo.src = qrConfig.logoImage;
            } else {
              resolve(canvas.toDataURL('image/png'));
            }
          };
          tempImg.src = qrData;
        });
      } else {
        return canvas.toDataURL('image/png');
      }
    } catch (err) {
      console.error('QR generation error:', err);
      return '';
    }
  };

  const downloadQRCode = async (code: DynamicQRCode) => {
    const dataUrl = await generateQRCodeImage(code);
    if (!dataUrl) {
      alert('生成二維碼失敗');
      return;
    }
    const link = document.createElement('a');
    link.download = `qrcode-${code.short_code}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="dynamic-qr-container">
      <div className="tab-navigation">
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          建立活碼
        </button>
        <button
          className={activeTab === 'manage' ? 'active' : ''}
          onClick={() => setActiveTab('manage')}
        >
          管理活碼 ({dynamicCodes.length})
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="create-section">
          <div className="create-form">
            {error && (
              <div style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                {error}
              </div>
            )}
            
            <button 
              className="create-btn" 
              onClick={createDynamicCode}
              disabled={isLoading}
              style={{
                padding: '16px 48px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '30px',
                width: '100%',
                maxWidth: '300px',
                alignSelf: 'center',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {isLoading ? '建立中...' : '建立活碼'}
            </button>
            
            <div className="qr-customization">
              <h3>配置活碼</h3>
              <p className="form-hint" style={{ marginBottom: '20px', color: '#64748b' }}>
                在下方輸入目標連結地址，活碼建立後可隨時修改連結而二維碼圖案不變
              </p>
              <QRGenerator
                config={{ ...qrConfig, text: targetUrl }}
                onConfigChange={(config) => {
                  setQrConfig(config);
                  setTargetUrl(config.text);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="manage-section">
          {isLoading ? (
            <div className="empty-state">
              <p>載入中...</p>
            </div>
          ) : dynamicCodes.length === 0 ? (
            <div className="empty-state">
              <p>暫無活碼</p>
              <button onClick={() => setActiveTab('create')}>建立第一個活碼</button>
            </div>
          ) : (
            <div className="codes-list">
              {dynamicCodes.map((code) => (
                <div key={code.id} className="code-card">
                  <div className="code-info">
                    <div className="code-header">
                      <span className="short-code">{code.short_code}</span>
                      <span className="scan-count">
                        掃描次數: {code.scan_count}
                      </span>
                    </div>

                    <DynamicQRPreview code={code} baseUrl={baseUrl} />
                    
                    <div className="url-section">
                      <label>跳轉連結:</label>
                      <div className="url-row">
                        <input
                          type="text"
                          value={code.target_url}
                          readOnly
                          className="url-input"
                        />
                        <button
                          onClick={() => copyToClipboard(code.target_url)}
                          className="icon-btn"
                        >
                          複製
                        </button>
                      </div>
                    </div>

                    <div className="url-section">
                      <label>活碼連結:</label>
                      <div className="url-row">
                        <input
                          type="text"
                          value={`${baseUrl}/r/${code.short_code}`}
                          readOnly
                          className="url-input"
                        />
                        <button
                          onClick={() => copyToClipboard(`${baseUrl}/r/${code.short_code}`)}
                          className="icon-btn"
                        >
                          複製
                        </button>
                      </div>
                    </div>

                    <div className="code-meta">
                      <span>建立於: {formatDate(code.created_at)}</span>
                    </div>
                  </div>

                  <div className="code-actions">
                    <button
                      onClick={() => downloadQRCode(code)}
                      className="download-btn"
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      下載二維碼
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCode(code);
                        setEditUrl(code.target_url);
                        setShowEditModal(true);
                      }}
                      className="edit-btn"
                    >
                      修改地址
                    </button>
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="delete-btn"
                      disabled={isLoading}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEditModal && selectedCode && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>修改跳轉地址</h3>
            <div className="form-group">
              <label>新的目標連結</label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)}>取消</button>
              <button 
                onClick={updateTargetUrl} 
                className="confirm-btn"
                disabled={isLoading}
              >
                {isLoading ? '儲存中...' : '確認修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamicQR;
