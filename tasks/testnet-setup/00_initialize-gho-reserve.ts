import { task } from 'hardhat/config';
import { ghoTokenConfig } from '../../helpers/config';

import {
  getPoolConfiguratorProxy,
  INCENTIVES_PROXY_ID,
  TREASURY_PROXY_ID,
} from '@galacticcouncil/aave-deploy-v3';
import { ConfiguratorInputTypes } from '@galacticcouncil/aave-deploy-v3/dist/types/typechain/@aave/core-v3/contracts/interfaces/IPoolConfigurator';

const printReserveInfo = (initReserveEvent) => {
  console.log(`Gho Reserve Initialized`);
  console.log(`\tasset:                       ${initReserveEvent.args.asset}`);
  console.log(`\tghoAToken:                   ${initReserveEvent.args.aToken}`);
  console.log(`\tstableDebtToken              ${initReserveEvent.args.stableDebtToken}`);
  console.log(`\tghoVariableDebtToken         ${initReserveEvent.args.variableDebtToken}`);
  console.log(
    `\tinterestRateStrategyAddress  ${initReserveEvent.args.interestRateStrategyAddress}`
  );
};

task('initialize-gho-reserve', 'Initialize Gho Reserve').setAction(async (_, hre) => {
  const { ethers } = hre;
  const [_deployer] = await hre.ethers.getSigners();

  const ghoATokenImplementation = await ethers.getContract('GhoAToken');
  const stableDebtTokenImplementation = await ethers.getContract('GhoStableDebtToken');
  const ghoVariableDebtTokenImplementation = await ethers.getContract('GhoVariableDebtToken');
  const ghoInterestRateStrategy = await ethers.getContract('GhoInterestRateStrategy');
  const ghoToken = await ethers.getContract('GhoToken');
  ghoToken.grantRole(ghoToken.FACILITATOR_MANAGER_ROLE(), _deployer.address);
  ghoToken.grantRole(ghoToken.BUCKET_MANAGER_ROLE(), _deployer.address);
  const poolConfigurator = await getPoolConfiguratorProxy();
  const treasuryAddress = (await hre.deployments.get(TREASURY_PROXY_ID)).address;
  const incentivesControllerAddress = (await hre.deployments.get(INCENTIVES_PROXY_ID)).address;

  const reserveInput: ConfiguratorInputTypes.InitReserveInputStruct = {
    aTokenImpl: ghoATokenImplementation.address,
    stableDebtTokenImpl: stableDebtTokenImplementation.address,
    variableDebtTokenImpl: ghoVariableDebtTokenImplementation.address,
    underlyingAssetDecimals: ghoTokenConfig.TOKEN_DECIMALS,
    interestRateStrategyAddress: ghoInterestRateStrategy.address,
    underlyingAsset: ghoToken.address,
    treasury: treasuryAddress,
    incentivesController: incentivesControllerAddress,
    aTokenName: `aHOLLAR`,
    aTokenSymbol: `aHOLLAR`,
    variableDebtTokenName: `Variable Debt HOLLAR`,
    variableDebtTokenSymbol: `vdHOLLAR`,
    stableDebtTokenName: 'Stable Debt HOLLAR',
    stableDebtTokenSymbol: 'sdHOLLAR',
    params: '0x10',
  };

  // Init reserve
  console.log('initializing reserve', reserveInput);
  const initReserveTx = await poolConfigurator.initReserves([reserveInput], { gasLimit: 10000000 });

  const initReserveTxReceipt = await initReserveTx.wait();
  const initReserveEvent = initReserveTxReceipt.events?.find(
    (e) => e.event === 'ReserveInitialized'
  );

  if (initReserveEvent) {
    printReserveInfo(initReserveEvent);
  } else {
    throw new Error(
      `Missing ReserveInitialized event at initReserves in GHO init, check tx: ${initReserveTxReceipt.transactionHash}`
    );
  }
});
