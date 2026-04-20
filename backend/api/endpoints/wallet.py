"""
api/endpoints/wallet.py
────────────────────────
FastAPI router for KimuntuXWallet interactions.

Endpoints
---------
GET  /wallets/{owner}/status
GET  /wallets/{owner}/details
GET  /wallets/{owner}/balances
GET  /wallets/{owner}/eth-balance
GET  /wallets/stats/total
GET  /wallets/tokens/supported

POST /wallets/create
POST /wallets/create-for
POST /wallets/deposit-eth
POST /wallets/credit-eth
POST /wallets/withdraw-eth
POST /wallets/withdraw-all-eth
POST /wallets/transfer-eth
POST /wallets/tokens/add
POST /wallets/tokens/{token}/remove
POST /wallets/platforms/authorize
POST /wallets/platforms/{platform}/revoke
POST /wallets/minimum-withdrawal
POST /wallets/pause
POST /wallets/unpause
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from api.models import (
    AddTokenRequest,
    CreateWalletForRequest,
    CreditETHRequest,
    DepositETHRequest,
    LegacyCreateWalletRequest,
    SupportedTokensResponse,
    TransferETHRequest,
    TxResponse,
    UpdateMinimumWithdrawalRequest,
    WalletBalancesResponse,
    WalletDetailsResponse,
    WalletExistsResponse,
    WalletSummaryResponse,
    WalletStatusResponse,
    RegisterAffiliateRequest,
)
from blockchain.contracts.wallet import WalletContract
from blockchain.exceptions import (
    BlockchainError,
    ContractCallError,
    GasError,
    InsufficientFundsError,
    TransactionRevertedError,
    TransactionTimeoutError,
)
from blockchain.web3_client import get_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/wallets", tags=["Wallet"])


def _wallet_contract() -> WalletContract:
    return WalletContract(get_client())


def _map_blockchain_error(exc: BlockchainError) -> HTTPException:
    if isinstance(exc, (TransactionRevertedError, ContractCallError)):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if isinstance(exc, (InsufficientFundsError, GasError)):
        return HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(exc))
    if isinstance(exc, TransactionTimeoutError):
        return HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))


# ─────────────────────────────────────────────────────────────────────────────
# Read endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{owner}/status", response_model=WalletStatusResponse)
def get_wallet_status(owner: str):
    """Check whether *owner* has a wallet in the contract."""
    try:
        exists = _wallet_contract().has_wallet(owner)
        return WalletStatusResponse(address=owner, has_wallet=exists)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/status/{owner}", response_model=WalletExistsResponse)
def get_wallet_status_compat(owner: str):
    """Compatibility route for the current frontend service."""
    status = get_wallet_status(owner)
    return WalletExistsResponse(exists=status.has_wallet)


@router.get("/{owner}/details", response_model=WalletDetailsResponse)
def get_wallet_details(owner: str):
    """Return full wallet metadata for *owner*."""
    try:
        d = _wallet_contract().get_wallet_details(owner)
        return WalletDetailsResponse(
            owner=d.owner,
            eth_balance=d.eth_balance,
            created_at=d.created_at,
            total_deposits=d.total_deposits,
            total_withdrawals=d.total_withdrawals,
        )
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/details/{owner}", response_model=WalletSummaryResponse)
def get_wallet_details_compat(owner: str):
    """Compatibility route for the current frontend service."""
    details = get_wallet_details(owner)
    return WalletSummaryResponse(
        owner=details.owner,
        is_active=True,
        created_at=details.created_at,
        eth_balance=details.eth_balance,
        total_deposits=details.total_deposits,
        total_withdrawals=details.total_withdrawals,
    )


@router.get("/{owner}/balances", response_model=WalletBalancesResponse)
def get_all_balances(owner: str):
    """Return ETH and all token balances for *owner*."""
    try:
        b = _wallet_contract().get_all_balances(owner)
        return WalletBalancesResponse(
            eth_balance=b.eth_balance,
            token_balances=b.token_balances,
        )
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/balances/{owner}", response_model=WalletBalancesResponse)
def get_all_balances_compat(owner: str):
    """Compatibility route for the current frontend service."""
    return get_all_balances(owner)


@router.get("/{owner}/eth-balance")
def get_eth_balance(owner: str):
    """Return only the ETH balance (in ETH) for *owner*'s wallet."""
    try:
        balance = _wallet_contract().get_eth_balance(owner)
        return {"owner": owner, "eth_balance": balance}
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/stats/total")
def get_total_wallets():
    """Return the total number of wallets created in the contract."""
    try:
        total = _wallet_contract().get_total_wallets()
        return {"total_wallets": total}
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.get("/tokens/supported", response_model=SupportedTokensResponse)
def get_supported_tokens():
    """Return the list of supported ERC-20 token addresses."""
    try:
        tokens = _wallet_contract().get_supported_tokens()
        return SupportedTokensResponse(supported_tokens=tokens)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.get("/tokens", response_model=SupportedTokensResponse)
