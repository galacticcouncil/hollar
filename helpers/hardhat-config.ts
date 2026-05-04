import {
  DEFAULT_BLOCK_GAS_LIMIT,
  eEthereumNetwork,
  FORK,
  FORK_BLOCK_NUMBER,
  getAlchemyKey,
} from '@galacticcouncil/aave-deploy-v3';
import { HardhatNetworkForkingUserConfig } from 'hardhat/types';
import fs from 'fs';
import { eHydrationNetwork } from '@galacticcouncil/aave-deploy-v3';

/** HARDHAT NETWORK CONFIGURATION */
const MNEMONIC = process.env.MNEMONIC || '';
const MNEMONIC_PATH = "m/44'/60'/0'/0";

export const NETWORKS_RPC_URL: Record<string, string> = {
  [eEthereumNetwork.main]: `https://eth-mainnet.alchemyapi.io/v2/${getAlchemyKey(
    eEthereumNetwork.main
  )}`,
  [eEthereumNetwork.hardhat]: 'http://localhost:8545',
  [eEthereumNetwork.goerli]: `https://eth-goerli.alchemyapi.io/v2/${getAlchemyKey(
    eEthereumNetwork.goerli
  )}`,
  sepolia: 'https://rpc.sepolia.ethpandaops.io',
  [eHydrationNetwork.nice]: 'https://rpc.nice.hydration.cloud',
  [eHydrationNetwork.hydration]: process.env.RPC || 'https://rpc.hydradx.cloud',
  // Local string key — installed @galacticcouncil/aave-deploy-v3 doesn't carry
  // lark2 in its enum; we register it here so hardhat-deploy writes artifacts to
  // hollar/deployments/lark2/ rather than polluting hollar/deployments/hydration/
  // (which holds real mainnet artifacts).
  lark2: process.env.RPC || 'https://2.lark.hydration.cloud',
};

const GAS_PRICE_PER_NET: Record<string, number> = {};

export const LIVE_NETWORKS: Record<string, boolean> = {
  [eEthereumNetwork.main]: true,
};

/** HARDHAT HELPERS */
export const buildForkConfig = (): HardhatNetworkForkingUserConfig | undefined => {
  let forkMode: HardhatNetworkForkingUserConfig | undefined;
  if (FORK && NETWORKS_RPC_URL[FORK]) {
    forkMode = {
      url: NETWORKS_RPC_URL[FORK] as string,
    };
    console.log('Fork mode activated:', NETWORKS_RPC_URL[FORK]);
    if (FORK_BLOCK_NUMBER) {
      forkMode.blockNumber = FORK_BLOCK_NUMBER;
    }
  }
  return forkMode;
};

export const hardhatNetworkSettings = {
  blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
  throwOnTransactionFailures: true,
  throwOnCallFailures: true,
  chainId: 31337,
  forking: buildForkConfig(),
  saveDeployments: true,
  allowUnlimitedContractSize: true,
  tags: ['local'],
  accounts:
    FORK && !!MNEMONIC
      ? {
          mnemonic: MNEMONIC,
          path: MNEMONIC_PATH,
          initialIndex: 0,
          count: 10,
        }
      : undefined,
};

export const getCommonNetworkConfig = (networkName: string, chainId?: number) => ({
  url: process.env.RPC || NETWORKS_RPC_URL[networkName] || '',
  blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
  chainId,
  gasPrice: GAS_PRICE_PER_NET[networkName] || undefined,
  // Hydration/lark eth_estimateGas is unreliable; bump multiplier to avoid OOG reverts.
  gasMultiplier: 20,
  accounts: [
    process.env.PRIV_KEY || 'd9b59470b079ffd6a0373c0870dcf7faf8c20f7340b6d05acbeb8a8a8473b131',
  ],
  ...(!!MNEMONIC && {
    accounts: {
      mnemonic: MNEMONIC,
      path: MNEMONIC_PATH,
      initialIndex: 0,
      count: 10,
    },
  }),
  live: LIVE_NETWORKS[networkName] || false,
});

export function getRemappings() {
  return fs
    .readFileSync('hardhat-remappings.txt', 'utf8')
    .split('\n')
    .filter(Boolean) // remove empty lines
    .map((line) => {
      return line.trim().split('=');
    });
}
