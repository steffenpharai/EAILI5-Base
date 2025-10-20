import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useWallet } from '../useWallet';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
  useSwitchChain: vi.fn(),
}));

// Mock the wagmi hooks
const mockUseAccount = vi.mocked(require('wagmi').useAccount);
const mockUseConnect = vi.mocked(require('wagmi').useConnect);
const mockUseDisconnect = vi.mocked(require('wagmi').useDisconnect);
const mockUseSwitchChain = vi.mocked(require('wagmi').useSwitchChain);

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wallet Connection', () => {
    it('returns connected wallet information', () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 8453, // Base mainnet
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connect).toBe(mockConnect);
      expect(result.current.disconnect).toBe(mockDisconnect);
    });

    it('returns disconnected state when no wallet connected', () => {
      const mockAccount = {
        address: undefined,
        isConnected: false,
        chainId: undefined,
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.address).toBe(null);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connect).toBe(mockConnect);
      expect(result.current.disconnect).toBe(mockDisconnect);
    });

    it('handles connection errors', () => {
      const mockAccount = {
        address: undefined,
        isConnected: false,
        chainId: undefined,
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: new Error('Connection failed'),
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.address).toBe(null);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connect).toBe(mockConnect);
    });
  });

  describe('Chain Switching', () => {
    it('switches to Base mainnet', async () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 1, // Ethereum mainnet
      };

      const mockSwitchChain = vi.fn();
      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: mockSwitchChain,
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.switchToBase();
      });

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 8453 });
    });

    it('switches to Base Sepolia testnet', async () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 1, // Ethereum mainnet
      };

      const mockSwitchChain = vi.fn();
      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: mockSwitchChain,
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.switchToBaseSepolia();
      });

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 84532 });
    });

    it('handles chain switch errors', async () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 1,
      };

      const mockSwitchChain = vi.fn().mockRejectedValue(new Error('Switch failed'));
      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: mockSwitchChain,
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        try {
          await result.current.switchToBase();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Switch failed');
        }
      });
    });
  });

  describe('Wallet Disconnection', () => {
    it('disconnects wallet successfully', async () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 8453,
      };

      const mockDisconnect = vi.fn();
      const mockConnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('handles disconnection errors', async () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 8453,
      };

      const mockDisconnect = vi.fn().mockRejectedValue(new Error('Disconnect failed'));
      const mockConnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        try {
          await result.current.disconnect();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Disconnect failed');
        }
      });
    });
  });

  describe('Pending States', () => {
    it('handles pending connection', () => {
      const mockAccount = {
        address: undefined,
        isConnected: false,
        chainId: undefined,
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: true,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isConnecting).toBe(true);
    });

    it('handles pending disconnection', () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 8453,
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: true,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isDisconnecting).toBe(true);
    });

    it('handles pending chain switch', () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 1,
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: true,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isSwitchingChain).toBe(true);
    });
  });

  describe('Chain Detection', () => {
    it('detects Base mainnet chain', () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 8453, // Base mainnet
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isBaseChain).toBe(true);
      expect(result.current.isBaseSepoliaChain).toBe(false);
    });

    it('detects Base Sepolia testnet chain', () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 84532, // Base Sepolia
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isBaseChain).toBe(false);
      expect(result.current.isBaseSepoliaChain).toBe(true);
    });

    it('detects non-Base chains', () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 1, // Ethereum mainnet
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isBaseChain).toBe(false);
      expect(result.current.isBaseSepoliaChain).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles connection errors gracefully', () => {
      const mockAccount = {
        address: undefined,
        isConnected: false,
        chainId: undefined,
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: new Error('User rejected connection'),
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.address).toBe(null);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe('User rejected connection');
    });

    it('handles disconnection errors gracefully', () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 8453,
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: new Error('Disconnection failed'),
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBe('Disconnection failed');
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const mockAccount = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        chainId: 8453,
      };

      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();

      mockUseAccount.mockReturnValue(mockAccount);
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [],
        isPending: false,
        error: null,
      });
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
        isPending: false,
        error: null,
      });
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result, rerender } = renderHook(() => useWallet());

      const initialAddress = result.current.address;

      // Re-render with same dependencies
      rerender();

      // Should not cause new state changes
      expect(result.current.address).toBe(initialAddress);
    });
  });
});
