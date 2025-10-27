import { useState, useEffect, useCallback } from 'react';
import { useMobile } from './useMobile';
import { useSafeArea } from './useMobile';
import { Z_INDEX } from '../utils/zIndex';

export interface MobileLayoutMetrics {
  // Viewport dimensions
  viewportHeight: number;
  viewportWidth: number;
  
  // Fixed element heights
  topBarHeight: number;
  feedbackBarHeight: number;
  footerHeight: number;
  totalChromeHeight: number;
  
  // Available content area
  contentHeight: number;
  contentWidth: number;
  
  // Safe area insets
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  
  // Layout calculations
  availableHeight: number;
  isKeyboardVisible: boolean;
  
  // Device info
  isLandscape: boolean;
  isPortrait: boolean;
}

export interface MobileLayoutConfig {
  topBarHeight?: number;
  feedbackBarHeight?: number;
  footerHeight?: number;
  enableKeyboardDetection?: boolean;
}

const DEFAULT_CONFIG: Required<MobileLayoutConfig> = {
  topBarHeight: 56,
  feedbackBarHeight: 36,
  footerHeight: 32,
  enableKeyboardDetection: true,
};

/**
 * Hook to manage mobile layout calculations and metrics
 * Only active on mobile devices (< 768px)
 */
export function useMobileLayout(config: MobileLayoutConfig = {}): MobileLayoutMetrics {
  const isMobile = useMobile();
  const safeArea = useSafeArea();
  
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window === 'undefined') return 0;
    // Use visualViewport if available (accounts for keyboard)
    if (window.visualViewport) {
      return window.visualViewport.height;
    }
    return window.innerHeight;
  });
  
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth;
  });
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [initialViewportHeight, setInitialViewportHeight] = useState(viewportHeight);
  
  // Calculate layout metrics
  const totalChromeHeight = mergedConfig.topBarHeight + mergedConfig.feedbackBarHeight + mergedConfig.footerHeight;
  
  const contentHeight = Math.max(0, viewportHeight - totalChromeHeight - safeArea.top - safeArea.bottom);
  const contentWidth = Math.max(0, viewportWidth - safeArea.left - safeArea.right);
  
  const availableHeight = contentHeight;
  
  const isLandscape = viewportWidth > viewportHeight;
  const isPortrait = viewportHeight > viewportWidth;
  
  // Handle viewport changes
  useEffect(() => {
    if (!isMobile) return;
    
    const handleResize = () => {
      // Prioritize visualViewport for accurate height
      const newHeight = window.visualViewport?.height || window.innerHeight;
      const newWidth = window.visualViewport?.width || window.innerWidth;
      
      setViewportHeight(newHeight);
      setViewportWidth(newWidth);
      
      // Keyboard detection (iOS/Android)
      if (mergedConfig.enableKeyboardDetection) {
        const heightDifference = initialViewportHeight - newHeight;
        const isKeyboard = heightDifference > 150; // Threshold for keyboard detection
        setIsKeyboardVisible(isKeyboard);
        
        // Update initial height when keyboard is dismissed
        if (!isKeyboard && newHeight > initialViewportHeight * 0.9) {
          setInitialViewportHeight(newHeight);
        }
      }
    };
    
    const handleOrientationChange = () => {
      // Small delay to allow orientation change to complete
      setTimeout(() => {
        const newHeight = window.innerHeight;
        const newWidth = window.innerWidth;
        
        setViewportHeight(newHeight);
        setViewportWidth(newWidth);
        setInitialViewportHeight(newHeight);
        setIsKeyboardVisible(false);
      }, 100);
    };
    
    // Listen to visualViewport changes (keyboard, zoom, etc.)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isMobile, initialViewportHeight, mergedConfig.enableKeyboardDetection]);
  
  // Initialize viewport height
  useEffect(() => {
    if (isMobile && initialViewportHeight === 0) {
      setInitialViewportHeight(window.innerHeight);
    }
  }, [isMobile, initialViewportHeight]);
  
  return {
    // Viewport dimensions
    viewportHeight,
    viewportWidth,
    
    // Fixed element heights
    topBarHeight: mergedConfig.topBarHeight,
    feedbackBarHeight: mergedConfig.feedbackBarHeight,
    footerHeight: mergedConfig.footerHeight,
    totalChromeHeight,
    
    // Available content area
    contentHeight,
    contentWidth,
    
    // Safe area insets
    safeAreaTop: safeArea.top,
    safeAreaBottom: safeArea.bottom,
    safeAreaLeft: safeArea.left,
    safeAreaRight: safeArea.right,
    
    // Layout calculations
    availableHeight,
    isKeyboardVisible,
    
    // Device info
    isLandscape,
    isPortrait,
  };
}

/**
 * Hook to get mobile-specific CSS custom properties
 * Returns CSS variables for use in styled components
 */
export function useMobileLayoutCSS(config: MobileLayoutConfig = {}) {
  const metrics = useMobileLayout(config);
  const isMobile = useMobile();
  
  if (!isMobile) {
    return {};
  }
  
  return {
    '--mobile-viewport-height': `${metrics.viewportHeight}px`,
    '--mobile-content-height': `${metrics.contentHeight}px`,
    '--mobile-available-height': `${metrics.availableHeight}px`,
    '--mobile-topbar-height': `${metrics.topBarHeight}px`,
    '--mobile-feedbackbar-height': `${metrics.feedbackBarHeight}px`,
    '--mobile-footer-height': `${metrics.footerHeight}px`,
    '--mobile-chrome-total': `${metrics.totalChromeHeight}px`,
    '--mobile-safe-top': `${metrics.safeAreaTop}px`,
    '--mobile-safe-bottom': `${metrics.safeAreaBottom}px`,
    '--mobile-safe-left': `${metrics.safeAreaLeft}px`,
    '--mobile-safe-right': `${metrics.safeAreaRight}px`,
  } as React.CSSProperties;
}

/**
 * Hook to calculate mobile drawer positioning
 */
export function useMobileDrawer() {
  const metrics = useMobileLayout();
  const isMobile = useMobile();
  
  const getDrawerStyles = useCallback((isOpen: boolean) => {
    if (!isMobile) return {};
    
    return {
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: Z_INDEX.drawer,
      transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s ease-out',
      maxHeight: `${Math.min(metrics.viewportHeight * 0.8, metrics.contentHeight)}px`,
      paddingBottom: `max(16px, ${metrics.safeAreaBottom}px)`,
    };
  }, [isMobile, metrics]);
  
  const getBackdropStyles = useCallback((isOpen: boolean) => {
    if (!isMobile) return {};
    
    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: Z_INDEX.drawerBackdrop,
      opacity: isOpen ? 1 : 0,
      transition: 'opacity 0.3s ease-out',
    };
  }, [isMobile]);
  
  return {
    getDrawerStyles,
    getBackdropStyles,
    maxHeight: Math.min(metrics.viewportHeight * 0.8, metrics.contentHeight),
  };
}

