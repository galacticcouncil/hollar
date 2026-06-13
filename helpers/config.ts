import { ethers } from 'ethers';
import { ZERO_ADDRESS } from './constants';
import { apyToAprPercent } from './apr';

export const ghoTokenConfig = {
  TOKEN_NAME: 'Hydrated Dollar',
  TOKEN_SYMBOL: 'HOLLAR',
  TOKEN_DECIMALS: 18,
};

export const ghoReserveConfig = {
  INTEREST_RATE: ethers.utils.parseUnits(apyToAprPercent(4.5).toString(), 25),
};

export const bilReserveConfig = {
  INTEREST_RATE: ethers.utils.parseUnits(apyToAprPercent(10).toString(), 25), // 10% APY
};

export const bilEntityConfig = {
  label: 'BIL',
  mintLimit: ethers.utils.parseUnits('1.0', 24), // 1M HOLLAR
};

export const ghoEntityConfig = {
  label: 'Hydration Market',
  entityAddress: ZERO_ADDRESS,
  mintLimit: ethers.utils.parseUnits('12.0', 24), // 12M
  flashMinterLabel: 'HOLLAR FlashMinter',
  flashMinterCapacity: ethers.utils.parseUnits('0.1', 24), // 100k
  flashMinterMaxFee: ethers.utils.parseUnits('10000', 0), // 100%
  flashMinterFee: 100, // 1.00%
  hsmCapacity: ethers.utils.parseUnits('18.0', 24), // 18M
};
