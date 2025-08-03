import { task } from 'hardhat/config';

import { getPoolConfiguratorProxy } from '@galacticcouncil/aave-deploy-v3';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';

task('enable-gho-borrowing', 'Enable variable borrowing on GHO')
  .addFlag('batch', 'Add transactions to batch instead of executing directly')
  .setAction(async ({ batch }, hre) => {
    const { ethers } = hre;

    const gho = await ethers.getContract('GhoToken');
    const poolConfigurator = await getPoolConfiguratorProxy();

    if (batch) {
      const tx = await poolConfigurator.populateTransaction.setReserveBorrowing(gho.address, true, {
        gasLimit: 1000000,
      });
      addTransaction(tx);
      console.log('Added GHO borrowing enablement to batch');
    } else {
      const enableBorrowingTx = await poolConfigurator.setReserveBorrowing(gho.address, true, {
        gasLimit: 1000000,
      });

      const enableBorrowingTxReceipt = await enableBorrowingTx.wait();

      const borrowingEnabledEvent = enableBorrowingTxReceipt.events?.find(
        (e) => e.event === 'ReserveBorrowing'
      );
      if (borrowingEnabledEvent?.args) {
        const { enabled, asset } = borrowingEnabledEvent.args;
        console.log(`Borrowing set to ${enabled} on asset: \n\t${asset}}`);
      } else {
        throw new Error(
          `Error at gho borrowing initialization. Check tx: ${enableBorrowingTxReceipt.transactionHash}`
        );
      }
    }
  });
