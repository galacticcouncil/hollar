import { task } from 'hardhat/config';

import { ghoEntityConfig } from '../../helpers/config';
import {
  getAaveProtocolDataProvider,
  getAddressFromJson,
  getPoolConfiguratorProxy,
  POOL_DATA_PROVIDER,
} from '@galacticcouncil/aave-deploy-v3';
import { GhoToken } from '../../types';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';
import { utils } from 'ethers';

task('add-gho-as-entity', 'Adds Aave as a gho entity')
  .addFlag('batch', 'Add transactions to batch instead of executing directly')
  .setAction(async ({ batch }, hre) => {
    const { ethers } = hre;
    const network = hre.network.name;

    const gho = (await ethers.getContract('GhoToken')) as GhoToken;
    const aaveDataProvider = await getAaveProtocolDataProvider(
      await getAddressFromJson(network, POOL_DATA_PROVIDER)
    );

    const tokenProxyAddresses = await aaveDataProvider.getReserveTokensAddresses(gho.address);

    const [deployer] = await hre.ethers.getSigners();

    if (batch) {
      const poolConfigurator = await getPoolConfiguratorProxy();
      const nonce = await hre.ethers.provider.getTransactionCount(poolConfigurator.address);
      const ghoATokenAddress = utils.getContractAddress({
        from: poolConfigurator.address,
        nonce: nonce,
      });
      const tx = await gho
        .connect(deployer)
        .populateTransaction.addFacilitator(
          ghoATokenAddress,
          ghoEntityConfig.label,
          ghoEntityConfig.mintLimit,
          {
            gasLimit: 500_000,
          }
        );
      addTransaction(tx);
      console.log(`Added Aave facilitator (${ghoATokenAddress}) to batch`);
    } else {
      const addEntityTx = await gho
        .connect(deployer)
        .addFacilitator(
          tokenProxyAddresses.aTokenAddress,
          ghoEntityConfig.label,
          ghoEntityConfig.mintLimit
        );
      const addEntityTxReceipt = await addEntityTx.wait();

      const newEntityEvents = addEntityTxReceipt.events?.find(
        (e) => e.event === 'FacilitatorAdded'
      );

      if (newEntityEvents?.args) {
        console.log(`Address added as a facilitator: ${JSON.stringify(newEntityEvents.args[0])}`);
      } else {
        throw new Error(
          `Error when adding facilitator. Check tx ${addEntityTxReceipt.transactionHash}`
        );
      }
    }
  });
