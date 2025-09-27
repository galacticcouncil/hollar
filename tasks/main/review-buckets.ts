import { task } from 'hardhat/config';

import { ghoEntityConfig } from '../../helpers/config';
import {
  getAaveProtocolDataProvider,
  getAddressFromJson,
  POOL_DATA_PROVIDER,
} from '@galacticcouncil/aave-deploy-v3';
import { GhoFlashMinter, GhoToken } from '../../types';
import { addTransaction } from '@galacticcouncil/aave-deploy-v3/dist/helpers/transaction-batch';

task('review-buckets', 'sets new bucket size of facilitator').setAction(async (_, hre) => {
  const { ethers } = hre;
  const network = hre.network.name;

  const gho = (await ethers.getContract('GhoToken')) as GhoToken;
  const aaveDataProvider = await getAaveProtocolDataProvider(
    await getAddressFromJson(network, POOL_DATA_PROVIDER)
  );
  const tokenProxyAddresses = await aaveDataProvider.getReserveTokensAddresses(gho.address);
  const ghoFlashMinter = (await ethers.getContract('GhoFlashMinter')) as GhoFlashMinter;
  const hsmAddress = '0x6d6f646c70792f68736d6f640000000000000000';

  const facilitators = [
    {
      label: ghoEntityConfig.label,
      address: tokenProxyAddresses.aTokenAddress,
      capacity: ghoEntityConfig.mintLimit,
    },
    {
      label: ghoEntityConfig.flashMinterLabel,
      address: ghoFlashMinter.address,
      capacity: ghoEntityConfig.flashMinterCapacity,
    },
    {
      label: 'HOLLAR Stability Module',
      address: hsmAddress,
      capacity: ghoEntityConfig.hsmCapacity,
    },
  ];

  for (const facilitator of facilitators) {
    const { label, capacity, address } = facilitator;

    const [currentBucketSize] = await gho.getFacilitatorBucket(address);
    if (currentBucketSize.eq(capacity)) {
      console.log(`Bucket size for ${label} is already set to ${capacity}`);
    } else {
      console.log(`Setting new bucket size for ${label}:`);
      console.log(`  ${currentBucketSize}`);
      console.log(`      ->`);
      console.log(`  ${capacity}`);

      const tx = await gho.populateTransaction.setFacilitatorBucketCapacity(address, capacity, {
        gasLimit: 200_000,
      });
      addTransaction(tx);
    }
  }
});
