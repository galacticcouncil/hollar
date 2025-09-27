import { task } from 'hardhat/config';
import {
  getAaveProtocolDataProvider,
  getAddressFromJson,
  getPoolConfiguratorProxy,
  POOL_DATA_PROVIDER,
  waitForTx,
} from '@galacticcouncil/aave-deploy-v3';
import { GhoToken } from '../../../types/src/contracts/gho/GhoToken';
import { getGhoVariableDebtToken, getContract, getGhoAToken } from '../../helpers/contract-getters';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';
import { utils } from 'ethers';

task('set-zero-discount-rate-strategy', 'Set ZeroDiscountRateStrategy in GhoVariableDebtToken')
  .addFlag('batch', 'Add transactions to batch instead of executing directly')
  .setAction(async ({ batch }, hre) => {
    const { ethers } = hre;
    const network = hre.network.name;

    const gho = (await ethers.getContract('GhoToken')) as GhoToken;
    const aaveDataProvider = await getAaveProtocolDataProvider(
      await getAddressFromJson(network, POOL_DATA_PROVIDER)
    );
    const tokenProxyAddresses = await aaveDataProvider.getReserveTokensAddresses(gho.address);
    let ghoVariableDebtToken = await getGhoVariableDebtToken(
      tokenProxyAddresses.variableDebtTokenAddress
    );

    // Set zero discount rate strategy
    const discountStrategy = await getContract('ZeroDiscountRateStrategy');

    if (batch) {
      const poolConfigurator = await getPoolConfiguratorProxy();
      const nonce = await hre.ethers.provider.getTransactionCount(poolConfigurator.address);

      ghoVariableDebtToken = await getGhoVariableDebtToken(
        utils.getContractAddress({
          from: poolConfigurator.address,
          nonce: nonce + 2, // +1 is stable debt token, +2 is variable debt token
        })
      );
      const txDiscountRate =
        await ghoVariableDebtToken.populateTransaction.updateDiscountRateStrategy(
          discountStrategy.address
        );
      addTransaction(txDiscountRate);
      console.log(`Added ZeroDiscountRateStrategy update to batch`);
    } else {
      const setDiscountRateTxReceipt = await waitForTx(
        await ghoVariableDebtToken.updateDiscountRateStrategy(discountStrategy.address)
      );
      console.log(
        `ZeroDiscountRateStrategy(${discountStrategy.address}) set to VariableDebtToken: ${ghoVariableDebtToken.address} in tx: ${setDiscountRateTxReceipt.transactionHash}`
      );
    }

    // Set discount token
    const discountToken = await getContract('GhoToken');

    if (batch) {
      const txDiscountToken = await ghoVariableDebtToken.populateTransaction.updateDiscountToken(
        discountToken.address
      );
      addTransaction(txDiscountToken);
      console.log(`Added DiscountToken update to batch`);
    } else {
      const setDiscountTokenTxReceipt = await waitForTx(
        await ghoVariableDebtToken.updateDiscountToken(discountToken.address)
      );
      console.log(
        `DiscountToken(${discountToken.address}) set to VariableDebtToken: ${ghoVariableDebtToken.address} in tx: ${setDiscountTokenTxReceipt.transactionHash}`
      );
    }
  });
