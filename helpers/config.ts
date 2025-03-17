import { ethers } from 'ethers';
import { ZERO_ADDRESS } from './constants';

export const ghoTokenConfig = {
  TOKEN_NAME: 'HOLLAR',
  TOKEN_SYMBOL: 'HOLLAR',
  TOKEN_DECIMALS: 18,
};

export const ghoReserveConfig = {
  INTEREST_RATE: ethers.utils.parseUnits('6.0', 25),
};

export const ghoEntityConfig = {
  label: 'Hydration Market',
  entityAddress: ZERO_ADDRESS,
  mintLimit: ethers.utils.parseUnits('1.0', 25), // 1M
  flashMinterLabel: 'HOLLAR FlashMinter',
  flashMinterCapacity: ethers.utils.parseUnits('1.0', 25), // 1M
  flashMinterMaxFee: ethers.utils.parseUnits('10000', 0), // 100%
  flashMinterFee: 100, // 1.00%
};
