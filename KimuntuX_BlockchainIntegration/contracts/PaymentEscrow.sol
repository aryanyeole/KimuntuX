// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PaymentEscrow is Ownable, ReentrancyGuard, Pausable {
    uint256 public escrowFeeRate = 200;
    uint256 public autoReleaseTimeout = 7 days;
    uint256 public totalEscrowValue;
    uint256 public totalEscrows;
    uint256 public totalEscrowsCompleted;

    struct Escrow {
        uint256 escrowId;
        address payable buyer;
        address payable seller;
        uint256 amount;
        uint256 escrowFee;
        uint256 createdAt;
        uint256 releaseTime;
        EscrowStatus status;
        string productId;
        string notes;
        address arbiter;
    }

    enum EscrowStatus {
        Active,
        Released,
        Refunded,
        Disputed,
        Cancelled
    }

    mapping(uint256 => Escrow) public escrows;
    mapping(address => uint256[]) public buyerEscrows;
    mapping(address => uint256[]) public sellerEscrows;
    mapping(address => bool) public authorizedArbiters;

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, string productId);
    event EscrowReleased(uint256 indexed escrowId, address indexed seller, uint256 amount, uint256 fee);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed escrowId, address indexed arbiter, EscrowStatus resolution);
    event EscrowCancelled(uint256 indexed escrowId, address indexed initiator);
    event ArbiterAuthorized(address indexed arbiter, bool authorized);

    modifier onlyBuyer(uint256 _escrowId) {
        require(escrows[_escrowId].buyer == msg.sender, "Only buyer can call this");
        _;
    }

    modifier onlyParty(uint256 _escrowId) {
        require(
            escrows[_escrowId].buyer == msg.sender || escrows[_escrowId].seller == msg.sender,
            "Only parties involved"
        );
        _;
    }

    modifier onlyArbiter(uint256 _escrowId) {
        require(
            authorizedArbiters[msg.sender] || escrows[_escrowId].arbiter == msg.sender || msg.sender == owner(),
            "Not authorized arbiter"
        );
        _;
    }

    modifier escrowActive(uint256 _escrowId) {
        require(escrows[_escrowId].status == EscrowStatus.Active, "Escrow not active");
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedArbiters[msg.sender] = true;
    }

    function createEscrow(
        address payable _seller,
        string memory _productId,
        string memory _notes,
        address _arbiter
    ) external payable whenNotPaused returns (uint256) {
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Cannot escrow to yourself");
        require(msg.value > 0, "Must send ETH");
        require(bytes(_productId).length > 0, "Product ID required");

        uint256 fee = (msg.value * escrowFeeRate) / 10000;
        uint256 amount = msg.value - fee;

        totalEscrows++;
        uint256 escrowId = totalEscrows;

        escrows[escrowId] = Escrow({
            escrowId: escrowId,
            buyer: payable(msg.sender),
            seller: _seller,
            amount: amount,
            escrowFee: fee,
            createdAt: block.timestamp,
            releaseTime: block.timestamp + autoReleaseTimeout,
            status: EscrowStatus.Active,
            productId: _productId,
            notes: _notes,
            arbiter: _arbiter
        });

        buyerEscrows[msg.sender].push(escrowId);
        sellerEscrows[_seller].push(escrowId);
        totalEscrowValue += amount;

        emit EscrowCreated(escrowId, msg.sender, _seller, amount, _productId);
        return escrowId;
    }

    function releaseEscrow(uint256 _escrowId) external onlyBuyer(_escrowId) escrowActive(_escrowId) nonReentrant whenNotPaused {
        _releaseEscrowInternal(_escrowId);
    }

    function autoReleaseEscrow(uint256 _escrowId) external escrowActive(_escrowId) nonReentrant whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(block.timestamp >= escrow.releaseTime, "Release time not reached");
        require(
            msg.sender == escrow.seller || msg.sender == escrow.buyer || msg.sender == owner(),
            "Not authorized"
        );
        _releaseEscrowInternal(_escrowId);
    }

    function _releaseEscrowInternal(uint256 _escrowId) private {
        Escrow storage escrow = escrows[_escrowId];
        uint256 amount = escrow.amount;
        address payable seller = escrow.seller;
        escrow.status = EscrowStatus.Released;
        totalEscrowValue -= amount;
        totalEscrowsCompleted++;
        (bool success, ) = seller.call{value: amount}("");
        require(success, "Transfer to seller failed");
        emit EscrowReleased(_escrowId, seller, amount, escrow.escrowFee);
    }

    function refundEscrow(uint256 _escrowId) external escrowActive(_escrowId) nonReentrant whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(
            msg.sender == escrow.seller || msg.sender == escrow.arbiter || authorizedArbiters[msg.sender] || msg.sender == owner(),
            "Not authorized to refund"
        );

        uint256 amount = escrow.amount;
        uint256 fee = escrow.escrowFee;
        address payable buyer = escrow.buyer;
        escrow.status = EscrowStatus.Refunded;
        totalEscrowValue -= amount;
        (bool success, ) = buyer.call{value: amount + fee}("");
        require(success, "Refund transfer failed");
        emit EscrowRefunded(_escrowId, buyer, amount + fee);
    }

    function raiseDispute(uint256 _escrowId, string memory _reason) external onlyParty(_escrowId) escrowActive(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        escrow.status = EscrowStatus.Disputed;
        emit EscrowDisputed(_escrowId, msg.sender, _reason);
    }

    function resolveDispute(uint256 _escrowId, bool _releaseToSeller) external onlyArbiter(_escrowId) nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Not in dispute");

        if (_releaseToSeller) {
            escrow.status = EscrowStatus.Active;
            _releaseEscrowInternal(_escrowId);
        } else {
            uint256 amount = escrow.amount;
            uint256 fee = escrow.escrowFee;
            address payable buyer = escrow.buyer;
            escrow.status = EscrowStatus.Refunded;
            totalEscrowValue -= amount;
            (bool success, ) = buyer.call{value: amount + fee}("");
            require(success, "Refund transfer failed");
            emit EscrowRefunded(_escrowId, buyer, amount + fee);
        }

        emit DisputeResolved(_escrowId, msg.sender, escrow.status);
    }

    function cancelEscrow(uint256 _escrowId) external escrowActive(_escrowId) nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        if (msg.sender == escrow.buyer) {
            require(block.timestamp < escrow.createdAt + 1 hours, "Cancellation period expired");
        } else {
            require(msg.sender == escrow.seller || msg.sender == owner(), "Not authorized to cancel");
        }

        uint256 amount = escrow.amount;
        uint256 fee = escrow.escrowFee;
        address payable buyer = escrow.buyer;
        escrow.status = EscrowStatus.Cancelled;
        totalEscrowValue -= amount;
        (bool success, ) = buyer.call{value: amount + fee}("");
        require(success, "Cancellation refund failed");
        emit EscrowCancelled(_escrowId, msg.sender);
    }

    function setEscrowFeeRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 500, "Fee too high (max 5%)");
        escrowFeeRate = _newRate;
    }

    function setAutoReleaseTimeout(uint256 _newTimeout) external onlyOwner {
        require(_newTimeout >= 1 days, "Timeout too short");
        require(_newTimeout <= 30 days, "Timeout too long");
        autoReleaseTimeout = _newTimeout;
    }

    function setArbiterAuthorization(address _arbiter, bool _authorized) external onlyOwner {
        authorizedArbiters[_arbiter] = _authorized;
        emit ArbiterAuthorized(_arbiter, _authorized);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        uint256 lockedFunds = totalEscrowValue;
        uint256 availableFees = balance - lockedFunds;
        require(availableFees > 0, "No fees to withdraw");
        (bool success, ) = payable(owner()).call{value: availableFees}("");
        require(success, "Fee withdrawal failed");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getEscrow(uint256 _escrowId) external view returns (
        uint256 escrowId,
        address buyer,
        address seller,
        uint256 amount,
        uint256 escrowFee,
        uint256 createdAt,
        uint256 releaseTime,
        EscrowStatus status,
        string memory productId,
        string memory notes,
        address arbiter
    ) {
        Escrow memory e = escrows[_escrowId];
        return (
            e.escrowId,
            e.buyer,
            e.seller,
            e.amount,
            e.escrowFee,
            e.createdAt,
            e.releaseTime,
            e.status,
            e.productId,
            e.notes,
            e.arbiter
        );
    }

    function getBuyerEscrows(address _buyer) external view returns (uint256[] memory) {
        return buyerEscrows[_buyer];
    }

    function getSellerEscrows(address _seller) external view returns (uint256[] memory) {
        return sellerEscrows[_seller];
    }

    function isAuthorizedArbiter(address _address) external view returns (bool) {
        return authorizedArbiters[_address];
    }

    function getContractStats() external view returns (
        uint256 balance,
        uint256 lockedValue,
        uint256 totalCreated,
        uint256 totalCompleted,
        uint256 feeRate
    ) {
        return (address(this).balance, totalEscrowValue, totalEscrows, totalEscrowsCompleted, escrowFeeRate);
    }

    receive() external payable {}
}
