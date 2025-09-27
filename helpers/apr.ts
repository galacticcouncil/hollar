const AAVE_COMPOUNDING_PERIODS = 31536000;

function apyToApr(apy, n = AAVE_COMPOUNDING_PERIODS) {
  return n * (Math.pow(1 + apy, 1 / n) - 1);
}

/**
 * Converts APY to APR with percentage inputs/outputs
 * @param {number} apyPercent - APY as a percentage (e.g., 5 for 5%)
 * @param {number} n - Number of compounding periods per year (default: 12)
 * @returns {number} APR as a percentage
 */
export function apyToAprPercent(apyPercent, n = AAVE_COMPOUNDING_PERIODS) {
  const apy = apyPercent / 100;
  const apr = apyToApr(apy, n);
  return apr * 100;
}
