import { task } from 'hardhat/config';

import { POOL_ADMIN } from '@galacticcouncil/aave-deploy-v3';
import { getBatch } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';
import {
  aaveManagerCall,
  generateProposalV2,
} from '@galacticcouncil/aave-deploy-v3/dist/helpers/hydration-proposal';
import ProposalDecoder from '@galacticcouncil/aave-deploy-v3/dist/helpers/proposal-decoder';

task('review-buckets-prop').setAction(async (_, hre) => {
  const { ethers } = hre;
  await hre.run('network-check');
  const admin = POOL_ADMIN[hre.network.name];

  await hre.run('review-buckets');

  const txs = await Promise.all(getBatch().map((tx) => aaveManagerCall({ ...tx, from: admin })));
  let preimage = await generateProposalV2(txs, false);
  const decoder = new ProposalDecoder(hre);
  await decoder.init();
  console.log('submit preimages:');
  console.log(preimage.toHex());
  decoder.printTree(decoder.transformCall(preimage.toHuman()));
});
