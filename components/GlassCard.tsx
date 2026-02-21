
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", title, action }) => {
  return (
    <div className={`glass rounded-2xl p-6 transition-all duration-300 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-6">
          {title && <h3 className="text-lg font-semibold text-white/90">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default GlassCard;
