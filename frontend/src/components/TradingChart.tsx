import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, Time, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { Token } from '../hooks/useTokenData';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  Activity, 
  Settings, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
} from 'lucide-react';

interface TradingChartProps {
  token: Token | null;
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type ChartType = 'candlestick' | 'line' | 'area' | 'bar';
type Indicator = 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger' | 'volume' | 'none';

interface IndicatorConfig {
  type: Indicator;
  period: number;
  color: string;
  visible: boolean;
}

const TradingChart: React.FC<TradingChartProps> = ({ token }) => {
  const { theme } = useTheme();
  const isMobile = useMobile();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [ohlcData, setOhlcData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { type: 'sma', period: 20, color: theme.accent.blue, visible: true },
    { type: 'ema', period: 50, color: theme.accent.green, visible: false },
    { type: 'rsi', period: 14, color: theme.accent.orange, visible: false },
    { type: 'macd', period: 12, color: theme.accent.purple, visible: false },
    { type: 'bollinger', period: 20, color: theme.accent.red, visible: false },
    { type: 'volume', period: 0, color: theme.accent.blue, visible: false }
  ]);
  const [showSettings, setShowSettings] = useState(false);
  const [scaleType, setScaleType] = useState<'linear' | 'logarithmic'>('linear');
  const [showGrid, setShowGrid] = useState(true);

