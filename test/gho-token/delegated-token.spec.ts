import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

describe('GhoToken - Delegated Token', () => {
  let ghoToken: Contract;
  let delegatedToken: Contract;
  let admin: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let facilitatorAddress: string;
  let user1Address: string;
  let user2Address: string;
  let user3Address: string;

  const INITIAL_AMOUNT = parseUnits('1000', 18);
  const TRANSFER_AMOUNT = parseUnits('100', 18);
  const MAX_UINT256 = ethers.constants.MaxUint256;

  before(async () => {
    [admin, user1, user2, user3] = await ethers.getSigners();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    user3Address = await user3.getAddress();

    // Deploy Gho Token
    const GhoTokenFactory = await ethers.getContractFactory('GhoToken');
    ghoToken = await GhoTokenFactory.connect(admin).deploy(await admin.getAddress());

    // Deploy a mock ERC20 token to use as delegated token
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    delegatedToken = await MockERC20Factory.connect(admin).deploy(
      'Mock Token',
      'MOCK',
      18,
      parseUnits('10000', 18)
    );

    // Setup facilitator to mint initial tokens
    const FACILITATOR_MANAGER_ROLE = await ghoToken.FACILITATOR_MANAGER_ROLE();
    await ghoToken.connect(admin).grantRole(FACILITATOR_MANAGER_ROLE, await admin.getAddress());

    // Add facilitator with bucket capacity
    await ghoToken
      .connect(admin)
      .addFacilitator(await admin.getAddress(), 'TestFacilitator', parseUnits('100000', 18));

    // Mint initial tokens to user1
    await ghoToken.connect(admin).mint(user1Address, INITIAL_AMOUNT);

    // Transfer some delegated tokens to user1
    await delegatedToken.connect(admin).transfer(user1Address, INITIAL_AMOUNT);
  });

  describe('Setting delegated token', () => {
    it('should emit DelegatedTokenUpdated event when setting delegated token', async () => {
      await expect(ghoToken.connect(admin).setDelegatedToken(delegatedToken.address))
        .to.emit(ghoToken, 'DelegatedTokenUpdated')
        .withArgs(ethers.constants.AddressZero, delegatedToken.address);
    });

    it('should correctly store delegated token address', async () => {
      expect(await ghoToken.delegatedToken()).to.equal(delegatedToken.address);
    });

    it('should revert when non-admin tries to set delegated token', async () => {
      await expect(ghoToken.connect(user1).setDelegatedToken(delegatedToken.address)).to.be
        .reverted;
    });

    it('should allow admin to update delegated token', async () => {
      const newDelegatedToken = delegatedToken.address; // Using same address for simplicity

      await expect(ghoToken.connect(admin).setDelegatedToken(newDelegatedToken))
        .to.emit(ghoToken, 'DelegatedTokenUpdated')
        .withArgs(delegatedToken.address, newDelegatedToken);

      expect(await ghoToken.delegatedToken()).to.equal(newDelegatedToken);
    });

    it('should allow admin to unset delegated token', async () => {
      await expect(ghoToken.connect(admin).setDelegatedToken(ethers.constants.AddressZero))
        .to.emit(ghoToken, 'DelegatedTokenUpdated')
        .withArgs(delegatedToken.address, ethers.constants.AddressZero);

      expect(await ghoToken.delegatedToken()).to.equal(ethers.constants.AddressZero);

      // Reset for next tests
      await ghoToken.connect(admin).setDelegatedToken(delegatedToken.address);
    });
  });

  describe('TransferFrom with delegated token', () => {
    beforeEach(async () => {
      // Reset balances
      if ((await ghoToken.balanceOf(user2Address)).lt(INITIAL_AMOUNT)) {
        await ghoToken.connect(user1).transfer(user2Address, TRANSFER_AMOUNT);
      }

      // Ensure delegated token is set
      if ((await ghoToken.delegatedToken()) !== delegatedToken.address) {
        await ghoToken.connect(admin).setDelegatedToken(delegatedToken.address);
      }

      // Reset allowances
      await ghoToken.connect(user1).approve(user3Address, 0);
      await delegatedToken.connect(user1).approve(user3Address, 0);
    });

    it('should use internal allowance when delegated token has no allowance', async () => {
      // Set only internal allowance
      await ghoToken.connect(user1).approve(user3Address, TRANSFER_AMOUNT);

      // Should transfer successfully
      await ghoToken.connect(user3).transferFrom(user1Address, user2Address, TRANSFER_AMOUNT);

      // Check balances changed
      expect(await ghoToken.balanceOf(user1Address)).to.equal(
        INITIAL_AMOUNT.sub(TRANSFER_AMOUNT.mul(2))
      );
      expect(await ghoToken.balanceOf(user2Address)).to.equal(TRANSFER_AMOUNT.mul(2));

      // Check allowance was used
      expect(await ghoToken.allowance(user1Address, user3Address)).to.equal(0);
    });

    it('should still check internal allowance when delegated token has non-max allowance', async () => {
      // Set both internal and external allowances
      await ghoToken.connect(user1).approve(user3Address, TRANSFER_AMOUNT.div(2));
      await delegatedToken.connect(user1).approve(user3Address, TRANSFER_AMOUNT);

      // Should fail because internal allowance is too small
      await expect(
        ghoToken.connect(user3).transferFrom(user1Address, user2Address, TRANSFER_AMOUNT)
      ).to.be.reverted;
    });

    it('should skip internal allowance check when delegated token has max allowance', async () => {
      // Set max external allowance but limited internal allowance
      await delegatedToken.connect(user1).approve(user3Address, MAX_UINT256);
      await ghoToken.connect(user1).approve(user3Address, TRANSFER_AMOUNT.div(2)); // Not enough for transfer

      // Should succeed despite insufficient internal allowance
      await ghoToken.connect(user3).transferFrom(user1Address, user2Address, TRANSFER_AMOUNT);

      // Check balances changed
      expect(await ghoToken.balanceOf(user1Address)).to.equal(
        INITIAL_AMOUNT.sub(TRANSFER_AMOUNT.mul(3))
      );
      expect(await ghoToken.balanceOf(user2Address)).to.equal(TRANSFER_AMOUNT.mul(3));

      // Internal allowance should remain unchanged since check was skipped
      expect(await ghoToken.allowance(user1Address, user3Address)).to.equal(TRANSFER_AMOUNT.div(2));
    });

    it('should work with max internal allowance regardless of delegated token', async () => {
      // Set max internal allowance
      await ghoToken.connect(user1).approve(user3Address, MAX_UINT256);

      // Transfer should work
      await ghoToken.connect(user3).transferFrom(user1Address, user2Address, TRANSFER_AMOUNT);

      // Internal allowance should still be max
      expect(await ghoToken.allowance(user1Address, user3Address)).to.equal(MAX_UINT256);
    });

    it('should fall back to internal allowance check if delegated token call fails', async () => {
      // Set internal allowance
      await ghoToken.connect(user1).approve(user3Address, TRANSFER_AMOUNT);

      // Set delegated token to a non-ERC20 contract address
      await ghoToken.connect(admin).setDelegatedToken(ghoToken.address); // Using ghoToken as a "bad" delegated token

      // Should still work using internal allowance
      await ghoToken.connect(user3).transferFrom(user1Address, user2Address, TRANSFER_AMOUNT);

      // Check allowance was used
      expect(await ghoToken.allowance(user1Address, user3Address)).to.equal(0);

      // Reset delegated token
      await ghoToken.connect(admin).setDelegatedToken(delegatedToken.address);
    });
  });
});
