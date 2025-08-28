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
  mintLimit: ethers.utils.parseUnits('2.0', 24), // 5.5M
  flashMinterLabel: 'HOLLAR FlashMinter',
  flashMinterCapacity: ethers.utils.parseUnits('0.1', 24), // 100k
  flashMinterMaxFee: ethers.utils.parseUnits('10000', 0), // 100%
  flashMinterFee: 100, // 1.00%
  hsmCapacity: ethers.utils.parseUnits('1.0', 24), // 550k
};
