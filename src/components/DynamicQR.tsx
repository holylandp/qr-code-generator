import { useState, useEffect } from 'react';
import { QRGenerator } from './QRGenerator';
import type { QRCodeConfig } from './QRGenerator';
import { createDynamicQRCode, getAllDynamicQRCodes, updateDynamicQRCodeTarget, deleteDynamicQRCode, type DynamicQRCode } from '../lib/supabase';

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
    text: '', width: 300, height: 300, colorDark: '#000000', colorLight: '#ffffff',
    correctLevel: 'H', margin: 2, logoImage: null, logoWidth: 60, logoHeight: 60,
    logoMargin: 5, logoCornerRadius: 8, logoBackgroundColor: '#ffffff',
    styleType: 'square', gradientStart: '#6366f1', gradientEnd: '#8b5cf6',
    useGradient: false, backgroundImage: null,
  });
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => { loadDynamicCodes(); }, []);

  const loadDynamicCodes = async () => {
    setIsLoading(true);
    const codes = await getAllDynamicQRCodes();
    setDynamicCodes(codes);
    setIsLoading(false);
  };

  const createDynamicCode = async () => {
    if (!targetUrl.trim()) { setError('请输入目标链接地址'); return; }
    let validUrl = targetUrl;
    if (!/^https?:\/\//i.test(validUrl)) validUrl = 'https://' + validUrl;
    setIsLoading(true); setError('');
    const newCode = await createDynamicQRCode(validUrl, qrConfig);
    if (newCode) {
      setDynamicCodes((prev) => [newCode, ...prev]);
      setTargetUrl(''); setActiveTab('manage');
      alert('活码创建成功！');
    } else { setError('创建失败，请重试'); }
    setIsLoading(false);
  };

  const updateTargetUrl = async () => {
    if (!selectedCode || !editUrl.trim()) return;
    let validUrl = editUrl;
    if (!/^https?:\/\//i.test(validUrl)) validUrl = 'https://' + validUrl;
    setIsLoading(true);
    const success = await updateDynamicQRCodeTarget(selectedCode.id, validUrl);
    if (success) {
      setDynamicCodes((prev) => prev.map((code) => code.id === selectedCode.id ? { ...code, target_url: validUrl, updated_at: new Date().toISOString() } : code));
      setShowEditModal(false); setSelectedCode(null); setEditUrl('');
      alert('链接地址更新成功！');
    } else { alert('更新失败，请重试'); }
    setIsLoading(false);
  };

  const deleteCode = async (id: string) => {
    if (!confirm('确定要删除这个活码吗？此操作不可恢复。')) return;
    setIsLoading(true);
    const success = await deleteDynamicQRCode(id);
    if (success) { setDynamicCodes((prev) => prev.filter((code) => code.id !== id)); }
    else { alert('删除失败，请重试'); }
    setIsLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); alert('已复制到剪贴板！'); } catch { alert('复制失败'); }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dynamic-qr-container">
      <div className="tab-navigation">
        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>创建活码</button>
        <button className={activeTab === 'manage' ? 'active' : ''} onClick={() => setActiveTab('manage')}>管理活码 ({dynamicCodes.length})</button>
      </div>
      {activeTab === 'create' && (
        <div className="create-section">
          <div className="create-form">
            {error && <div style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
            <div className="qr-customization">
              <h3>配置活码</h3>
              <p className="form-hint" style={{ marginBottom: '20px', color: '#64748b' }}>在下方输入目标链接地址，活码创建后可随时修改链接而二维码图案不变</p>
              <QRGenerator config={{ ...qrConfig, text: targetUrl }} onConfigChange={(config) => { setQrConfig(config); setTargetUrl(config.text); }} />
            </div>
            <button className="create-btn" onClick={createDynamicCode} disabled={isLoading}>{isLoading ? '创建中...' : '创建活码'}</button>
          </div>
        </div>
      )}
      {activeTab === 'manage' && (
        <div className="manage-section">
          {isLoading ? (<div className="empty-state"><p>加载中...</p></div>) :
           dynamicCodes.length === 0 ? (<div className="empty-state"><p>暂无活码</p><button onClick={() => setActiveTab('create')}>创建第一个活码</button></div>) : (
            <div className="codes-list">
              {dynamicCodes.map((code) => (
                <div key={code.id} className="code-card">
                  <div className="code-info">
                    <div className="code-header">
                      <span className="short-code">{code.short_code}</span>
                      <span className="scan-count">扫描次数: {code.scan_count}</span>
                    </div>
                    <div className="url-section">
                      <label>跳转链接:</label>
                      <div className="url-row">
                        <input type="text" value={code.target_url} readOnly className="url-input" />
                        <button onClick={() => copyToClipboard(code.target_url)} className="icon-btn">复制</button>
                      </div>
                    </div>
                    <div className="url-section">
                      <label>活码链接:</label>
                      <div className="url-row">
                        <input type="text" value={`${baseUrl}/r/${code.short_code}`} readOnly className="url-input" />
                        <button onClick={() => copyToClipboard(`${baseUrl}/r/${code.short_code}`)} className="icon-btn">复制</button>
                      </div>
                    </div>
                    <div className="code-meta"><span>创建于: {formatDate(code.created_at)}</span></div>
                  </div>
                  <div className="code-actions">
                    <button onClick={() => { setSelectedCode(code); setEditUrl(code.target_url); setShowEditModal(true); }} className="edit-btn">修改地址</button>
                    <button onClick={() => deleteCode(code.id)} className="delete-btn" disabled={isLoading}>删除</button>
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
            <h3>修改跳转地址</h3>
            <div className="form-group">
              <label>新的目标链接</label>
              <input type="text" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)}>取消</button>
              <button onClick={updateTargetUrl} className="confirm-btn" disabled={isLoading}>{isLoading ? '保存中...' : '确认修改'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamicQR;