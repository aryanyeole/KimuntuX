# 🚀 KimuntuX Deployment Scripts - Complete Guide

**Version:** 2.0.0
**Last Updated:** March 4, 2026
**Status:** Production-Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Deployment Script (deploy-all.js)](#deployment-script)
3. [Verification Script (verify.js)](#verification-script)
4. [Usage Examples](#usage-examples)
5. [Advanced Features](#advanced-features)
6. [Error Handling](#error-handling)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The KimuntuX deployment infrastructure consists of two production-grade scripts:

### **deploy-all.js** (600+ lines)
Enterprise-grade deployment script with:
- ✅ **3-Phase Deployment Pipeline** (Validate → Deploy → Post-Process)
- ✅ **Comprehensive Pre-Flight Checks** (Network, Balance, Compilation)
- ✅ **Gas Estimation** (Before deployment)
- ✅ **Retry Logic** (Up to 3 attempts per contract)
- ✅ **State Verification** (Validates deployed contracts)
- ✅ **Artifact Management** (Saves addresses, ABIs, metadata)
- ✅ **Production Safeguards** (10-second warning for mainnet)

### **verify.js** (500+ lines)
Intelligent verification script with:
- ✅ **Automatic Artifact Loading** (Reads deployment files)
- ✅ **Smart Retry Logic** (Handles rate limits, timeouts)
- ✅ **Error Classification** (8 error types with specific handling)
- ✅ **Rate Limit Prevention** (3-second delays between contracts)
- ✅ **Already Verified Detection** (Skips re-verification)
- ✅ **Multi-Chain Support** (Ethereum, Polygon, BSC)

---

## 📦 Deployment Script

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PHASE 1: VALIDATION                        │
├─────────────────────────────────────────────────────────────┤
│  1. Network Validation     → Verify chain ID matches        │
│  2. Deployer Validation    → Check balance sufficient       │
│  3. Compilation Validation → Verify contracts compiled      │
│  4. Gas Estimation         → Estimate total deployment cost │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   PHASE 2: DEPLOYMENT                        │
├─────────────────────────────────────────────────────────────┤
│  For each contract in order:                                │
│    1. Deploy with constructor args                          │
│    2. Wait for confirmations                                │
│    3. Verify code at address                                │
│    4. Check contract state                                  │
│    5. Retry on failure (up to 3x)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                PHASE 3: POST-DEPLOYMENT                      │
├─────────────────────────────────────────────────────────────┤
│  1. Save deployment artifacts (JSON)                        │
│  2. Save contract ABIs                                      │
│  3. Print summary & next steps                              │
│  4. Display explorer links                                  │
└─────────────────────────────────────────────────────────────┘
```

### Configuration

All configuration is at the top of `deploy-all.js`:

```javascript
const CONFIG = {
  // Minimum balance required per network
  MINIMUM_BALANCE: {
    localhost: "0.01",
    sepolia: "0.05",    // 0.05 ETH for testnet
    mainnet: "1.0",     // 1 ETH for safety on mainnet
    polygon: "0.5",     // 0.5 MATIC
  },

  // Constructor arguments for each contract
  CONSTRUCTOR_ARGS: {
    KimuntuXWallet: {
      minimumWithdrawalAmount: ethers.parseEther("0.01"),
    },
    KimuntuXCommissionSystem: {},  // No constructor args
    PaymentEscrow: {},             // No constructor args
  },

  // Deployment order (respects dependencies)
  DEPLOYMENT_ORDER: [
    "KimuntuXWallet",
    "KimuntuXCommissionSystem",
    "PaymentEscrow",
  ],

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,  // 5 seconds

  // Gas estimation buffer
  GAS_BUFFER: 1.2,    // 20% extra for safety

  // Confirmations to wait
  CONFIRMATIONS: {
    sepolia: 2,
    mainnet: 5,
    polygon: 3,
  },
};
```

### Key Features

#### 1. **Network Validation**
```javascript
// Verifies:
// - Network name matches expected
// - Chain ID is correct
// - Provider is accessible
// - Configuration is valid

await validateNetwork();
// ✅ Network: sepolia
// ✅ Chain ID: 11155111
// ✅ Provider: https://eth-sepolia.g.alchemy.com/...
```

#### 2. **Balance Checking**
```javascript
// Checks:
// - Deployer account has sufficient ETH
// - Balance meets network-specific minimum
// - Displays current balance

await validateDeployer();
// ✅ Deployer: 0x1234...
// ✅ Balance: 0.15 ETH
// ✅ Sufficient balance (min: 0.05 ETH)
```

#### 3. **Compilation Validation**
```javascript
// Verifies:
// - All contracts are compiled
// - Bytecode exists and is valid
// - Contract size under 24KB limit
// - Factory can be created

await validateCompilation();
// ✅ KimuntuXWallet: 18,234 bytes (75.8% of limit)
// ✅ KimuntuXCommissionSystem: 12,456 bytes
// ✅ PaymentEscrow: 15,678 bytes
```

#### 4. **Gas Estimation**
```javascript
// Estimates:
// - Gas required per contract
// - Total deployment cost
// - Cost at current gas price
// - Adds 20% buffer for safety

await estimateDeploymentCost();
// Gas Price: 25 gwei
// • KimuntuXWallet: ~3,000,000 gas (~0.075 ETH)
// • KimuntuXCommissionSystem: ~2,500,000 gas
// • PaymentEscrow: ~2,800,000 gas
// Total: ~0.20 ETH
```

#### 5. **Retry Logic**
```javascript
// Features:
// - Automatically retries failed deployments
// - Exponential backoff (5s, 10s, 15s)
// - Up to 3 attempts per contract
// - Preserves error details

try {
  await deployContract(name, args);
} catch (error) {
  if (retryCount < MAX_RETRIES) {
    console.log("🔄 Retrying in 5 seconds...");
    await sleep(5000);
    return deployContract(name, args, retryCount + 1);
  }
}
```

#### 6. **State Verification**
```javascript
// After deployment, verifies:
// - Owner is correct
// - Constructor args applied
// - Initial state is correct
// - Contract is callable

await verifyContractState(name, address, contract);
// ✅ Owner: 0x1234...
// ✅ Min Withdrawal: 0.01 ETH
// ✅ Platform Fee: 3.00%
```

#### 7. **Artifact Saving**
```javascript
// Saves to deployments/${network}-deployment.json:
{
  "network": "sepolia",
  "chainId": "11155111",
  "deployer": "0x1234...",
  "timestamp": "2026-03-04T12:00:00.000Z",
  "contracts": {
    "KimuntuXWallet": {
      "address": "0x5678...",
      "transactionHash": "0xabcd...",
      "blockNumber": 12345678,
      "constructorArgs": ["10000000000000000"],
      "verified": false
    }
  }
}
```

### Output Example

```
╔════════════════════════════════════════════════════════════╗
║   KimuntuX Blockchain Integration - Deployment            ║
╚════════════════════════════════════════════════════════════╝


╔════════════════════════════════════════════════════════════╗
║              Phase 1: Pre-Deployment Validation            ║
╚════════════════════════════════════════════════════════════╝

🌐 Network Validation
   ─────────────────────────────────────────────────────────
   • Network Name: sepolia
   • Chain ID: 11155111
   • Provider: https://eth-sepolia.g.alchemy.com/v2/...
   ✅ Network configuration valid

👤 Deployer Validation
   ─────────────────────────────────────────────────────────
   • Deployer Address: 0x1234567890abcdef1234567890abcdef12345678
   • Balance: 0.15 ETH
   ✅ Sufficient balance (min: 0.05 ETH)

📦 Contract Compilation Validation
   ─────────────────────────────────────────────────────────
   • KimuntuXWallet:
     Bytecode Size: 18234 bytes (75.8% of limit)
   • KimuntuXCommissionSystem:
     Bytecode Size: 12456 bytes (51.8% of limit)
   • PaymentEscrow:
     Bytecode Size: 15678 bytes (65.2% of limit)
   ✅ All contracts compiled and validated

💰 Gas Estimation
   ─────────────────────────────────────────────────────────
   • Gas Price: 25 gwei
   • KimuntuXWallet:
     Gas: 3000000 (buffered: 3600000)
     Cost: 0.075 ETH
   • KimuntuXCommissionSystem:
     Gas: 2500000 (buffered: 3000000)
     Cost: 0.0625 ETH
   • PaymentEscrow:
     Gas: 2800000 (buffered: 3360000)
     Cost: 0.07 ETH

   • Total Estimated Cost: 0.2075 ETH
     (at 25 gwei)


╔════════════════════════════════════════════════════════════╗
║                 Phase 2: Contract Deployment               ║
╚════════════════════════════════════════════════════════════╝


[1/3] KimuntuXWallet

📦 Deploying KimuntuXWallet...
   ─────────────────────────────────────────────────────────
   • Sending deployment transaction...
   • Transaction Hash: 0xabcdef1234567890...
   • Waiting for confirmations...
   ✅ KimuntuXWallet deployed successfully!
   • Address: 0x1111111111111111111111111111111111111111
   • Block: 12345678
   • Code Size: 18234 bytes
   • Confirmations: 2
   • Verifying KimuntuXWallet state...
     Owner: 0x1234567890abcdef1234567890abcdef12345678
     Min Withdrawal: 0.01 ETH
   ✅ State verification passed


[2/3] KimuntuXCommissionSystem

📦 Deploying KimuntuXCommissionSystem...
   ─────────────────────────────────────────────────────────
   • Sending deployment transaction...
   • Transaction Hash: 0x1234567890abcdef...
   • Waiting for confirmations...
   ✅ KimuntuXCommissionSystem deployed successfully!
   • Address: 0x2222222222222222222222222222222222222222
   • Block: 12345679
   • Code Size: 12456 bytes
   • Confirmations: 2
   • Verifying KimuntuXCommissionSystem state...
     Owner: 0x1234567890abcdef1234567890abcdef12345678
     Platform Fee: 3.00%
   ✅ State verification passed


[3/3] PaymentEscrow

📦 Deploying PaymentEscrow...
   ─────────────────────────────────────────────────────────
   • Sending deployment transaction...
   • Transaction Hash: 0xfedcba0987654321...
   • Waiting for confirmations...
   ✅ PaymentEscrow deployed successfully!
   • Address: 0x3333333333333333333333333333333333333333
   • Block: 12345680
   • Code Size: 15678 bytes
   • Confirmations: 2
   • Verifying PaymentEscrow state...
     Owner: 0x1234567890abcdef1234567890abcdef12345678
     Escrow Fee: 2.00%
   ✅ State verification passed


╔════════════════════════════════════════════════════════════╗
║              Phase 3: Post-Deployment Tasks                ║
╚════════════════════════════════════════════════════════════╝

💾 Saving Deployment Artifacts
   ─────────────────────────────────────────────────────────
   ✅ Deployment info saved to:
      deployments/sepolia-deployment.json
   ✅ ABI saved: KimuntuXWallet.abi.json
   ✅ ABI saved: KimuntuXCommissionSystem.abi.json
   ✅ ABI saved: PaymentEscrow.abi.json


╔════════════════════════════════════════════════════════════╗
║                  🎉 DEPLOYMENT SUCCESSFUL!                  ║
╚════════════════════════════════════════════════════════════╝

📍 Contract Addresses:
   • KimuntuXWallet:
     0x1111111111111111111111111111111111111111
   • KimuntuXCommissionSystem:
     0x2222222222222222222222222222222222222222
   • PaymentEscrow:
     0x3333333333333333333333333333333333333333

⏱️  Deployment Time: 45.32s


📝 Next Steps:
   ─────────────────────────────────────────────────────────
   1. Verify contracts on Etherscan:
      npm run verify:sepolia

   2. View contracts on block explorer:
      • KimuntuXWallet: https://sepolia.etherscan.io/address/0x1111...
      • KimuntuXCommissionSystem: https://sepolia.etherscan.io/address/0x2222...
      • PaymentEscrow: https://sepolia.etherscan.io/address/0x3333...

   3. Update frontend/demo with contract addresses
   4. Configure backend with contract addresses and ABIs
   5. Test all contract functions
   6. Complete testing on testnet (100+ transactions)
   7. Get security audit before mainnet deployment

✨ Deployment complete! All contracts are ready for use.
```

---

## 🔍 Verification Script

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PHASE 1: VALIDATION                        │
├─────────────────────────────────────────────────────────────┤
│  1. Load Deployment Artifacts  → Read JSON from deployments/│
│  2. Validate API Key           → Check Etherscan API key    │
│  3. Build Verification Queue   → Determine what to verify   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   PHASE 2: VERIFICATION                      │
├─────────────────────────────────────────────────────────────┤
│  For each contract in queue:                                │
│    1. Call Hardhat verify task                              │
│    2. Handle errors intelligently:                          │
│       • Already verified → Success                          │
│       • Rate limit → Retry with backoff                     │
│       • Timeout → Retry                                     │
│       • Invalid API key → Fail immediately                  │
│       • Other → Log and continue                            │
│    3. Update deployment file                                │
│    4. Wait 3s (rate limit prevention)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 3: SUMMARY                          │
├─────────────────────────────────────────────────────────────┤
│  1. Print verification statistics                           │
│  2. Show failed contracts (if any)                          │
│  3. Display explorer links                                  │
│  4. Provide next steps                                      │
└─────────────────────────────────────────────────────────────┘
```

### Error Classification

The verification script classifies errors into 8 types:

| Error Type | Handling | Retry? |
|------------|----------|--------|
| **already_verified** | Success (skip) | No |
| **rate_limit** | Exponential backoff | Yes (5x) |
| **timeout** | Wait and retry | Yes (5x) |
| **invalid_api_key** | Fail immediately | No |
| **etherscan_error** | Log and continue | No |
| **verification_failed** | Log with tips | No |
| **notok** | Check deployment | No |
| **unknown** | Log full error | No |

### Retry Strategy

```javascript
// Retry delays (exponential backoff)
RETRY_DELAYS: [
  5000,   // 5 seconds  (1st retry)
  10000,  // 10 seconds (2nd retry)
  30000,  // 30 seconds (3rd retry)
  60000,  // 1 minute   (4th retry)
  120000, // 2 minutes  (5th retry)
]

// Rate limit prevention
// Wait 3 seconds between contracts
VERIFICATION_DELAY: 3000
```

### Output Example

```
╔════════════════════════════════════════════════════════════╗
║            KimuntuX Contract Verification                  ║
╚════════════════════════════════════════════════════════════╝


╔════════════════════════════════════════════════════════════╗
║                    Phase 1: Validation                      ║
╚════════════════════════════════════════════════════════════╝

📂 Loading Deployment Artifacts
   ─────────────────────────────────────────────────────────
   • Network: sepolia
   • Looking for: deployments/sepolia-deployment.json
   • Deployment Date: 2026-03-04T12:00:00.000Z
   • Deployer: 0x1234567890abcdef1234567890abcdef12345678
   • Chain ID: 11155111
   • Contracts Found: 3

🔑 Validating API Key
   ─────────────────────────────────────────────────────────
   • API Key Variable: ETHERSCAN_API_KEY
   • API Key: ABC12345...XYZ9
   ✅ API key configured

📋 Building Verification Queue
   ─────────────────────────────────────────────────────────
   • KimuntuXWallet: Queued
     Address: 0x1111111111111111111111111111111111111111
     Constructor Args: 1
   • KimuntuXCommissionSystem: Queued
     Address: 0x2222222222222222222222222222222222222222
     Constructor Args: 0
   • PaymentEscrow: Queued
     Address: 0x3333333333333333333333333333333333333333
     Constructor Args: 0

   Total contracts to verify: 3


╔════════════════════════════════════════════════════════════╗
║                   Contract Verification                     ║
╚════════════════════════════════════════════════════════════╝


[1/3] KimuntuXWallet

🔎 Verifying KimuntuXWallet...
   ─────────────────────────────────────────────────────────
   • Address: 0x1111111111111111111111111111111111111111
   • Constructor Args: ["10000000000000000"]
   ✅ KimuntuXWallet verified successfully!
   ⏳ Waiting 3s before next contract...


[2/3] KimuntuXCommissionSystem

🔎 Verifying KimuntuXCommissionSystem...
   ─────────────────────────────────────────────────────────
   • Address: 0x2222222222222222222222222222222222222222
   • Constructor Args: None
   ✅ KimuntuXCommissionSystem verified successfully!
   ⏳ Waiting 3s before next contract...


[3/3] PaymentEscrow

🔎 Verifying PaymentEscrow...
   ─────────────────────────────────────────────────────────
   • Address: 0x3333333333333333333333333333333333333333
   • Constructor Args: None
   ✅ PaymentEscrow verified successfully!

💾 Updated deployment file with verification status


╔════════════════════════════════════════════════════════════╗
║                 Phase 3: Summary                            ║
╚════════════════════════════════════════════════════════════╝


╔════════════════════════════════════════════════════════════╗
║                 ✅ VERIFICATION COMPLETE!                    ║
╚════════════════════════════════════════════════════════════╝

📊 Verification Summary:
   ─────────────────────────────────────────────────────────
   • Total Contracts: 3
   • Newly Verified: 3
   • Already Verified: 0
   • Failed: 0

🔗 View Verified Contracts:
   ─────────────────────────────────────────────────────────
   • KimuntuXWallet:
     https://sepolia.etherscan.io/address/0x1111...#code
   • KimuntuXCommissionSystem:
     https://sepolia.etherscan.io/address/0x2222...#code
   • PaymentEscrow:
     https://sepolia.etherscan.io/address/0x3333...#code

📝 Next Steps:
   ─────────────────────────────────────────────────────────
   1. View source code on block explorer
   2. Interact with contracts via explorer UI
   3. Share verified addresses with users
   4. Update frontend with contract addresses
   5. Begin integration testing

✨ All contracts verified successfully!
```

---

## 💻 Usage Examples

### Basic Deployment

```bash
# 1. Deploy to local Hardhat network
npx hardhat run scripts/deploy-all.js

# 2. Deploy to Sepolia testnet
npm run deploy:sepolia
# OR
npx hardhat run scripts/deploy-all.js --network sepolia

# 3. Deploy to Polygon mainnet
npx hardhat run scripts/deploy-all.js --network polygon
```

### Basic Verification

```bash
# 1. Verify on Sepolia
npm run verify:sepolia
# OR
npx hardhat run scripts/verify.js --network sepolia

# 2. Verify on Polygon
npx hardhat run scripts/verify.js --network polygon
```

### Complete Workflow

```bash
# Step 1: Compile contracts
npm run compile

# Step 2: Deploy to Sepolia
npm run deploy:sepolia
# Output: Saves to deployments/sepolia-deployment.json

# Step 3: Verify contracts
npm run verify:sepolia
# Reads: deployments/sepolia-deployment.json
# Updates: Sets verified: true

# Step 4: Check deployment
cat deployments/sepolia-deployment.json

# Step 5: View on Etherscan
# Visit links displayed in terminal
```

### Advanced: Modify Constructor Args

```javascript
// Edit scripts/deploy-all.js

const CONFIG = {
  CONSTRUCTOR_ARGS: {
    KimuntuXWallet: {
      // Change minimum withdrawal to 0.05 ETH
      minimumWithdrawalAmount: ethers.parseEther("0.05"),
    },
  },
};
```

### Advanced: Custom Gas Price

```javascript
// Edit hardhat.config.js

sepolia: {
  url: SEPOLIA_RPC_URL,
  accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  chainId: 11155111,
  gasPrice: 50000000000, // 50 gwei (instead of "auto")
}
```

---

## 🚀 Advanced Features

### 1. **Production Safeguards**

When deploying to mainnet:

```javascript
// 10-second warning with ability to cancel
if (["mainnet", "polygon", "bsc"].includes(network.name)) {
  console.log("⚠️  WARNING: You are deploying to MAINNET!");
  console.log("   This will use REAL money and cannot be undone.");
  console.log("   Press Ctrl+C to cancel, or wait 10 seconds...\n");
  await sleep(10000);
}
```

### 2. **Gas Buffer**

Adds 20% to gas estimates:

```javascript
const gasWithBuffer = (gasEstimate * BigInt(120)) / 100n;
// Prevents "out of gas" errors
```

### 3. **Contract Size Validation**

Ensures contracts are under 24KB:

```javascript
if (bytecodeSize > 24576) {
  throw new Error(`Contract exceeds 24KB limit! (${bytecodeSize} bytes)`);
}
```

### 4. **State Verification**

Validates deployed contracts work:

```javascript
// Check owner
const owner = await contract.owner();
console.log(`Owner: ${owner}`);

// Check configuration
const minWithdrawal = await contract.minimumWithdrawalAmount();
console.log(`Min Withdrawal: ${formatEth(minWithdrawal)} ETH`);
```

### 5. **Artifact Management**

Saves complete deployment data:

```javascript
deploymentInfo = {
  network: "sepolia",
  chainId: "11155111",
  deployer: "0x1234...",
  timestamp: "2026-03-04T12:00:00.000Z",
  deploymentTime: 45320, // milliseconds
  contracts: { /* ... */ },
  configuration: { /* ... */ }
}
```

### 6. **Error Recovery**

Graceful handling of failures:

```javascript
// Deployment fails
// → Retry 3 times with 5-second delay
// → If all fail, save partial results
// → Log actionable error messages
// → Exit with error code 1
```

---

## ⚠️ Error Handling

### Deployment Errors

#### "Insufficient funds for gas"
```
❌ Error: Insufficient balance!
   Need at least 0.05 ETH, have 0.02 ETH.
   Get testnet ETH from: https://sepoliafaucet.com

✅ Solution:
   1. Get more testnet ETH from faucet
   2. Check you're using correct wallet
   3. Verify network in MetaMask
```

#### "Contract size exceeds 24KB"
```
❌ Error: Contract size exceeds 24KB limit! (26234 bytes)

✅ Solutions:
   1. Enable optimizer in hardhat.config.js
   2. Increase optimizer runs to 1000
   3. Refactor contract (split into multiple contracts)
   4. Remove unused functions
```

#### "Transaction underpriced"
```
❌ Error: Transaction underpriced

✅ Solutions:
   1. Increase gas price in hardhat.config.js
   2. Use gasPrice: ethers.parseUnits("50", "gwei")
   3. Wait for network congestion to clear
```

### Verification Errors

#### "Max rate limit reached"
```
⚠️  Rate limit reached
🔄 Retrying in 5 seconds... (Attempt 1/5)
🔄 Retrying in 10 seconds... (Attempt 2/5)
✅ Verification successful

✅ Solution: Automatic retry with exponential backoff
```

#### "Invalid API Key"
```
❌ Invalid Etherscan API key. Check your .env file.

✅ Solution:
   1. Get API key from https://etherscan.io/myapikey
   2. Add to .env: ETHERSCAN_API_KEY=your_key_here
   3. Restart verification
```

#### "Contract not found"
```
❌ Etherscan API error. Contract may not be deployed.

✅ Solutions:
   1. Wait 30 seconds after deployment
   2. Check network matches: --network sepolia
   3. Verify contract address is correct
   4. Check explorer: https://sepolia.etherscan.io
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: "Deployment file not found"

**Cause:** Verification script can't find deployment artifacts

**Solution:**
```bash
# Check if deployment file exists
ls deployments/

# If missing, deploy first
npm run deploy:sepolia

# Verify file was created
cat deployments/sepolia-deployment.json
```

#### Issue 2: "Network mismatch"

**Cause:** Deploying to wrong network

**Solution:**
```bash
# Check current network
npx hardhat console --network sepolia
> await ethers.provider.getNetwork()

# Deploy to correct network
npx hardhat run scripts/deploy-all.js --network sepolia
```

#### Issue 3: "Constructor arguments mismatch"

**Cause:** Verification constructor args don't match deployment

**Solution:**
```bash
# Check deployment file for actual args used
cat deployments/sepolia-deployment.json | grep constructorArgs

# Manually verify with correct args
npx hardhat verify --network sepolia \
  0x1111111111111111111111111111111111111111 \
  "10000000000000000"
```

#### Issue 4: "Contracts already verified"

**Cause:** Trying to re-verify contracts

**Solution:**
```bash
# This is actually success! Script detects and skips
# No action needed, contracts are verified

# View on Etherscan
# https://sepolia.etherscan.io/address/YOUR_ADDRESS#code
```

---

## 📚 Additional Resources

**Documentation:**
- [Hardhat Deployment Guide](https://hardhat.org/hardhat-runner/docs/guides/deploying)
- [Etherscan Verification API](https://docs.etherscan.io/tutorials/verifying-contracts-programmatically)
- [Ethers.js Deployment](https://docs.ethers.org/v6/api/contract/#ContractFactory-deploy)

**Tools:**
- [Hardhat Console](https://hardhat.org/hardhat-runner/docs/guides/hardhat-console): `npx hardhat console --network sepolia`
- [Tenderly](https://tenderly.co): Monitor deployments
- [OpenZeppelin Defender](https://defender.openzeppelin.com): Manage contracts

**Support:**
- Email: yannkayilu@kimuntupower.com
- Hardhat Discord: https://hardhat.org/discord

---

## ✅ Checklist

### Before Deployment

- [ ] `.env` file configured
- [ ] Testnet ETH obtained (0.1+ ETH)
- [ ] Contracts compiled: `npm run compile`
- [ ] Tests passing (if tests exist): `npm test`
- [ ] Network correct: Check `--network` flag

### After Deployment

- [ ] Deployment successful (all 3 contracts)
- [ ] Addresses saved in `deployments/` folder
- [ ] ABIs exported
- [ ] Ready for verification

### Before Verification

- [ ] Deployment completed successfully
- [ ] Etherscan API key in `.env`
- [ ] Wait 30 seconds after deployment
- [ ] Correct network specified

### After Verification

- [ ] All contracts verified
- [ ] Source code visible on Etherscan
- [ ] Contracts interact on explorer
- [ ] Addresses shared with team

---

**Deployment Scripts Version:** 2.0.0
**Last Updated:** March 4, 2026
**Maintainer:** KimuntuX Development Team

