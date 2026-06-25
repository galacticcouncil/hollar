import { DeployFunction } from 'hardhat-deploy/types';
import { getPool } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';
import { ZERO_ADDRESS } from '../helpers/constants';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pool = await getPool();

  const variableDebtResult = await deploy('GhoVariableDebtToken-GIGAHDX', {
    from: deployer,
    contract: 'GhoVariableDebtToken',
    args: [pool.address],
    log: true,
    gasLimit: 10_000_000,
  });
  const variableDebtImpl = await hre.ethers.getContract('GhoVariableDebtToken-GIGAHDX');
  try {
    const initializeTx = await variableDebtImpl.initialize(
      pool.address, // initializingPool
      ZERO_ADDRESS, // underlyingAsset
      ZERO_ADDRESS, // incentivesController
      0, // debtTokenDecimals
      'GHO_VARIABLE_DEBT_GIGAHDX_IMPL', // debtTokenName
      'GHO_VARIABLE_DEBT_GIGAHDX_IMPL', // debtTokenSymbol
      0, // params
      { gasLimit: 2_000_000 }
    );
    await initializeTx.wait();
  } catch (e: any) {
    if (!e?.message?.includes('already been initialized')) throw e;
    console.log('GhoVariableDebtToken-GIGAHDX already initialized');
  }

  console.log(`GhoVariableDebtToken-GIGAHDX Implementation: ${variableDebtResult.address}`);
  return true;
};

func.id = 'GhoVariableDebt-GIGAHDX';
func.tags = ['GhoVariableDebt-GIGAHDX', 'gigahdx_gho_deploy'];

export default func;
