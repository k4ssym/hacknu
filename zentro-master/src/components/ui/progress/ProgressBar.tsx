// src/ui/progress/ProgressBar.tsx
import React from "react";

type ProgressBarProps = {
  value: number;
  color?: 'orange' | 'success' | 'error';
  className?: string;
  barClassName?: string;
};

const colorMap = {
  orange: 'bg-orange-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

export default function ProgressBar({ 
  value, 
  color = 'orange', 
  className = '', 
  barClassName = '' 
}: ProgressBarProps) {
  // Calculate width ensuring it stays between 0 and 100
  const width = Math.min(100, Math.max(0, value));
  
  // Combine base classes with any additional classes passed via props
  const containerClasses = [
    'w-full',
    'h-2',
    'bg-gray-200',
    'rounded-full',
    'overflow-hidden',
    'dark:bg-gray-700',
    className
  ].filter(Boolean).join(' ');

  const barClasses = [
    'h-full',
    'transition-all',
    'duration-300',
    colorMap[color],
    barClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div
        className={barClasses}
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}