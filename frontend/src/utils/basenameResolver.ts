/**
 * Basename resolver utility for Base ecosystem
 * Resolves basenames like stefo0.base.eth to Ethereum addresses
 */

// stefo0.base.eth resolved address for Base Batches submission
// This is the actual address for stefo0.base.eth basename
export const STEFO0_BASE_ETH_ADDRESS = '0x7897ee83FE2281d8780483A6E7bFD251d3152cF7' as `0x${string}`;

/**
 * Resolve a basename to an Ethereum address
 * @param basename - The basename to resolve (e.g., "stefo0.base.eth")
 * @returns The resolved Ethereum address
 */
export const resolveBasename = async (basename: string): Promise<`0x${string}`> => {
  // Resolve stefo0.base.eth to actual address for Base Batches submission
  if (basename === 'stefo0.base.eth') {
    return STEFO0_BASE_ETH_ADDRESS;
  }
  
  // For other basenames, you would implement actual resolution logic here
  throw new Error(`Basename ${basename} not supported yet`);
};

/**
 * Check if a string is a valid Ethereum address
 * @param address - The string to check
 * @returns True if it's a valid Ethereum address
 */
export const isValidAddress = (address: string): address is `0x${string}` => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Get the appreciation recipient address
 * @returns The address to send appreciation to
 */
export const getAppreciationAddress = (): `0x${string}` => {
  return STEFO0_BASE_ETH_ADDRESS;
};
