import { task } from 'hardhat/config';
import { POOL_ADMIN } from '@galacticcouncil/aave-deploy-v3';

task('hollar-setup', 'Deploy and Configure Hollar').setAction(async (params, hre) => {
  await hre.run('network-check');
  const admin = POOL_ADMIN[hre.network.name];
  const { deployer } = await hre.getNamedAccounts();

  console.log('DEPLOY CONTRACTS ########################################');
  if (admin !== deployer) {
    await hre.run('deploy', {
      tags: 'full_gho_deploy',
      noCompile: true,
    });
    console.log('transfer ownership to pool admin', admin);
    await hre.run('gho-transfer-ownership', { newOwner: admin });
    console.log('rest of the setup has to be done by admin');
    return;
  } else {
    console.log('admin cannot deploy contracts');
  }

  console.log('INITIALIZE RESERVE ######################################');
  await hre.run('initialize-gho-reserve');

  console.log('CONFIGURE RESERVE #######################################');
  await hre.run('enable-gho-borrowing');
  await hre.run('set-gho-oracle');

  console.log('CONFIGURE HOLLAR ########################################');
  await hre.run('add-gho-as-entity');
  await hre.run('add-gho-flashminter-as-entity');
  await hre.run('set-gho-addresses');
  await hre.run('set-zero-discount-rate-strategy');

  console.log('SUMMARY #################################################');
  await hre.run('print-all-deployments');
});

const blankSpace = () => {
  console.log();
};
