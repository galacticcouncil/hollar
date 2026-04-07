import { DeployFunction } from 'hardhat-deploy/types';
import { getPool } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { ZERO_ADDRESS } from '../helpers/constants';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pool = await getPool();

  const stableDebtResult = await deploy('GhoStableDebtToken-GIGAHDX', {
    from: deployer,
    contract: 'GhoStableDebtToken',
    args: [pool.address],
    log: true,
    gasLimit: 10_000_000,
  });
  const stableDebtImpl = await hre.ethers.getContract('GhoStableDebtToken-GIGAHDX');
  const initializeTx = await stableDebtImpl.initialize(
    pool.address, // initializingPool
    ZERO_ADDRESS, // underlyingAsset
    ZERO_ADDRESS, // incentivesController
    0, // debtTokenDecimals
    'GHO_STABLE_DEBT_GIGAHDX_IMPL', // debtTokenName
    'GHO_STABLE_DEBT_GIGAHDX_IMPL', // debtTokenSymbol
    0 // params
  );
  await initializeTx.wait();

  console.log(`GhoStableDebtToken-GIGAHDX Implementation: ${stableDebtResult.address}`);
  return true;
};

func.id = 'GhoStableDebt-GIGAHDX';
func.tags = ['GhoStableDebt-GIGAHDX', 'gigahdx_gho_deploy'];

export default func;
