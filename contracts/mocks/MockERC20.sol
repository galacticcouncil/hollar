// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 * @title MockERC20
 * @dev Implementation of the MockERC20 used for testing
 */
contract MockERC20 is ERC20 {
  uint8 private _decimals;

  /**
   * @dev Initializes the contract minting some tokens for the deployer
   * @param name The name of the token
   * @param symbol The symbol of the token
   * @param decimals_ The number of decimals of the token
   * @param mintAmount The amount to mint for the deployer
   */
  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals_,
    uint256 mintAmount
  ) ERC20(name, symbol) {
    _decimals = decimals_;
    _mint(msg.sender, mintAmount);
  }

  /**
   * @return The number of decimals of the token
   */
  function decimals() public view virtual override returns (uint8) {
    return _decimals;
  }
}
