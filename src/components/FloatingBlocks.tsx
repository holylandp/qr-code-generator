import React, { useEffect, useRef } from 'react';

// 學術風格顏色：天藍、橙色、白色、薄荷
const ACADEMIC_COLORS = ['#38bdf8', '#fb923c', '#ffffff', '#a5f3fc', '#818cf8', '#c084fc', '#f472b6'];

interface Block {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

const FloatingBlocks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blocksRef = useRef<Block[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設置 canvas 大小
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 初始化方塊
    const blockCount = 25;
    blocksRef.current = Array.from({ length: blockCount }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 30 + 20,
      color: ACADEMIC_COLORS[Math.floor(Math.random() * ACADEMIC_COLORS.length)],
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.3 - 0.2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1,
    }));

    // 動畫循環
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blocksRef.current.forEach((block) => {
        // 更新位置
        block.x += block.speedX;
        block.y += block.speedY;
        block.rotation += block.rotationSpeed;

        // 邊界檢查
        if (block.x < -block.size) block.x = canvas.width + block.size;
        if (block.x > canvas.width + block.size) block.x = -block.size;
        if (block.y < -block.size) block.y = canvas.height + block.size;
        if (block.y > canvas.height + block.size) block.y = -block.size;

        // 繪製方塊
        ctx.save();
        ctx.translate(block.x, block.y);
        ctx.rotate((block.rotation * Math.PI) / 180);
        
        // 方塊陰影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // 方塊本體
        ctx.fillStyle = block.color;
        ctx.fillRect(-block.size / 2, -block.size / 2, block.size, block.size);
        
        // 方塊邊框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-block.size / 2, -block.size / 2, block.size, block.size);
        
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
};

export default FloatingBlocks;