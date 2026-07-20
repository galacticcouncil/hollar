import { DeployFunction } from 'hardhat-deploy/types';
import { getPool } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { ZERO_ADDRESS } from '../helpers/constants';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pool = await getPool();

  const stableDebtResult = await deploy('GhoStableDebtToken-BIL', {
    from: deployer,
    contract: 'GhoStableDebtToken',
    args: [pool.address],
    log: true,
    gasLimit: 10_000_000,
  });
  const stableDebtImpl = await hre.ethers.getContract('GhoStableDebtToken-BIL');
  const initializeTx = await stableDebtImpl.initialize(
    pool.address, // initializingPool
    ZERO_ADDRESS, // underlyingAsset
    ZERO_ADDRESS, // incentivesController
    0, // debtTokenDecimals
    'HOLLAR_STABLE_DEBT_BIL_IMPL', // debtTokenName
    'HOLLAR_STABLE_DEBT_BIL_IMPL', // debtTokenSymbol
    0 // params
  );
  await initializeTx.wait();

  console.log(`GhoStableDebtToken-BIL Implementation: ${stableDebtResult.address}`);
  return true;
};

func.id = 'GhoStableDebt-BIL';
func.tags = ['GhoStableDebt-BIL', 'bil_hollar_deploy'];

export default func;
