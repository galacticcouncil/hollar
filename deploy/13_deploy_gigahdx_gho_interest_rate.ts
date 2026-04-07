import { DeployFunction } from 'hardhat-deploy/types';
import { ghoReserveConfig } from '../helpers/config';
import { getPoolAddressesProvider } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const { INTEREST_RATE } = ghoReserveConfig;

  const addressesProvider = await getPoolAddressesProvider();

  const interestRateStrategy = await deploy('GhoInterestRateStrategy-GIGAHDX', {
    from: deployer,
    contract: 'GhoInterestRateStrategy',
    args: [
      addressesProvider.address, // addressesProvider
      INTEREST_RATE, // variableBorrowRate (4.5% APY)
    ],
    log: true,
  });

  console.log(`GhoInterestRateStrategy-GIGAHDX: ${interestRateStrategy.address}`);
  return true;
};

func.id = 'GhoInterestRateStrategy-GIGAHDX';
func.tags = ['GhoInterestRateStrategy-GIGAHDX', 'gigahdx_gho_deploy'];

export default func;
