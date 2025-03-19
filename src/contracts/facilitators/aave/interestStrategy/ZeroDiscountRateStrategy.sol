// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IGhoDiscountRateStrategy} from '../interestStrategy/interfaces/IGhoDiscountRateStrategy.sol';

/**
 * @title ZeroDiscountRateStrategy
 * @author Aave
 * @notice Discount Rate Strategy that always return zero discount rate.
 */
contract ZeroDiscountRateStrategy is IGhoDiscountRateStrategy {
  uint256 public constant GHO_DISCOUNTED_PER_DISCOUNT_TOKEN = 0;
  uint256 public constant DISCOUNT_RATE = 0;
  uint256 public constant MIN_DISCOUNT_TOKEN_BALANCE = 0;
  uint256 public constant MIN_DEBT_TOKEN_BALANCE = 0;

  /// @inheritdoc IGhoDiscountRateStrategy
  function calculateDiscountRate(
    uint256 debtBalance,
    uint256 discountTokenBalance
  ) external view override returns (uint256) {
    return DISCOUNT_RATE;
  }
}
