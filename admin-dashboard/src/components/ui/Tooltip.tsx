import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number>();

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipElement = tooltipRef.current;
      
      if (tooltipElement) {
        const tooltipRect = tooltipElement.getBoundingClientRect();
        let x = 0;
        let y = 0;

        switch (position) {
          case 'top':
            x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            y = triggerRect.top - tooltipRect.height - 8;
            break;
          case 'bottom':
            x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            y = triggerRect.bottom + 8;
            break;
          case 'left':
            x = triggerRect.left - tooltipRect.width - 8;
            y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            break;
          case 'right':
            x = triggerRect.right + 8;
            y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            break;
        }

        // Ensure tooltip stays within viewport
        const padding = 8;
        x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
        y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

        setTooltipPosition({ x, y });
      }
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipContent = isVisible && (
    <div
      ref={tooltipRef}
      className={`
        fixed z-tooltip bg-gray-900 text-white text-sm px-3 py-2 rounded-md shadow-lg
        pointer-events-none transition-opacity duration-200
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
      }}
    >
      {content}
      <div
        className={`
          absolute w-2 h-2 bg-gray-900 transform rotate-45
          ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
          ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
          ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
          ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
        `}
      />
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
};