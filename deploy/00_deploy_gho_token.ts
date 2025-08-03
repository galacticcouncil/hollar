import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { GhoToken } from '../types';

const func: DeployFunction = async function ({
  getNamedAccounts,
  deployments,
  ...hre
}: HardhatRuntimeEnvironment) {
  console.log();
  console.log(`~~~~~~~   Beginning GHO Deployments   ~~~~~~~`);

  const [_deployer, ...restSigners] = await hre.ethers.getSigners();

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const ghoResult = await deploy('GhoToken', {
    from: deployer,
    args: [deployer],
    log: true,
  });
  console.log(`GHO Address:                   ${ghoResult.address}`);

  const delegatedToken = '0x0000000000000000000000000000000100000000';
  const ghoToken = (await hre.ethers.getContract('GhoToken')) as GhoToken;
  const tx = await ghoToken.setDelegatedToken(delegatedToken);
  await tx.wait();
  console.log(`Delegated Token Set:           ${delegatedToken}`);

  return true;
};

func.id = 'GhoToken';
func.tags = ['GhoToken', 'full_gho_deploy'];

export default func;
