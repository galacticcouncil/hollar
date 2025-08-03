import { DeployFunction } from 'hardhat-deploy/types';
import { getPool } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { ZERO_ADDRESS } from '../helpers/constants';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pool = await getPool();

  const variableDebtResult = await deploy('GhoVariableDebtToken', {
    from: deployer,
    args: [pool.address],
    log: true,
    gasLimit: 10_000_000,
  });
  const variableDebtImpl = await hre.ethers.getContract('GhoVariableDebtToken');
  const initializeTx = await variableDebtImpl.initialize(
    pool.address, // initializingPool
    ZERO_ADDRESS, // underlyingAsset
    ZERO_ADDRESS, // incentivesController
    0, // debtTokenDecimals
    'GHO_VARIABLE_DEBT_TOKEN_IMPL', // debtTokenName
    'GHO_VARIABLE_DEBT_TOKEN_IMPL', // debtTokenSymbol
    0 // params
  );
  await initializeTx.wait();

  console.log(`Variable Debt Implementation:  ${variableDebtResult.address}`);
  return true;
};

func.id = 'GhoVariableDebt';
func.tags = ['GhoVariableDebt', 'full_gho_deploy'];

export default func;