def get_supported_tokens_compat():
    """Compatibility route for the current frontend service."""
    return get_supported_tokens()


# ─────────────────────────────────────────────────────────────────────────────
# Write endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/create", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def create_wallet(body: LegacyCreateWalletRequest | None = None):
    """
    Create a wallet.

    With no body, creates a wallet for the platform account.
    With ``user_address`` in the request body, behaves like ``/create-for``.
    """
    try:
        contract = _wallet_contract()
        tx_hash = (
            contract.create_wallet_for(body.user_address)
            if body is not None
            else contract.create_wallet()
        )
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/create-for",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def create_wallet_for(body: CreateWalletForRequest):
    """Create a wallet for *user* (platform must be an authorised platform)."""
    try:
        tx_hash = _wallet_contract().create_wallet_for(body.user)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/deposit-eth",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def deposit_eth(body: DepositETHRequest):
    """Deposit ETH into the platform wallet's wallet in the contract."""
    try:
        tx_hash = _wallet_contract().deposit_eth(body.amount_eth)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post(
    "/credit-eth",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def credit_eth(body: CreditETHRequest):
    """Credit ETH directly to a user's wallet (authorised platform only)."""
    try:
        tx_hash = _wallet_contract().credit_eth(body.user, body.amount_eth)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/withdraw-eth",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def withdraw_eth(body: DepositETHRequest):
    """Withdraw a specific ETH amount from the platform wallet's wallet."""
    try:
        tx_hash = _wallet_contract().withdraw_eth(body.amount_eth)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post(
    "/withdraw-all-eth",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def withdraw_all_eth():
    """Withdraw the entire ETH balance from the platform wallet's wallet."""
    try:
        tx_hash = _wallet_contract().withdraw_all_eth()
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post(
    "/transfer-eth",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def transfer_eth(body: TransferETHRequest):
    """Transfer ETH between two wallets within the contract."""
    try:
        tx_hash = _wallet_contract().transfer_eth(body.recipient, body.amount_eth)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/tokens/add",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def add_token(body: AddTokenRequest):
    """Add a supported ERC-20 token (owner only)."""
    try:
        tx_hash = _wallet_contract().add_supported_token(body.token, body.symbol)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/tokens/{token}/remove",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def remove_token(token: str):
    """Remove a supported ERC-20 token (owner only)."""
    try:
        tx_hash = _wallet_contract().remove_supported_token(token)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/platforms/authorize",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def authorize_platform(body: RegisterAffiliateRequest):
    """Authorise a platform address to credit wallets (owner only)."""
    try:
        tx_hash = _wallet_contract().authorize_platform(body.affiliate)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/platforms/{platform}/revoke",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def revoke_platform(platform: str):
    """Revoke a platform's wallet-crediting authorisation (owner only)."""
    try:
        tx_hash = _wallet_contract().revoke_platform(platform)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/minimum-withdrawal",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def update_minimum_withdrawal(body: UpdateMinimumWithdrawalRequest):
    """Update the minimum withdrawal threshold in ETH (owner only)."""
    try:
        tx_hash = _wallet_contract().update_minimum_withdrawal(body.amount_eth)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post("/pause", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def pause():
    """Pause the wallet contract (owner only)."""
    try:
        tx_hash = _wallet_contract().pause()
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post("/unpause", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def unpause():
    """Unpause the wallet contract (owner only)."""
    try:
        tx_hash = _wallet_contract().unpause()
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
