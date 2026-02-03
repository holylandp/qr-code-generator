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
                    <p>支持自定義顏色、添加Logo等功能</p>
                  </div>
                  <QRGenerator />
                </div>
              ) : (
                <div className="section">
                  <div className="section-header">
                    <h2>活碼管理</h2>
                    <p>創建可隨時修改跳轉地址的二維碼</p>
                  </div>
                  <DynamicQR />
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p>© 2026 培華二維碼生成器 | Powered by Z</p>
        </footer>
      </div>
    </div>
  );
}

export default App;