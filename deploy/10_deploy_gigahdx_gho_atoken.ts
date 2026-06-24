import { DeployFunction } from 'hardhat-deploy/types';
import { getPool } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { ZERO_ADDRESS } from '../helpers/constants';
import { GhoAToken } from '../types';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pool = await getPool();

  const aTokenResult = await deploy('GhoAToken-GIGAHDX', {
    from: deployer,
    contract: 'GhoAToken',
    args: [pool.address],
    log: true,
    gasLimit: 10_000_000,
  });
  const aTokenImpl = (await hre.ethers.getContractAt(
    'GhoAToken',
    aTokenResult.address
  )) as GhoAToken;
  try {
    const initializeTx = await aTokenImpl.initialize(
      pool.address, // initializingPool
      ZERO_ADDRESS, // treasury
      ZERO_ADDRESS, // underlyingAsset
      ZERO_ADDRESS, // incentivesController
      0, // aTokenDecimals
      'GHO_ATOKEN_GIGAHDX_IMPL', // aTokenName
      'GHO_ATOKEN_GIGAHDX_IMPL', // aTokenSymbol
      '0x10', // params
      { gasLimit: 2_000_000 }
    );
    await initializeTx.wait();
  } catch (e: any) {
    if (!e?.message?.includes('already been initialized')) throw e;
    console.log('GhoAToken-GIGAHDX already initialized');
  }

  console.log(`GhoAToken-GIGAHDX Implementation: ${aTokenResult.address}`);
  return true;
};

func.id = 'GhoAToken-GIGAHDX';
func.tags = ['GhoAToken-GIGAHDX', 'gigahdx_gho_deploy'];

export default func;
