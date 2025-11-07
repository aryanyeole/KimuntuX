pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title KimuntuX Commission Tracker
 * @dev Smart contract for tracking and managing affiliate commissions on blockchain
 * @notice This contract provides transparent, immutable commission tracking for the KimuntuX platform
 */
contract KimuntuXCommissionTracker is Ownable, ReentrancyGuard, Pausable {
    
    // Commission structure
    struct Commission {
        address affiliate;
        uint256 amount;
        uint256 timestamp;
        string transactionId;
        string offerId;
        CommissionStatus status;
        string metadata; // JSON string for additional data
    }
    
    // Commission status enum
    enum CommissionStatus {
        Pending,
        Approved,
        Paid,
        Disputed,
        Cancelled
    }
    
    // State variables
    mapping(address => Commission[]) public affiliateCommissions;
    mapping(string => Commission) public transactionCommissions;
    mapping(address => uint256) public affiliateBalances;
    mapping(address => uint256) public totalEarned;
    mapping(address => bool) public authorizedPlatforms;
    
    uint256 public totalCommissionsTracked;
    uint256 public totalCommissionsPaid;
    uint256 public minimumPayoutThreshold;
    
    // Events
    event CommissionRecorded(
        address indexed affiliate,
        uint256 amount,
        string transactionId,
        string offerId,
        uint256 timestamp
    );
    
    event CommissionApproved(
        string indexed transactionId,
        address indexed affiliate,
        uint256 amount
    );
    
    event CommissionPaid(
        address indexed affiliate,
        uint256 amount,
        uint256 timestamp
    );
    
    event CommissionDisputed(
        string indexed transactionId,
        address indexed affiliate,
        string reason
    );
    
    event PayoutThresholdUpdated(uint256 newThreshold);
    
    event PlatformAuthorized(address indexed platform);
    event PlatformRevoked(address indexed platform);
    
    /**
     * @dev Constructor sets initial configuration
     * @param _minimumPayoutThreshold Minimum balance required for payout (in wei)
     */
    constructor(uint256 _minimumPayoutThreshold) {
        minimumPayoutThreshold = _minimumPayoutThreshold;
        authorizedPlatforms[msg.sender] = true;
    }
    
    /**
     * @dev Modifier to restrict functions to authorized platforms only
     */
    modifier onlyAuthorizedPlatform() {
        require(authorizedPlatforms[msg.sender], "Not authorized platform");
        _;
    }
    
    /**
     * @dev Record a new commission on the blockchain
     * @param _affiliate Address of the affiliate earning the commission
     * @param _amount Commission amount in wei
     * @param _transactionId Unique transaction identifier from off-chain system
     * @param _offerId Identifier of the offer/product
     * @param _metadata Additional metadata as JSON string
     */
    function recordCommission(
        address _affiliate,
        uint256 _amount,
        string memory _transactionId,
        string memory _offerId,
        string memory _metadata
    ) external onlyAuthorizedPlatform whenNotPaused {
        require(_affiliate != address(0), "Invalid affiliate address");
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_transactionId).length > 0, "Transaction ID required");
        require(
            transactionCommissions[_transactionId].timestamp == 0,
            "Transaction already recorded"
        );
        
        Commission memory newCommission = Commission({
            affiliate: _affiliate,
            amount: _amount,
            timestamp: block.timestamp,
            transactionId: _transactionId,
            offerId: _offerId,
            status: CommissionStatus.Pending,
            metadata: _metadata
        });
        
        affiliateCommissions[_affiliate].push(newCommission);
        transactionCommissions[_transactionId] = newCommission;
        totalCommissionsTracked += _amount;
        
        emit CommissionRecorded(
            _affiliate,
            _amount,
            _transactionId,
            _offerId,
            block.timestamp
        );
    }
    
    /**
     * @dev Approve a pending commission
     * @param _transactionId Transaction ID to approve
     */
    function approveCommission(string memory _transactionId)
        external
        onlyAuthorizedPlatform
    {
        Commission storage commission = transactionCommissions[_transactionId];
        require(commission.timestamp != 0, "Commission not found");
        require(
            commission.status == CommissionStatus.Pending,
            "Commission not pending"
        );
        
        commission.status = CommissionStatus.Approved;
        affiliateBalances[commission.affiliate] += commission.amount;
        totalEarned[commission.affiliate] += commission.amount;
        
        emit CommissionApproved(
            _transactionId,
            commission.affiliate,
            commission.amount
        );
    }
    
    /**
     * @dev Process payout to affiliate
     * @param _affiliate Address to receive payout
     */
    function processPayout(address payable _affiliate)
        external
        onlyAuthorizedPlatform
        nonReentrant
        whenNotPaused
    {
        uint256 balance = affiliateBalances[_affiliate];
        require(balance >= minimumPayoutThreshold, "Below minimum threshold");
        require(address(this).balance >= balance, "Insufficient contract balance");
        
        affiliateBalances[_affiliate] = 0;
        totalCommissionsPaid += balance;
        
        (bool success, ) = _affiliate.call{value: balance}("");
        require(success, "Payout failed");
        
        emit CommissionPaid(_affiliate, balance, block.timestamp);
    }
    
    /**
     * @dev Dispute a commission
     * @param _transactionId Transaction ID to dispute
     * @param _reason Reason for dispute
     */
    function disputeCommission(string memory _transactionId, string memory _reason)
        external
    {
        Commission storage commission = transactionCommissions[_transactionId];
        require(commission.timestamp != 0, "Commission not found");
        require(
            commission.affiliate == msg.sender || owner() == msg.sender,
            "Not authorized to dispute"
        );
        
        commission.status = CommissionStatus.Disputed;
        
        emit CommissionDisputed(_transactionId, commission.affiliate, _reason);
    }
    
    /**
     * @dev Get all commissions for an affiliate
     * @param _affiliate Affiliate address
     * @return Array of commissions
     */
    function getAffiliateCommissions(address _affiliate)
        external
        view
        returns (Commission[] memory)
    {
        return affiliateCommissions[_affiliate];
    }
    
    /**
     * @dev Get commission count for an affiliate
     * @param _affiliate Affiliate address
     * @return Number of commissions
     */
    function getCommissionCount(address _affiliate) external view returns (uint256) {
        return affiliateCommissions[_affiliate].length;
    }
    
    /**
     * @dev Get affiliate's current balance
     * @param _affiliate Affiliate address
     * @return Current balance in wei
     */
    function getAffiliateBalance(address _affiliate) external view returns (uint256) {
        return affiliateBalances[_affiliate];
    }
    
    /**
     * @dev Check if affiliate can request payout
     * @param _affiliate Affiliate address
     * @return Boolean indicating if payout is possible
     */
    function canRequestPayout(address _affiliate) external view returns (bool) {
        return affiliateBalances[_affiliate] >= minimumPayoutThreshold;
    }
    
    /**
     * @dev Authorize a platform to record commissions
     * @param _platform Platform address to authorize
     */
    function authorizePlatform(address _platform) external onlyOwner {
        require(_platform != address(0), "Invalid platform address");
        authorizedPlatforms[_platform] = true;
        emit PlatformAuthorized(_platform);
    }
    
    /**
     * @dev Revoke platform authorization
     * @param _platform Platform address to revoke
     */
    function revokePlatform(address _platform) external onlyOwner {
        authorizedPlatforms[_platform] = false;
        emit PlatformRevoked(_platform);
    }
    
    /**
     * @dev Update minimum payout threshold
     * @param _newThreshold New threshold in wei
     */
    function updatePayoutThreshold(uint256 _newThreshold) external onlyOwner {
        minimumPayoutThreshold = _newThreshold;
        emit PayoutThresholdUpdated(_newThreshold);
    }
    
    /**
     * @dev Fund the contract for payouts
     */
    function fundContract() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
    }
    
    /**
     * @dev Withdraw contract balance (emergency only)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance");
        payable(owner()).transfer(_amount);
    }
    
    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get contract statistics
     * @return totalTracked Total commissions tracked
     * @return totalPaid Total commissions paid out
     * @return contractBalance Current contract balance
     */
    function getContractStats()
        external
        view
        returns (
            uint256 totalTracked,
            uint256 totalPaid,
            uint256 contractBalance
        )
    {
        return (
            totalCommissionsTracked,
            totalCommissionsPaid,
            address(this).balance
        );
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
