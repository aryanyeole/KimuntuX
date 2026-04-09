# KimuntuX Smart Contracts - Complete Deployment Guide

This guide will walk you through deploying all three KimuntuX smart contracts to the Sepolia testnet and eventually to Ethereum mainnet.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Testing](#local-testing)
4. [Sepolia Testnet Deployment](#sepolia-testnet-deployment)
5. [Contract Verification](#contract-verification)
6. [Post-Deployment Testing](#post-deployment-testing)
7. [Mainnet Deployment](#mainnet-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

2. **npm** or **yarn**
   ```bash
   npm --version
   ```

3. **MetaMask Wallet** or similar Web3 wallet
   - Install from [metamask.io](https://metamask.io)
   - Create a new wallet or import existing one
   - **IMPORTANT:** Use a separate wallet for deployment, not your personal wallet with mainnet funds

4. **Sepolia Testnet ETH**
   - Get free test ETH from:
     - [Alchemy Sepolia Faucet](https://sepoliafaucet.com)
     - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
     - [Chainlink Faucet](https://faucets.chain.link/sepolia)
   - You'll need ~0.05-0.1 ETH for deployment and testing

5. **API Keys**
   - **Alchemy** or **Infura** RPC URL: [alchemy.com](https://www.alchemy.com) or [infura.io](https://infura.io)
   - **Etherscan API Key**: [etherscan.io/apis](https://etherscan.io/apis)

---

## Environment Setup

### Step 1: Install Dependencies

```bash
cd KimuntuX_BlockchainIntegration

# Install all packages
npm install

# Expected packages:
# - hardhat
# - @openzeppelin/contracts (v5.x)
# - @nomicfoundation/hardhat-toolbox
# - dotenv
```

### Step 2: Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
```

**Edit `.env` file:**

```bash
# Sepolia RPC URL (from Alchemy or Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY_HERE

# Your deployer wallet private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_private_key_here

# Etherscan API key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Enable gas reporting
REPORT_GAS=false
```

**⚠️ SECURITY WARNING:**
- NEVER commit your `.env` file to git
- NEVER share your private key
- Use a dedicated deployment wallet, not your personal wallet
- The `.gitignore` file will prevent `.env` from being committed

### Step 3: Get Your Private Key

**From MetaMask:**

1. Open MetaMask
2. Click the three dots → Account Details
3. Export Private Key
4. Enter password
5. Copy the private key (remove the `0x` prefix)
6. Paste into `.env` file

### Step 4: Fund Your Deployment Wallet

1. Copy your wallet address from MetaMask
2. Visit a Sepolia faucet (links above)
3. Request test ETH (~0.1 ETH is enough)
4. Wait for transaction to confirm (~15 seconds)

**Verify balance:**
```bash
# Check balance on Etherscan
# Visit: https://sepolia.etherscan.io/address/YOUR_ADDRESS
```

---

## Local Testing

Before deploying to testnet, test everything locally.

### Step 1: Compile Contracts

```bash
npm run compile

# Expected output:
# ✔ Compiled X Solidity files successfully
```

If you encounter compilation errors, check:
- Solidity version in contracts matches `hardhat.config.js`
- OpenZeppelin contracts are v5.x compatible
- No syntax errors in `.sol` files

### Step 2: Start Local Hardhat Node

```bash
# Terminal 1 - Start local blockchain
npm run node

# This creates a local Ethereum node on http://127.0.0.1:8545
# 20 test accounts with 10,000 ETH each
# Keep this running in a separate terminal
```

### Step 3: Deploy to Local Node

```bash
# Terminal 2 - Deploy to local node
npm run deploy:local

# Expected output:
# ✅ KimuntuXWallet deployed to: 0x...
# ✅ KimuntuXCommissionSystem deployed to: 0x...
# ✅ PaymentEscrow deployed to: 0x...
```

### Step 4: Test Contracts Locally

```bash
# Run Hardhat tests (if you have test files)
npm test

# Or interact manually using Hardhat console
npx hardhat console --network localhost
```

**Example console interaction:**

```javascript
const KimuntuXWallet = await ethers.getContractFactory("KimuntuXWallet");
const wallet = await KimuntuXWallet.attach("DEPLOYED_ADDRESS_HERE");

// Create a wallet
await wallet.createWallet();

// Check if wallet exists
const hasWallet = await wallet.hasWallet("YOUR_ADDRESS");
console.log("Has wallet:", hasWallet);
```

---

## Sepolia Testnet Deployment

### Step 1: Verify Configuration

**Check your `.env` file has:**
- ✅ `SEPOLIA_RPC_URL` with valid Alchemy/Infura URL
- ✅ `PRIVATE_KEY` (without 0x prefix)
- ✅ `ETHERSCAN_API_KEY` for verification

**Verify connection:**

```bash
npx hardhat run scripts/verify-connection.js --network sepolia
```

If this doesn't exist, manually check:

```bash
npx hardhat console --network sepolia

# In console:
const balance = await ethers.provider.getBalance("YOUR_WALLET_ADDRESS");
console.log("Balance:", ethers.formatEther(balance), "ETH");
```

### Step 2: Deploy All Contracts

```bash
npm run deploy:sepolia

# This will:
# 1. Deploy KimuntuXWallet
# 2. Deploy KimuntuXCommissionSystem
# 3. Deploy PaymentEscrow
# 4. Save deployment info to deployments/sepolia-deployment.json
```

**Expected output:**

```
╔════════════════════════════════════════════════════════════╗
║   KimuntuX Blockchain Integration - Complete Deployment    ║
╚════════════════════════════════════════════════════════════╝

📋 Deployment Configuration:
   • Deployer Address: 0xYourAddress...
   • Account Balance: 0.0987 ETH
   • Network: sepolia
   • Chain ID: 11155111

📦 [1/3] Deploying KimuntuXWallet...
   ✅ KimuntuXWallet deployed to: 0x...

📦 [2/3] Deploying KimuntuXCommissionSystem...
   ✅ KimuntuXCommissionSystem deployed to: 0x...

📦 [3/3] Deploying PaymentEscrow...
   ✅ PaymentEscrow deployed to: 0x...

╔════════════════════════════════════════════════════════════╗
║                  🎉 DEPLOYMENT SUCCESSFUL!                  ║
╚════════════════════════════════════════════════════════════╝

📍 Contract Addresses:
   • KimuntuXWallet: 0x...
   • KimuntuXCommissionSystem: 0x...
   • PaymentEscrow: 0x...

🔗 Etherscan Links:
   • Wallet: https://sepolia.etherscan.io/address/0x...
   • Commission: https://sepolia.etherscan.io/address/0x...
   • Escrow: https://sepolia.etherscan.io/address/0x...
```

### Step 3: Save Contract Addresses

The deployment script automatically saves addresses to:
```
deployments/sepolia-deployment.json
```

**Important:** Keep this file safe! You'll need these addresses for:
- Contract verification
- Backend integration
- Frontend configuration
- Testing

---

## Contract Verification

Verifying contracts on Etherscan allows anyone to read your contract source code and interact with it through the Etherscan UI.

### Step 1: Verify All Contracts

```bash
npm run verify:sepolia

# This reads deployments/sepolia-deployment.json
# and verifies all three contracts
```

**Expected output:**

```
🔍 Starting contract verification on Etherscan...

🔎 Verifying KimuntuXWallet...
   Address: 0x...
   ✅ KimuntuXWallet verified successfully!

🔎 Verifying KimuntuXCommissionSystem...
   Address: 0x...
   ✅ KimuntuXCommissionSystem verified successfully!

🔎 Verifying PaymentEscrow...
   Address: 0x...
   ✅ PaymentEscrow verified successfully!
```

### Step 2: Check Verification on Etherscan

1. Visit the Etherscan link for each contract
2. Click the "Contract" tab
3. You should see:
   - ✅ Green checkmark next to contract name
   - "Contract Source Code Verified" message
   - Full Solidity source code
   - Read Contract / Write Contract tabs

---

## Post-Deployment Testing

### Test on Sepolia Testnet

#### 1. Using Etherscan UI

**Create a Wallet:**

1. Go to Wallet contract on Etherscan
2. Click "Write Contract" tab
3. Connect MetaMask
4. Call `createWallet()` function
5. Confirm transaction in MetaMask
6. Wait for confirmation (~15 seconds)
7. Check "Read Contract" tab → `hasWallet(yourAddress)` should return `true`

**Deposit ETH:**

1. "Write Contract" → `depositETH()`
2. Enter value (e.g., 0.01 ETH in the "payableAmount" field)
3. Confirm transaction
4. Check balance with `getETHBalance(yourAddress)`

#### 2. Using Hardhat Console

```bash
npx hardhat console --network sepolia
```

```javascript
// Load deployment info
const deployment = require('./deployments/sepolia-deployment.json');

// Attach to contracts
const Wallet = await ethers.getContractFactory("KimuntuXWallet");
const wallet = Wallet.attach(deployment.contracts.KimuntuXWallet.address);

const Commission = await ethers.getContractFactory("KimuntuXCommissionSystem");
const commission = Commission.attach(deployment.contracts.KimuntuXCommissionSystem.address);

// Get signer
const [signer] = await ethers.getSigners();

// Create wallet
const tx1 = await wallet.createWallet();
await tx1.wait();
console.log("✅ Wallet created");

// Register as affiliate
const tx2 = await commission.registerSelf();
await tx2.wait();
console.log("✅ Registered as affiliate");

// Check state
const hasWallet = await wallet.hasWallet(signer.address);
const isAffiliate = await commission.isAffiliate(signer.address);
console.log("Has wallet:", hasWallet);
console.log("Is affiliate:", isAffiliate);
```

#### 3. Update Demo HTML

Update `demo.html` to connect to your deployed contracts:

```javascript
// Around line 630 in demo.html
const BlockchainState = {
    contracts: {
        wallet: '0xYOUR_WALLET_CONTRACT_ADDRESS',
        commission: '0xYOUR_COMMISSION_CONTRACT_ADDRESS',
        escrow: '0xYOUR_ESCROW_CONTRACT_ADDRESS',
        owner: '0xYOUR_DEPLOYER_ADDRESS'
    },
    // ... rest of code
};
```

---

## Mainnet Deployment

**⚠️ CRITICAL - Read Before Mainnet Deployment:**

### Pre-Mainnet Checklist

- [ ] All contracts thoroughly tested on Sepolia testnet
- [ ] Security audit completed by professional firm (Budget: $15,000-$30,000)
- [ ] Audit issues resolved and re-audited
- [ ] Emergency pause mechanisms tested
- [ ] Ownership transfer plan ready
- [ ] Multi-sig wallet setup for contract ownership
- [ ] Gas optimization verified
- [ ] Documentation complete
- [ ] Backend integration tested
- [ ] Team training completed

### Security Audit

**Recommended Audit Firms:**

1. **OpenZeppelin** - [openzeppelin.com/security-audits](https://openzeppelin.com/security-audits)
2. **Trail of Bits** - [trailofbits.com](https://www.trailofbits.com)
3. **Consensys Diligence** - [consensys.net/diligence](https://consensys.net/diligence)
4. **Certik** - [certik.com](https://www.certik.com)

**Typical Timeline:**
- 2-4 weeks for audit
- 1-2 weeks for fixes
- 1 week for re-audit

**Cost:** $15,000 - $50,000 depending on contract complexity

### Mainnet Deployment Steps

**Only after successful audit:**

```bash
# 1. Update .env with mainnet configuration
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_PRIVATE_KEY=your_mainnet_deployer_key

# 2. Fund deployer wallet (need ~0.5 ETH for deployment + buffer)

# 3. Deploy to mainnet
npx hardhat run scripts/deploy-all.js --network mainnet

# 4. Verify contracts
npx hardhat run scripts/verify.js --network mainnet

# 5. Transfer ownership to multi-sig wallet
# Do NOT keep deployment wallet as owner on mainnet
```

**Estimated Mainnet Deployment Costs (Gas @ 30 gwei):**

| Contract | Est. Gas | Cost @ 30 gwei |
|----------|----------|----------------|
| KimuntuXWallet | ~3,000,000 | ~$200 |
| CommissionSystem | ~2,500,000 | ~$160 |
| PaymentEscrow | ~2,800,000 | ~$180 |
| **Total** | **~8,300,000** | **~$540** |

*Note: Actual costs vary with gas prices*

---

## Troubleshooting

### Common Issues

#### 1. "Insufficient funds for gas"

**Problem:** Not enough ETH in deployer wallet

**Solution:**
```bash
# Check balance
npx hardhat console --network sepolia
const balance = await ethers.provider.getBalance("YOUR_ADDRESS");
console.log(ethers.formatEther(balance));

# Get more testnet ETH from faucets
```

#### 2. "Nonce too high" or "Nonce too low"

**Problem:** Transaction nonce mismatch

**Solution:**
```bash
# Reset account in MetaMask
# Settings → Advanced → Clear activity tab data

# Or specify nonce manually in deployment script
```

#### 3. "Contract already deployed"

**Problem:** Trying to deploy to same address

**Solution:**
```bash
# Clean artifacts
npm run clean

# Recompile
npm run compile

# Deploy again
```

#### 4. "Cannot find module '@openzeppelin/contracts'"

**Problem:** Dependencies not installed

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 5. "Error: Invalid API Key"

**Problem:** Wrong or missing Etherscan API key

**Solution:**
- Check `.env` file has correct `ETHERSCAN_API_KEY`
- Verify key at [etherscan.io/myapikey](https://etherscan.io/myapikey)

#### 6. "Transaction underpriced"

**Problem:** Gas price too low

**Solution:**
```javascript
// In hardhat.config.js, increase gas price
sepolia: {
  gasPrice: "auto", // or specific value like 50000000000 (50 gwei)
}
```

### Getting Help

- **Hardhat Docs:** [hardhat.org/docs](https://hardhat.org/docs)
- **OpenZeppelin Forum:** [forum.openzeppelin.com](https://forum.openzeppelin.com)
- **Ethereum Stack Exchange:** [ethereum.stackexchange.com](https://ethereum.stackexchange.com)
- **KimuntuX Support:** yannkayilu@kimuntupower.com

---

## Next Steps After Deployment

1. ✅ **Test all functionality** on testnet
2. ✅ **Update backend** with contract addresses and ABIs
3. ✅ **Update frontend** to connect to deployed contracts
4. ✅ **Document APIs** for team integration
5. ✅ **Setup monitoring** (Tenderly, Defender, etc.)
6. ✅ **Create admin dashboard** for contract management
7. ✅ **Plan security audit** before mainnet
8. ✅ **Setup multi-sig wallet** for mainnet ownership

---

## Summary

✅ **Testnet:** Free, safe to experiment, perfect for development
✅ **Mainnet:** Real money, requires audit, production deployment

**Deployment Timeline:**

- **Week 1:** Local testing
- **Week 2:** Sepolia deployment & integration testing
- **Week 3-4:** Full system integration
- **Week 5-8:** Security audit
- **Week 9:** Mainnet deployment

Good luck with your deployment! 🚀
