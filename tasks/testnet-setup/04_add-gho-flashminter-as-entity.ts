import { GhoFlashMinter } from '../../../types/src/contracts/facilitators/flashMinter/GhoFlashMinter';
import { GhoToken } from '../../../types/src/contracts/gho/GhoToken';
import { task } from 'hardhat/config';
import { ghoEntityConfig } from '../../helpers/config';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';

task('add-gho-flashminter-as-entity', 'Adds FlashMinter as a gho entity')
  .addFlag('batch', 'Add transactions to batch instead of executing directly')
  .setAction(async ({ batch }, hre) => {
    const { ethers } = hre;

    const gho = (await ethers.getContract('GhoToken')) as GhoToken;
    const ghoFlashMinter = (await ethers.getContract('GhoFlashMinter')) as GhoFlashMinter;

    if (batch) {
      const tx = await gho.populateTransaction.addFacilitator(
        ghoFlashMinter.address,
        ghoEntityConfig.flashMinterLabel,
        ghoEntityConfig.flashMinterCapacity,
        {
          gasLimit: 500_000,
        }
      );
      addTransaction(tx);
      console.log(`Added FlashMinter facilitator (${ghoFlashMinter.address}) to batch`);
    } else {
      const addEntityTx = await gho.addFacilitator(
        ghoFlashMinter.address,
        ghoEntityConfig.flashMinterLabel,
        ghoEntityConfig.flashMinterCapacity
      );
      const addEntityTxReceipt = await addEntityTx.wait();

      const newEntityEvents = addEntityTxReceipt.events?.find(
        (e) => e.event === 'FacilitatorAdded'
      );
      if (newEntityEvents?.args) {
        console.log(`Address added as a facilitator: ${JSON.stringify(newEntityEvents.args[0])}`);
      } else {
        throw new Error(`Error at adding entity. Check tx: ${addEntityTx.hash}`);
      }
    }
  });
