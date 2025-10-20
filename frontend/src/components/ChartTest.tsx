import React, { useState } from 'react';
import { TrendingUp, RefreshCw, BarChart3, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProButton } from './pro';
import TradingChart from './TradingChart';
import { useChartData } from '../hooks/useChartData';
import { useTokenList } from '../hooks/useChartData';

const ChartTest: React.FC = () => {
  const { theme } = useTheme();
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1h');
  const [showRealData, setShowRealData] = useState(true);
  
  const { tokens, loading: tokensLoading, error: tokensError } = useTokenList('top15', 10);
  const { ohlc, loading: chartLoading, error: chartError, refetch } = useChartData(
    selectedToken?.address, 
    timeframe === '1m' || timeframe === '5m' || timeframe === '15m' ? 1 : 
    timeframe === '1h' ? 1 : 
    timeframe === '4h' ? 7 : 30
  );

  const handleTokenSelect = (token: any) => {
    setSelectedToken(token);
  };

  const handleTimeframeChange = (newTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d') => {
    setTimeframe(newTimeframe);
  };

  const handleRefresh = () => {
    if (selectedToken) {
      refetch();
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.surface.primary,
    padding: '20px',
    gap: '20px',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: theme.surface.secondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const controlsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const tokenListStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: theme.surface.secondary,
    padding: '16px',
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
    maxHeight: '200px',
    overflowY: 'auto',
  };

  const tokenItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    border: '1px solid transparent',
  };

  const selectedTokenStyles: React.CSSProperties = {
    background: theme.accent.blue,
    color: theme.surface.primary,
    borderColor: theme.accent.blue,
  };

  const tokenNameStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'inherit',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const tokenPriceStyles: React.CSSProperties = {
    fontSize: '12px',
    fontFamily: 'JetBrains Mono, monospace',
    color: 'inherit',
  };

  const chartContainerStyles: React.CSSProperties = {
    flex: 1,
    background: theme.surface.secondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
    overflow: 'hidden',
  };

  const statusStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: theme.text.secondary,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const timeframeContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '12px',
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '$0.00';
    if (price < 0.000001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>
          <BarChart3 className="w-6 h-6" />
          Chart Test
        </h2>
        <div style={controlsStyles}>
          <ProButton
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={!selectedToken || chartLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${chartLoading ? 'animate-spin' : ''}`} />
            Refresh
          </ProButton>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
        {/* Token List */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: theme.text.primary,
            marginBottom: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            Select Token
          </h3>
          
          {tokensLoading ? (
            <div style={{ textAlign: 'center', color: theme.text.secondary, padding: '20px' }}>
              <Activity className="w-6 h-6 mx-auto mb-2 animate-pulse" />
              Loading tokens...
            </div>
          ) : tokensError ? (
            <div style={{ textAlign: 'center', color: theme.accent.red, padding: '20px' }}>
              Error: {tokensError}
            </div>
          ) : (
            <div style={tokenListStyles}>
              {tokens.map((token) => (
                <div
                  key={token.address}
                  style={{
                    ...tokenItemStyles,
                    ...(selectedToken?.address === token.address ? selectedTokenStyles : {}),
                  }}
                  onClick={() => handleTokenSelect(token)}
                  onMouseEnter={(e) => {
                    if (selectedToken?.address !== token.address) {
                      e.currentTarget.style.background = theme.surface.tertiary;
                      e.currentTarget.style.borderColor = theme.border.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedToken?.address !== token.address) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div>
                    <div style={tokenNameStyles}>{token.symbol}</div>
                    <div style={{ fontSize: '12px', color: 'inherit', opacity: 0.7 }}>
                      {token.name}
                    </div>
                  </div>
                  <div style={tokenPriceStyles}>
                    {formatPrice(token.price)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timeframe Selection */}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.text.primary,
              marginBottom: '8px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Timeframe
            </h4>
            <div style={timeframeContainerStyles}>
              {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
                <ProButton
                  key={tf}
                  variant={timeframe === tf ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTimeframeChange(tf)}
                >
                  {tf}
                </ProButton>
              ))}
            </div>
          </div>

          {/* Chart Status */}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.text.primary,
              marginBottom: '8px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Chart Status
            </h4>
            <div style={statusStyles}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: chartLoading ? theme.accent.orange : 
                           chartError ? theme.accent.red : 
                           ohlc.length > 0 ? theme.accent.green : theme.text.tertiary,
              }} />
              {chartLoading ? 'Loading...' : 
               chartError ? `Error: ${chartError}` : 
               ohlc.length > 0 ? `${ohlc.length} data points` : 'No data'}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={chartContainerStyles}>
          {selectedToken ? (
            <TradingChart token={selectedToken} />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.text.tertiary,
              textAlign: 'center',
            }}>
              <div>
                <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
                <p>Select a token to view its chart</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartTest;
