// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PaymentEscrow
 * @dev Escrow contract for KimuntuX marketplace transactions
 * @notice Holds funds in escrow until transaction completion or dispute resolution
 */
contract PaymentEscrow is Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    /// @notice Escrow fee in basis points (100 = 1%)
    uint256 public escrowFeeRate = 200; // 2%
    
    /// @notice Timeout period for automatic release (in seconds)
    uint256 public autoReleaseTimeout = 7 days;
    
    /// @notice Total value in escrow
    uint256 public totalEscrowValue;
    
    /// @notice Total escrows created
    uint256 public totalEscrows;
    
    /// @notice Total escrows completed
    uint256 public totalEscrowsCompleted;
    
    // ============ Structs ============
    
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
        address arbiter;  // Third party for dispute resolution
    }
    
    enum EscrowStatus {
        Active,
        Released,
        Refunded,
        Disputed,
        Cancelled
    }
    
    // ============ Mappings ============
    
    /// @notice Mapping from escrow ID to Escrow struct
    mapping(uint256 => Escrow) public escrows;
    
    /// @notice Mapping from buyer address to their escrow IDs
    mapping(address => uint256[]) public buyerEscrows;
    
    /// @notice Mapping from seller address to their escrow IDs
    mapping(address => uint256[]) public sellerEscrows;
    
    /// @notice Authorized arbiters for dispute resolution
    mapping(address => bool) public authorizedArbiters;
    
    // ============ Events ============
    
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        string productId
    );
    
    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed seller,
        uint256 amount,
        uint256 fee
    );
    
    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );
    
    event EscrowDisputed(
        uint256 indexed escrowId,
        address indexed initiator,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed arbiter,
        EscrowStatus resolution
    );
    
    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed initiator
    );
    
    event ArbiterAuthorized(
        address indexed arbiter,
        bool authorized
    );
    
    // ============ Modifiers ============
    
    modifier onlyBuyer(uint256 _escrowId) {
        require(
            escrows[_escrowId].buyer == msg.sender,
            "Only buyer can call this"
        );
        _;
    }
    
    modifier onlySeller(uint256 _escrowId) {
        require(
            escrows[_escrowId].seller == msg.sender,
            "Only seller can call this"
        );
        _;
    }
    
    modifier onlyParty(uint256 _escrowId) {
        require(
            escrows[_escrowId].buyer == msg.sender ||
            escrows[_escrowId].seller == msg.sender,
            "Only parties involved"
        );
        _;
    }
    
    modifier onlyArbiter(uint256 _escrowId) {
        require(
            authorizedArbiters[msg.sender] ||
            escrows[_escrowId].arbiter == msg.sender ||
            msg.sender == owner(),
            "Not authorized arbiter"
        );
        _;
    }
    
    modifier escrowActive(uint256 _escrowId) {
        require(
            escrows[_escrowId].status == EscrowStatus.Active,
            "Escrow not active"
        );
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        // Owner is automatically authorized arbiter
        authorizedArbiters[msg.sender] = true;
    }
    
    // ============ Escrow Creation ============
    
    /**
     * @notice Create a new escrow
     * @param _seller Seller address
     * @param _productId Product identifier
     * @param _notes Additional notes
     * @param _arbiter Optional arbiter address
     */
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
        
        // Calculate escrow fee
        uint256 fee = (msg.value * escrowFeeRate) / 10000;
        uint256 amount = msg.value - fee;
        
        // Create escrow
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
        
        // Track escrows
        buyerEscrows[msg.sender].push(escrowId);
        sellerEscrows[_seller].push(escrowId);
        totalEscrowValue += amount;
        
        emit EscrowCreated(escrowId, msg.sender, _seller, amount, _productId);
        
        return escrowId;
    }
    
    // ============ Escrow Release ============
    
    /**
     * @notice Release escrow to seller (by buyer)
     * @param _escrowId Escrow ID to release
     */
    function releaseEscrow(uint256 _escrowId) 
        external 
        onlyBuyer(_escrowId)
        escrowActive(_escrowId)
        nonReentrant
        whenNotPaused
    {
        _releaseEscrowInternal(_escrowId);
    }
    
    /**
     * @notice Auto-release escrow after timeout period
     * @param _escrowId Escrow ID to release
     */
    function autoReleaseEscrow(uint256 _escrowId)
        external
        escrowActive(_escrowId)
        nonReentrant
        whenNotPaused
    {
        Escrow storage escrow = escrows[_escrowId];
        require(
            block.timestamp >= escrow.releaseTime,
            "Release time not reached"
        );
        require(
            msg.sender == escrow.seller || 
            msg.sender == escrow.buyer ||
            msg.sender == owner(),
            "Not authorized"
        );
        
        _releaseEscrowInternal(_escrowId);
    }
    
    /**
     * @dev Internal function to release escrow
     */
    function _releaseEscrowInternal(uint256 _escrowId) private {
        Escrow storage escrow = escrows[_escrowId];
        
        uint256 amount = escrow.amount;
        address payable seller = escrow.seller;
        
        // Update state
        escrow.status = EscrowStatus.Released;
        totalEscrowValue -= amount;
        totalEscrowsCompleted++;
        
        // Transfer funds to seller
        (bool success, ) = seller.call{value: amount}("");
        require(success, "Transfer to seller failed");
        
        emit EscrowReleased(_escrowId, seller, amount, escrow.escrowFee);
    }
    
    // ============ Escrow Refund ============
    
    /**
     * @notice Refund escrow to buyer (by seller or arbiter)
     * @param _escrowId Escrow ID to refund
     */
    function refundEscrow(uint256 _escrowId)
        external
        escrowActive(_escrowId)
        nonReentrant
        whenNotPaused
    {
        Escrow storage escrow = escrows[_escrowId];
        require(
            msg.sender == escrow.seller ||
            msg.sender == escrow.arbiter ||
            authorizedArbiters[msg.sender] ||
            msg.sender == owner(),
            "Not authorized to refund"
        );
        
        uint256 amount = escrow.amount;
        uint256 fee = escrow.escrowFee;
        address payable buyer = escrow.buyer;
        
        // Update state
        escrow.status = EscrowStatus.Refunded;
        totalEscrowValue -= amount;
        
        // Refund full amount including fee to buyer
        (bool success, ) = buyer.call{value: amount + fee}("");
        require(success, "Refund transfer failed");
        
        emit EscrowRefunded(_escrowId, buyer, amount + fee);
    }
    
    // ============ Dispute Management ============
    
    /**
     * @notice Raise a dispute
     * @param _escrowId Escrow ID in dispute
     * @param _reason Reason for dispute
     */
    function raiseDispute(uint256 _escrowId, string memory _reason)
        external
        onlyParty(_escrowId)
        escrowActive(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        escrow.status = EscrowStatus.Disputed;
        
        emit EscrowDisputed(_escrowId, msg.sender, _reason);
    }
    
    /**
     * @notice Resolve a dispute
     * @param _escrowId Escrow ID to resolve
     * @param _releaseToSeller True to release to seller, false to refund buyer
     */
    function resolveDispute(uint256 _escrowId, bool _releaseToSeller)
        external
        onlyArbiter(_escrowId)
        nonReentrant
    {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.Disputed,
            "Not in dispute"
        );
        
        if (_releaseToSeller) {
            // Revert to active and release
            escrow.status = EscrowStatus.Active;
            _releaseEscrowInternal(_escrowId);
        } else {
            // Refund to buyer
            uint256 amount = escrow.amount;
            uint256 fee = escrow.escrowFee;
            address payable buyer = escrow.buyer;
            
            escrow.status = EscrowStatus.Refunded;
            totalEscrowValue -= amount;
            
            (bool success, ) = buyer.call{value: amount + fee}("");
            require(success, "Refund transfer failed");
            
            emit EscrowRefunded(_escrowId, buyer, amount + fee);
        }
        
        emit DisputeResolved(
            _escrowId,
            msg.sender,
            escrow.status
        );
    }
    
    // ============ Cancellation ============
    
    /**
     * @notice Cancel escrow (only before seller confirms/delivers)
     * @param _escrowId Escrow ID to cancel
     */
    function cancelEscrow(uint256 _escrowId)
        external
        escrowActive(_escrowId)
        nonReentrant
    {
        Escrow storage escrow = escrows[_escrowId];
        
        // Only buyer can cancel within first hour, or both parties can agree
        if (msg.sender == escrow.buyer) {
            require(
                block.timestamp < escrow.createdAt + 1 hours,
                "Cancellation period expired"
            );
        } else {
            require(
                msg.sender == escrow.seller ||
                msg.sender == owner(),
                "Not authorized to cancel"
            );
        }
        
        uint256 amount = escrow.amount;
        uint256 fee = escrow.escrowFee;
        address payable buyer = escrow.buyer;
        
        // Update state
        escrow.status = EscrowStatus.Cancelled;
        totalEscrowValue -= amount;
        
        // Refund to buyer
        (bool success, ) = buyer.call{value: amount + fee}("");
        require(success, "Cancellation refund failed");
        
        emit EscrowCancelled(_escrowId, msg.sender);
    }
    
    // ============ Administrative Functions ============
    
    /**
     * @notice Set escrow fee rate
     * @param _newRate New rate in basis points
     */
    function setEscrowFeeRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 500, "Fee too high (max 5%)");
        escrowFeeRate = _newRate;
    }
    
    /**
     * @notice Set auto-release timeout
     * @param _newTimeout New timeout in seconds
     */
    function setAutoReleaseTimeout(uint256 _newTimeout) external onlyOwner {
        require(_newTimeout >= 1 days, "Timeout too short");
        require(_newTimeout <= 30 days, "Timeout too long");
        autoReleaseTimeout = _newTimeout;
    }
    
    /**
     * @notice Authorize an arbiter
     * @param _arbiter Arbiter address
     * @param _authorized Authorization status
     */
    function setArbiterAuthorization(address _arbiter, bool _authorized)
        external
        onlyOwner
    {
        authorizedArbiters[_arbiter] = _authorized;
        emit ArbiterAuthorized(_arbiter, _authorized);
    }
    
    /**
     * @notice Withdraw collected fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        uint256 lockedFunds = totalEscrowValue;
        uint256 availableFees = balance - lockedFunds;
        
        require(availableFees > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: availableFees}("");
        require(success, "Fee withdrawal failed");
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get escrow details
     * @param _escrowId Escrow ID
     */
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
    
    /**
     * @notice Get buyer's escrow IDs
     * @param _buyer Buyer address
     */
    function getBuyerEscrows(address _buyer) external view returns (uint256[] memory) {
        return buyerEscrows[_buyer];
    }
    
    /**
     * @notice Get seller's escrow IDs
     * @param _seller Seller address
     */
    function getSellerEscrows(address _seller) external view returns (uint256[] memory) {
        return sellerEscrows[_seller];
    }
    
    /**
     * @notice Check if address is authorized arbiter
     * @param _address Address to check
     */
    function isAuthorizedArbiter(address _address) external view returns (bool) {
        return authorizedArbiters[_address];
    }
    
    /**
     * @notice Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 balance,
        uint256 lockedValue,
        uint256 totalCreated,
        uint256 totalCompleted,
        uint256 feeRate
    ) {
        return (
            address(this).balance,
            totalEscrowValue,
            totalEscrows,
            totalEscrowsCompleted,
            escrowFeeRate
        );
    }
    
    // ============ Receive Function ============
    
    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}
