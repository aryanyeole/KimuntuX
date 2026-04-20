# Deployment Guide for Sponsor Demo

This guide will walk you through deploying the complete blockchain integration for sponsor testing.

---

## Prerequisites

Ensure you have the following installed:
- Node.js (v16 or higher)
- Python 3.9+
- PostgreSQL (for RDS)
- Git

---

## Step 1: Deploy Hardhat Node & Contracts

### 1.1 Start Hardhat Node

```bash
# Terminal 1: Hardhat Node
cd KimuntuX_BlockchainIntegration
npx hardhat node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812e339D9B73b0245ad59E1edd142 (10000 ETH)
...
```

**Keep this terminal running!**

---

### 1.2 Deploy Contracts

```bash
# Terminal 2: Deploy contracts
cd KimuntuX_BlockchainIntegration
npx hardhat run scripts/deploy-all.js --network localhost
```

**Expected Output:**
```
Deploying contracts to network: localhost
Deployer address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deployer balance: 10000.0 ETH

Deploying KimuntuXWallet...
✓ KimuntuXWallet deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

Deploying KimuntuXCommissionSystem...
✓ KimuntuXCommissionSystem deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

Deploying PaymentEscrow...
✓ PaymentEscrow deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

Deployment complete!

Copy these to your .env file:
COMMISSION_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
WALLET_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ESCROW_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Copy the contract addresses!** You'll need them for the backend.

---

### 1.3 Sync ABIs

```bash
# Still in KimuntuX_BlockchainIntegration directory
node scripts/sync-abis.js
```

**Expected Output:**
```
Syncing ABIs from Hardhat artifacts to backend...
✓ CommissionSystem.json synced
✓ Wallet.json synced
✓ PaymentEscrow.json synced
ABI sync complete!
```

---

## Step 2: Deploy Backend

### 2.1 Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with the contract addresses from Step 1.2:

```env
# Blockchain Configuration
BLOCKCHAIN_DEMO_MODE=true
LOCAL_RPC_URL=http://127.0.0.1:8545
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Platform Wallet (use Hardhat Account #0)
PLATFORM_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Contract Addresses (from deployment output)
COMMISSION_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
WALLET_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ESCROW_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kimuntux

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
LOG_LEVEL=INFO
LOG_FORMAT=text

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

---

### 2.2 Set Up Database

```bash
# Create database
createdb kimuntux

# Or using psql
psql -U postgres
CREATE DATABASE kimuntux;
\q

# Run migrations
cd backend
alembic upgrade head
```

**Expected Output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 0001, initial blockchain tables
```

---

### 2.3 Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

### 2.4 Start Backend

```bash
# Terminal 3: Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Will watch for changes in these directories: ['C:\\...\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Starting KimuntuX Backend …
INFO:     Blockchain ready — block=1, gas=1.0 gwei, platform_balance=10000.000000 ETH
INFO:     Application startup complete.
```

**Keep this terminal running!**

---

### 2.5 Verify Backend

Open a new terminal and test:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "latest_block": 1,
#   "gas_price_gwei": 1.0,
#   "platform_balance_eth": 10000.0,
#   "contracts": {
#     "KimuntuXCommissionSystem": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
#     "KimuntuXWallet": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
#     "PaymentEscrow": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
#   }
# }
```

---

## Step 3: Deploy Frontend

### 3.1 Configure Environment

```bash
cd ..  # Back to project root
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
REACT_APP_BLOCKCHAIN_API_URL=http://localhost:8000
REACT_APP_BLOCKCHAIN_NETWORK=local
```

---

### 3.2 Install Dependencies

```bash
npm install
```

---

### 3.3 Start Frontend

```bash
# Terminal 4: Frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view kimuntu_x in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

**Keep this terminal running!**

---

## Step 4: Verify Deployment

### 4.1 Check All Services

You should now have 4 terminals running:

1. **Terminal 1:** Hardhat Node (`http://127.0.0.1:8545`)
2. **Terminal 2:** Available for commands
3. **Terminal 3:** Backend (`http://localhost:8000`)
4. **Terminal 4:** Frontend (`http://localhost:3000`)

---

### 4.2 Test Frontend

Open browser to `http://localhost:3000`

**Test Navigation:**
- ✓ Home page loads
- ✓ Navigate to `/blockchain` page
- ✓ Navigate to `/fintech` page
- ✓ Navigate to `/affiliate-hub` page

---

### 4.3 Test Backend API

```bash
# Test commission stats
curl http://localhost:8000/api/v1/commissions/stats

# Test escrow stats
curl http://localhost:8000/api/v1/escrows/stats

# Test wallet endpoints
curl http://localhost:8000/api/v1/wallets/tokens
```

---

## Step 5: Demo Workflow for Sponsors

### 5.1 Navigate to Blockchain Page

1. Open `http://localhost:3000/blockchain`
2. Show live platform metrics
3. Explain the three smart contracts:
   - Commission System
   - Wallet Management
   - Payment Escrow

---

### 5.2 Navigate to Fintech Page

1. Open `http://localhost:3000/fintech`
2. Show wallet integration
3. Explain payment processing capabilities

---

### 5.3 Navigate to Affiliate Hub

1. Open `http://localhost:3000/affiliate-hub`
2. Show commission tracking
3. Explain affiliate program features

---

### 5.4 Test Backend Operations (Optional)

If sponsors want to see actual transactions:

```bash
# Record a commission
curl -X POST http://localhost:8000/api/v1/commissions/record \
  -H "Content-Type: application/json" \
  -d '{
    "affiliate": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "amount_eth": 0.01,
    "tx_id": "demo-commission-001"
  }'

# Create an escrow
curl -X POST http://localhost:8000/api/v1/escrows/create \
  -H "Content-Type: application/json" \
  -d '{
    "seller": "0x70997970C51812e339D9B73b0245ad59E1edd142",
    "product_id": "DEMO-PRODUCT-001",
    "notes": "Demo escrow for sponsors",
    "arbiter": "0x0000000000000000000000000000000000000000",
    "amount_eth": 0.01
  }'
```

---

## Troubleshooting

### Issue: "Connection refused" on backend

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running, restart backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### Issue: "Network error" on frontend

**Solution:**
```bash
# Check CORS settings in backend/.env
ALLOWED_ORIGINS=http://localhost:3000

# Restart backend after changing
```

---

### Issue: Hardhat node stopped

**Solution:**
```bash
# Restart Hardhat node
cd KimuntuX_BlockchainIntegration
npx hardhat node

# Redeploy contracts
npx hardhat run scripts/deploy-all.js --network localhost

# Update contract addresses in backend/.env
# Restart backend
```

---

### Issue: Database connection error

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -l | grep kimuntux

# Run migrations
cd backend
alembic upgrade head
```

---

## Production Deployment (Future)

For production deployment to Sepolia or Polygon:

1. **Update Environment:**
   ```env
   BLOCKCHAIN_DEMO_MODE=false
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   PLATFORM_PRIVATE_KEY=<your-production-key>
   ```

2. **Deploy Contracts:**
   ```bash
   npx hardhat run scripts/deploy-all.js --network sepolia
   ```

3. **Update Frontend:**
   ```env
   REACT_APP_BLOCKCHAIN_NETWORK=sepolia
   ```

4. **Build Frontend:**
   ```bash
   npm run build
   serve -s build
   ```

---

## Quick Start Script

Create `start-demo.sh`:

```bash
#!/bin/bash

# Start Hardhat node in background
cd KimuntuX_BlockchainIntegration
npx hardhat node &
HARDHAT_PID=$!

# Wait for Hardhat to start
sleep 5

# Deploy contracts
npx hardhat run scripts/deploy-all.js --network localhost

# Sync ABIs
node scripts/sync-abis.js

# Start backend in background
cd ../backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
cd ..
npm start

# Cleanup on exit
trap "kill $HARDHAT_PID $BACKEND_PID" EXIT
```

Usage:
```bash
chmod +x start-demo.sh
./start-demo.sh
```

---

## Summary

You now have:
- ✓ Hardhat node running with deployed contracts
- ✓ Backend API serving blockchain operations
- ✓ Frontend displaying live blockchain data
- ✓ Database configured and migrated
- ✓ All services connected and working

**Ready for sponsor demo!**

For questions, check:
- `.kiro/BLOCKCHAIN_DEMO_GUIDE.md` - Demo workflow
- `.kiro/DATABASE_VERIFICATION_GUIDE.md` - Database verification
- `.kiro/IMPLEMENTATION_SUMMARY.md` - Technical details
