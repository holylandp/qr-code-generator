import { useState } from 'react';
import { CosmicBackground } from './components/CosmicBackground';
import { QRGenerator } from './components/QRGenerator';
import { DynamicQR } from './components/DynamicQR';
import './App.css';

type TabType = 'static' | 'dynamic';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('static');

  return (
    <div className="app">
      <CosmicBackground />
      
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">
            <span className="title-icon">◈</span>
            培華二維碼生成器
          </h1>
          <p className="app-subtitle">專業級二維碼生成工具 · 支援活碼 · 自訂樣式</p>
        </header>

        <main className="app-main">
          <div className="tab-container">
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'static' ? 'active' : ''}`}
                onClick={() => setActiveTab('static')}
              >
                <span className="tab-icon">▣</span>
                普通二維碼
              </button>
              <button
                className={`tab-btn ${activeTab === 'dynamic' ? 'active' : ''}`}
                onClick={() => setActiveTab('dynamic')}
              >
                <span className="tab-icon">⟲</span>
                活碼 (可修改)
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'static' ? (
                <div className="section">
                  <div className="section-header">
                    <h2>普通二維碼生成</h2>
                    <p>支援自訂顏色、樣式、新增Logo等功能</p>
                  </div>
                  <QRGenerator />
                </div>
              ) : (
                <div className="section">
                  <div className="section-header">
                    <h2>活碼管理</h2>
                    <p>建立可隨時修改跳轉位址的二維碼，圖案永不改變</p>
                  </div>
                  <DynamicQR />
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p>© 2025 培華二維碼生成器 | Powered by React</p>
        </footer>
      </div>
    </div>
  );
}

export default App;