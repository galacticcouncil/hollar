import { ethers } from 'ethers';
import { ZERO_ADDRESS } from './constants';

export const ghoTokenConfig = {
  TOKEN_NAME: 'Hydrated Dollar',
  TOKEN_SYMBOL: 'HOLLAR',
  TOKEN_DECIMALS: 18,
};

export const ghoReserveConfig = {
  INTEREST_RATE: ethers.utils.parseUnits('5.0', 25),
};

export const ghoEntityConfig = {
  label: 'Hydration Market',
  entityAddress: ZERO_ADDRESS,
  mintLimit: ethers.utils.parseUnits('5.5', 25), // 5.5M
  flashMinterLabel: 'HOLLAR FlashMinter',
  flashMinterCapacity: ethers.utils.parseUnits('0.1', 25), // 100k
  flashMinterMaxFee: ethers.utils.parseUnits('10000', 0), // 100%
  flashMinterFee: 100, // 1.00%
  hsmCapacity: ethers.utils.parseUnits('0.55', 25), // 550k
};
