import { task } from 'hardhat/config';

task('hollar-setup', 'Deploy and Configure Hollar').setAction(async (params, hre) => {
  /*****************************************
   *          INITIALIZE RESERVE           *
   ******************************************/
  blankSpace();
  await hre.run('initialize-gho-reserve');

  /*****************************************
   *          CONFIGURE RESERVE            *
   * 1. enable borrowing                   *
   * 2. configure oracle                   *
   ******************************************/
  blankSpace();
  await hre.run('enable-gho-borrowing');

  blankSpace();
  await hre.run('set-gho-oracle');

  /******************************************
   *              CONFIGURE GHO             *
   * 1. Add aave as a GHO entity            *
   * 2. Add flashminter as GHO entity       *
   * 3. Set addresses in AToken and VDebt   *
   ******************************************/
  blankSpace();

  blankSpace();
  await hre.run('add-gho-as-entity');

  blankSpace();
  await hre.run('add-gho-flashminter-as-entity');

  blankSpace();
  await hre.run('set-gho-addresses');

  /******************************************
   *           PRINT DEPLOYMENT             *
   ******************************************/

  blankSpace();
  await hre.run('print-all-deployments');
});

const blankSpace = () => {
  console.log();
};
