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
            宇宙二维码生成器
          </h1>
          <p className="app-subtitle">专业级二维码生成工具 · 支持活码 · 自定义样式</p>
        </header>

        <main className="app-main">
          <div className="tab-container">
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'static' ? 'active' : ''}`}
                onClick={() => setActiveTab('static')}
              >
                <span className="tab-icon">▣</span>
                普通二维码
              </button>
              <button
                className={`tab-btn ${activeTab === 'dynamic' ? 'active' : ''}`}
                onClick={() => setActiveTab('dynamic')}
              >
                <span className="tab-icon">⟲</span>
                活码 (可修改)
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'static' ? (
                <div className="section">
                  <div className="section-header">
                    <h2>普通二维码生成</h2>
                    <p>支持自定义颜色、样式、添加Logo等功能</p>
                  </div>
                  <QRGenerator />
                </div>
              ) : (
                <div className="section">
                  <div className="section-header">
                    <h2>活码管理</h2>
                    <p>创建可随时修改跳转地址的二维码，图案永不改变</p>
                  </div>
                  <DynamicQR />
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p>© 2025 宇宙二维码生成器 | Powered by React</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
