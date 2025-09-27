import { task } from 'hardhat/config';

import { getAaveOracle } from '@galacticcouncil/aave-deploy-v3';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';

task('set-gho-oracle', 'Set oracle for gho in Aave Oracle')
  .addFlag('batch', 'Add transactions to batch instead of executing directly')
  .setAction(async ({ batch }, hre) => {
    const { ethers } = hre;

    const gho = await ethers.getContract('GhoToken');
    const ghoOracle = await ethers.getContract('GhoOracle');
    const aaveOracle = await getAaveOracle();

    if (batch) {
      const tx = await aaveOracle.populateTransaction.setAssetSources(
        [gho.address],
        [ghoOracle.address]
      );
      addTransaction(tx);
      console.log(`Added GHO oracle setting to batch`);
    } else {
      const setSourcesTx = await aaveOracle.setAssetSources([gho.address], [ghoOracle.address]);
      const setSourcesTxReceipt = await setSourcesTx.wait();

      const assetSourceUpdate = setSourcesTxReceipt.events?.find(
        (e) => e.event === 'AssetSourceUpdated'
      );

      if (assetSourceUpdate?.args) {
        const { source, asset } = assetSourceUpdate.args;
        console.log(`Source set to: ${source} for asset ${asset}`);
      } else {
        throw new Error(`Error at oracle setup, check tx: ${setSourcesTxReceipt.transactionHash}`);
      }
    }
  });
