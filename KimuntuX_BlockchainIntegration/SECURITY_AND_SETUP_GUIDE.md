# 🔐 KimuntuX Blockchain - Security & Setup Guide

**Last Updated:** March 4, 2026
**Version:** 1.0.0
**Status:** Production-Ready

---

## 📋 Table of Contents

1. [Quick Start (15 Minutes)](#quick-start-15-minutes)
2. [Environment Setup](#environment-setup)
3. [Security Best Practices](#security-best-practices)
4. [Network Configuration](#network-configuration)
5. [Deployment Pipeline](#deployment-pipeline)
6. [Troubleshooting](#troubleshooting)
7. [Team Collaboration](#team-collaboration)
8. [Production Deployment Checklist](#production-deployment-checklist)

---

## 🚀 Quick Start (15 Minutes)

### Prerequisites
- [x] Node.js 16+ installed
- [x] MetaMask browser extension
- [x] Basic understanding of Ethereum

### Step-by-Step Setup

```bash
# 1. Clone and navigate to project
cd KimuntuX_BlockchainIntegration

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your credentials (see instructions below)
# Use your text editor to fill in the values

# 5. Compile contracts
npm run compile

# 6. Deploy to Sepolia testnet
npm run deploy:sepolia

# 7. Verify contracts on Etherscan
npm run verify:sepolia
```

**Time Estimate:** 10-15 minutes (excluding faucet wait time)

---

## 🔧 Environment Setup

### 1. Get Sepolia Testnet ETH

You need ~0.1 ETH on Sepolia for deployment and testing.

**Faucets (Choose one):**

1. **Alchemy Faucet** (Recommended)
   - URL: https://www.alchemy.com/faucets/ethereum-sepolia
   - Requires: Alchemy account (free)
   - Amount: 0.5 ETH/day
   - Speed: Instant

2. **Sepolia PoW Faucet**
   - URL: https://sepolia-faucet.pk910.de
   - Requires: Mining (browser-based)
   - Amount: Variable based on mining time
   - Speed: 1-2 hours for 0.1 ETH

3. **Sepolia Faucet**
   - URL: https://sepoliafaucet.com
   - Requires: Twitter account or Alchemy login
   - Amount: 0.5 ETH/day
   - Speed: Instant

**Steps:**
```
1. Create new MetaMask wallet (dedicated for testing)
2. Switch network to "Sepolia Test Network"
3. Copy your wallet address
4. Visit faucet and request testnet ETH
5. Wait for transaction confirmation (~15 seconds)
6. Verify balance in MetaMask
```

### 2. Get Alchemy API Key

Alchemy provides reliable RPC access to Ethereum networks.

**Steps:**

```
1. Go to https://www.alchemy.com
2. Sign up for free account
3. Click "Create App"
4. Fill in details:
   - Name: KimuntuX Sepolia
   - Description: KimuntuX Smart Contracts
   - Chain: Ethereum
   - Network: Sepolia
5. Click "View Key"
6. Copy the HTTPS URL (not WebSocket)
7. Paste into .env as SEPOLIA_RPC_URL
```

**Example URL Format:**
```
https://eth-sepolia.g.alchemy.com/v2/abcd1234efgh5678ijkl
```

### 3. Get Etherscan API Key

Required for automatic contract verification.

**Steps:**

```
1. Go to https://etherscan.io
2. Sign up for free account
3. Go to https://etherscan.io/myapikey
4. Click "Add" button
5. Name: "KimuntuX Development"
6. Copy the API key
7. Paste into .env as ETHERSCAN_API_KEY
```

**API Key Format:**
```
ABC123DEF456GHI789JKL012MNO345
```

### 4. Export Private Key from MetaMask

⚠️ **SECURITY WARNING:** Never use your main wallet for development!

**Steps:**

```
1. Open MetaMask
2. Select the testnet wallet you created
3. Click the three dots (⋮)
4. Select "Account details"
5. Click "Show private key"
6. Enter your MetaMask password
7. Copy the private key (starts with 0x)
8. Paste into .env as PRIVATE_KEY
```

**Private Key Format:**
```
0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

### 5. Configure .env File

Your `.env` file should look like this:

```bash
# Minimum required for Sepolia deployment
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ACTUAL_KEY
PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ACTUAL_ETHERSCAN_KEY

# Optional: Gas reporting
REPORT_GAS=false
```

---

## 🔒 Security Best Practices

### Critical Security Rules

#### ✅ DO:

1. **Use Separate Wallets**
   - Testnet wallet: For Sepolia, Goerli, Mumbai
   - Mainnet wallet: For Ethereum, Polygon, BSC
   - Personal wallet: Never use for development

2. **Protect Private Keys**
   - Store in password manager (1Password, LastPass, Bitwarden)
   - Never commit to git (check `.gitignore`)
   - Never share via email/Slack/Discord
   - Use hardware wallet (Ledger, Trezor) for mainnet

3. **Use Environment Variables**
   - All secrets in `.env` file
   - Never hardcode keys in source code
   - Use `.env.example` for documentation only

4. **Regular Security Audits**
   - Scan with `git-secrets` before commits
   - Use `npm audit` to check dependencies
   - Review access logs on Alchemy/Etherscan

5. **Multi-Signature for Production**
   - Use Gnosis Safe for mainnet contract ownership
   - Require 2-3 signatures for admin functions
   - Store backup keys in separate locations

#### ❌ DON'T:

1. **Never Commit Secrets**
   ```bash
   # Always verify before committing
   git status | grep .env
   git diff | grep -i "private"
   ```

2. **Never Reuse Keys**
   - Don't use testnet keys for mainnet
   - Don't use same key across projects
   - Rotate keys regularly (every 3-6 months)

3. **Never Share Keys**
   - No screenshots with visible keys
   - No copy-paste in public channels
   - No unencrypted backups

4. **Never Use Personal Wallets**
   - Create dedicated deployment wallets
   - Keep minimal funds (only what's needed)
   - Separate funds immediately after deployment

### What If Keys Are Compromised?

**Immediate Actions:**

```bash
# 1. Transfer all funds to new wallet (URGENT!)
# Do this FIRST, before anything else

# 2. Generate new wallet
# Create new MetaMask wallet

# 3. Update .env with new keys
# Replace compromised PRIVATE_KEY

# 4. If contracts already deployed, transfer ownership
# Use Etherscan or custom script to transfer to new address

# 5. Audit recent transactions
# Check Etherscan for unauthorized activity

# 6. Report to team
# Inform team members of the breach

# 7. Rotate all related credentials
# RPC keys, API keys, etc.
```

### Security Checklist Before Every Commit

```bash
# Run these checks before `git commit`

# 1. Check for .env file
git status | grep -E "\.env$"
# Should return nothing (only .env.example should be tracked)

# 2. Check for private keys in diff
git diff | grep -i "private.*key"
# Should return nothing

# 3. Check for API keys
git diff | grep -E "[A-Z0-9]{32,}"
# Review any matches (might be legitimate hashes)

# 4. Check for wallet addresses with funds
git diff | grep -E "0x[a-fA-F0-9]{40}"
# Review any addresses (deployment addresses are OK)

# 5. Install git-secrets (one-time setup)
npm install -g git-secrets
git secrets --install
git secrets --register-aws  # Detects AWS keys
git secrets --scan          # Scan staged files
```

---

## 🌐 Network Configuration

### Available Networks

| Network | Type | Chain ID | Gas Cost | Speed | Use Case |
|---------|------|----------|----------|-------|----------|
| **Hardhat** | Local | 31337 | Free | Instant | Unit testing |
| **Localhost** | Local | 31337 | Free | Instant | Frontend dev |
| **Sepolia** | Testnet | 11155111 | Free | ~15s | Production testing |
| **Polygon Amoy** | Testnet | 80002 | Free | ~2s | Polygon testing |
| **BSC Testnet** | Testnet | 97 | Free | ~3s | BSC testing |
| **Ethereum** | Mainnet | 1 | $50-500 | ~15s | Production |
| **Polygon** | Mainnet | 137 | $0.01-0.10 | ~2s | Low-cost production |
| **BSC** | Mainnet | 56 | $0.20-1 | ~3s | Alternative mainnet |

### Network Selection Guide

**For Testing (Start Here):**
```bash
# Compile contracts
npm run compile

# Deploy to local Hardhat network
npx hardhat run scripts/deploy-all.js

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

**For Production (After Audit):**
```bash
# Deploy to Polygon (recommended - low cost)
npx hardhat run scripts/deploy-all.js --network polygon

# Deploy to Ethereum mainnet (expensive)
npx hardhat run scripts/deploy-all.js --network mainnet
```

### Gas Cost Comparison

**Deployment Costs (All 3 Contracts):**

| Network | Estimated Cost | Speed | Recommendation |
|---------|---------------|-------|----------------|
| Sepolia | **FREE** | 15s | ✅ Use for testing |
| Polygon | **$5-10** | 2s | ✅ Recommended for production |
| BSC | **$20-30** | 3s | ⚠️ Alternative option |
| Ethereum | **$300-800** | 15s | ⚠️ Only if necessary |

**Transaction Costs (Per Operation):**

| Operation | Sepolia | Polygon | Ethereum |
|-----------|---------|---------|----------|
| Create Wallet | FREE | $0.001 | $1.50 |
| Deposit ETH | FREE | $0.001 | $1.35 |
| Withdraw | FREE | $0.001 | $1.50 |
| Record Commission | FREE | $0.002 | $3.00 |
| Create Escrow | FREE | $0.002 | $3.60 |
| Release Escrow | FREE | $0.001 | $1.65 |

**Recommendation:** Deploy to **Polygon** for production (100x cheaper than Ethereum)

---

## 🚀 Deployment Pipeline

### Development Workflow

```
1. Development → 2. Testing → 3. Staging → 4. Production
   (Local)       (Sepolia)     (Polygon)    (Ethereum)
```

### Stage 1: Local Development

```bash
# Start local Hardhat network (Terminal 1)
npx hardhat node

# Deploy to local network (Terminal 2)
npx hardhat run scripts/deploy-all.js --network localhost

# Run tests
npx hardhat test

# Generate gas report
REPORT_GAS=true npx hardhat test
```

**Purpose:**
- Fast iteration
- No costs
- Instant feedback
- Perfect for development

### Stage 2: Testnet Deployment (Sepolia)

```bash
# Ensure .env is configured
cat .env | grep SEPOLIA_RPC_URL

# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia

# View deployment
# Check: deployments/sepolia-deployment.json
```

**Purpose:**
- Real network testing
- Free testnet ETH
- Etherscan verification
- Share with team for testing

**Success Indicators:**
- ✅ All 3 contracts deployed
- ✅ Verified on Etherscan
- ✅ Constructor args correct
- ✅ Owner address matches deployer
- ✅ All functions callable

### Stage 3: Production Deployment

⚠️ **STOP! Complete these requirements first:**

**Pre-Production Checklist:**

- [ ] 100+ successful test transactions on Sepolia
- [ ] Security audit completed ($15k-30k)
- [ ] All audit findings resolved
- [ ] Multi-sig wallet setup (Gnosis Safe)
- [ ] Emergency response plan documented
- [ ] Team trained on contract administration
- [ ] Budget approved ($500-800 for Ethereum, $5-10 for Polygon)
- [ ] Legal review completed (if applicable)
- [ ] Insurance considerations addressed
- [ ] Monitoring setup (OpenZeppelin Defender, Tenderly)

**Deployment Steps:**

```bash
# 1. Final compilation
npm run clean
npm run compile

# 2. Deploy to mainnet (choose network)
npx hardhat run scripts/deploy-all.js --network polygon  # Recommended
# OR
npx hardhat run scripts/deploy-all.js --network mainnet  # Expensive

# 3. Verify contracts
npx hardhat verify --network polygon CONTRACT_ADDRESS "constructor_args"

# 4. Transfer ownership to multi-sig
# Use Etherscan "Write Contract" interface

# 5. Test all functions
# Use Etherscan UI to test each function

# 6. Announce deployment
# Update documentation, notify team, announce to users
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Insufficient funds for gas"

**Cause:** Deployer wallet doesn't have enough ETH

**Solution:**
```bash
# Check wallet balance
npx hardhat console --network sepolia
> await ethers.provider.getBalance("YOUR_WALLET_ADDRESS")

# Get more testnet ETH from faucet
# Need at least 0.1 ETH for deployment
```

#### Issue: "Network connection failed"

**Cause:** Invalid or rate-limited RPC URL

**Solution:**
```bash
# Test RPC connection
curl -X POST $SEPOLIA_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return current block number
# If error, check your Alchemy API key or use different RPC
```

#### Issue: "Contract verification failed"

**Cause:** Constructor arguments mismatch or wrong compiler version

**Solution:**
```bash
# Check deployment file
cat deployments/sepolia-deployment.json

# Verify with correct constructor args
npx hardhat verify --network sepolia \
  CONTRACT_ADDRESS \
  "10000000000000000"  # Example: 0.01 ETH in wei

# Check compiler version matches hardhat.config.js
```

#### Issue: "Private key invalid format"

**Cause:** Private key missing `0x` prefix or wrong length

**Solution:**
```bash
# Private key should be:
# - 66 characters total (0x + 64 hex characters)
# - Start with 0x
# - Only contain 0-9 and a-f

# Correct format:
PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Wrong formats:
PRIVATE_KEY=abcdef...  # Missing 0x
PRIVATE_KEY=0xabcd...  # Too short
```

#### Issue: "Transaction underpriced"

**Cause:** Gas price too low for current network congestion

**Solution:**
```javascript
// Edit hardhat.config.js for the network
sepolia: {
  // ...
  gasPrice: "auto",  // Let Hardhat estimate
  // OR set manually (in gwei)
  // gasPrice: 50000000000,  // 50 gwei
}
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Enable Hardhat verbose logging
npx hardhat run scripts/deploy-all.js --network sepolia --verbose

# Enable debug logging
DEBUG=hardhat:* npx hardhat run scripts/deploy-all.js --network sepolia

# Check Hardhat console
npx hardhat console --network sepolia
> await ethers.getSigners()
> await ethers.provider.getNetwork()
```

---

## 👥 Team Collaboration

### Sharing Configuration Safely

**DO:**
```bash
# Share .env.example (safe)
git add .env.example
git commit -m "Update environment variable template"

# Share deployment addresses (safe)
git add deployments/sepolia-deployment.json
git commit -m "Add Sepolia deployment addresses"

# Share configuration changes
git add hardhat.config.js
git commit -m "Update Sepolia RPC timeout"
```

**DON'T:**
```bash
# Never commit actual .env
git add .env  # ❌ WRONG!

# Never share private keys
slack_message "Here's my private key: 0x..."  # ❌ WRONG!

# Never commit deployment artifacts with sensitive data
git add .openzeppelin/  # ❌ May contain sensitive data
```

### Team Member Onboarding

**New Team Member Checklist:**

```bash
# 1. Clone repository
git clone https://github.com/KimuntuX/KimuntuX_BlockchainIntegration.git
cd KimuntuX_BlockchainIntegration

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Get credentials (from team lead)
# - Shared Alchemy API key (can be shared)
# - Shared Etherscan API key (can be shared)
# - Personal MetaMask wallet (do NOT share)

# 5. Test local deployment
npm run compile
npx hardhat test

# 6. Access shared testnet contracts
# Use deployment addresses from deployments/ folder
```

### Shared Resources

**Safe to Share:**
- ✅ Alchemy API keys (rate-limited, not critical)
- ✅ Etherscan API keys (rate-limited, not critical)
- ✅ RPC URLs (semi-public)
- ✅ Deployed contract addresses (public)
- ✅ ABI files (public after verification)

**NEVER Share:**
- ❌ Private keys (full wallet access)
- ❌ Mnemonic phrases (full wallet access)
- ❌ .env files (contains private keys)
- ❌ Mainnet deployment credentials

### Alternative: Using Shared Testnet

Instead of everyone deploying separately:

```bash
# Option 1: One person deploys, shares addresses
# Team lead deploys to Sepolia
npm run deploy:sepolia

# Share deployment file
git add deployments/sepolia-deployment.json
git commit -m "Shared testnet deployment"

# Team members use existing deployment
# No need for individual deployments
```

---

## ✅ Production Deployment Checklist

### Pre-Deployment (1-3 Months Before)

- [ ] **Security Audit**
  - [ ] Hire professional auditor ($15k-30k)
  - [ ] Review: Consensys Diligence, Trail of Bits, OpenZeppelin
  - [ ] Fix all critical findings
  - [ ] Fix all high-severity findings
  - [ ] Document accepted risks for low/medium findings

- [ ] **Extensive Testing**
  - [ ] 100+ transactions on Sepolia
  - [ ] Test all edge cases
  - [ ] Test emergency functions
  - [ ] Load testing (if applicable)
  - [ ] Integration testing with backend

- [ ] **Infrastructure Setup**
  - [ ] Setup multi-sig wallet (Gnosis Safe)
  - [ ] Configure 2-of-3 or 3-of-5 signature scheme
  - [ ] Setup monitoring (OpenZeppelin Defender or Tenderly)
  - [ ] Setup alerting (Discord/Slack webhooks)
  - [ ] Prepare emergency response plan

- [ ] **Documentation**
  - [ ] User guide completed
  - [ ] Admin guide completed
  - [ ] Emergency procedures documented
  - [ ] Contract interaction guide
  - [ ] API integration guide

- [ ] **Legal & Compliance**
  - [ ] Legal review completed
  - [ ] Terms of service updated
  - [ ] Privacy policy updated
  - [ ] Compliance requirements met
  - [ ] Insurance considered

### Deployment Day (2-4 Hours)

- [ ] **Final Checks**
  - [ ] Clean compilation: `npm run clean && npm run compile`
  - [ ] All tests pass: `npm test`
  - [ ] No pending changes: `git status`
  - [ ] Correct branch: `git branch`
  - [ ] Backup current code: `git tag v1.0.0-mainnet`

- [ ] **Wallet Preparation**
  - [ ] Hardware wallet connected (Ledger/Trezor)
  - [ ] Sufficient funds (0.5-1 ETH for Ethereum, 10 MATIC for Polygon)
  - [ ] Test transaction on testnet first
  - [ ] Backup recovery phrase secured

- [ ] **Deployment Execution**
  - [ ] Deploy contracts: `npx hardhat run scripts/deploy-all.js --network [mainnet/polygon]`
  - [ ] Verify deployment addresses
  - [ ] Verify constructor arguments
  - [ ] Check owner addresses

- [ ] **Verification**
  - [ ] Verify on Etherscan: `npm run verify:mainnet` (or verify:polygon)
  - [ ] Verify source code matches
  - [ ] Test read functions on Etherscan
  - [ ] Test write functions (small amounts)

- [ ] **Ownership Transfer**
  - [ ] Transfer ownership to multi-sig
  - [ ] Verify multi-sig has ownership
  - [ ] Test multi-sig functionality
  - [ ] Revoke deployer privileges (if applicable)

- [ ] **Post-Deployment Testing**
  - [ ] Test each contract function
  - [ ] Verify events emit correctly
  - [ ] Test emergency pause functions
  - [ ] Check gas costs
  - [ ] Monitor first hour for issues

### Post-Deployment (First Week)

- [ ] **Monitoring**
  - [ ] Setup transaction monitoring
  - [ ] Monitor gas prices
  - [ ] Watch for unusual activity
  - [ ] Daily balance checks

- [ ] **Documentation Updates**
  - [ ] Update README with mainnet addresses
  - [ ] Update integration guides
  - [ ] Announce deployment (blog, social media)
  - [ ] Update frontend with new addresses

- [ ] **Team Training**
  - [ ] Train support team
  - [ ] Document common issues
  - [ ] Create escalation procedures
  - [ ] Conduct emergency drills

---

## 📞 Support & Resources

### Getting Help

**Documentation:**
- 📖 [Hardhat Docs](https://hardhat.org/docs)
- 📖 [OpenZeppelin Docs](https://docs.openzeppelin.com)
- 📖 [Ethers.js Docs](https://docs.ethers.org)

**Community:**
- 💬 [Hardhat Discord](https://hardhat.org/discord)
- 💬 [Ethereum Stack Exchange](https://ethereum.stackexchange.com)
- 💬 [r/ethdev](https://reddit.com/r/ethdev)

**Tools:**
- 🔍 [Sepolia Etherscan](https://sepolia.etherscan.io)
- 🔍 [Alchemy Dashboard](https://dashboard.alchemy.com)
- 🔧 [Remix IDE](https://remix.ethereum.org)
- 🔧 [Tenderly](https://tenderly.co)

### Emergency Contacts

**In Case of Security Incident:**
1. Pause contracts (if possible)
2. Contact security audit team
3. Notify users via official channels
4. Document incident timeline
5. Prepare disclosure

**Security Audit Firms:**
- Consensys Diligence: https://consensys.net/diligence
- Trail of Bits: https://www.trailofbits.com
- OpenZeppelin: https://openzeppelin.com/security-audits
- Hacken: https://hacken.io
- CertiK: https://www.certik.com

---

## 📝 Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-04 | Initial comprehensive guide |

---

**Maintained by:** KimuntuX Development Team
**Last Security Review:** 2026-03-04
**Next Review Due:** 2026-06-04

