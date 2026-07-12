import React from 'react';

export const MatrixBackground: React.FC = () => {
  return (
    <div className="matrix-container">
      {Array.from({ length: 5 }).map((_, pIdx) => (
        <div key={pIdx} className="matrix-pattern">
          {Array.from({ length: 40 }).map((_, cIdx) => (
            <div key={cIdx} className="matrix-column" />
          ))}
        </div>
      ))}
    </div>
  );
};
