// src/components/ui/tooltip/Tooltip.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top - 8;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 8;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 8;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 8;
            break;
        }

        setCoords({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
        aria-describedby={isVisible ? 'tooltip-content' : undefined}
      >
        {children}
      </div>

      {isVisible &&
        createPortal(
          <div
            id="tooltip-content"
            role="tooltip"
            className="fixed z-50 px-3 py-2 text-sm bg-gray-800 text-white rounded-md shadow-lg"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: position === 'top' || position === 'bottom' 
                ? 'translateX(-50%)' 
                : position === 'left' || position === 'right'
                ? 'translateY(-50%)'
                : 'none',
            }}
          >
            {content}
            <div 
              className={`absolute w-2 h-2 bg-gray-800 transform rotate-45`}
              style={{
                ...(position === 'top' && { 
                  bottom: '-4px', 
                  left: '50%', 
                  transform: 'translateX(-50%) rotate(45deg)' 
                }),
                ...(position === 'bottom' && { 
                  top: '-4px', 
                  left: '50%', 
                  transform: 'translateX(-50%) rotate(45deg)' 
                }),
                ...(position === 'left' && { 
                  right: '-4px', 
                  top: '50%', 
                  transform: 'translateY(-50%) rotate(45deg)' 
                }),
                ...(position === 'right' && { 
                  left: '-4px', 
                  top: '50%', 
                  transform: 'translateY(-50%) rotate(45deg)' 
                }),
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
};