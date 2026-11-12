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

const byteLength = (hex: string) => (hex.length - 2) / 2;

task('review-buckets-prop')
  .addFlag('whitelist', 'Wrap the call for the Technical Committee whitelist')
  .setAction(async ({ whitelist }: { whitelist: boolean }, hre) => {
    await hre.run('network-check');
    const admin = POOL_ADMIN[hre.network.name];

    clearBatch();
    await hre.run('review-buckets');

    const batch = getBatch();
    if (batch.length === 0) {
      console.log('No bucket changes needed - no proposal generated');
      return;
    }

    const txs = await Promise.all(batch.map((tx) => aaveManagerCall({ ...tx, from: admin })));
    const decoder = new ProposalDecoder(hre);
    await decoder.init();

    let proposal;
    if (whitelist) {
      const { whitelistedCall, proposal: dispatch } = await generateProposalV2(txs, true);
      console.log('whitelisted call (TC whitelist.whitelistCall):');
      console.log(whitelistedCall.toHex());
      console.log(
        'whitelisted call hash:',
        whitelistedCall.hash.toHex(),
        'length:',
        byteLength(whitelistedCall.toHex())
      );
      proposal = dispatch;
    } else {
      proposal = await generateProposalV2(txs, false);
    }

    console.log(
      `submit preimage (${whitelist ? 'WhitelistedCaller' : 'EconomicParameters'} track):`
    );
    console.log(proposal.toHex());
    console.log('preimage hash:', proposal.hash.toHex(), 'length:', byteLength(proposal.toHex()));
    decoder.printTree(decoder.transformCall(proposal.toHuman()));
  });
