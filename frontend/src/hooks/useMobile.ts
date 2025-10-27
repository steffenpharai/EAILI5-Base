import { useState, useEffect } from 'react';

// Mobile breakpoint constant
export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;

/**
 * Hook to detect if the current viewport is mobile
 * @param breakpoint - Custom breakpoint (default: 768px)
 * @returns boolean indicating if viewport is mobile
 */
export function useMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Generic media query hook
 * @param query - CSS media query string
 * @returns boolean indicating if media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Add listener
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Hook to detect if the device supports touch
 * @returns boolean indicating touch capability
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - for older browsers
      navigator.msMaxTouchPoints > 0
    );
  });

  return isTouchDevice;
}

/**
 * Hook to track device orientation
 * @returns object with orientation info
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState(() => {
    if (typeof window === 'undefined') return { angle: 0, type: 'portrait-primary' };
    
    return {
      angle: window.screen?.orientation?.angle || 0,
      type: window.screen?.orientation?.type || 'portrait-primary'
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
      setOrientation({
        angle: window.screen?.orientation?.angle || 0,
        type: window.screen?.orientation?.type || 'portrait-primary'
      });
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  return {
    ...orientation,
    isPortrait: orientation.type.includes('portrait'),
    isLandscape: orientation.type.includes('landscape')
  };
}

/**
 * Hook to get safe area insets for notched devices
 * @returns object with safe area insets
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0')
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
}

/**
 * Hook to detect device type and capabilities
 * @returns object with device information
 */
export function useDeviceInfo() {
  const isMobile = useMobile();
  const isTouchDevice = useTouchDevice();
  const orientation = useOrientation();
  const safeArea = useSafeArea();
  
  const [userAgent] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.navigator.userAgent;
  });

  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);
  
  // Detect if running in Base Wallet (Coinbase Wallet)
  const isBaseWallet = useMediaQuery('(display-mode: standalone)') || 
    window.location.href.includes('coinbase-wallet') ||
    window.location.href.includes('wallet.coinbase.com');

  return {
    isMobile,
    isTouchDevice,
    orientation,
    safeArea,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isBaseWallet,
    userAgent
  };
}

/**
 * Hook to manage responsive breakpoints
 * @returns object with breakpoint information
 */
export function useBreakpoints() {
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  const isTablet = useMediaQuery(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${TABLET_BREAKPOINT}px)`);
  const isLargeDesktop = useMediaQuery('(min-width: 1440px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    current: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
}

/**
 * Hook to detect if the app is running as a PWA
 * @returns boolean indicating PWA mode
 */
export function usePWA(): boolean {
  const [isPWA] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore - for older browsers
      window.navigator.standalone === true
    );
  });

  return isPWA;
}

/**
 * Hook to manage viewport height (accounting for mobile browser UI)
 * @returns object with viewport height information
 */
export function useViewportHeight() {
  const [height, setHeight] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return window.innerHeight;
  });

  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight);
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return {
    height,
    vh: height,
    // CSS custom property for viewport height
    cssVh: `${height}px`
  };
}
