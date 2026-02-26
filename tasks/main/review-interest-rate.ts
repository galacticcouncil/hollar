import { task } from 'hardhat/config';
import { BigNumber } from 'ethers';

import { ghoReserveConfig } from '../../helpers/config';
import {
  getAaveProtocolDataProvider,
  getAddressFromJson,
  getPoolConfiguratorProxy,
  POOL_DATA_PROVIDER,
} from '@galacticcouncil/aave-deploy-v3';
import { getPoolAddressesProvider } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { GhoInterestRateStrategy, GhoToken } from '../../types';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';

task(
  'review-interest-rate',
  'Compare config and on-chain interest rate, deploy new strategy if different'
).setAction(async (_, hre) => {
  const { ethers } = hre;
  const network = hre.network.name;

  const gho = (await ethers.getContract('GhoToken')) as GhoToken;
  const aaveDataProvider = await getAaveProtocolDataProvider(
    await getAddressFromJson(network, POOL_DATA_PROVIDER)
  );

  // Get the current interest rate strategy address from the pool
  const currentStrategyAddress = await aaveDataProvider.getInterestRateStrategyAddress(gho.address);

  // Get the current on-chain interest rate
  const currentStrategy = (await ethers.getContractAt(
    'GhoInterestRateStrategy',
    currentStrategyAddress
  )) as GhoInterestRateStrategy;
  const onChainRate = await currentStrategy.getBaseVariableBorrowRate();

  // Get the configured interest rate
  const configuredRate = ghoReserveConfig.INTEREST_RATE;

  console.log('Interest Rate Comparison:');
  console.log(`  On-chain rate:    ${onChainRate.toString()}`);
  console.log(`  Configured rate:  ${configuredRate.toString()}`);

  if (onChainRate.eq(configuredRate)) {
    console.log('Interest rates match - no changes needed');
    return;
  }

  console.log('Interest rates differ - deploying new strategy...');

  // Deploy new interest rate strategy
  const addressesProvider = await getPoolAddressesProvider();
  const GhoInterestRateStrategyFactory = await ethers.getContractFactory('GhoInterestRateStrategy');
  const newStrategy = await GhoInterestRateStrategyFactory.deploy(
    addressesProvider.address,
    configuredRate
  );
  await newStrategy.deployed();

  console.log(`New GhoInterestRateStrategy deployed at: ${newStrategy.address}`);

  // Verify the new rate
  const newRate = await newStrategy.getBaseVariableBorrowRate();
  console.log(`New strategy rate: ${newRate.toString()}`);

  // Add transaction to set the new interest rate strategy
  const poolConfigurator = await getPoolConfiguratorProxy();
  const tx = await poolConfigurator.populateTransaction.setReserveInterestRateStrategyAddress(
    gho.address,
    newStrategy.address,
    { gasLimit: 200_000 }
  );
  addTransaction(tx);

  console.log('Added setReserveInterestRateStrategyAddress transaction to batch');
});
