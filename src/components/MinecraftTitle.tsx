import React from 'react';

interface MinecraftTitleProps {
  text: string;
}

const MinecraftTitle: React.FC<MinecraftTitleProps> = ({ text }) => {
  const characters = text.split('');

  return (
    <div className="minecraft-title-container">
      <div className="minecraft-title-wrapper">
        {characters.map((char, index) => {
          if (char === ' ') {
            return <span key={index} className="minecraft-space"></span>;
          }

          return (
            <span
              key={index}
              className="minecraft-char"
              style={{
                animationDelay: `${index * 0.08}s`,
              }}
            >
              <span className="minecraft-char-inner">{char}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MinecraftTitle;