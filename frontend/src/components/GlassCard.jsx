import React from 'react';

export default function GlassCard({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel glass-panel-hover glass-card-accent rounded-2xl border border-white/10 ${className}`}
    >
      {children}
    </div>
  );
}
