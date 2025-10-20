// Production configuration to suppress development warnings
export const initializeProductionConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    // Suppress Lit dev mode warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('Lit is in dev mode')) {
        return; // Suppress Lit dev mode warnings in production
      }
      originalConsoleWarn.apply(console, args);
    };

    // Suppress other development warnings
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0];
      if (typeof message === 'string' && (
        message.includes('Download error or resource isn\'t a valid image') ||
        message.includes('Failed to fetch remote project configuration')
      )) {
        return; // Suppress resource loading warnings in production
      }
      originalConsoleError.apply(console, args);
    };
  }
};

// Initialize immediately
initializeProductionConfig();