  // Fetch real OHLC data
  const fetchOhlcData = async (tokenAddress: string, days: number) => {
    if (!tokenAddress) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens/${tokenAddress}/ohlc?days=${days}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.ohlc) {
        setOhlcData(data.ohlc);
      } else {
        console.error('Failed to fetch OHLC data:', data.error);
        setOhlcData([]);
      }
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      setOhlcData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch OHLC data when token or timeframe changes
  useEffect(() => {
    if (token?.address) {
      const daysMap = {
        '1m': 1,
        '5m': 1,
        '15m': 1,
        '1h': 1,
        '4h': 7,
        '1d': 30
      };
      fetchOhlcData(token.address, daysMap[timeframe]);
    }
  }, [token, timeframe]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme.surface.primary },
        textColor: theme.text.secondary,
      },
      grid: {
        vertLines: { color: showGrid ? theme.border.primary : 'transparent' },
        horzLines: { color: showGrid ? theme.border.primary : 'transparent' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: theme.border.primary,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,           // ADD: Space on right side
        barSpacing: 10,            // ADD: Minimum space between bars (wider = more readable)
        minBarSpacing: 8,          // ADD: Don't compress bars below this
        fixLeftEdge: false,        // ADD: Allow scrolling left
        fixRightEdge: false,       // ADD: Allow scrolling right
        lockVisibleTimeRangeOnResize: false, // ADD: Adjust visible range on resize
        rightBarStaysOnScroll: true,         // ADD: Keep right bar visible when scrolling
        visible: true,
      },
      rightPriceScale: {
        borderColor: theme.border.primary,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        visible: true,
        autoScale: true,           // ADD: Auto-scale price axis
      },
      handleScroll: {
        mouseWheel: true,          // ADD: Enable mouse wheel scrolling
        pressedMouseMove: true,    // ADD: Enable click-drag scrolling
        horzTouchDrag: true,       // ADD: Enable touch drag on mobile
        vertTouchDrag: false,      // Disable vertical touch drag
      },
      handleScale: {
        axisPressedMouseMove: true,  // ADD: Enable scaling via axis
        mouseWheel: true,            // ADD: Enable zoom with mouse wheel
        pinch: true,                 // ADD: Enable pinch zoom on mobile
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: theme.accent.green,
      downColor: theme.accent.red,
      borderUpColor: theme.accent.green,
      borderDownColor: theme.accent.red,
      wickUpColor: theme.accent.green,
      wickDownColor: theme.accent.red,
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Use real OHLC data if available, otherwise fallback to mock data
    if (ohlcData.length > 0) {
      // Convert OHLC data to candlestick format
      const candlestickData = ohlcData.map(point => ({
        time: point.time as Time,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close
      }));
      
      candlestickSeries.setData(candlestickData);
      
      // ADD: Set visible range to show last 30-40 candles initially
      // This prevents overcrowding and makes chart readable
      if (candlestickData.length > 40) {
        const visibleStart = candlestickData.length - 40;
        chart.timeScale().setVisibleRange({
          from: candlestickData[visibleStart].time,
          to: candlestickData[candlestickData.length - 1].time,
        });
      } else {
        // Fit all data if less than 40 candles
        chart.timeScale().fitContent();
      }
      
      // Add indicators
      const smaIndicator = indicators.find(i => i.type === 'sma' && i.visible);
      const emaIndicator = indicators.find(i => i.type === 'ema' && i.visible);
      
      if (smaIndicator) {
        const smaData = calculateSMA(ohlcData, smaIndicator.period);
        if (smaData.length > 0) {
          const smaSeries = chart.addSeries(LineSeries, {
            color: smaIndicator.color,
            lineWidth: 2,
            title: `SMA ${smaIndicator.period}`,
          });
          smaSeries.setData(smaData);
        }
      }
      
      if (emaIndicator) {
        const emaData = calculateEMA(ohlcData, emaIndicator.period);
        if (emaData.length > 0) {
          const emaSeries = chart.addSeries(LineSeries, {
            color: emaIndicator.color,
            lineWidth: 2,
            title: `EMA ${emaIndicator.period}`,
          });
          emaSeries.setData(emaData);
        }
      }
      
      chart.timeScale().fitContent();
    } else if (token && !loading) {
      // Fallback to mock data if no real data available
      let safePrice = token.price;
      
      if (safePrice > 1000000) {
        safePrice = 1000;
      } else if (safePrice < 0.000001 && safePrice > 0) {
        safePrice = 0.01;
      } else if (safePrice <= 0 || !isFinite(safePrice)) {
        safePrice = 1;
      }
      
      const mockData = generateMockCandleData(safePrice, timeframe);
      const validData = mockData.filter(item => 
        item.value >= -90071992547409.91 && 
        item.value <= 90071992547409.91 &&
        isFinite(item.value)
      );
      
      if (validData.length > 0) {
        // Convert line data to candlestick format
        const candlestickData = validData.map((point, index) => {
          const variation = 0.02; // 2% variation
          const open = point.value * (1 + (Math.random() - 0.5) * variation);
          const close = point.value * (1 + (Math.random() - 0.5) * variation);
          const high = Math.max(open, close) * (1 + Math.random() * variation);
          const low = Math.min(open, close) * (1 - Math.random() * variation);
          
          return {
            time: point.time,
            open: open,
            high: high,
            low: low,
            close: close
          };
        });
        
        candlestickSeries.setData(candlestickData);
        
        // Add indicators to mock data
        const smaIndicator = indicators.find(i => i.type === 'sma' && i.visible);
        const emaIndicator = indicators.find(i => i.type === 'ema' && i.visible);
        
        if (smaIndicator) {
          const smaData = calculateSMA(candlestickData, smaIndicator.period);
          if (smaData.length > 0) {
            const smaSeries = chart.addSeries(LineSeries, {
              color: smaIndicator.color,
              lineWidth: 2,
              title: `SMA ${smaIndicator.period}`,
            });
            smaSeries.setData(smaData);
          }
        }
        
        if (emaIndicator) {
          const emaData = calculateEMA(candlestickData, emaIndicator.period);
          if (emaData.length > 0) {
            const emaSeries = chart.addSeries(LineSeries, {
              color: emaIndicator.color,
              lineWidth: 2,
              title: `EMA ${emaIndicator.period}`,
            });
            emaSeries.setData(emaData);
          }
        }
        
        chart.timeScale().fitContent();
      }
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme, token, timeframe, ohlcData, loading, indicators, showGrid]);

  // Enhanced resize handler
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.surface.primary,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isMobile ? '8px 12px' : '2px 6px',  // Responsive padding
    borderBottom: `1px solid ${theme.border.primary}`,
    gap: isMobile ? '8px' : '2px',    // Responsive gap
    height: isMobile ? '64px' : '28px',  // Responsive height
    minHeight: isMobile ? '64px' : '28px',
    flexWrap: isMobile ? 'wrap' : 'nowrap',  // Allow wrapping on mobile
  };

  const tokenInfoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '4px',    // Responsive gap
    flex: isMobile ? '1 1 100%' : '0 0 auto',  // Full width on mobile
  };

  const tokenNameStyles: React.CSSProperties = {
    fontSize: isMobile ? '16px' : '13px',      // Responsive font
    fontWeight: 700,
    color: theme.text.primary,
    letterSpacing: '-0.02em',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const priceStyles: React.CSSProperties = {
    fontSize: isMobile ? '16px' : '13px',      // Responsive font
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'JetBrains Mono, monospace',
  };


  const controlsContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '2px',    // Responsive gap
    flex: isMobile ? '1 1 100%' : '1 1 auto',
    justifyContent: isMobile ? 'flex-start' : 'flex-end',
    overflow: isMobile ? 'auto' : 'hidden', // Scrollable on mobile
    WebkitOverflowScrolling: 'touch',
  };

  const controlGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: isMobile ? '4px' : '0px',    // Responsive gap
    padding: isMobile ? '2px' : '0px',
    background: theme.surface.secondary,
    borderRadius: isMobile ? '6px' : '2px',
    flexShrink: 0,
  };

  const separatorStyles: React.CSSProperties = {
    width: '1px',
    height: isMobile ? '32px' : '24px',
    background: theme.border.primary,
    opacity: 0.5,
  };

  // Responsive button styles - Best practice: 44px on mobile, compact on desktop
  const chartButtonStyles = (isActive: boolean): React.CSSProperties => ({
    minHeight: isMobile ? '44px' : '24px',
    minWidth: isMobile ? '44px' : '32px',
    padding: isMobile ? '12px 16px' : '4px 8px',
    fontSize: isMobile ? '14px' : '12px',
    fontWeight: 600,
    background: isActive ? theme.accent.blue : theme.surface.secondary,
    color: isActive ? theme.text.inverted : theme.text.primary,
    border: `1px solid ${isActive ? theme.accent.blue : theme.border.primary}`,
    borderRadius: isMobile ? '6px' : '4px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, system-ui, sans-serif',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  });

  const formatPrice = (token: Token | null) => {
    if (!token) return '$0.00';
    
    // Use formatted price from backend if available
    if (token.priceFormatted) {
      return `$${token.priceFormatted}`;
    }
    
    // Fallback to local formatting (world-class standards)
    const price = token.price;
    if (price === 0) return '$0.00';
    if (price < 0.000001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  // Toggle indicator visibility
  const toggleIndicator = (indicatorType: Indicator) => {
    setIndicators(prev => prev.map(indicator => 
      indicator.type === indicatorType 
        ? { ...indicator, visible: !indicator.visible }
        : indicator
    ));
  };

  // Calculate simple moving average
  const calculateSMA = (data: any[], period: number) => {
    if (data.length < period) return [];
    const sma: Array<{ time: any; value: number }> = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.close, 0);
      sma.push({ time: data[i].time, value: sum / period });
    }
    return sma;
  };

  // Calculate exponential moving average
  const calculateEMA = (data: any[], period: number) => {
    if (data.length < period) return [];
    const ema: Array<{ time: any; value: number }> = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA value is SMA
    const firstSMA = data.slice(0, period).reduce((acc, candle) => acc + candle.close, 0) / period;
    ema.push({ time: data[period - 1].time, value: firstSMA });
    
    for (let i = period; i < data.length; i++) {
      const emaValue: number = (data[i].close * multiplier) + (ema[ema.length - 1].value * (1 - multiplier));
      ema.push({ time: data[i].time, value: emaValue });
    }
    return ema;
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={tokenInfoStyles}>
          {token ? (
            <>
              <div style={tokenNameStyles}>{token.symbol}</div>
              <div style={priceStyles}>{formatPrice(token)}</div>
              <div style={{
                fontSize: isMobile ? '14px' : '11px',      // Responsive font
                fontWeight: 600,
                padding: isMobile ? '4px 8px' : '2px 4px',    // Responsive padding
                borderRadius: isMobile ? '4px' : '2px',
                background: token.priceChange24h >= 0 
                  ? 'rgba(0, 200, 5, 0.1)' 
                  : 'rgba(255, 82, 82, 0.1)',
                color: token.priceChange24h >= 0 ? theme.accent.green : theme.accent.red,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
              </div>
            </>
          ) : (
            <div style={{ color: theme.text.secondary }}>Select a token to view chart</div>
          )}
        </div>

        <div style={controlsContainerStyles}>
          {/* Timeframe Controls */}
          <div style={controlGroupStyles}>
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                style={chartButtonStyles(timeframe === tf)}
                onClick={() => setTimeframe(tf)}
                aria-label={`${tf} timeframe`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div style={separatorStyles} />

          {/* Chart Type Controls */}
          <div style={controlGroupStyles}>
            <button
              style={chartButtonStyles(chartType === 'candlestick')}
              onClick={() => setChartType('candlestick')}
              aria-label="Candlestick chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              style={chartButtonStyles(chartType === 'line')}
              onClick={() => setChartType('line')}
              aria-label="Line chart"
            >
              <LineChart className="w-4 h-4" />
            </button>
          </div>

          <div style={separatorStyles} />

          {/* Indicator Controls */}
          <div style={controlGroupStyles}>
            <button
              style={chartButtonStyles(!!indicators.find(i => i.type === 'sma')?.visible)}
              onClick={() => toggleIndicator('sma')}
              aria-label="Toggle SMA indicator"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              style={chartButtonStyles(!!indicators.find(i => i.type === 'ema')?.visible)}
              onClick={() => toggleIndicator('ema')}
              aria-label="Toggle EMA indicator"
            >
              <TrendingDown className="w-4 h-4" />
            </button>
            <button
              style={chartButtonStyles(!!indicators.find(i => i.type === 'volume')?.visible)}
              onClick={() => toggleIndicator('volume')}
              aria-label="Toggle Volume indicator"
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>

          <div style={separatorStyles} />

          {/* Zoom Controls */}
          <div style={controlGroupStyles}>
            <button
              style={chartButtonStyles(false)}
              onClick={() => chartRef.current?.timeScale().fitContent()}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              style={chartButtonStyles(false)}
              onClick={() => chartRef.current?.timeScale().fitContent()}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              style={chartButtonStyles(false)}
              onClick={() => chartRef.current?.timeScale().fitContent()}
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div style={separatorStyles} />

          {/* Settings */}
          <button
            style={chartButtonStyles(showSettings)}
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Chart settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={chartContainerRef} 
        style={{ 
          flex: 1, 
          position: 'relative',
          width: '100%', 
          height: '400px',
          minHeight: '400px',        // ADD: Ensure minimum height
          cursor: 'crosshair',       // ADD: Better cursor for trading chart
          touchAction: 'none',       // ADD: Better touch handling
        }} 
      >
        {/* Placeholder when no token is selected */}
        {!token && !loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: theme.text.tertiary,
            pointerEvents: 'none',
          }}>
            <TrendingUp 
              style={{ 
                width: isMobile ? '48px' : '64px',
                height: isMobile ? '48px' : '64px',
                color: theme.accent.blue, 
                opacity: 0.3,
                margin: '0 auto 16px',
              }} 
            />
            <div style={{ 
              fontSize: isMobile ? '14px' : '16px',
              marginBottom: '8px',
              fontWeight: 500,
            }}>
              Select a token to view chart
            </div>
            <div style={{ 
              fontSize: isMobile ? '12px' : '13px',
              opacity: 0.7,
            }}>
              Choose from the token list on the left
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <Activity 
              style={{ 
                width: '32px',
                height: '32px',
                color: theme.accent.blue,
                animation: 'spin 1s linear infinite',
              }} 
            />
            <div style={{
              marginTop: '12px',
              fontSize: '13px',
              color: theme.text.secondary,
            }}>
              Loading chart data...
            </div>
          </div>
        )}
      </div>

      {/* Chart Controls Hint */}
      <div style={{
        fontSize: '11px',
        color: theme.text.tertiary,
        marginTop: '8px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        opacity: 0.7,
      }}>
        <span>🖱️ Click + Drag to pan</span>
        <span>⚙️ Scroll to zoom</span>
        <span>↔️ Double-click to fit</span>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '16px',
          background: theme.surface.primary,
          border: `1px solid ${theme.border.primary}`,
          borderRadius: '8px',
          padding: '16px',
          minWidth: '300px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            color: theme.text.primary,
            fontSize: '14px',
            fontWeight: 600
          }}>
            Chart Settings
          </h4>
          
          {/* Scale Type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '12px',
              color: theme.text.secondary,
              fontWeight: 500
            }}>
              Scale Type
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={chartButtonStyles(scaleType === 'linear')}
                onClick={() => setScaleType('linear')}
                aria-label="Linear scale"
              >
                Linear
              </button>
              <button
                style={chartButtonStyles(scaleType === 'logarithmic')}
                onClick={() => setScaleType('logarithmic')}
                aria-label="Logarithmic scale"
              >
                Log
              </button>
            </div>
          </div>

          {/* Grid Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '12px',
              color: theme.text.secondary,
              fontWeight: 500
            }}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                style={{ margin: 0 }}
              />
              Show Grid
            </label>
          </div>

          {/* Indicators */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '12px',
              color: theme.text.secondary,
              fontWeight: 500
            }}>
              Indicators
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {indicators.map((indicator, index) => (
                <div key={indicator.type} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px',
                  background: theme.surface.tertiary,
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={indicator.visible}
                      onChange={() => toggleIndicator(indicator.type)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ 
                      fontSize: '12px',
                      color: theme.text.primary,
                      textTransform: 'uppercase',
                      fontWeight: 500
                    }}>
                      {indicator.type}
                    </span>
                  </div>
                  {indicator.period > 0 && (
                    <input
                      type="number"
                      value={indicator.period}
                      onChange={(e) => {
                        const newPeriod = parseInt(e.target.value) || 0;
                        setIndicators(prev => prev.map((ind, i) => 
                          i === index ? { ...ind, period: newPeriod } : ind
                        ));
                      }}
                      style={{
                        width: '60px',
                        padding: '4px 8px',
                        background: theme.surface.primary,
                        border: `1px solid ${theme.border.primary}`,
                        borderRadius: '4px',
                        color: theme.text.primary,
                        fontSize: '12px'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: theme.text.secondary,
          background: theme.surface.primary,
          padding: '12px 20px',
          borderRadius: '8px',
          border: `1px solid ${theme.border.primary}`,
        }}>
          Loading chart data...
        </div>
      )}

      {!token && !loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: theme.text.tertiary,
        }}>
          Select a token from the list to view its chart
        </div>
      )}
    </div>
  );
};

// Generate mock price data for area chart
function generateMockCandleData(basePrice: number, timeframe: Timeframe) {
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  const intervals = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };
  const interval = intervals[timeframe];
  const count = 100;

  let currentPrice = basePrice;
  for (let i = count; i >= 0; i--) {
    const time = (now - (i * interval)) as Time;
    // Simulate price movement with random walk
    const change = (Math.random() - 0.5) * 0.02;
    currentPrice = currentPrice * (1 + change);

    data.push({
      time,
      value: currentPrice,
    });
  }

  return data;
}

export default TradingChart;

