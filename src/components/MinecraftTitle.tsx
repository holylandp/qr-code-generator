import React from 'react';
import { motion } from 'framer-motion';

interface MinecraftTitleProps {
  text: string;
}

const MinecraftTitle: React.FC<MinecraftTitleProps> = ({ text }) => {
  const characters = text.split('');
  const letterVariants = {
    initial: { y: 0, scaleY: 1, scaleX: 1, rotate: 0 },
    animate: (i: number) => ({
      y: [0, -25, 0],
      scaleY: [1, 1.25, 0.9, 1],
      scaleX: [1, 0.85, 1.1, 1],
      rotate: [0, -5, 5, 0],
      transition: { delay: i * 0.08, duration: 1.2, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut", times: [0, 0.4, 0.8, 1] }
    }),
  };

  return (
    <div className="relative z-10 w-full flex justify-center">
      <div className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-x-0">
        {characters.map((char, index) => {
          if (char === ' ') return <span key={index} className="w-2 sm:w-3 md:w-4 inline-block"></span>;
          return (
            <motion.span key={index} custom={index} variants={letterVariants} initial="initial" animate="animate" className="inline-block relative cursor-default origin-bottom">
              <span className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black select-none" style={{
                fontFamily: "'Outfit', sans-serif",
                background: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 0px rgba(244, 114, 182, 0.2)) drop-shadow(0 8px 15px rgba(129, 140, 248, 0.25))',
                display: 'block', letterSpacing: '-0.06em', padding: '0 2px'
              }}>{char}</span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
};

export default MinecraftTitle;
