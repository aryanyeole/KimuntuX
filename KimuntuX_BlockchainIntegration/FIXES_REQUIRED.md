# 🔧 Required Fixes for Smart Contracts

**IMPORTANT:** These fixes must be applied before deploying to Sepolia testnet.

---

## Fix #1: KimuntuXWallet.sol

### Lines 4-8: Update Import Paths

**❌ BEFORE:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
```

**✅ AFTER:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
```

### Line 109: Update Constructor

**❌ BEFORE:**
```solidity
constructor(uint256 _minimumWithdrawalAmount) {
    minimumWithdrawalAmount = _minimumWithdrawalAmount;
    authorizedPlatforms[msg.sender] = true;
}
```

**✅ AFTER:**
```solidity
constructor(uint256 _minimumWithdrawalAmount) Ownable(msg.sender) {
    minimumWithdrawalAmount = _minimumWithdrawalAmount;
    authorizedPlatforms[msg.sender] = true;
}
```

---

## Fix #2: KimuntuXCommissionSystem.sol

### Lines 4-6: Update Import Paths

**❌ BEFORE:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
```

**✅ AFTER:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
```

### Line 50: Update Constructor

**❌ BEFORE:**
```solidity
constructor() {
    authorizedMerchants[msg.sender] = true;
}
```

**✅ AFTER:**
```solidity
constructor() Ownable(msg.sender) {
    authorizedMerchants[msg.sender] = true;
}
```

---

## Fix #3: PaymentEscrow.sol

### Line 2: Update Solidity Version

**❌ BEFORE:**
```solidity
pragma solidity ^0.8.19;
```

**✅ AFTER:**
```solidity
pragma solidity ^0.8.20;
```

### Lines 4-6: Update Import Paths

**❌ BEFORE:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
```

**✅ AFTER:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
```

### Line 162: Update Constructor

**❌ BEFORE:**
```solidity
constructor() {
    // Owner is automatically authorized arbiter
    authorizedArbiters[msg.sender] = true;
}
```

**✅ AFTER:**
```solidity
constructor() Ownable(msg.sender) {
    // Owner is automatically authorized arbiter
    authorizedArbiters[msg.sender] = true;
}
```

---

## Why These Fixes Are Needed

### OpenZeppelin v5.x Changes

OpenZeppelin v5.x (released 2024) reorganized their contract structure:

- **security/** folder was removed
- **ReentrancyGuard** moved to **utils/**
- **Pausable** moved to **utils/**
- **Ownable** now requires initial owner in constructor (prevents accidentally leaving ownership uninitialized)

Your `package.json` specifies OpenZeppelin v5.x (`"@openzeppelin/contracts": "^5.0.1"`), so your contracts must use v5 syntax.

---

## Quick Fix Checklist

- [ ] Fix KimuntuXWallet.sol imports (lines 5-6)
- [ ] Fix KimuntuXWallet.sol constructor (line 109)
- [ ] Fix KimuntuXCommissionSystem.sol imports (lines 5-6)
- [ ] Fix KimuntuXCommissionSystem.sol constructor (line 50)
- [ ] Fix PaymentEscrow.sol Solidity version (line 2)
- [ ] Fix PaymentEscrow.sol imports (lines 5-6)
- [ ] Fix PaymentEscrow.sol constructor (line 162)

---

## Verify Fixes

After applying fixes, run:

```bash
npm run compile
```

**Expected output:**
```
✔ Compiled 3 Solidity files successfully
```

If you see compilation errors, double-check that:
1. All import paths changed from `security/` to `utils/`
2. All constructors have `Ownable(msg.sender)` after the function signature
3. PaymentEscrow.sol uses Solidity version 0.8.20

---

## Then Deploy!

Once compilation succeeds:

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia
```

---

**Questions?** See [CONTRACT_REVIEW_SUMMARY.md](./CONTRACT_REVIEW_SUMMARY.md) for complete details.
