import { expect } from 'chai';
import { GhoToken } from './../../../types/src/contracts/gho/GhoToken';
import { task } from 'hardhat/config';

task('gho-transfer-ownership', 'Transfer Ownership of Gho')
  .addParam('newOwner')
  .setAction(async ({ newOwner }, hre) => {
    const DEFAULT_ADMIN_ROLE = hre.ethers.utils.hexZeroPad('0x00', 32);

    const gho = (await hre.ethers.getContract('GhoToken')) as GhoToken;
    if (false) {
      console.log(newOwner, 'is already admin');
    } else {
      const tx1 = await gho.grantRole(gho.FACILITATOR_MANAGER_ROLE(), newOwner);
      await tx1.wait();
      const tx2 = await gho.grantRole(gho.BUCKET_MANAGER_ROLE(), newOwner);
      await tx2.wait();
      const grantAdminRoleTx = await gho.grantRole(DEFAULT_ADMIN_ROLE, newOwner);
      await grantAdminRoleTx.wait();
      // await expect(grantAdminRoleTx).to.emit(gho, 'RoleGranted');

      const { deployer } = await hre.getNamedAccounts();
      const removeAdminRoleTx = await gho.renounceRole(DEFAULT_ADMIN_ROLE, deployer);
      await removeAdminRoleTx.wait();
      // TODO

      console.log(`GHO ownership transferred to:  ${newOwner}`);
    }
  });
