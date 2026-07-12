import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    VANTA: any;
  }
}

export const VantaBackground: React.FC = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);

  useEffect(() => {
    const initVanta = () => {
      if (vantaRef.current && window.VANTA && window.VANTA.NET && !effectRef.current) {
        effectRef.current = window.VANTA.NET({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0xff3f81,
          backgroundColor: 0x23153c,
          points: 10.00,
          maxDistance: 20.00,
          spacing: 15.00,
          showDots: true
        });
      }
    };

    // Delay initialization slightly to guarantee script loading
    const timer = setTimeout(initVanta, 100);

    return () => {
      clearTimeout(timer);
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={vantaRef} 
      className="fixed inset-0 w-full h-screen z-[-10] pointer-events-none overflow-hidden"
    />
  );
};
