import { GhoToken } from '../../../types/src/contracts/gho/GhoToken';
import { task } from 'hardhat/config';
import { ghoEntityConfig } from '../../helpers/config';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';

task('add-hsm-as-entity', 'Adds HSM as a gho entity')
  .addFlag('batch', 'Add transactions to batch instead of executing directly')
  .setAction(async ({ batch }, hre) => {
    const { ethers } = hre;

    const gho = (await ethers.getContract('GhoToken')) as GhoToken;
    const hsmAddress = '0x6d6f646c70792f68736d6f640000000000000000';
    const hsmLabel = 'HOLLAR Stability Module';

    if (batch) {
      const tx = await gho.populateTransaction.addFacilitator(
        hsmAddress,
        hsmLabel,
        ghoEntityConfig.hsmCapacity,
        {
          gasLimit: 500_000,
        }
      );
      addTransaction(tx);
      console.log(`Added HSM facilitator (${hsmAddress}) to batch`);
    } else {
      const addEntityTx = await gho.addFacilitator(
        hsmAddress,
        hsmLabel,
        ghoEntityConfig.hsmCapacity
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
