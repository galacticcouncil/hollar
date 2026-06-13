import { DeployFunction } from 'hardhat-deploy/types';
import { getPool } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { ZERO_ADDRESS } from '../helpers/constants';
import { GhoAToken } from '../types';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pool = await getPool();

  const aTokenResult = await deploy('GhoAToken-BIL', {
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
  const initializeTx = await aTokenImpl.initialize(
    pool.address, // initializingPool
    ZERO_ADDRESS, // treasury
    ZERO_ADDRESS, // underlyingAsset
    ZERO_ADDRESS, // incentivesController
    0, // aTokenDecimals
    'HOLLAR_ATOKEN_BIL_IMPL', // aTokenName
    'HOLLAR_ATOKEN_BIL_IMPL', // aTokenSymbol
    '0x10' // params
  );
  await initializeTx.wait();

  console.log(`GhoAToken-BIL Implementation: ${aTokenResult.address}`);
  return true;
};

func.id = 'GhoAToken-BIL';
func.tags = ['GhoAToken-BIL', 'bil_hollar_deploy'];

export default func;
