import { DeployFunction } from 'hardhat-deploy/types';
import { hdclReserveConfig } from '../helpers/config';
import { getPoolAddressesProvider } from '@galacticcouncil/aave-deploy-v3/dist/helpers/contract-getters';

const func: DeployFunction = async function ({ getNamedAccounts, deployments, ...hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const { INTEREST_RATE } = hdclReserveConfig;

  const addressesProvider = await getPoolAddressesProvider();

  const interestRateStrategy = await deploy('GhoInterestRateStrategy-HDCL', {
    from: deployer,
    contract: 'GhoInterestRateStrategy',
    args: [
      addressesProvider.address, // addressesProvider
      INTEREST_RATE, // variableBorrowRate (10% APY)
    ],
    log: true,
  });

  console.log(`GhoInterestRateStrategy-HDCL: ${interestRateStrategy.address}`);
  return true;
};

func.id = 'GhoInterestRateStrategy-HDCL';
func.tags = ['GhoInterestRateStrategy-HDCL', 'hdcl_hollar_deploy'];

export default func;
