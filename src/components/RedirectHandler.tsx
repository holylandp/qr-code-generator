import { useEffect, useState } from 'react';
import { getDynamicQRCodeByShortCode, recordScan } from '../lib/supabase';
import TransitionScene from './TransitionScene';

export function RedirectHandler() {
  const [status, setStatus] = useState<'loading' | 'not-found'>('loading');

  useEffect(() => {
    const handleRedirect = async () => {
      const path = window.location.pathname;
      const match = path.match(/^\/r\/([A-Za-z0-9]+)$/);
      if (!match) { setStatus('not-found'); return; }
      const shortCode = match[1];
      const code = await getDynamicQRCodeByShortCode(shortCode);
      if (code) {
        await recordScan(shortCode);
        window.location.href = code.target_url;
      } else { setStatus('not-found'); }
    };
    
    const timer = setTimeout(() => {
      handleRedirect();
    }, 1500); // 1.5秒後開始跳轉
    
    return () => clearTimeout(timer);
  }, []);

  if (status === 'not-found') {
    return (
      <div className="w-full h-screen relative bg-[#f0f9ff] overflow-hidden">
        <TransitionScene />
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto bg-[rgba(240,249,255,0.3)] backdrop-blur-[2px]">
          <div className="bg-[rgba(255,255,255,0.95)] rounded-[32px] p-[48px_40px] max-w-[480px] w-[90%] text-center border-[3px_solid_rgba(224,170,255,0.5)] shadow-[0_25px_50px_-12px_rgba(192,132,252,0.3),0_0_0_8px_rgba(255,255,255,0.5),inset_0_0_30px_rgba(224,170,255,0.1)] backdrop-blur-[20px] animate-[slideIn_0.5s_ease-out]">
            <div className="w-20 h-20 mx-6 bg-gradient-to-br from-[#f472b6] to-[#ef4444] rounded-full flex items-center justify-center text-[40px] text-white shadow-[0_10px_30px_rgba(244,114,182,0.4)] animate-[pulse_2s_ease-in-out_infinite]">✕</div>
            <p className="text-[#7c3aed] text-[1.2rem] mb-7 font-semibold leading-[1.6] font-['Outfit',sans-serif]">抱歉，您訪問的活碼連結未找到或已被刪除。</p>
            <button onClick={() => window.location.href = '/'} className="px-10 py-4 bg-gradient-to-br from-[#c084fc] to-[#f472b6] text-white text-[1.1rem] font-bold cursor-pointer transition-all duration-300 font-['Outfit',sans-serif] tracking-[1px] shadow-[0_4px_15px_rgba(192,132,252,0.4),0_0_0_3px_rgba(255,255,255,0.5)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(192,132,252,0.6),0_0_0_3px_rgba(255,255,255,0.8)] active:translate-y-[-1px] active:scale-[0.98]">返回首頁</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative bg-[#f0f9ff] overflow-hidden">
      <TransitionScene />
    </div>
  );
}

export default RedirectHandler;