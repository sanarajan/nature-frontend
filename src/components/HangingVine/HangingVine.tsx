import React from 'react';
import './HangingVine.css';

const HangingVine: React.FC = () => {
  // Authentic leaf shape based on the provided reference (broad base, long pointed drip tip, clear veins)
  const renderLeaf = (fill: string, transform: string) => (
    <g transform={transform}>
      {/* Main leaf body */}
      <path d="M 0 0 C 8 -25, 25 -30, 32 -10 C 35 -3, 42 -1, 48 0 C 42 1, 35 3, 32 10 C 25 30, 8 25, 0 0 Z" fill={fill} />
      {/* Central main vein - very subtle */}
      <path d="M 0 0 L 46 0" stroke="rgba(200, 255, 150, 0.25)" strokeWidth="0.6" fill="none" />
      {/* Secondary veins - subtle */}
      <path d="M 6 0 Q 10 -12, 16 -18 M 6 0 Q 10 12, 16 18" stroke="rgba(200, 255, 150, 0.15)" strokeWidth="0.4" fill="none" />
      <path d="M 14 0 Q 18 -12, 25 -16 M 14 0 Q 18 12, 25 16" stroke="rgba(200, 255, 150, 0.15)" strokeWidth="0.4" fill="none" />
      <path d="M 22 0 Q 26 -8, 30 -10 M 22 0 Q 26 8, 30 10" stroke="rgba(200, 255, 150, 0.15)" strokeWidth="0.4" fill="none" />
      <path d="M 29 0 Q 32 -4, 34 -5 M 29 0 Q 32 4, 34 5" stroke="rgba(200, 255, 150, 0.15)" strokeWidth="0.4" fill="none" />
    </g>
  );

  return (
    <div className="hanging-vine-container">
      <svg viewBox="0 0 100 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="hanging-vine-svg">
        {/* Main Stem - Thinner (strokeWidth 1.8) and longer, organically curved */}
        <path d="M50 -10 C 58 70, 38 140, 52 220 C 62 280, 42 360, 48 440 C 52 470, 44 490, 44 490" stroke="#2e5c2e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        
        {/* Banyan Leaves attached naturally to the vine with varied sizing and spacing */}
        {renderLeaf("#3a7c3a", "translate(51, 30) rotate(22) scale(0.95)")}
        {renderLeaf("#469a46", "translate(49, 70) rotate(165) scale(0.75)")}
        {renderLeaf("#3a7c3a", "translate(46, 120) rotate(-15) scale(0.85)")}
        {renderLeaf("#2e5c2e", "translate(49, 160) rotate(175) scale(1)")}
        {renderLeaf("#3a7c3a", "translate(51, 210) rotate(35) scale(0.8)")}
        {renderLeaf("#469a46", "translate(53, 260) rotate(155) scale(0.9)")}
        {renderLeaf("#2e5c2e", "translate(48, 310) rotate(-5) scale(0.7)")}
        {renderLeaf("#3a7c3a", "translate(45, 360) rotate(170) scale(0.85)")}
        {renderLeaf("#469a46", "translate(47, 410) rotate(15) scale(0.75)")}
        {renderLeaf("#3a7c3a", "translate(48, 450) rotate(160) scale(0.65)")}
      </svg>
    </div>
  );
};

export default HangingVine;
