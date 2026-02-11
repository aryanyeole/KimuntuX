# KimuntuX Smart Contracts - Backend Integration Guide

Complete guide for integrating the KimuntuX smart contracts with your Python/FastAPI backend.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Contract ABIs](#contract-abis)
6. [Python Integration](#python-integration)
7. [API Endpoints](#api-endpoints)
8. [Security Best Practices](#security-best-practices)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Overview

### Architecture

```
┌─────────────────────┐
│   Frontend (React)  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  FastAPI Backend    │
│  ┌───────────────┐  │
│  │   Web3.py     │  │
│  └───────┬───────┘  │
└──────────┼──────────┘
           │
           ↓
┌─────────────────────┐
│ Ethereum Blockchain │
│  ┌──────────────┐   │
│  │   Wallet     │   │
│  │   Contract   │   │
│  └──────────────┘   │
│  ┌──────────────┐   │
│  │  Commission  │   │
│  │   Contract   │   │
│  └──────────────┘   │
│  ┌──────────────┐   │
│  │   Escrow     │   │
│  │   Contract   │   │
│  └──────────────┘   │
└─────────────────────┘
```

---

## Prerequisites

- Python 3.9+
- FastAPI
- web3.py
- PostgreSQL (for off-chain data)
- Redis (for caching)
- Deployed contracts on Sepolia or Mainnet

---

## Installation

### Step 1: Install Python Dependencies

```bash
pip install web3
pip install fastapi
pip install uvicorn
pip install python-dotenv
pip install asyncpg  # PostgreSQL async driver
pip install redis
pip install pydantic
```

Or use requirements.txt:

```bash
# requirements.txt
web3==6.15.0
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-dotenv==1.0.0
asyncpg==0.29.0
redis==5.0.1
pydantic==2.5.3
python-multipart==0.0.6
```

```bash
pip install -r requirements.txt
```

---

## Configuration

### Step 1: Environment Variables

Create `.env` file in your backend directory:

```bash
# Blockchain Configuration
WEB3_PROVIDER_URI=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
CHAIN_ID=11155111  # Sepolia testnet
# For mainnet: CHAIN_ID=1

# Platform Wallet (for gas fees)
PLATFORM_ADDRESS=0xYourPlatformAddress
PLATFORM_PRIVATE_KEY=your_private_key_here

# Contract Addresses (from deployment)
WALLET_CONTRACT_ADDRESS=0xYourWalletContractAddress
COMMISSION_CONTRACT_ADDRESS=0xYourCommissionContractAddress
ESCROW_CONTRACT_ADDRESS=0xYourEscrowContractAddress

# Database
DATABASE_URL=postgresql://user:password@localhost/kimuntux_db

# Redis
REDIS_URL=redis://localhost:6379/0

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

### Step 2: Load Contract ABIs

After deploying contracts, copy ABIs from Hardhat artifacts:

```bash
# ABIs are in: KimuntuX_BlockchainIntegration/artifacts/contracts/
# Copy to your backend: backend/contracts/abis/
```

---

## Contract ABIs

### Extract ABIs from Hardhat Artifacts

```python
# scripts/extract_abis.py
import json
import os

def extract_abi(artifact_path, output_path):
    """Extract ABI from Hardhat artifact"""
    with open(artifact_path, 'r') as f:
        artifact = json.load(f)

    abi = artifact['abi']

    with open(output_path, 'w') as f:
        json.dump(abi, f, indent=2)

    print(f"✅ Extracted ABI to {output_path}")

# Extract all ABIs
artifacts_dir = "../KimuntuX_BlockchainIntegration/artifacts/contracts"
abis_dir = "./contracts/abis"

os.makedirs(abis_dir, exist_ok=True)

extract_abi(
    f"{artifacts_dir}/KimuntuXWallet.sol/KimuntuXWallet.json",
    f"{abis_dir}/KimuntuXWallet.json"
)

extract_abi(
    f"{artifacts_dir}/KimuntuXCommissionSystem.sol/KimuntuXCommissionSystem.json",
    f"{abis_dir}/KimuntuXCommissionSystem.json"
)

extract_abi(
    f"{artifacts_dir}/PaymentEscrow.sol/PaymentEscrow.json",
    f"{abis_dir}/PaymentEscrow.json"
)

print("✅ All ABIs extracted successfully!")
```

---

## Python Integration

### Step 1: Web3 Setup

```python
# blockchain/web3_client.py
from web3 import Web3
from web3.middleware import geth_poa_middleware
import json
import os
from dotenv import load_dotenv

load_dotenv()

class Web3Client:
    def __init__(self):
        self.provider_uri = os.getenv('WEB3_PROVIDER_URI')
        self.w3 = Web3(Web3.HTTPProvider(self.provider_uri))

        # Add PoA middleware for testnets
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        # Platform wallet (for paying gas)
        self.platform_address = os.getenv('PLATFORM_ADDRESS')
        self.platform_private_key = os.getenv('PLATFORM_PRIVATE_KEY')

        # Verify connection
        if not self.w3.is_connected():
            raise Exception("Failed to connect to Ethereum node")

        print(f"✅ Connected to Ethereum network")
        print(f"   Chain ID: {self.w3.eth.chain_id}")
        print(f"   Block number: {self.w3.eth.block_number}")

    def get_balance(self, address):
        """Get ETH balance for address"""
        balance_wei = self.w3.eth.get_balance(address)
        return self.w3.from_wei(balance_wei, 'ether')

    def load_contract(self, address, abi_path):
        """Load contract instance"""
        with open(abi_path, 'r') as f:
            abi = json.load(f)

        checksum_address = self.w3.to_checksum_address(address)
        return self.w3.eth.contract(address=checksum_address, abi=abi)

    def send_transaction(self, function, from_address=None, value=0):
        """
        Send a transaction to the blockchain

        Args:
            function: Contract function to call
            from_address: Sender address (defaults to platform address)
            value: ETH value to send (in wei)

        Returns:
            Transaction receipt
        """
        if from_address is None:
            from_address = self.platform_address

        # Build transaction
        transaction = function.build_transaction({
            'from': from_address,
            'value': value,
            'gas': 300000,  # Estimate or hardcode
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(from_address),
            'chainId': self.w3.eth.chain_id
        })

        # Sign transaction
        signed_txn = self.w3.eth.account.sign_transaction(
            transaction,
            private_key=self.platform_private_key
        )

        # Send transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)

        # Wait for receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return receipt

# Global instance
web3_client = Web3Client()
```

### Step 2: Contract Wrappers

```python
# blockchain/contracts/wallet.py
from blockchain.web3_client import web3_client
import os

class KimuntuXWalletContract:
    def __init__(self):
        contract_address = os.getenv('WALLET_CONTRACT_ADDRESS')
        abi_path = 'contracts/abis/KimuntuXWallet.json'
        self.contract = web3_client.load_contract(contract_address, abi_path)
        self.w3 = web3_client.w3

    def create_wallet(self, user_address):
        """Create a wallet for a user"""
        function = self.contract.functions.createWalletFor(user_address)
        receipt = web3_client.send_transaction(function)

        return {
            'success': receipt['status'] == 1,
            'transaction_hash': receipt['transactionHash'].hex(),
            'gas_used': receipt['gasUsed']
        }

    def has_wallet(self, user_address):
        """Check if user has a wallet"""
        return self.contract.functions.hasWallet(user_address).call()

    def get_eth_balance(self, user_address):
        """Get ETH balance in wallet"""
        balance_wei = self.contract.functions.getETHBalance(user_address).call()
        return self.w3.from_wei(balance_wei, 'ether')

    def get_wallet_details(self, user_address):
        """Get complete wallet details"""
        details = self.contract.functions.getWalletDetails(user_address).call()

        return {
            'owner': details[0],
            'eth_balance': self.w3.from_wei(details[1], 'ether'),
            'created_at': details[2],
            'total_deposits': self.w3.from_wei(details[3], 'ether'),
            'total_withdrawals': self.w3.from_wei(details[4], 'ether')
        }

    def credit_eth(self, user_address, amount_eth):
        """Credit ETH to user wallet (platform pays)"""
        amount_wei = self.w3.to_wei(amount_eth, 'ether')

        function = self.contract.functions.creditETH(user_address, amount_wei)
        receipt = web3_client.send_transaction(function, value=amount_wei)

        return {
            'success': receipt['status'] == 1,
            'transaction_hash': receipt['transactionHash'].hex(),
            'amount': amount_eth
        }

# Global instance
wallet_contract = KimuntuXWalletContract()
```

```python
# blockchain/contracts/commission.py
from blockchain.web3_client import web3_client
import os

class KimuntuXCommissionContract:
    def __init__(self):
        contract_address = os.getenv('COMMISSION_CONTRACT_ADDRESS')
        abi_path = 'contracts/abis/KimuntuXCommissionSystem.json'
        self.contract = web3_client.load_contract(contract_address, abi_path)
        self.w3 = web3_client.w3

    def register_affiliate(self, affiliate_address):
        """Register an affiliate"""
        function = self.contract.functions.registerAffiliate(affiliate_address)
        receipt = web3_client.send_transaction(function)

        return {
            'success': receipt['status'] == 1,
            'transaction_hash': receipt['transactionHash'].hex()
        }

    def is_affiliate(self, address):
        """Check if address is registered affiliate"""
        return self.contract.functions.isAffiliate(address).call()

    def record_commission(self, affiliate_address, sale_amount_eth, commission_rate_bp, transaction_id):
        """
        Record a commission for an affiliate

        Args:
            affiliate_address: Affiliate wallet address
            sale_amount_eth: Sale amount in ETH
            commission_rate_bp: Commission rate in basis points (1000 = 10%)
            transaction_id: Unique transaction identifier
        """
        sale_amount_wei = self.w3.to_wei(sale_amount_eth, 'ether')

        # Calculate commission amount
        commission_wei = (sale_amount_wei * commission_rate_bp) // 10000

        function = self.contract.functions.recordCommission(
            affiliate_address,
            sale_amount_wei,
            commission_rate_bp,
            transaction_id
        )

        receipt = web3_client.send_transaction(function, value=commission_wei)

        return {
            'success': receipt['status'] == 1,
            'transaction_hash': receipt['transactionHash'].hex(),
            'commission_amount': self.w3.from_wei(commission_wei, 'ether')
        }

    def get_balance(self, affiliate_address):
        """Get pending commission balance"""
        balance_wei = self.contract.functions.getBalance(affiliate_address).call()
        return self.w3.from_wei(balance_wei, 'ether')

    def get_all_commissions(self, affiliate_address):
        """Get all commissions for an affiliate"""
        commissions = self.contract.functions.getAllCommissions(affiliate_address).call()

        return [{
            'affiliate': c[0],
            'amount': self.w3.from_wei(c[1], 'ether'),
            'timestamp': c[2],
            'transaction_id': c[3],
            'status': ['Pending', 'Approved', 'Paid', 'Disputed'][c[4]]
        } for c in commissions]

# Global instance
commission_contract = KimuntuXCommissionContract()
```

---

## API Endpoints

### FastAPI Application

```python
# main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from blockchain.contracts.wallet import wallet_contract
from blockchain.contracts.commission import commission_contract
import logging

app = FastAPI(title="KimuntuX Blockchain API", version="1.0.0")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class WalletCreate(BaseModel):
    user_address: str

class CommissionRecord(BaseModel):
    affiliate_address: str
    sale_amount: float
    commission_rate: int
    transaction_id: str

# === WALLET ENDPOINTS ===

@app.post("/api/wallet/create")
async def create_wallet(data: WalletCreate):
    """Create a new wallet for a user"""
    try:
        # Check if wallet already exists
        if wallet_contract.has_wallet(data.user_address):
            raise HTTPException(status_code=400, detail="Wallet already exists")

        # Create wallet
        result = wallet_contract.create_wallet(data.user_address)

        logger.info(f"Created wallet for {data.user_address}")

        return {
            "success": True,
            "message": "Wallet created successfully",
            "transaction_hash": result['transaction_hash'],
            "user_address": data.user_address
        }

    except Exception as e:
        logger.error(f"Error creating wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/wallet/{user_address}")
async def get_wallet(user_address: str):
    """Get wallet details for a user"""
    try:
        if not wallet_contract.has_wallet(user_address):
            raise HTTPException(status_code=404, detail="Wallet not found")

        details = wallet_contract.get_wallet_details(user_address)
        balance = wallet_contract.get_eth_balance(user_address)

        return {
            "success": True,
            "address": user_address,
            "balance": float(balance),
            "details": details
        }

    except Exception as e:
        logger.error(f"Error fetching wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# === COMMISSION ENDPOINTS ===

@app.post("/api/commission/register")
async def register_affiliate(data: WalletCreate):
    """Register a user as an affiliate"""
    try:
        # Check if already registered
        if commission_contract.is_affiliate(data.user_address):
            raise HTTPException(status_code=400, detail="Already registered as affiliate")

        # Check if wallet exists
        if not wallet_contract.has_wallet(data.user_address):
            raise HTTPException(status_code=400, detail="Must create wallet first")

        # Register affiliate
        result = commission_contract.register_affiliate(data.user_address)

        logger.info(f"Registered affiliate: {data.user_address}")

        return {
            "success": True,
            "message": "Affiliate registered successfully",
            "transaction_hash": result['transaction_hash']
        }

    except Exception as e:
        logger.error(f"Error registering affiliate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/commission/record")
async def record_commission(data: CommissionRecord):
    """Record a commission for an affiliate"""
    try:
        # Validate affiliate
        if not commission_contract.is_affiliate(data.affiliate_address):
            raise HTTPException(status_code=400, detail="Not a registered affiliate")

        # Record commission
        result = commission_contract.record_commission(
            data.affiliate_address,
            data.sale_amount,
            data.commission_rate,
            data.transaction_id
        )

        logger.info(f"Recorded commission: {data.transaction_id}")

        return {
            "success": True,
            "message": "Commission recorded successfully",
            "transaction_hash": result['transaction_hash'],
            "commission_amount": result['commission_amount']
        }

    except Exception as e:
        logger.error(f"Error recording commission: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/commission/{affiliate_address}/balance")
async def get_commission_balance(affiliate_address: str):
    """Get pending commission balance for affiliate"""
    try:
        balance = commission_contract.get_balance(affiliate_address)

        return {
            "success": True,
            "affiliate_address": affiliate_address,
            "balance": float(balance)
        }

    except Exception as e:
        logger.error(f"Error fetching balance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/commission/{affiliate_address}/history")
async def get_commission_history(affiliate_address: str):
    """Get all commissions for an affiliate"""
    try:
        commissions = commission_contract.get_all_commissions(affiliate_address)

        return {
            "success": True,
            "affiliate_address": affiliate_address,
            "commissions": commissions
        }

    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# === HEALTH CHECK ===

@app.get("/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "blockchain_connected": web3_client.w3.is_connected(),
        "block_number": web3_client.w3.eth.block_number
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Security Best Practices

### 1. Private Key Management

```python
# NEVER hardcode private keys
# ❌ BAD
PRIVATE_KEY = "0x1234567890abcdef..."

# ✅ GOOD - Use environment variables
from dotenv import load_dotenv
import os
load_dotenv()
PRIVATE_KEY = os.getenv('PLATFORM_PRIVATE_KEY')

# ✅ BETTER - Use a key management service
# AWS Secrets Manager, HashiCorp Vault, etc.
```

### 2. Input Validation

```python
from eth_utils import is_address

def validate_ethereum_address(address: str):
    """Validate Ethereum address format"""
    if not is_address(address):
        raise ValueError("Invalid Ethereum address")
    return address.lower()
```

### 3. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/wallet/create")
@limiter.limit("5/minute")  # Max 5 wallets per minute per IP
async def create_wallet(request: Request, data: WalletCreate):
    # ... implementation
```

### 4. Gas Price Monitoring

```python
def get_safe_gas_price(w3):
    """Get gas price with safety cap"""
    current_gas_price = w3.eth.gas_price
    max_gas_price = w3.to_wei(100, 'gwei')  # Cap at 100 gwei

    return min(current_gas_price, max_gas_price)
```

---

## Error Handling

```python
# errors.py
class BlockchainError(Exception):
    """Base exception for blockchain errors"""
    pass

class InsufficientFundsError(BlockchainError):
    """Not enough ETH for transaction"""
    pass

class TransactionFailedError(BlockchainError):
    """Transaction reverted or failed"""
    pass

# Usage in API
try:
    result = wallet_contract.create_wallet(address)
except InsufficientFundsError:
    raise HTTPException(status_code=402, detail="Insufficient funds for gas")
except TransactionFailedError:
    raise HTTPException(status_code=500, detail="Transaction failed")
```

---

## Testing

### Unit Tests

```python
# tests/test_wallet_contract.py
import pytest
from blockchain.contracts.wallet import wallet_contract

def test_create_wallet():
    """Test wallet creation"""
    test_address = "0x1234567890123456789012345678901234567890"

    result = wallet_contract.create_wallet(test_address)

    assert result['success'] == True
    assert wallet_contract.has_wallet(test_address) == True

def test_get_balance():
    """Test balance retrieval"""
    test_address = "0x1234567890123456789012345678901234567890"

    balance = wallet_contract.get_eth_balance(test_address)

    assert isinstance(balance, float)
    assert balance >= 0
```

### Integration Tests

```python
# tests/test_integration.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_flow():
    """Test complete commission flow"""

    # 1. Create wallet
    response = client.post("/api/wallet/create", json={
        "user_address": "0x1234567890123456789012345678901234567890"
    })
    assert response.status_code == 200

    # 2. Register affiliate
    response = client.post("/api/commission/register", json={
        "user_address": "0x1234567890123456789012345678901234567890"
    })
    assert response.status_code == 200

    # 3. Record commission
    response = client.post("/api/commission/record", json={
        "affiliate_address": "0x1234567890123456789012345678901234567890",
        "sale_amount": 100.0,
        "commission_rate": 1000,
        "transaction_id": "TEST-001"
    })
    assert response.status_code == 200
```

---

## Summary

✅ **Web3 Client** - Manages blockchain connections
✅ **Contract Wrappers** - Python interfaces to smart contracts
✅ **API Endpoints** - RESTful API for frontend
✅ **Security** - Best practices implemented
✅ **Error Handling** - Robust error management
✅ **Testing** - Unit and integration tests

**Next Steps:**
1. Deploy backend to production server
2. Configure environment variables
3. Test all endpoints on Sepolia
4. Monitor gas costs and optimize
5. Prepare for mainnet launch

For questions: yannkayilu@kimuntupower.com
