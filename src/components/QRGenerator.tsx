import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

export interface QRCodeConfig {
  text: string; width: number; height: number;
  colorDark: string; colorLight: string;
  correctLevel: 'L' | 'M' | 'Q' | 'H'; margin: number;
  logoImage: string | null; logoWidth: number; logoHeight: number;
  logoMargin: number; logoCornerRadius: number; logoBackgroundColor: string;
  styleType: 'square' | 'rounded' | 'dot' | 'liquid';
  gradientStart: string; gradientEnd: string; useGradient: boolean;
  backgroundImage: string | null;
}

const defaultConfig: QRCodeConfig = {
  text: 'https://example.com', width: 300, height: 300,
  colorDark: '#000000', colorLight: '#ffffff', correctLevel: 'H', margin: 2,
  logoImage: null, logoWidth: 60, logoHeight: 60, logoMargin: 5,
  logoCornerRadius: 8, logoBackgroundColor: '#ffffff', styleType: 'square',
  gradientStart: '#6366f1', gradientEnd: '#8b5cf6', useGradient: false, backgroundImage: null,
};

interface QRGeneratorProps {
  config?: Partial<QRCodeConfig>;
  onConfigChange?: (config: QRCodeConfig) => void;
}

export function QRGenerator({ config: externalConfig, onConfigChange }: QRGeneratorProps) {
  const [config, setConfig] = useState<QRCodeConfig>({ ...defaultConfig, ...externalConfig });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  const updateConfig = (updates: Partial<QRCodeConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  useEffect(() => {
    const generate = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        await QRCode.toCanvas(canvas, config.text || 'https://example.com', {
          width: config.width, height: config.height, margin: config.margin,
          color: { dark: config.useGradient ? '#000000' : config.colorDark, light: config.colorLight },
          errorCorrectionLevel: config.correctLevel,
        });
        if (config.useGradient || config.styleType !== 'square' || config.logoImage) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = config.width; tempCanvas.height = config.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return;
          tempCtx.drawImage(canvas, 0, 0);
          ctx.fillStyle = config.colorLight;
          ctx.fillRect(0, 0, config.width, config.height);
          if (config.useGradient) {
            const gradient = ctx.createLinearGradient(0, 0, config.width, config.height);
            gradient.addColorStop(0, config.gradientStart);
            gradient.addColorStop(1, config.gradientEnd);
            ctx.fillStyle = gradient;
          } else { ctx.fillStyle = config.colorDark; }
          const imageData = tempCtx.getImageData(0, 0, config.width, config.height);
          const data = imageData.data;
          const moduleSize = config.width / Math.sqrt(data.length / 4);
          const moduleCount = Math.round(config.width / moduleSize);
          for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
              const x = col * moduleSize; const y = row * moduleSize;
              const idx = (Math.floor(y + moduleSize/2) * config.width + Math.floor(x + moduleSize/2)) * 4;
              if (data[idx] < 128) {
                const size = moduleSize - 1;
                switch (config.styleType) {
                  case 'rounded': ctx.beginPath(); ctx.roundRect(x + 0.5, y + 0.5, size, size, size * 0.3); ctx.fill(); break;
                  case 'dot': ctx.beginPath(); ctx.arc(x + moduleSize / 2, y + moduleSize / 2, size * 0.4, 0, Math.PI * 2); ctx.fill(); break;
                  case 'liquid': ctx.beginPath(); ctx.arc(x + moduleSize / 2, y + moduleSize / 2, size * 0.45, 0, Math.PI * 2); ctx.fill(); break;
                  default: ctx.fillRect(x + 0.5, y + 0.5, size, size);
                }
              }
            }
          }
          if (config.logoImage) {
            const logo = new Image();
            logo.crossOrigin = 'anonymous';
            logo.onload = () => {
              const x = (config.width - config.logoWidth) / 2;
              const y = (config.height - config.logoHeight) / 2;
              if (config.logoBackgroundColor !== 'transparent') {
                ctx.fillStyle = config.logoBackgroundColor;
                ctx.beginPath();
                ctx.roundRect(x - config.logoMargin, y - config.logoMargin, config.logoWidth + config.logoMargin * 2, config.logoHeight + config.logoMargin * 2, config.logoCornerRadius);
                ctx.fill();
              }
              ctx.drawImage(logo, x, y, config.logoWidth, config.logoHeight);
              setDataUrl(canvas.toDataURL('image/png'));
            };
            logo.src = config.logoImage;
          } else { setDataUrl(canvas.toDataURL('image/png')); }
        } else { setDataUrl(canvas.toDataURL('image/png')); }
      } catch (err) { console.error('QR generation error:', err); }
    };
    generate();
  }, [config]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { updateConfig({ logoImage: event.target?.result as string }); };
    reader.readAsDataURL(file);
  };

  const downloadQR = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = dataUrl; link.click();
  };

  return (
    <div className="qr-generator" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
      <div className="qr-preview" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
        <canvas ref={canvasRef} width={config.width} height={config.height} style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }} />
      </div>
      <div className="qr-controls" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="control-group">
          <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>链接地址</label>
          <textarea value={config.text} onChange={(e) => updateConfig({ text: e.target.value })} placeholder="请输入链接或文本" rows={3} style={{ width: '100%', padding: '12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px', color: '#e2e8f0', resize: 'vertical' }} />
        </div>
        <div className="control-group">
          <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>尺寸: {config.width}px</label>
          <input type="range" min="200" max="600" step="50" value={config.width} onChange={(e) => updateConfig({ width: parseInt(e.target.value), height: parseInt(e.target.value) })} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="control-group">
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>前景色</label>
            <input type="color" value={config.colorDark} onChange={(e) => updateConfig({ colorDark: e.target.value, useGradient: false })} style={{ width: '60px', height: '40px', border: 'none', borderRadius: '8px' }} />
          </div>
          <div className="control-group">
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>背景色</label>
            <input type="color" value={config.colorLight} onChange={(e) => updateConfig({ colorLight: e.target.value })} style={{ width: '60px', height: '40px', border: 'none', borderRadius: '8px' }} />
          </div>
        </div>
        <div className="control-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#94a3b8' }}>
            <input type="checkbox" checked={config.useGradient} onChange={(e) => updateConfig({ useGradient: e.target.checked })} /> 使用渐变色
          </label>
          {config.useGradient && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <input type="color" value={config.gradientStart} onChange={(e) => updateConfig({ gradientStart: e.target.value })} style={{ width: '50px', height: '35px', border: 'none', borderRadius: '6px' }} />
              <span style={{ color: '#64748b' }}>→</span>
              <input type="color" value={config.gradientEnd} onChange={(e) => updateConfig({ gradientEnd: e.target.value })} style={{ width: '50px', height: '35px', border: 'none', borderRadius: '6px' }} />
            </div>
          )}
        </div>
        <div className="control-group">
          <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>码点样式</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['square', 'rounded', 'dot', 'liquid'] as const).map((style) => (
              <button key={style} onClick={() => updateConfig({ styleType: style })} style={{ padding: '8px 16px', background: config.styleType === style ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', color: config.styleType === style ? '#fff' : '#94a3b8', cursor: 'pointer' }}>
                {style === 'square' && '方形'}{style === 'rounded' && '圆角'}{style === 'dot' && '圆点'}{style === 'liquid' && '液态'}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>容错级别</label>
          <select value={config.correctLevel} onChange={(e) => updateConfig({ correctLevel: e.target.value as QRCodeConfig['correctLevel'] })} style={{ padding: '10px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', color: '#e2e8f0', width: '100%' }}>
            <option value="L">L (7%)</option><option value="M">M (15%)</option><option value="Q">Q (25%)</option><option value="H">H (30%)</option>
          </select>
        </div>
        <div className="control-group">
          <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} id="logo-upload" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <label htmlFor="logo-upload" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'inline-block' }}>{config.logoImage ? '更换 Logo' : '选择 Logo'}</label>
            {config.logoImage && (<button onClick={() => updateConfig({ logoImage: null })} style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.8)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>移除</button>)}
          </div>
          {config.logoImage && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Logo 大小: {config.logoWidth}px</label>
              <input type="range" min="30" max="120" value={config.logoWidth} onChange={(e) => updateConfig({ logoWidth: parseInt(e.target.value), logoHeight: parseInt(e.target.value) })} style={{ width: '100%' }} />
            </div>
          )}
        </div>
        <button onClick={downloadQR} disabled={!dataUrl} style={{ padding: '14px 32px', background: dataUrl ? 'linear-gradient(135deg, #10b981, #059669)' : '#475569', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: dataUrl ? 'pointer' : 'not-allowed', marginTop: '10px' }}>下载二维码</button>
      </div>
    </div>
  );
}

export { defaultConfig };
export type { QRCodeConfig };