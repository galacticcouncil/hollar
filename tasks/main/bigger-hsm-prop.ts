import { task } from 'hardhat/config';

import { POOL_ADMIN } from '@galacticcouncil/aave-deploy-v3';
import { getBatch } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';
import {
  aaveManagerCall,
  generateProposalV2,
} from '@galacticcouncil/aave-deploy-v3/dist/helpers/hydration-proposal';
import ProposalDecoder from '@galacticcouncil/aave-deploy-v3/dist/helpers/proposal-decoder';
import { parseEther } from 'ethers/lib/utils';
import { getApi } from '@galacticcouncil/aave-deploy-v3/dist/helpers/hydration-proposal';

task('bigger-hsm-prop').setAction(async (_, hre) => {
  await hre.run('network-check');
  const admin = POOL_ADMIN[hre.network.name];
  const { tx } = await getApi();

  await hre.run('review-buckets');

  const hsmTxs = [
    tx.hsm.updateCollateralAsset(1003, null, null, null, null, 8_000_000 * 10 ** 6),
    tx.hsm.updateCollateralAsset(1002, null, null, null, null, 8_000_000 * 10 ** 6),
    tx.hsm.updateCollateralAsset(
      1_000_745,
      null,
      null,
      null,
      null,
      parseEther('2000000').toString()
    ),
    tx.hsm.updateCollateralAsset(
      1_000_625,
      null,
      null,
      null,
      null,
      parseEther('2000000').toString()
    ),
  ];

  const txs = await Promise.all(getBatch().map((tx) => aaveManagerCall({ ...tx, from: admin })));
  txs.push(...hsmTxs);
  let { proposal, whitelistedCall } = await generateProposalV2(txs, true);
  const decoder = new ProposalDecoder(hre);
  await decoder.init();
  console.log('whitelist call hash:');
  console.log(whitelistedCall.hash.toHex());
  console.log('submit preimages:');
  console.log(proposal.toHex());
  decoder.printTree(decoder.transformCall(proposal.toHuman()));
});
