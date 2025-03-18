import { task } from 'hardhat/config';
import { getAaveProtocolDataProvider, waitForTx } from '@galacticcouncil/aave-deploy-v3';
import { GhoToken } from '../../../types/src/contracts/gho/GhoToken';
import { getGhoVariableDebtToken, getContract } from '../../helpers/contract-getters';

task(
  'set-zero-discount-rate-strategy',
  'Set ZeroDiscountRateStrategy in GhoVariableDebtToken'
).setAction(async (_, hre) => {
  const { ethers } = hre;

  const gho = (await ethers.getContract('GhoToken')) as GhoToken;
  const aaveDataProvider = await getAaveProtocolDataProvider();
  const tokenProxyAddresses = await aaveDataProvider.getReserveTokensAddresses(gho.address);
  const ghoVariableDebtToken = await getGhoVariableDebtToken(
    tokenProxyAddresses.variableDebtTokenAddress
  );

  // Set zero discount rate strategy
  const discountStrategy = await getContract('ZeroDiscountRateStrategy');
  const setDiscountRateTxReceipt = await waitForTx(
    await ghoVariableDebtToken.updateDiscountRateStrategy(discountStrategy.address)
  );
  console.log(
    `ZeroDiscountRateStrategy(${discountStrategy.address}) set to VariableDebtToken: ${ghoVariableDebtToken.address} in tx: ${setDiscountRateTxReceipt.transactionHash}`
  );

  // Set discount token
  const discountToken = await getContract('GhoToken');
  const setDiscountTokenTxReceipt = await waitForTx(
    await ghoVariableDebtToken.updateDiscountToken(discountToken.address)
  );
  console.log(
    `DiscountToken(${discountToken.address}) set to VariableDebtToken: ${ghoVariableDebtToken.address} in tx: ${setDiscountTokenTxReceipt.transactionHash}`
  );
});
