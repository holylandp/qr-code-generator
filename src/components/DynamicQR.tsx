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
            dark: config?.useGradient ? '#000000' : (config?.colorDark || '#000000'),
            light: config?.colorLight || '#ffffff',
          },
          errorCorrectionLevel: 'H',
        } as any);

        // 应用自定义样式
        if (config?.useGradient || config?.styleType !== 'square' || config?.logoImage) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return;
          tempCtx.drawImage(canvas, 0, 0);

          ctx.fillStyle = config?.colorLight || '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (config?.useGradient) {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, config?.gradientStart || '#6366f1');
            gradient.addColorStop(1, config?.gradientEnd || '#8b5cf6');
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = config?.colorDark || '#000000';
          }

          const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const moduleSize = canvas.width / Math.sqrt(data.length / 4);
          const moduleCount = Math.round(canvas.width / moduleSize);

          for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
              const x = col * moduleSize;
              const y = row * moduleSize;
              const idx = (Math.floor(y + moduleSize/2) * canvas.width + Math.floor(x + moduleSize/2)) * 4;
              
              if (data[idx] < 128) {
                const size = moduleSize - 1;
                switch (config?.styleType) {
                  case 'rounded':
                    ctx.beginPath();
                    ctx.roundRect(x + 0.5, y + 0.5, size, size, size * 0.3);
                    ctx.fill();
                    break;
                  case 'dot':
                    ctx.beginPath();
                    ctx.arc(x + moduleSize / 2, y + moduleSize / 2, size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                  case 'liquid':
                    ctx.beginPath();
                    ctx.arc(x + moduleSize / 2, y + moduleSize / 2, size * 0.45, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                  default:
                    ctx.fillRect(x + 0.5, y + 0.5, size, size);
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
                ctx.roundRect(
                  x - (config?.logoMargin || 3),
                  y - (config?.logoMargin || 3),
                  logoW + (config?.logoMargin || 3) * 2,
                  logoH + (config?.logoMargin || 3) * 2,
                  config?.logoCornerRadius || 6
                );
                ctx.fill();
              }

              ctx.drawImage(logo, x, y, logoW, logoH);
              setIsLoading(false);
            };
            logo.src = config.logoImage as string;
          } else {
            setIsLoading(false);
          }
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
            加载中...
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

  // 加载所有活码
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
      setError('请输入目标链接地址');
      return;
    }

    // 验证 URL
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
      alert('活码创建成功！');
    } else {
      setError('创建失败，请重试');
    }

    setIsLoading(false);
  };

  const updateTargetUrl = async () => {
    if (!selectedCode || !editUrl.trim()) return;

    // 验证 URL
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
      alert('链接地址更新成功！');
    } else {
      alert('更新失败，请重试');
    }

    setIsLoading(false);
  };

  const deleteCode = async (id: string) => {
    if (!confirm('确定要删除这个活码吗？此操作不可恢复。')) return;

    setIsLoading(true);
    const success = await deleteDynamicQRCode(id);

    if (success) {
      setDynamicCodes((prev) => prev.filter((code) => code.id !== id));
    } else {
      alert('删除失败，请重试');
    }

    setIsLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板！');
    } catch {
      alert('复制失败');
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

  // 生成活码二维码图片
  const generateQRCodeImage = async (code: DynamicQRCode): Promise<string> => {
    const canvas = document.createElement('canvas');
    const config = code.qr_config as QRCodeConfig;
    const qrUrl = `${baseUrl}/r/${code.short_code}`;
    
    try {
      await QRCode.toCanvas(canvas, qrUrl, {
        width: config?.width || 300,
        margin: config?.margin || 2,
        color: {
          dark: config?.useGradient ? '#000000' : (config?.colorDark || '#000000'),
          light: config?.colorLight || '#ffffff',
        },
        errorCorrectionLevel: config?.correctLevel || 'H',
      } as any);

      // 应用自定义样式
      if (config?.useGradient || config?.styleType !== 'square' || config?.logoImage) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return canvas.toDataURL('image/png');

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return canvas.toDataURL('image/png');
        tempCtx.drawImage(canvas, 0, 0);

        ctx.fillStyle = config?.colorLight || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (config?.useGradient) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, config?.gradientStart || '#6366f1');
          gradient.addColorStop(1, config?.gradientEnd || '#8b5cf6');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = config?.colorDark || '#000000';
        }

        const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const moduleSize = canvas.width / Math.sqrt(data.length / 4);
        const moduleCount = Math.round(canvas.width / moduleSize);

        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            const x = col * moduleSize;
            const y = row * moduleSize;
            const idx = (Math.floor(y + moduleSize/2) * canvas.width + Math.floor(x + moduleSize/2)) * 4;
            
            if (data[idx] < 128) {
              const size = moduleSize - 1;
              switch (config?.styleType) {
                case 'rounded':
                  ctx.beginPath();
                  ctx.roundRect(x + 0.5, y + 0.5, size, size, size * 0.3);
                  ctx.fill();
                  break;
                case 'dot':
                  ctx.beginPath();
                  ctx.arc(x + moduleSize / 2, y + moduleSize / 2, size * 0.4, 0, Math.PI * 2);
                  ctx.fill();
                  break;
                case 'liquid':
                  ctx.beginPath();
                  ctx.arc(x + moduleSize / 2, y + moduleSize / 2, size * 0.45, 0, Math.PI * 2);
                  ctx.fill();
                  break;
                default:
                  ctx.fillRect(x + 0.5, y + 0.5, size, size);
              }
            }
          }
        }

        // 添加Logo
        if (config?.logoImage) {
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            logo.onload = () => {
              const logoW = config?.logoWidth || 60;
              const logoH = config?.logoHeight || 60;
              const x = (canvas.width - logoW) / 2;
              const y = (canvas.height - logoH) / 2;

              if (config?.logoBackgroundColor && config?.logoBackgroundColor !== 'transparent') {
                ctx.fillStyle = config.logoBackgroundColor;
                ctx.beginPath();
                ctx.roundRect(
                  x - (config?.logoMargin || 5),
                  y - (config?.logoMargin || 5),
                  logoW + (config?.logoMargin || 5) * 2,
                  logoH + (config?.logoMargin || 5) * 2,
                  config?.logoCornerRadius || 8
                );
                ctx.fill();
              }

              ctx.drawImage(logo, x, y, logoW, logoH);
              resolve();
            };
            logo.src = config.logoImage as string;
          });
        }
      }

      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('QR generation error:', err);
      return '';
    }
  };

  // 下载活码二维码
  const downloadQRCode = async (code: DynamicQRCode) => {
    const dataUrl = await generateQRCodeImage(code);
    if (!dataUrl) {
      alert('生成二维码失败');
      return;
    }
    const link = document.createElement('a');
    link.download = `qrcode-${code.short_code}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="dynamic-qr-container">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          创建活码
        </button>
        <button
          className={activeTab === 'manage' ? 'active' : ''}
          onClick={() => setActiveTab('manage')}
        >
          管理活码 ({dynamicCodes.length})
        </button>
      </div>

      {/* Create Tab */}
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
              {isLoading ? '创建中...' : '创建活码'}
            </button>
            
            <div className="qr-customization">
              <h3>配置活码</h3>
              <p className="form-hint" style={{ marginBottom: '20px', color: '#64748b' }}>
                在下方输入目标链接地址，活码创建后可随时修改链接而二维码图案不变
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

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="manage-section">
          {isLoading ? (
            <div className="empty-state">
              <p>加载中...</p>
            </div>
          ) : dynamicCodes.length === 0 ? (
            <div className="empty-state">
              <p>暂无活码</p>
              <button onClick={() => setActiveTab('create')}>创建第一个活码</button>
            </div>
          ) : (
            <div className="codes-list">
              {dynamicCodes.map((code) => (
                <div key={code.id} className="code-card">
                  <div className="code-info">
                    <div className="code-header">
                      <span className="short-code">{code.short_code}</span>
                      <span className="scan-count">
                        扫描次数: {code.scan_count}
                      </span>
                    </div>

                    {/* 活码二维码预览 */}
                    <DynamicQRPreview code={code} baseUrl={baseUrl} />
                    
                    <div className="url-section">
                      <label>跳转链接:</label>
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
                          复制
                        </button>
                      </div>
                    </div>

                    <div className="url-section">
                      <label>活码链接:</label>
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
                          复制
                        </button>
                      </div>
                    </div>

                    <div className="code-meta">
                      <span>创建于: {formatDate(code.created_at)}</span>
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
                      下载二维码
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
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCode && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>修改跳转地址</h3>
            <div className="form-group">
              <label>新的目标链接</label>
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
                {isLoading ? '保存中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamicQR;
