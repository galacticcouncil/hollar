import { task } from 'hardhat/config';
import {
  STAKE_AAVE_PROXY,
  TREASURY_PROXY_ID,
  getAaveProtocolDataProvider,
  waitForTx,
} from '@galacticcouncil/aave-deploy-v3';
import { GhoToken } from '../../../types/src/contracts/gho/GhoToken';
import { ghoReserveConfig } from '../../helpers/config';
import {
  getGhoAToken,
  getGhoVariableDebtToken,
  getGhoDiscountRateStrategy,
} from '../../helpers/contract-getters';

task(
  'set-gho-addresses',
  'Set addresses as needed in GhoAToken and GhoVariableDebtToken'
).setAction(async (_, hre) => {
  const { ethers } = hre;

  const gho = (await ethers.getContract('GhoToken')) as GhoToken;
  const aaveDataProvider = await getAaveProtocolDataProvider();
  const treasuryAddress = await (await hre.deployments.get(TREASURY_PROXY_ID)).address;
  const tokenProxyAddresses = await aaveDataProvider.getReserveTokensAddresses(gho.address);
  const ghoAToken = await getGhoAToken(tokenProxyAddresses.aTokenAddress);
  const ghoVariableDebtToken = await getGhoVariableDebtToken(
    tokenProxyAddresses.variableDebtTokenAddress
  );

  // Set treasury
  const setTreasuryTxReceipt = await waitForTx(await ghoAToken.updateGhoTreasury(treasuryAddress));
  console.log(
    `GhoAToken treasury set to: ${treasuryAddress} in tx: ${setTreasuryTxReceipt.transactionHash}`
  );

  // Set variable debt token in AToken
  const setVariableDebtTxReceipt = await waitForTx(
    await ghoAToken.setVariableDebtToken(tokenProxyAddresses.variableDebtTokenAddress)
  );
  console.log(
    `GhoAToken variableDebtContract set to: ${tokenProxyAddresses.variableDebtTokenAddress} in tx: ${setVariableDebtTxReceipt.transactionHash}`
  );

  // Set AToken in variable debt token
  const setATokenTxReceipt = await waitForTx(
    await ghoVariableDebtToken.setAToken(tokenProxyAddresses.aTokenAddress)
  );
  console.log(
    `VariableDebtToken aToken set to: ${tokenProxyAddresses.aTokenAddress} in tx: ${setATokenTxReceipt.transactionHash}`
  );
});