/**
 * Hook to manage mobile chat input positioning
 */
export function useMobileChatInput() {
  const metrics = useMobileLayout();
  const isMobile = useMobile();
  
  const getInputStyles = useCallback((isSticky: boolean = true) => {
    if (!isMobile) return {};
    
    if (isSticky) {
      return {
        position: 'sticky' as const,
        bottom: 0,
        zIndex: Z_INDEX.fab + 1,
        background: 'var(--color-bg-primary)',
        borderTop: '1px solid var(--color-border-primary)',
        paddingTop: '16px',
        paddingBottom: `max(16px, ${metrics.safeAreaBottom}px)`,
      };
    }
    
    return {
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: Z_INDEX.fab + 1,
      background: 'var(--color-bg-primary)',
      borderTop: '1px solid var(--color-border-primary)',
      paddingTop: '16px',
      paddingBottom: `max(16px, ${metrics.safeAreaBottom}px)`,
    };
  }, [isMobile, metrics]);
  
  return {
    getInputStyles,
    bottomOffset: metrics.safeAreaBottom,
  };
}

/**
 * Hook to get mobile-specific container styles
 */
export function useMobileContainer() {
  const metrics = useMobileLayout();
  const isMobile = useMobile();
  
  const getContainerStyles = useCallback(() => {
    if (!isMobile) return {};
    
    return {
      height: `${metrics.contentHeight}px`,
      overflowY: 'auto' as const,
      WebkitOverflowScrolling: 'touch',
      paddingBottom: `${metrics.footerHeight + metrics.safeAreaBottom}px`,
    };
  }, [isMobile, metrics]);
  
  const getContentStyles = useCallback(() => {
    if (!isMobile) return {};
    
    return {
      minHeight: `${metrics.contentHeight}px`,
      paddingTop: `${metrics.topBarHeight + metrics.feedbackBarHeight}px`,
      paddingBottom: `${metrics.footerHeight}px`,
    };
  }, [isMobile, metrics]);
  
  return {
    getContainerStyles,
    getContentStyles,
    contentHeight: metrics.contentHeight,
  };
}
