import { task } from 'hardhat/config';
import {
  TREASURY_PROXY_ID,
  getAaveProtocolDataProvider,
  waitForTx,
  getPoolConfiguratorProxy,
} from '@galacticcouncil/aave-deploy-v3';
import { GhoToken } from '../../../types/src/contracts/gho/GhoToken';
import { getGhoAToken, getGhoVariableDebtToken } from '../../helpers/contract-getters';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';
import { utils } from 'ethers';

task('set-gho-addresses', 'Set addresses as needed in GhoAToken and GhoVariableDebtToken')
  .addFlag('batch', 'Add transactions to batch instead of executing directly')
  .setAction(async ({ batch }, hre) => {
    const { ethers } = hre;

    const gho = (await ethers.getContract('GhoToken')) as GhoToken;
    const treasuryAddress = await (await hre.deployments.get(TREASURY_PROXY_ID)).address;

    let ghoAToken, ghoVariableDebtToken;
    if (!batch) {
      const aaveDataProvider = await getAaveProtocolDataProvider();
      const tokenProxyAddresses = await aaveDataProvider.getReserveTokensAddresses(gho.address);
      ghoAToken = await getGhoAToken(tokenProxyAddresses.aTokenAddress);
      ghoVariableDebtToken = await getGhoVariableDebtToken(
        tokenProxyAddresses.variableDebtTokenAddress
      );
    } else {
      const poolConfigurator = await getPoolConfiguratorProxy();
      const nonce = await hre.ethers.provider.getTransactionCount(poolConfigurator.address);

      ghoAToken = await getGhoAToken(
        utils.getContractAddress({
          from: poolConfigurator.address,
          nonce: nonce,
        })
      );
      ghoVariableDebtToken = await getGhoVariableDebtToken(
        utils.getContractAddress({
          from: poolConfigurator.address,
          nonce: nonce + 2, // +1 is stable debt token, +2 is variable debt token
        })
      );
    }

    // Set treasury
    if (batch) {
      const txTreasury = await ghoAToken.populateTransaction.updateGhoTreasury(treasuryAddress);
      addTransaction(txTreasury);
      console.log(`Added GhoAToken treasury update to batch`);
    } else {
      const setTreasuryTxReceipt = await waitForTx(
        await ghoAToken.updateGhoTreasury(treasuryAddress)
      );
      console.log(
        `GhoAToken treasury set to: ${treasuryAddress} in tx: ${setTreasuryTxReceipt.transactionHash}`
      );
    }

    // Set variable debt token in AToken
    if (batch) {
      const txVariableDebt = await ghoAToken.populateTransaction.setVariableDebtToken(
        ghoVariableDebtToken.address
      );
      addTransaction(txVariableDebt);
      console.log(`Added GhoAToken variableDebtContract update to batch`);
    } else {
      const setVariableDebtTxReceipt = await waitForTx(
        await ghoAToken.setVariableDebtToken(ghoVariableDebtToken.address)
      );
      console.log(
        `GhoAToken variableDebtContract set to: ${ghoVariableDebtToken.address} in tx: ${setVariableDebtTxReceipt.transactionHash}`
      );
    }

    // Set AToken in variable debt token
    if (batch) {
      const txAToken = await ghoVariableDebtToken.populateTransaction.setAToken(ghoAToken.address);
      addTransaction(txAToken);
      console.log(`Added VariableDebtToken aToken update to batch`);
    } else {
      const setATokenTxReceipt = await waitForTx(
        await ghoVariableDebtToken.setAToken(ghoAToken.address)
      );
      console.log(
        `VariableDebtToken aToken set to: ${ghoAToken.address} in tx: ${setATokenTxReceipt.transactionHash}`
      );
    }
  });
