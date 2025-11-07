// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title KimuntuX Wallet
 * @dev Smart contract wallet system for KimuntuX users to receive and manage crypto payouts
 * @notice This contract manages user crypto wallets with multi-currency support (ETH, USDT, USDC)
 */
contract KimuntuXWallet is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Wallet structure for each user
    struct Wallet {
        address owner;
        uint256 ethBalance;
        mapping(address => uint256) tokenBalances; // token address => balance
        bool exists;
        uint256 createdAt;
        uint256 totalDeposits;
        uint256 totalWithdrawals;
    }

    // Supported token addresses
    struct SupportedToken {
        address tokenAddress;
        string symbol;
        bool isActive;
    }

    // State variables
    mapping(address => Wallet) private wallets;
    mapping(address => bool) public walletExists;
    mapping(address => SupportedToken) public supportedTokens;
    mapping(address => bool) public authorizedPlatforms; // Can credit wallets
    
    address[] public allWalletAddresses;
    address[] public tokenAddressList;
    
    uint256 public totalWallets;
    uint256 public minimumWithdrawalAmount;
    
    // Events
    event WalletCreated(
        address indexed owner,
        uint256 timestamp
    );
    
    event ETHDeposit(
        address indexed wallet,
        uint256 amount,
        uint256 timestamp
    );
    
    event TokenDeposit(
        address indexed wallet,
        address indexed token,
        uint256 amount,
        string symbol,
        uint256 timestamp
    );
    
    event ETHWithdrawal(
        address indexed wallet,
        uint256 amount,
        uint256 timestamp
    );
    
    event TokenWithdrawal(
        address indexed wallet,
        address indexed token,
        uint256 amount,
        string symbol,
        uint256 timestamp
    );
    
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        address token,
        uint256 timestamp
    );
    
    event TokenAdded(
        address indexed token,
        string symbol
    );
    
    event TokenRemoved(
        address indexed token,
        string symbol
    );
    
    event PlatformAuthorized(address indexed platform);
    event PlatformRevoked(address indexed platform);
    
    event MinimumWithdrawalUpdated(uint256 newMinimum);

    /**
     * @dev Constructor initializes the wallet system
     * @param _minimumWithdrawalAmount Minimum amount for withdrawals (in wei)
     */
    constructor(uint256 _minimumWithdrawalAmount) {
        minimumWithdrawalAmount = _minimumWithdrawalAmount;
        authorizedPlatforms[msg.sender] = true;
    }

    /**
     * @dev Modifier to check if wallet exists
     */
    modifier walletMustExist(address _owner) {
        require(walletExists[_owner], "Wallet does not exist");
        _;
    }

    /**
     * @dev Modifier to restrict to wallet owner
     */
    modifier onlyWalletOwner(address _wallet) {
        require(msg.sender == _wallet, "Not wallet owner");
        _;
    }

    /**
     * @dev Modifier to restrict to authorized platforms
     */
    modifier onlyAuthorizedPlatform() {
        require(authorizedPlatforms[msg.sender], "Not authorized platform");
        _;
    }

    // ===========================================
    // WALLET MANAGEMENT FUNCTIONS
    // ===========================================

    /**
     * @dev Create a new wallet for the caller
     */
    function createWallet() external whenNotPaused {
        require(!walletExists[msg.sender], "Wallet already exists");
        
        Wallet storage newWallet = wallets[msg.sender];
        newWallet.owner = msg.sender;
        newWallet.exists = true;
        newWallet.createdAt = block.timestamp;
        newWallet.ethBalance = 0;
        newWallet.totalDeposits = 0;
        newWallet.totalWithdrawals = 0;
        
        walletExists[msg.sender] = true;
        allWalletAddresses.push(msg.sender);
        totalWallets++;
        
        emit WalletCreated(msg.sender, block.timestamp);
    }

    /**
     * @dev Create wallet for a user (called by authorized platform)
     * @param _user Address of the user
     */
    function createWalletFor(address _user) 
        external 
        onlyAuthorizedPlatform 
        whenNotPaused 
    {
        require(_user != address(0), "Invalid address");
        require(!walletExists[_user], "Wallet already exists");
        
        Wallet storage newWallet = wallets[_user];
        newWallet.owner = _user;
        newWallet.exists = true;
        newWallet.createdAt = block.timestamp;
        newWallet.ethBalance = 0;
        newWallet.totalDeposits = 0;
        newWallet.totalWithdrawals = 0;
        
        walletExists[_user] = true;
        allWalletAddresses.push(_user);
        totalWallets++;
        
        emit WalletCreated(_user, block.timestamp);
    }

    // ===========================================
    // DEPOSIT FUNCTIONS
    // ===========================================

    /**
     * @dev Deposit ETH into caller's wallet
     */
    function depositETH() 
        external 
        payable 
        walletMustExist(msg.sender) 
        whenNotPaused 
    {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        Wallet storage wallet = wallets[msg.sender];
        wallet.ethBalance += msg.value;
        wallet.totalDeposits += msg.value;
        
        emit ETHDeposit(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Credit ETH to user wallet (called by authorized platform)
     * @param _user User address
     * @param _amount Amount to credit
     */
    function creditETH(address _user, uint256 _amount) 
        external 
        payable
        onlyAuthorizedPlatform 
        walletMustExist(_user) 
        whenNotPaused 
    {
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value == _amount, "Sent value must match amount");
        
        Wallet storage wallet = wallets[_user];
        wallet.ethBalance += _amount;
        wallet.totalDeposits += _amount;
        
        emit ETHDeposit(_user, _amount, block.timestamp);
    }

    /**
     * @dev Deposit ERC-20 tokens into caller's wallet
     * @param _token Token contract address
     * @param _amount Amount of tokens to deposit
     */
    function depositToken(address _token, uint256 _amount) 
        external 
        walletMustExist(msg.sender) 
        whenNotPaused 
    {
        require(_amount > 0, "Deposit amount must be greater than 0");
        require(supportedTokens[_token].isActive, "Token not supported");
        
        Wallet storage wallet = wallets[msg.sender];
        
        // Transfer tokens from user to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        wallet.tokenBalances[_token] += _amount;
        
        emit TokenDeposit(
            msg.sender, 
            _token, 
            _amount, 
            supportedTokens[_token].symbol, 
            block.timestamp
        );
    }

    /**
     * @dev Credit ERC-20 tokens to user wallet (called by authorized platform)
     * @param _user User address
     * @param _token Token contract address
     * @param _amount Amount of tokens to credit
     */
    function creditToken(address _user, address _token, uint256 _amount) 
        external 
        onlyAuthorizedPlatform 
        walletMustExist(_user) 
        whenNotPaused 
    {
        require(_amount > 0, "Amount must be greater than 0");
        require(supportedTokens[_token].isActive, "Token not supported");
        
        Wallet storage wallet = wallets[_user];
        
        // Transfer tokens from platform to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        wallet.tokenBalances[_token] += _amount;
        
        emit TokenDeposit(
            _user, 
            _token, 
            _amount, 
            supportedTokens[_token].symbol, 
            block.timestamp
        );
    }

    // ===========================================
    // WITHDRAWAL FUNCTIONS
    // ===========================================

    /**
     * @dev Withdraw ETH from caller's wallet
     * @param _amount Amount to withdraw (in wei)
     */
    function withdrawETH(uint256 _amount) 
        external 
        nonReentrant 
        walletMustExist(msg.sender) 
        whenNotPaused 
    {
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(_amount >= minimumWithdrawalAmount, "Below minimum withdrawal amount");
        
        Wallet storage wallet = wallets[msg.sender];
        require(wallet.ethBalance >= _amount, "Insufficient balance");
        
        wallet.ethBalance -= _amount;
        wallet.totalWithdrawals += _amount;
        
        // Transfer ETH to user
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "ETH transfer failed");
        
        emit ETHWithdrawal(msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Withdraw ERC-20 tokens from caller's wallet
     * @param _token Token contract address
     * @param _amount Amount of tokens to withdraw
     */
    function withdrawToken(address _token, uint256 _amount) 
        external 
        nonReentrant 
        walletMustExist(msg.sender) 
        whenNotPaused 
    {
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(supportedTokens[_token].isActive, "Token not supported");
        
        Wallet storage wallet = wallets[msg.sender];
        require(wallet.tokenBalances[_token] >= _amount, "Insufficient token balance");
        
        wallet.tokenBalances[_token] -= _amount;
        
        // Transfer tokens to user
        IERC20(_token).safeTransfer(msg.sender, _amount);
        
        emit TokenWithdrawal(
            msg.sender, 
            _token, 
            _amount, 
            supportedTokens[_token].symbol, 
            block.timestamp
        );
    }

    /**
     * @dev Withdraw all ETH from caller's wallet
     */
    function withdrawAllETH() external nonReentrant walletMustExist(msg.sender) whenNotPaused {
        Wallet storage wallet = wallets[msg.sender];
        uint256 balance = wallet.ethBalance;
        
        require(balance > 0, "No ETH balance");
        require(balance >= minimumWithdrawalAmount, "Below minimum withdrawal amount");
        
        wallet.ethBalance = 0;
        wallet.totalWithdrawals += balance;
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "ETH transfer failed");
        
        emit ETHWithdrawal(msg.sender, balance, block.timestamp);
    }

    // ===========================================
    // TRANSFER FUNCTIONS
    // ===========================================

    /**
     * @dev Transfer ETH to another wallet within the system
     * @param _recipient Recipient wallet address
     * @param _amount Amount to transfer
     */
    function transferETH(address _recipient, uint256 _amount) 
        external 
        walletMustExist(msg.sender) 
        walletMustExist(_recipient) 
        whenNotPaused 
    {
        require(_amount > 0, "Transfer amount must be greater than 0");
        require(_recipient != msg.sender, "Cannot transfer to self");
        
        Wallet storage senderWallet = wallets[msg.sender];
        Wallet storage recipientWallet = wallets[_recipient];
        
        require(senderWallet.ethBalance >= _amount, "Insufficient balance");
        
        senderWallet.ethBalance -= _amount;
        recipientWallet.ethBalance += _amount;
        
        emit Transfer(msg.sender, _recipient, _amount, address(0), block.timestamp);
    }

    /**
     * @dev Transfer tokens to another wallet within the system
     * @param _recipient Recipient wallet address
     * @param _token Token contract address
     * @param _amount Amount to transfer
     */
    function transferToken(address _recipient, address _token, uint256 _amount) 
        external 
        walletMustExist(msg.sender) 
        walletMustExist(_recipient) 
        whenNotPaused 
    {
        require(_amount > 0, "Transfer amount must be greater than 0");
        require(_recipient != msg.sender, "Cannot transfer to self");
        require(supportedTokens[_token].isActive, "Token not supported");
        
        Wallet storage senderWallet = wallets[msg.sender];
        Wallet storage recipientWallet = wallets[_recipient];
        
        require(senderWallet.tokenBalances[_token] >= _amount, "Insufficient token balance");
        
        senderWallet.tokenBalances[_token] -= _amount;
        recipientWallet.tokenBalances[_token] += _amount;
        
        emit Transfer(msg.sender, _recipient, _amount, _token, block.timestamp);
    }

    // ===========================================
    // VIEW FUNCTIONS
    // ===========================================

    /**
     * @dev Get ETH balance for a wallet
     * @param _owner Wallet owner address
     * @return ETH balance in wei
     */
    function getETHBalance(address _owner) 
        external 
        view 
        walletMustExist(_owner) 
        returns (uint256) 
    {
        return wallets[_owner].ethBalance;
    }

    /**
     * @dev Get token balance for a wallet
     * @param _owner Wallet owner address
     * @param _token Token contract address
     * @return Token balance
     */
    function getTokenBalance(address _owner, address _token) 
        external 
        view 
        walletMustExist(_owner) 
        returns (uint256) 
    {
        return wallets[_owner].tokenBalances[_token];
    }

    /**
     * @dev Get all balances for a wallet
     * @param _owner Wallet owner address
     * @return ethBalance ETH balance
     * @return tokenBalances Array of token balances
     * @return tokenAddresses Array of token addresses
     */
    function getAllBalances(address _owner) 
        external 
        view 
        walletMustExist(_owner) 
        returns (
            uint256 ethBalance,
            uint256[] memory tokenBalances,
            address[] memory tokenAddresses
        ) 
    {
        Wallet storage wallet = wallets[_owner];
        ethBalance = wallet.ethBalance;
        
        uint256 tokenCount = tokenAddressList.length;
        tokenBalances = new uint256[](tokenCount);
        tokenAddresses = new address[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            address tokenAddr = tokenAddressList[i];
            tokenAddresses[i] = tokenAddr;
            tokenBalances[i] = wallet.tokenBalances[tokenAddr];
        }
        
        return (ethBalance, tokenBalances, tokenAddresses);
    }

    /**
     * @dev Get wallet details
     * @param _owner Wallet owner address
     * @return owner Owner address
     * @return ethBalance ETH balance
     * @return createdAt Creation timestamp
     * @return totalDeposits Total deposits
     * @return totalWithdrawals Total withdrawals
     */
    function getWalletDetails(address _owner) 
        external 
        view 
        walletMustExist(_owner) 
        returns (
            address owner,
            uint256 ethBalance,
            uint256 createdAt,
            uint256 totalDeposits,
            uint256 totalWithdrawals
        ) 
    {
        Wallet storage wallet = wallets[_owner];
        return (
            wallet.owner,
            wallet.ethBalance,
            wallet.createdAt,
            wallet.totalDeposits,
            wallet.totalWithdrawals
        );
    }

    /**
     * @dev Check if wallet exists for an address
     * @param _owner Address to check
     * @return Boolean indicating if wallet exists
     */
    function hasWallet(address _owner) external view returns (bool) {
        return walletExists[_owner];
    }

    /**
     * @dev Get total number of wallets
     * @return Total wallet count
     */
    function getTotalWallets() external view returns (uint256) {
        return totalWallets;
    }

    /**
     * @dev Get list of all wallet addresses
     * @return Array of wallet addresses
     */
    function getAllWallets() external view returns (address[] memory) {
        return allWalletAddresses;
    }

    /**
     * @dev Get list of supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenAddressList;
    }

    // ===========================================
    // ADMIN FUNCTIONS - TOKEN MANAGEMENT
    // ===========================================

    /**
     * @dev Add a supported token
     * @param _token Token contract address
     * @param _symbol Token symbol
     */
    function addSupportedToken(address _token, string memory _symbol) 
        external 
        onlyOwner 
    {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token].isActive, "Token already supported");
        
        supportedTokens[_token] = SupportedToken({
            tokenAddress: _token,
            symbol: _symbol,
            isActive: true
        });
        
        tokenAddressList.push(_token);
        
        emit TokenAdded(_token, _symbol);
    }

    /**
     * @dev Remove a supported token
     * @param _token Token contract address
     */
    function removeSupportedToken(address _token) external onlyOwner {
        require(supportedTokens[_token].isActive, "Token not supported");
        
        string memory symbol = supportedTokens[_token].symbol;
        supportedTokens[_token].isActive = false;
        
        emit TokenRemoved(_token, symbol);
    }

    // ===========================================
    // ADMIN FUNCTIONS - PLATFORM MANAGEMENT
    // ===========================================

    /**
     * @dev Authorize a platform to credit wallets
     * @param _platform Platform address
     */
    function authorizePlatform(address _platform) external onlyOwner {
        require(_platform != address(0), "Invalid platform address");
        authorizedPlatforms[_platform] = true;
        emit PlatformAuthorized(_platform);
    }

    /**
     * @dev Revoke platform authorization
     * @param _platform Platform address
     */
    function revokePlatform(address _platform) external onlyOwner {
        authorizedPlatforms[_platform] = false;
        emit PlatformRevoked(_platform);
    }

    /**
     * @dev Update minimum withdrawal amount
     * @param _newMinimum New minimum in wei
     */
    function updateMinimumWithdrawal(uint256 _newMinimum) external onlyOwner {
        minimumWithdrawalAmount = _newMinimum;
        emit MinimumWithdrawalUpdated(_newMinimum);
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
     * @dev Emergency withdraw contract ETH balance (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Emergency withdraw contract token balance (owner only)
     * @param _token Token address
     */
    function emergencyWithdrawToken(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No token balance");
        
        IERC20(_token).safeTransfer(owner(), balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Accept ETH for funding contract
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function does not exist");
    }
}
