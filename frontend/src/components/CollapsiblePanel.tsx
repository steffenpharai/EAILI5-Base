import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';

interface CollapsiblePanelProps {
  id: string; // For localStorage persistence
  title: string;
  direction: 'vertical' | 'horizontal';
  defaultCollapsed?: { mobile: boolean; desktop: boolean };
  collapsedSize?: string; // "48px" for sidebars, "32px" for bars
  expandedSize?: string; // "320px", "100%", etc.
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  onToggle?: (collapsed: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  // Animation props
  animationDuration?: number;
  easing?: string;
  // Collapsed content (for horizontal collapse)
  collapsedContent?: React.ReactNode;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  id,
  title,
  direction,
  defaultCollapsed = { mobile: true, desktop: false },
  collapsedSize = direction === 'horizontal' ? "48px" : "32px",
  expandedSize = direction === 'horizontal' ? "320px" : "100%",
  children,
  icon,
  badge,
  onToggle,
  className = '',
  style = {},
  animationDuration = 300,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  collapsedContent
}) => {
  const { theme } = useTheme();
  const isMobile = useMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState<number | string>('auto');

  // Load persisted state from localStorage
  useEffect(() => {
    const storageKey = `eaili5_${id}_collapsed`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored !== null) {
      const storedCollapsed = JSON.parse(stored);
      setIsCollapsed(storedCollapsed);
    } else {
      // Use responsive defaults if no stored state
      const shouldCollapse = isMobile ? defaultCollapsed.mobile : defaultCollapsed.desktop;
      setIsCollapsed(shouldCollapse);
    }
  }, [id, isMobile, defaultCollapsed]);

  // Clear localStorage for specific components that should reset
  useEffect(() => {
    if (id === 'feedbackbar') {
      // Reset feedbackbar to always be expanded by default
      const storageKey = `eaili5_${id}_collapsed`;
      const stored = localStorage.getItem(storageKey);
      if (stored === 'true') {
        localStorage.removeItem(storageKey);
        setIsCollapsed(false);
      }
    }
  }, [id]);

  // Reset to defaults when device type changes (mobile/desktop)
  useEffect(() => {
    const storageKey = `eaili5_${id}_collapsed`;
    const stored = localStorage.getItem(storageKey);
    
    // Only reset if there's no stored preference
    if (stored === null) {
      const shouldCollapse = isMobile ? defaultCollapsed.mobile : defaultCollapsed.desktop;
      setIsCollapsed(shouldCollapse);
    }
  }, [isMobile, defaultCollapsed, id]);

  // Persist state to localStorage
  useEffect(() => {
    const storageKey = `eaili5_${id}_collapsed`;
    localStorage.setItem(storageKey, JSON.stringify(isCollapsed));
  }, [id, isCollapsed]);

  // Measure content size for smooth animations
  useEffect(() => {
    if (contentRef.current) {
      if (direction === 'horizontal') {
        const width = contentRef.current.scrollWidth;
        setContentSize(width);
      } else {
        const height = contentRef.current.scrollHeight;
        setContentSize(height);
      }
    }
  }, [children, direction]);

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Dynamic styles based on direction
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    background: theme.surface.primary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    overflow: 'hidden',
    transition: `all ${animationDuration}ms ${easing}`,
    ...style
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: direction === 'horizontal' ? '12px 8px' : '12px 16px',
    background: theme.surface.secondary,
    borderBottom: direction === 'horizontal' || isCollapsed ? 'none' : `1px solid ${theme.border.primary}`,
    borderRight: direction === 'horizontal' && !isCollapsed ? `1px solid ${theme.border.primary}` : 'none',
    cursor: 'pointer',
    minHeight: '44px', // Touch-friendly minimum
    minWidth: direction === 'horizontal' ? '44px' : 'auto',
    transition: `all ${animationDuration}ms ${easing}`,
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    writingMode: direction === 'horizontal' ? 'vertical-rl' : 'horizontal-tb',
    textOrientation: direction === 'horizontal' ? 'mixed' : 'initial',
  };

  const titleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: direction === 'horizontal' ? '12px' : '14px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    transform: direction === 'horizontal' ? 'rotate(180deg)' : 'none',
    whiteSpace: direction === 'horizontal' ? 'nowrap' : 'normal',
  };

  const badgeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    background: theme.accent.blue,
    color: theme.text.inverted,
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const toggleButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: `all ${animationDuration}ms ${easing}`,
    minHeight: '44px',
    minWidth: '44px',
  };

  const contentStyles: React.CSSProperties = {
    overflow: 'hidden',
    transition: `all ${animationDuration}ms ${easing}`,
    ...(direction === 'horizontal' ? {
      width: isCollapsed ? 0 : (contentSize === 'auto' ? '320px' : contentSize),
      opacity: isCollapsed ? 0 : 1,
    } : {
      height: isCollapsed ? 0 : (contentSize === 'auto' ? 'auto' : contentSize),
      opacity: isCollapsed ? 0 : 1,
    })
  };

  const contentInnerStyles: React.CSSProperties = {
    padding: direction === 'horizontal' ? '16px 8px' : '16px',
  };

  const collapsedContentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: direction === 'horizontal' ? '8px' : '8px 16px',
    background: theme.surface.secondary,
    minHeight: direction === 'horizontal' ? 'auto' : '32px',
    minWidth: direction === 'horizontal' ? '48px' : 'auto',
    writingMode: direction === 'horizontal' ? 'vertical-rl' : 'horizontal-tb',
    textOrientation: direction === 'horizontal' ? 'mixed' : 'initial',
  };

  const getToggleIcon = () => {
    if (direction === 'horizontal') {
      return isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />;
    }
    return isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div 
      className={className}
      style={containerStyles}
    >
      {/* Header */}
      <div
        style={headerStyles}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-controls={`${id}-content`}
        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${title} panel`}
      >
        {isCollapsed && collapsedContent ? (
          <div style={collapsedContentStyles}>
            {collapsedContent}
          </div>
        ) : (
          <div style={titleStyles}>
            {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
            <span>{title}</span>
            {badge && (
              <span style={badgeStyles}>
                {badge}
              </span>
            )}
          </div>
        )}
        
        <button
          style={toggleButtonStyles}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          onKeyDown={handleKeyDown}
          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${title}`}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.surface.tertiary;
            e.currentTarget.style.color = theme.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = theme.text.secondary;
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
            e.currentTarget.style.opacity = '0.8';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '1';
          }}
        >
          {getToggleIcon()}
        </button>
      </div>

      {/* Content */}
      <div
        id={`${id}-content`}
        ref={contentRef}
        style={contentStyles}
        aria-hidden={isCollapsed}
      >
        <div style={contentInnerStyles}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsiblePanel;
