import { DeployFunction } from 'hardhat-deploy/types';
import { getPool } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { ZERO_ADDRESS } from '../helpers/constants';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pool = await getPool();

  const stableDebtResult = await deploy('GhoStableDebtToken-HDCL', {
    from: deployer,
    contract: 'GhoStableDebtToken',
    args: [pool.address],
    log: true,
    gasLimit: 10_000_000,
  });
  const stableDebtImpl = await hre.ethers.getContract('GhoStableDebtToken-HDCL');
  const initializeTx = await stableDebtImpl.initialize(
    pool.address, // initializingPool
    ZERO_ADDRESS, // underlyingAsset
    ZERO_ADDRESS, // incentivesController
    0, // debtTokenDecimals
    'GHO_STABLE_DEBT_HDCL_IMPL', // debtTokenName
    'GHO_STABLE_DEBT_HDCL_IMPL', // debtTokenSymbol
    0 // params
  );
  await initializeTx.wait();

  console.log(`GhoStableDebtToken-HDCL Implementation: ${stableDebtResult.address}`);
  return true;
};

func.id = 'GhoStableDebt-HDCL';
func.tags = ['GhoStableDebt-HDCL', 'hdcl_gho_deploy'];

export default func;
