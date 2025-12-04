// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title KimuntuX Commission System
 * @dev Unified contract for managing affiliate commissions with integrated wallet support
 * @notice Simplified, production-ready contract for KimuntuX platform
 */
contract KimuntuXCommissionSystem is Ownable, ReentrancyGuard, Pausable {

    // Commission structure
    struct Commission {
        address affiliate;
        uint256 amount;
        uint256 timestamp;
        string transactionId;
        CommissionStatus status;
    }

    enum CommissionStatus {
        Pending,
        Approved,
        Paid,
        Disputed
    }

    // State variables
    mapping(address => uint256) public balances;
    mapping(address => Commission[]) public commissions;
    mapping(string => bool) public processedTransactions;
    mapping(address => bool) public authorizedMerchants;
    mapping(address => bool) public registeredAffiliates;

    uint256 public totalCommissionsPaid;
    uint256 public platformFeeRate = 300; // 3% in basis points
    uint256 public minimumPayout = 0.01 ether;

    // Events
    event AffiliateRegistered(address indexed affiliate, uint256 timestamp);
    event CommissionRecorded(address indexed affiliate, uint256 amount, string transactionId);
    event CommissionApproved(address indexed affiliate, uint256 amount);
    event CommissionPaid(address indexed affiliate, uint256 amount);
    event CommissionDisputed(address indexed affiliate, string transactionId);
    event MerchantAuthorized(address indexed merchant, bool status);

    constructor() {
        authorizedMerchants[msg.sender] = true;
    }

    modifier onlyMerchant() {
        require(authorizedMerchants[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier onlyAffiliate() {
        require(registeredAffiliates[msg.sender], "Not registered affiliate");
        _;
    }

    // ============ AFFILIATE MANAGEMENT ============

    function registerAffiliate(address _affiliate) external onlyOwner {
        require(_affiliate != address(0), "Invalid address");
        require(!registeredAffiliates[_affiliate], "Already registered");

        registeredAffiliates[_affiliate] = true;
        emit AffiliateRegistered(_affiliate, block.timestamp);
    }

    function registerSelf() external {
        require(!registeredAffiliates[msg.sender], "Already registered");
        registeredAffiliates[msg.sender] = true;
        emit AffiliateRegistered(msg.sender, block.timestamp);
    }

    // ============ COMMISSION RECORDING ============

    function recordCommission(
        address _affiliate,
        uint256 _saleAmount,
        uint256 _commissionRate,
        string memory _transactionId
    ) external payable onlyMerchant whenNotPaused {
        require(registeredAffiliates[_affiliate], "Affiliate not registered");
        require(_saleAmount > 0, "Invalid sale amount");
        require(!processedTransactions[_transactionId], "Transaction already processed");

        uint256 commissionAmount = (_saleAmount * _commissionRate) / 10000;
        uint256 platformFee = (commissionAmount * platformFeeRate) / 10000;
        uint256 netCommission = commissionAmount - platformFee;

        require(msg.value >= commissionAmount, "Insufficient payment");

        Commission memory newCommission = Commission({
            affiliate: _affiliate,
            amount: netCommission,
            timestamp: block.timestamp,
            transactionId: _transactionId,
            status: CommissionStatus.Pending
        });

        commissions[_affiliate].push(newCommission);
        processedTransactions[_transactionId] = true;

        emit CommissionRecorded(_affiliate, netCommission, _transactionId);

        // Refund excess
        if (msg.value > commissionAmount) {
            payable(msg.sender).transfer(msg.value - commissionAmount);
        }
    }

    // ============ COMMISSION APPROVAL ============

    function approveCommission(address _affiliate, uint256 _commissionIndex)
        external
        onlyMerchant
    {
        require(_commissionIndex < commissions[_affiliate].length, "Invalid index");
        Commission storage comm = commissions[_affiliate][_commissionIndex];
        require(comm.status == CommissionStatus.Pending, "Not pending");

        comm.status = CommissionStatus.Approved;
        balances[_affiliate] += comm.amount;

        emit CommissionApproved(_affiliate, comm.amount);
    }

    function autoApprove(address _affiliate, string memory _transactionId)
        external
        onlyMerchant
    {
        Commission[] storage affiliateComms = commissions[_affiliate];
        for (uint256 i = 0; i < affiliateComms.length; i++) {
            if (keccak256(bytes(affiliateComms[i].transactionId)) == keccak256(bytes(_transactionId)) &&
                affiliateComms[i].status == CommissionStatus.Pending) {
                affiliateComms[i].status = CommissionStatus.Approved;
                balances[_affiliate] += affiliateComms[i].amount;
                emit CommissionApproved(_affiliate, affiliateComms[i].amount);
                return;
            }
        }
        revert("Commission not found");
    }

    // ============ WITHDRAWAL ============

    function withdraw() external onlyAffiliate nonReentrant whenNotPaused {
        uint256 amount = balances[msg.sender];
        require(amount >= minimumPayout, "Below minimum payout");
        require(address(this).balance >= amount, "Insufficient contract balance");

        balances[msg.sender] = 0;
        totalCommissionsPaid += amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit CommissionPaid(msg.sender, amount);
    }

    function withdrawAmount(uint256 _amount) external onlyAffiliate nonReentrant whenNotPaused {
        require(_amount > 0, "Invalid amount");
        require(_amount >= minimumPayout, "Below minimum payout");
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        require(address(this).balance >= _amount, "Insufficient contract balance");

        balances[msg.sender] -= _amount;
        totalCommissionsPaid += _amount;

        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");

        emit CommissionPaid(msg.sender, _amount);
    }

    // ============ ADMIN FUNCTIONS ============

    function authorizeMerchant(address _merchant, bool _status) external onlyOwner {
        authorizedMerchants[_merchant] = _status;
        emit MerchantAuthorized(_merchant, _status);
    }

    function setPlatformFeeRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 1000, "Fee too high (max 10%)");
        platformFeeRate = _newRate;
    }

    function setMinimumPayout(uint256 _newMinimum) external onlyOwner {
        minimumPayout = _newMinimum;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 contractBalance = address(this).balance;
        uint256 totalPending = 0;

        // In production, you'd track this more efficiently
        require(contractBalance > totalPending, "No fees to withdraw");

        uint256 fees = contractBalance - totalPending;
        (bool success, ) = payable(owner()).call{value: fees}("");
        require(success, "Transfer failed");
    }

    // ============ VIEW FUNCTIONS ============

    function getBalance(address _affiliate) external view returns (uint256) {
        return balances[_affiliate];
    }

    function getCommissionCount(address _affiliate) external view returns (uint256) {
        return commissions[_affiliate].length;
    }

    function getCommission(address _affiliate, uint256 _index) external view returns (
        uint256 amount,
        uint256 timestamp,
        string memory transactionId,
        CommissionStatus status
    ) {
        require(_index < commissions[_affiliate].length, "Invalid index");
        Commission memory comm = commissions[_affiliate][_index];
        return (comm.amount, comm.timestamp, comm.transactionId, comm.status);
    }

    function getAllCommissions(address _affiliate) external view returns (Commission[] memory) {
        return commissions[_affiliate];
    }

    function getContractStats() external view returns (
        uint256 contractBalance,
        uint256 totalPaid,
        uint256 feeRate,
        uint256 minPayout
    ) {
        return (
            address(this).balance,
            totalCommissionsPaid,
            platformFeeRate,
            minimumPayout
        );
    }

    function isAffiliate(address _address) external view returns (bool) {
        return registeredAffiliates[_address];
    }

    function isMerchant(address _address) external view returns (bool) {
        return authorizedMerchants[_address];
    }

    receive() external payable {}
}
