import React from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string; // Container classes (e.g. h-36, h-[380px])
  cardClassName?: string; // Inner card styles (e.g. p-6 flex-col items-stretch)
  theme?: 'emerald' | 'rose' | 'violet' | 'amber' | 'default';
}

export const Card3D: React.FC<Card3DProps> = ({ 
  children, 
  className = '', 
  cardClassName = '',
  theme = 'default'
}) => {
  const themeClass = theme !== 'default' ? `card-3d-${theme}` : '';

  return (
    <div className={`container-3d noselect ${className}`}>
      <div className="canvas">
        <div className="tracker tr-1"></div>
        <div className="tracker tr-2"></div>
        <div className="tracker tr-3"></div>
        <div className="tracker tr-4"></div>
        <div className="tracker tr-5"></div>
        <div className="tracker tr-6"></div>
        <div className="tracker tr-7"></div>
        <div className="tracker tr-8"></div>
        <div className="tracker tr-9"></div>
        <div className="tracker tr-10"></div>
        <div className="tracker tr-11"></div>
        <div className="tracker tr-12"></div>
        <div className="tracker tr-13"></div>
        <div className="tracker tr-14"></div>
        <div className="tracker tr-15"></div>
        <div className="tracker tr-16"></div>
        <div className="tracker tr-17"></div>
        <div className="tracker tr-18"></div>
        <div className="tracker tr-19"></div>
        <div className="tracker tr-20"></div>
        <div className="tracker tr-21"></div>
        <div className="tracker tr-22"></div>
        <div className="tracker tr-23"></div>
        <div className="tracker tr-24"></div>
        <div className="tracker tr-25"></div>
        
        <div className={`card-3d ${themeClass} ${cardClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
