import { DeployFunction } from 'hardhat-deploy/types';
import { getPool } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { ZERO_ADDRESS } from '../helpers/constants';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pool = await getPool();

  const variableDebtResult = await deploy('GhoVariableDebtToken-HDCL', {
    from: deployer,
    contract: 'GhoVariableDebtToken',
    args: [pool.address],
    log: true,
    gasLimit: 10_000_000,
  });
  const variableDebtImpl = await hre.ethers.getContract('GhoVariableDebtToken-HDCL');
  const initializeTx = await variableDebtImpl.initialize(
    pool.address, // initializingPool
    ZERO_ADDRESS, // underlyingAsset
    ZERO_ADDRESS, // incentivesController
    0, // debtTokenDecimals
    'HOLLAR_VARIABLE_DEBT_HDCL_IMPL', // debtTokenName
    'HOLLAR_VARIABLE_DEBT_HDCL_IMPL', // debtTokenSymbol
    0 // params
  );
  await initializeTx.wait();

  console.log(`GhoVariableDebtToken-HDCL Implementation: ${variableDebtResult.address}`);
  return true;
};

func.id = 'GhoVariableDebt-HDCL';
func.tags = ['GhoVariableDebt-HDCL', 'hdcl_hollar_deploy'];

export default func;
