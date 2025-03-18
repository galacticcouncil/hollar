import { GhoToken } from './../../../types/src/contracts/gho/GhoToken';
import { task } from 'hardhat/config';

task('gho-transfer-ownership', 'Transfer Ownership of Gho')
  .addParam('newOwner')
  .setAction(async ({ newOwner }, hre) => {
    const { deployer } = await hre.getNamedAccounts();
    const DEFAULT_ADMIN_ROLE = hre.ethers.utils.hexZeroPad('0x00', 32);
    const gho = (await hre.ethers.getContract('GhoToken')) as GhoToken;
    const roles = [
      DEFAULT_ADMIN_ROLE,
      await gho.FACILITATOR_MANAGER_ROLE(),
      await gho.BUCKET_MANAGER_ROLE(),
    ];

    for (const role of roles) {
      const hasRole = await gho.hasRole(role, newOwner);
      if (!hasRole) {
        const tx = await gho.grantRole(role, newOwner);
        await tx.wait();
        console.log(`Role ${role} granted to ${newOwner}`);
      } else {
        console.log(`Role ${role} already granted to ${newOwner}`);
      }
    }

    for (const role of roles.reverse()) {
      const hasRole = await gho.hasRole(role, deployer);
      if (hasRole) {
        const tx = await gho.renounceRole(role, deployer);
        await tx.wait();
        console.log(`Role ${role} renounced from ${deployer}`);
      } else {
        console.log(`Role ${role} already renounced from ${deployer}`);
      }
    }

    console.log(`GHO ownership transferred to:  ${newOwner}`);
  });
