import { task } from 'hardhat/config';

import { POOL_ADMIN } from '@galacticcouncil/aave-deploy-v3';
import {
  getBatch,
  clearBatch,
} from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';
import {
  aaveManagerCall,
  generateProposalV2,
} from '@galacticcouncil/aave-deploy-v3/dist/helpers/hydration-proposal';
import ProposalDecoder from '@galacticcouncil/aave-deploy-v3/dist/helpers/proposal-decoder';

task(
  'review-interest-rate-prop',
  'Generate proposal to update interest rate strategy if config differs from on-chain'
).setAction(async (_, hre) => {
  await hre.run('network-check');
  const admin = POOL_ADMIN[hre.network.name];

  // Clear any existing batch transactions
  clearBatch();

  // Run review-interest-rate which will add transactions to the batch if needed
  await hre.run('review-interest-rate');

  const batch = getBatch();
  if (batch.length === 0) {
    console.log('No interest rate changes needed - no proposal generated');
    return;
  }

  // Convert batch transactions to Aave manager calls
  const txs = await Promise.all(batch.map((tx) => aaveManagerCall({ ...tx, from: admin })));

  // Generate and encode proposal (non-whitelisted)
  let proposal = await generateProposalV2(txs, false);

  const decoder = new ProposalDecoder(hre);
  await decoder.init();

  console.log('\n=== INTEREST RATE UPDATE PROPOSAL ===\n');
  console.log('submit preimage:');
  console.log(proposal.toHex());
  console.log('\nDecoded proposal structure:');
  decoder.printTree(decoder.transformCall(proposal.toHuman()));
});
