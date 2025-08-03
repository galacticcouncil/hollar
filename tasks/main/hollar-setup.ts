import { task } from 'hardhat/config';
import {
  getACLManager,
  getPool,
  getPoolAddressesProvider,
  POOL_ADMIN,
} from '@galacticcouncil/aave-deploy-v3';
import { getBatch } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';
import {
  location,
  aaveManagerCall,
  generateProposalV2,
  getApi,
  rootEvmCall,
} from '@galacticcouncil/aave-deploy-v3/dist/helpers/hydration-proposal';
import ProposalDecoder from '@galacticcouncil/aave-deploy-v3/dist/helpers/proposal-decoder';
import { GhoFlashMinter } from '../../types';

task('hollar-setup', 'Deploy and Configure Hollar').setAction(async (params, hre) => {
  const { ethers } = hre;
  await hre.run('network-check');
  const admin = POOL_ADMIN[hre.network.name];

  console.log('DEPLOY CONTRACTS ########################################');
  const [_deployer] = await hre.ethers.getSigners();
  const deployerAddress = await _deployer.getAddress();
  if (deployerAddress === '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0') {
    await hre.run('deploy', {
      tags: 'full_gho_deploy',
      noCompile: true,
    });
    await hre.run('print-all-deployments');
    console.log('transfer ownership to pool admin', admin);
    await hre.run('gho-transfer-ownership', { newOwner: admin });
    console.log('rest of the setup has to be done by admin');
    return;
  } else {
    console.log('admin cannot deploy contracts');
  }

  console.log('INITIALIZE RESERVE ######################################');
  await hre.run('initialize-gho-reserve', { batch: true });

  console.log('CONFIGURE RESERVE #######################################');
  await hre.run('enable-gho-borrowing', { batch: true });
  await hre.run('set-gho-oracle', { batch: true });

  console.log('CONFIGURE HOLLAR ########################################');
  await hre.run('add-gho-as-entity', { batch: true });
  await hre.run('add-gho-flashminter-as-entity', { batch: true });
  await hre.run('add-hsm-as-entity', { batch: true });
  await hre.run('set-gho-addresses', { batch: true });
  await hre.run('set-zero-discount-rate-strategy', { batch: true });

  const txs = await Promise.all(getBatch().map((tx) => aaveManagerCall({ ...tx, from: admin })));
  const txs2: any[] = [];

  const { tx } = await getApi();
  txs.push(
    tx.assetRegistry.register(
      ...Object.values({
        id: '222',
        name: 'Hydrated Dollar',
        assetType: 'Erc20',
        existentialDeposit: 0,
        symbol: 'HOLLAR',
        decimals: 18,
        location: location((await ethers.getContract('GhoToken')).address),
        xcmRateLimit: null,
        isSufficient: true,
      })
    )
  );

  console.log('CREATE POOLS ########################################');
  const treasuryOrigin = { system: { Signed: '13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB' } };
  const hydrationTreasuryAddress = '0x6d6f646C70792f74727372790000000000000000';
  const pool = await getPool();
  const hollarAddress = (await ethers.getContract('GhoToken')).address;
  const mintAmount = ethers.utils.parseEther('1000001');
  const mint = await pool.populateTransaction.borrow(
    hollarAddress,
    mintAmount,
    2,
    0,
    hydrationTreasuryAddress,
    {
      gasLimit: 1_000_000,
    }
  );
  mint.from = hydrationTreasuryAddress;
  txs.push(await rootEvmCall(mint));

  console.log('HOLLAR-aUSDC');
  txs.push(
    tx.assetRegistry.register(
      ...Object.values({
        id: 110,
        name: '2-Pool-HUSDC',
        assetType: 'StableSwap',
        existentialDeposit: 1000,
        symbol: '2-Pool-HUSDC',
        decimals: 18,
        location: null,
        xcmRateLimit: null,
        isSufficient: true,
      })
    )
  );
  txs.push(
    tx.stableswap.createPool(
      ...Object.values({
        shareAsset: 110,
        assets: [222, 1003],
        amplification: 1000,
        fee: 200,
      })
    )
  );
  txs2.push(
    tx.utility.dispatchAs(
      treasuryOrigin,
      tx.dispatcher.dispatchWithExtraGas(
        tx.stableswap.addAssetsLiquidity(
          110,
          [
            { assetId: 222, amount: '250,000,000,000,000,000,000,000'.replace(/,/g, '') },
            { assetId: 1003, amount: '250,000,000,000'.replace(/,/g, '') },
          ],
          1000
        ),
        1000000 // extra gas
      )
    )
  );

  console.log('HOLLAR-aUSDT');
  txs.push(
    tx.assetRegistry.register(
      ...Object.values({
        id: 111,
        name: '2-Pool-HUSDT',
        assetType: 'StableSwap',
        existentialDeposit: 1000,
        symbol: '2-Pool-HUSDT',
        decimals: 18,
        location: null,
        xcmRateLimit: null,
        isSufficient: true,
      })
    )
  );
  txs.push(
    tx.stableswap.createPool(
      ...Object.values({
        shareAsset: 111,
        assets: [222, 1002],
        amplification: 100,
        fee: 200,
      })
    )
  );
  txs2.push(
    tx.utility.dispatchAs(
      treasuryOrigin,
      tx.dispatcher.dispatchWithExtraGas(
        tx.stableswap.addAssetsLiquidity(
          111,
          [
            { assetId: 222, amount: '250,000,000,000,000,000,000,000'.replace(/,/g, '') },
            { assetId: 1002, amount: '250,000,000,000'.replace(/,/g, '') },
          ],
          1000
        ),
        1000000 // extra gas
      )
    )
  );

  console.log('HOLLAR-sUSDS');
  txs.push(
    tx.assetRegistry.register(
      ...Object.values({
        id: 112,
        name: '2-Pool-HUSDS',
        assetType: 'StableSwap',
        existentialDeposit: 1000,
        symbol: '2-Pool-HUSDS',
        decimals: 18,
        location: null,
        xcmRateLimit: null,
        isSufficient: true,
      })
    )
  );
  txs.push(
    tx.stableswap.createPoolWithPegs(
      ...Object.values({
        shareAsset: 112,
        assets: [222, 1_000_745],
        amplification: 1000,
        fee: 400,
        pegSource: [{ Value: [1, 1] }, { MMOracle: '0x4b32bffc6acd751446e79e8687ef3815fd7924fd' }],
        maxPegUpdate: 1,
      })
    )
  );
  txs2.push(
    tx.utility.dispatchAs(
      treasuryOrigin,
      tx.stableswap.addAssetsLiquidity(
        112,
        [
          { assetId: 222, amount: '250,000,000,000,000,000,000,000'.replace(/,/g, '') },
          { assetId: 1_000_745, amount: '250,000,000,000,000,000,000,000'.replace(/,/g, '') }, // TODO: adjust amount by peg
        ],
        1000
      )
    )
  );

  console.log('HOLLAR-sUSDe');
  txs.push(
    tx.assetRegistry.register(
      ...Object.values({
        id: 113,
        name: '2-Pool-HUSDe',
        assetType: 'StableSwap',
        existentialDeposit: 1000,
        symbol: '2-Pool-HUSDe',
        decimals: 18,
        location: null,
        xcmRateLimit: null,
        isSufficient: true,
      })
    )
  );
  txs.push(
    tx.stableswap.createPoolWithPegs(
      ...Object.values({
        shareAsset: 113,
        assets: [222, 1_000_625],
        amplification: 1000,
        fee: 400,
        pegSource: [{ Value: [1, 1] }, { MMOracle: '0x22cdea305cee63d082e79f8c5db939eecd0265d0' }],
        maxPegUpdate: 1,
      })
    )
  );
  txs2.push(
    tx.utility.dispatchAs(
      treasuryOrigin,
      tx.stableswap.addAssetsLiquidity(
        113,
        [
          { assetId: 222, amount: '250,000,000,000,000,000,000,000'.replace(/,/g, '') },
          { assetId: 1_000_625, amount: '250,000,000,000,000,000,000,000'.replace(/,/g, '') }, // TODO: adjust amount by peg
        ],
        1000
      )
    )
  );

  console.log('FUND HSM ########################################');
  const parseEther = (eth) => ethers.utils.parseEther(eth).toString();
  const max = parseEther('1111111');
  const coeficient = parseEther('0.995');
  const rate = 100;
  const buyBackFee = 100;
  const purchaseFee = 0;
  const hsmTxs = [
    tx.hsm.addCollateralAsset(
      1003,
      110,
      purchaseFee,
      coeficient,
      buyBackFee,
      rate,
      500_000 * 10 ** 6
    ),
    tx.hsm.addCollateralAsset(
      1002,
      111,
      purchaseFee,
      coeficient,
      buyBackFee,
      rate,
      500_000 * 10 ** 6
    ),
    tx.hsm.addCollateralAsset(
      1_000_745,
      112,
      purchaseFee,
      coeficient,
      buyBackFee,
      rate,
      parseEther('300000')
    ),
    tx.hsm.addCollateralAsset(
      1_000_625,
      113,
      purchaseFee,
      coeficient,
      buyBackFee,
      rate,
      parseEther('300000')
    ),
    tx.utility.dispatchAs(
      treasuryOrigin,
      tx.utility.batchAll([
        tx.dispatcher.dispatchWithExtraGas(
          tx.hsm.buy(1003, 222, parseEther('100000'), max),
          1_000_000
        ),
        tx.dispatcher.dispatchWithExtraGas(
          tx.hsm.buy(1002, 222, parseEther('100000'), max),
          1_000_000
        ),
      ])
    ),
  ];

  const hsm2txs = [
    tx.utility.dispatchAs(
      treasuryOrigin,
      tx.utility.batchAll([
        tx.hsm.buy(1_000_745, 222, parseEther('50000'), max),
        tx.hsm.buy(1_000_625, 222, parseEther('50000'), max),
      ])
    ),
  ];

  const flashMinter = (await ethers.getContract('GhoFlashMinter')) as GhoFlashMinter;
  hsm2txs.push(tx.hsm.setFlashMinter(flashMinter.address));

  const hsmOrigin = {
    system: { Signed: '0x6d6f646c70792f68736d6f640000000000000000000000000000000000000000' },
  };
  const hsmAddress = '0x6d6f646c70792f68736d6f640000000000000000';

  hsm2txs.push(tx.utility.dispatchAs(hsmOrigin, tx.evmAccounts.bindEvmAddress()));

  const poolAddressesProvider = await getPoolAddressesProvider();
  const aclManager = await getACLManager(await poolAddressesProvider.getACLManager());
  const addFlashBorrower = await aclManager.populateTransaction.addFlashBorrower(hsmAddress);
  hsm2txs.push(await aaveManagerCall({ ...addFlashBorrower, from: admin }));

  hsm2txs.push(
    tx.multiTransactionPayment.addCurrency(222, '10,960,000,000,000,000,000,000'.replace(/,/g, ''))
  );

  hsm2txs.push(
    tx.router.forceInsertRoute({ assetIn: 0, assetOut: 222 }, [
      {
        pool: 'Omnipool',
        assetIn: '0',
        assetOut: '100',
      },
      {
        pool: {
          Stableswap: '100',
        },
        assetIn: '100',
        assetOut: '10',
      },
      {
        pool: 'Aave',
        assetIn: '10',
        assetOut: '1002',
      },
      {
        pool: {
          Stableswap: '111',
        },
        assetIn: '1002',
        assetOut: '222',
      },
    ])
  );

  hsm2txs.push(
    tx.router.forceInsertRoute({ assetIn: 20, assetOut: 222 }, [
      {
        pool: 'Omnipool',
        assetIn: '20',
        assetOut: '100',
      },
      {
        pool: {
          Stableswap: '100',
        },
        assetIn: '100',
        assetOut: '10',
      },
      {
        pool: {
          Stableswap: '102',
        },
        assetIn: '10',
        assetOut: '22',
      },
      {
        pool: 'Aave',
        assetIn: '22',
        assetOut: '1003',
      },
      {
        pool: {
          Stableswap: '110',
        },
        assetIn: '1003',
        assetOut: '222',
      },
    ])
  );

  txs.push(tx.scheduler.scheduleAfter(0, null, 0, tx.utility.batchAll(txs2)));
  txs.push(tx.scheduler.scheduleAfter(1, null, 0, tx.utility.batchAll(hsmTxs)));
  txs.push(tx.scheduler.scheduleAfter(2, null, 0, tx.utility.batchAll(hsm2txs)));

  let preimage = await generateProposalV2(txs, false);
  const decoder = new ProposalDecoder(hre);
  await decoder.init();
  console.log('submit preimages:');
  console.log(preimage.toHex());
  decoder.printTree(decoder.transformCall(preimage.toHuman()));
});
