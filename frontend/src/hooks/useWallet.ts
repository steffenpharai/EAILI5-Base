import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const useWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const connectWallet = async () => {
    try {
      await connect({ connector: injected() });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  return {
    address,
    isConnected,
    connect: connectWallet,
    disconnect: disconnectWallet
  };
};
