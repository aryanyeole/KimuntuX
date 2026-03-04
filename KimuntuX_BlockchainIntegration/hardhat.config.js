// ═══════════════════════════════════════════════════════════════════════════
// KIMUNTUX BLOCKCHAIN INTEGRATION - HARDHAT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
//
// This configuration file sets up the Hardhat development environment for
// deploying and testing KimuntuX smart contracts on multiple networks.
//
// DEPENDENCIES:
//   - hardhat: Core development environment
//   - @nomicfoundation/hardhat-toolbox: All-in-one plugin bundle
//   - dotenv: Environment variable management
//
// SECURITY:
//   - All sensitive data (private keys, API keys) stored in .env file
//   - .env file must be added to .gitignore (NEVER commit it!)
//   - Uses fail-safe defaults to prevent accidental mainnet deployments
//
// ═══════════════════════════════════════════════════════════════════════════

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT VARIABLE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
// This section validates that required environment variables are set before
// attempting deployment to prevent costly mistakes.

/**
 * Validates that required environment variables are present
 * @param {string[]} requiredVars - Array of required variable names
 * @param {string} context - Context for error message (e.g., "Sepolia deployment")
 */
function validateEnvVars(requiredVars, context) {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error(`\n❌ ERROR: Missing required environment variables for ${context}:`);
    missing.forEach(varName => console.error(`   • ${varName}`));
    console.error(`\nPlease create a .env file based on .env.example and fill in the required values.\n`);
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

// Validate critical environment variables when accessing specific networks
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Warning if attempting testnet/mainnet without proper configuration
if (process.argv.includes("--network") && process.argv.includes("sepolia")) {
  if (!SEPOLIA_RPC_URL || !PRIVATE_KEY) {
    console.error("\n⚠️  WARNING: Deploying to Sepolia requires SEPOLIA_RPC_URL and PRIVATE_KEY in .env file\n");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HARDHAT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // ═══════════════════════════════════════════════════════════════════════════
  // SOLIDITY COMPILER CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  solidity: {
    version: "0.8.20",  // Latest stable version with security improvements
    settings: {
      optimizer: {
        enabled: true,  // Enable optimization for gas efficiency
        runs: 200,      // Default: 200 runs (balanced between deployment and runtime costs)

        // EXPLANATION OF OPTIMIZER RUNS:
        // • 1 run: Optimize for deployment cost (expensive to use later)
        // • 200 runs: Balanced (Hardhat default, good for most contracts)
        // • 1000+ runs: Optimize for frequent use (more expensive to deploy)
        // • 10000+ runs: Libraries and frequently-called contracts
        //
        // For KimuntuX contracts:
        //   - Wallet: High frequency → Could use 1000 runs
        //   - Commission: Medium frequency → 200 runs is good
        //   - Escrow: Low frequency → 200 runs is good
        //
        // Decision: Keep 200 runs (balanced) for initial deployment
        // Can optimize per-contract later if needed
      },

      // Enable all metadata outputs for verification
      metadata: {
        bytecodeHash: "ipfs",  // Use IPFS hash for deterministic builds
      },

      // Output selection for verification and debugging
      outputSelection: {
        "*": {
          "*": [
            "abi",
            "evm.bytecode",
            "evm.deployedBytecode",
            "evm.methodIdentifiers",
            "metadata"
          ]
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NETWORK CONFIGURATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Each network configuration requires:
  //   - url: RPC endpoint for the network
  //   - accounts: Array of private keys (from .env)
  //   - chainId: Network chain ID (for verification)
  //   - gasPrice: "auto" lets Hardhat calculate optimal gas price
  //
  // SECURITY NOTE:
  //   - Private keys are loaded from .env file
  //   - If .env is missing, networks will have empty accounts array (safe)
  //   - This prevents accidental deployments without proper configuration
  //
  // ═══════════════════════════════════════════════════════════════════════════

  networks: {
    // ─────────────────────────────────────────────────────────────────────────
    // LOCAL DEVELOPMENT NETWORKS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * HARDHAT NETWORK (Default)
     * - In-memory network for testing
     * - Automatically started by Hardhat
     * - Fast, deterministic, great for unit tests
     * - Gets reset after each test run
     */
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,        // Automatically mine blocks
        interval: 0        // Mine immediately (no delay)
      },
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,         // Generate 20 test accounts
        accountsBalance: "10000000000000000000000"  // 10,000 ETH per account
      },
      // Forking (optional): Uncomment to fork mainnet for testing
      // forking: {
      //   url: process.env.MAINNET_RPC_URL || "",
      //   blockNumber: 18000000  // Fork from specific block for consistency
      // }
    },

    /**
     * LOCALHOST NETWORK
     * - For testing with a local Hardhat node
     * - Run `npx hardhat node` in separate terminal
     * - Useful for frontend development
     */
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000  // 60 second timeout for local connections
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TESTNET NETWORKS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * ETHEREUM SEPOLIA TESTNET (PRIMARY TESTNET)
     * - Free testnet ETH from faucets
     * - Most active Ethereum testnet
     * - Best for production testing before mainnet
     *
     * FAUCETS:
     *   - https://sepoliafaucet.com
     *   - https://sepolia-faucet.pk910.de
     *   - https://www.alchemy.com/faucets/ethereum-sepolia
     *
     * EXPLORER:
     *   - https://sepolia.etherscan.io
     */
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",   // Let Hardhat estimate gas price
      timeout: 120000,    // 2 minute timeout for testnet transactions

      // Gas limit protection (optional)
      // gas: 6000000,    // Max gas per transaction
    },

    /**
     * POLYGON MUMBAI TESTNET (DEPRECATED - Use Amoy instead)
     * - Low-cost testing environment
     * - Faster block times than Ethereum
     * - Note: Mumbai is being deprecated, use Amoy testnet instead
     */
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: "auto",
      timeout: 120000
    },

    /**
     * POLYGON AMOY TESTNET (NEW - Replaces Mumbai)
     * - New Polygon testnet replacing Mumbai
     * - Get testnet MATIC from faucets
     */
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80002,
      gasPrice: "auto",
      timeout: 120000
    },

    /**
     * BINANCE SMART CHAIN TESTNET
     * - BSC testnet for testing BSC deployments
     * - Get testnet BNB from faucet
     */
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 97,
      gasPrice: "auto",
      timeout: 120000
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MAINNET NETWORKS (PRODUCTION)
    // ─────────────────────────────────────────────────────────────────────────
    //
    // ⚠️  WARNING: MAINNET DEPLOYMENTS USE REAL MONEY!
    //
    // Before deploying to mainnet:
    //   1. Complete security audit ($15k-30k)
    //   2. Thoroughly test on testnet (100+ transactions)
    //   3. Use a multi-signature wallet for ownership
    //   4. Have emergency response plan ready
    //   5. Verify all constructor parameters
    //   6. Double-check contract addresses
    //   7. Consider using OpenZeppelin Defender
    //
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * ETHEREUM MAINNET
     * - Primary Ethereum network
     * - High gas costs ($50-$500 per deployment)
     * - Maximum security and decentralization
     * - Use MAINNET_PRIVATE_KEY (separate from testnet)
     */
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: "auto",
      timeout: 300000,  // 5 minute timeout for mainnet

      // Mainnet-specific safety features (uncomment for extra protection)
      // gasMultiplier: 1.2,  // Add 20% buffer to gas estimates
    },

    /**
     * POLYGON MAINNET (PoS)
     * - Low-cost alternative to Ethereum (~$0.01 per transaction)
     * - Fast block times (~2 seconds)
     * - Great for high-frequency operations
     * - Recommended for KimuntuX production deployment
     */
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: "auto",
      timeout: 120000
    },

    /**
     * BINANCE SMART CHAIN MAINNET
     * - Low-cost alternative (~$0.20 per transaction)
     * - High throughput
     * - Large user base
     */
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 56,
      gasPrice: "auto",
      timeout: 120000
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ETHERSCAN CONTRACT VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Etherscan verification allows users to:
  //   - Read contract source code
  //   - Interact with contract functions via UI
  //   - Verify contract authenticity
  //   - Build trust with users
  //
  // SETUP:
  //   1. Get API key from etherscan.io/myapikey
  //   2. Add to .env file: ETHERSCAN_API_KEY=your_key_here
  //   3. Run: npx hardhat verify --network sepolia CONTRACT_ADDRESS "constructor_arg1"
  //
  // ═══════════════════════════════════════════════════════════════════════════

  etherscan: {
    apiKey: {
      // Ethereum networks
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,  // Deprecated but included for compatibility

      // Polygon networks
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",

      // BSC networks
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    },

    // Custom chains configuration (if needed)
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAS REPORTER CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Gas reporter shows gas usage for each contract function during tests
  // Helps optimize contract code for lower transaction costs
  //
  // USAGE:
  //   - Enable: Set REPORT_GAS=true in .env file
  //   - Run tests: npx hardhat test
  //   - View report: gas-report.txt
  //
  // GAS OPTIMIZATION TIPS:
  //   - Use `unchecked {}` for safe arithmetic
  //   - Pack storage variables efficiently
  //   - Use `calldata` instead of `memory` for read-only arrays
  //   - Cache storage variables in memory
  //   - Use events instead of storing logs on-chain
  //
  // ═══════════════════════════════════════════════════════════════════════════

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",

    // CoinMarketCap API for price data (optional)
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",

    // Output configuration
    outputFile: "gas-report.txt",
    noColors: true,  // Better for file output

    // Token price configuration (optional - uses live prices if CMC key provided)
    token: "ETH",    // Can change to "MATIC" for Polygon, "BNB" for BSC
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",

    // Show method names in report
    showMethodSig: true,

    // Show gas used in USD
    showTimeSpent: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT PATHS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Defines where Hardhat looks for contracts, tests, and artifacts
  //
  // STRUCTURE:
  //   contracts/  → Solidity source files (.sol)
  //   test/       → Test files (Mocha/Chai)
  //   scripts/    → Deployment and utility scripts
  //   artifacts/  → Compiled contracts (auto-generated)
  //   cache/      → Compilation cache (auto-generated)
  //
  // ═══════════════════════════════════════════════════════════════════════════

  paths: {
    sources: "./contracts",      // ✅ Updated to match your structure
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    scripts: "./scripts"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MOCHA TEST CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Mocha is the test framework used by Hardhat
  // Timeout prevents hanging tests from blocking the suite
  //
  // ═══════════════════════════════════════════════════════════════════════════

  mocha: {
    timeout: 40000,  // 40 seconds (sufficient for network calls)

    // Additional Mocha options (uncomment if needed)
    // reporter: "spec",           // Test output format
    // slow: 1000,                 // Tests slower than 1s marked as slow
    // bail: false,                // Stop on first test failure
    // parallel: false,            // Run tests in parallel
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL HARDHAT PLUGINS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Contract size report (uncomment to enable)
  // contractSizer: {
  //   alphaSort: true,
  //   runOnCompile: true,
  //   disambiguatePaths: false,
  // },

  // Code coverage configuration (uncomment to enable)
  // solidity-coverage: {
  //   skipFiles: ['test/', 'mock/']
  // },

  // TypeScript configuration (if using TypeScript)
  // typechain: {
  //   outDir: "typechain",
  //   target: "ethers-v6",
  // }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPFUL COMMANDS
// ═══════════════════════════════════════════════════════════════════════════
//
// COMPILATION:
//   npx hardhat compile          # Compile all contracts
//   npx hardhat clean            # Clear cache and artifacts
//
// TESTING:
//   npx hardhat test             # Run all tests
//   npx hardhat test --parallel  # Run tests in parallel
//   REPORT_GAS=true npx hardhat test  # Show gas usage
//
// LOCAL DEVELOPMENT:
//   npx hardhat node             # Start local Hardhat node
//   npx hardhat console          # Interactive console
//
// DEPLOYMENT:
//   npx hardhat run scripts/deploy-all.js --network localhost
//   npx hardhat run scripts/deploy-all.js --network sepolia
//
// VERIFICATION:
//   npx hardhat verify --network sepolia CONTRACT_ADDRESS "constructor_arg"
//   npm run verify:sepolia       # Run verification script
//
// UTILITIES:
//   npx hardhat accounts         # List available accounts
//   npx hardhat help             # Show all commands
//   npx hardhat flatten contracts/MyContract.sol  # Flatten for verification
//
// ═══════════════════════════════════════════════════════════════════════════
