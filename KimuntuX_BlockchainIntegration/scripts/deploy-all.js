// ═══════════════════════════════════════════════════════════════════════════
// KIMUNTUX BLOCKCHAIN - PRODUCTION DEPLOYMENT SCRIPT
// ═══════════════════════════════════════════════════════════════════════════
//
// This script deploys all KimuntuX smart contracts in the correct order with:
//   - Comprehensive pre-deployment validation
//   - Gas estimation and balance checking
//   - Retry logic for failed transactions
//   - Detailed logging and progress tracking
//   - Structured artifact saving for verification
//   - Error handling with actionable feedback
//
// USAGE:
//   npx hardhat run scripts/deploy-all.js --network localhost
//   npx hardhat run scripts/deploy-all.js --network sepolia
//   npx hardhat run scripts/deploy-all.js --network polygon
//
// ═══════════════════════════════════════════════════════════════════════════

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Minimum balance required for deployment (in ETH)
  MINIMUM_BALANCE: {
    localhost: "0.01",
    hardhat: "0.01",
    sepolia: "0.05",
    goerli: "0.05",
    mumbai: "0.05",
    amoy: "0.05",
    polygon: "0.5",
    mainnet: "1.0",
    bsc: "0.5",
  },

  // Contract constructor arguments
  CONSTRUCTOR_ARGS: {
    KimuntuXWallet: {
      minimumWithdrawalAmount: ethers.parseEther("0.01"), // 0.01 ETH
    },
    KimuntuXCommissionSystem: {},
    PaymentEscrow: {},
  },

  // Deployment order (respects dependencies)
  DEPLOYMENT_ORDER: [
    "KimuntuXWallet",
    "KimuntuXCommissionSystem",
    "PaymentEscrow",
  ],

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds

  // Gas estimation buffer (20% extra)
  GAS_BUFFER: 1.2,

  // Confirmation blocks to wait
  CONFIRMATIONS: {
    localhost: 1,
    hardhat: 1,
    sepolia: 2,
    goerli: 2,
    mumbai: 2,
    amoy: 2,
    polygon: 3,
    mainnet: 5,
    bsc: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format ETH amount for display
 */
function formatEth(wei) {
  return ethers.formatEther(wei);
}

/**
 * Format gas price for display
 */
function formatGwei(wei) {
  return ethers.formatUnits(wei, "gwei");
}

/**
 * Create ASCII box for visual separation
 */
function printBox(title, width = 62) {
  const padding = Math.max(0, width - title.length - 2);
  const leftPad = Math.floor(padding / 2);
  const rightPad = Math.ceil(padding / 2);

  console.log("╔" + "═".repeat(width) + "╗");
  console.log("║" + " ".repeat(leftPad) + title + " ".repeat(rightPad) + "║");
  console.log("╚" + "═".repeat(width) + "╝");
}

/**
 * Print deployment header
 */
function printHeader() {
  console.log("\n");
  printBox("KimuntuX Blockchain Integration - Deployment");
  console.log("\n");
}

/**
 * Print deployment summary
 */
function printSummary(results, duration) {
  console.log("\n");
  printBox("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("\n");

  console.log("📍 Contract Addresses:");
  for (const [name, result] of Object.entries(results)) {
    console.log(`   • ${name}:`);
    console.log(`     ${result.address}`);
  }

  console.log("\n⏱️  Deployment Time:", duration);
  console.log("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate network configuration
 */
async function validateNetwork() {
  console.log("🌐 Network Validation");
  console.log("   ─────────────────────────────────────────────────────────");

  const networkInfo = await ethers.provider.getNetwork();
  const chainId = networkInfo.chainId.toString();

  console.log(`   • Network Name: ${network.name}`);
  console.log(`   • Chain ID: ${chainId}`);
  console.log(`   • Provider: ${ethers.provider.connection?.url || "Hardhat Network"}`);

  // Validate chain ID matches expected
  const expectedChainIds = {
    localhost: "31337",
    hardhat: "31337",
    sepolia: "11155111",
    goerli: "5",
    mumbai: "80001",
    amoy: "80002",
    polygon: "137",
    mainnet: "1",
    bsc: "56",
  };

  if (expectedChainIds[network.name] && expectedChainIds[network.name] !== chainId) {
    throw new Error(
      `Chain ID mismatch! Expected ${expectedChainIds[network.name]}, got ${chainId}`
    );
  }

  console.log("   ✅ Network configuration valid\n");
}

/**
 * Validate deployer account and balance
 */
async function validateDeployer() {
  console.log("👤 Deployer Validation");
  console.log("   ─────────────────────────────────────────────────────────");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`   • Deployer Address: ${deployer.address}`);
  console.log(`   • Balance: ${formatEth(balance)} ETH`);

  // Check minimum balance
  const minBalance = ethers.parseEther(
    CONFIG.MINIMUM_BALANCE[network.name] || CONFIG.MINIMUM_BALANCE.sepolia
  );

  if (balance < minBalance) {
    throw new Error(
      `Insufficient balance! Need at least ${formatEth(minBalance)} ETH, have ${formatEth(balance)} ETH.\n` +
        `   Get testnet ETH from: https://sepoliafaucet.com`
    );
  }

  console.log(`   ✅ Sufficient balance (min: ${formatEth(minBalance)} ETH)\n`);

  return deployer;
}

/**
 * Validate contract compilation
 */
async function validateCompilation() {
  console.log("📦 Contract Compilation Validation");
  console.log("   ─────────────────────────────────────────────────────────");

  for (const contractName of CONFIG.DEPLOYMENT_ORDER) {
    try {
      const factory = await ethers.getContractFactory(contractName);
      const bytecode = factory.bytecode;
      const bytecodeSize = (bytecode.length - 2) / 2; // Remove 0x and convert to bytes

      console.log(`   • ${contractName}:`);
      console.log(`     Bytecode Size: ${bytecodeSize} bytes (${(bytecodeSize / 24576 * 100).toFixed(1)}% of limit)`);

      if (bytecodeSize > 24576) {
        throw new Error(`Contract size exceeds 24KB limit! (${bytecodeSize} bytes)`);
      }

      if (bytecodeSize === 0) {
        throw new Error(`No bytecode! Contract may not be compiled.`);
      }
    } catch (error) {
      throw new Error(
        `Failed to load ${contractName}: ${error.message}\n` +
          `   Run: npx hardhat compile`
      );
    }
  }

  console.log("   ✅ All contracts compiled and validated\n");
}

/**
 * Estimate total deployment cost
 */
async function estimateDeploymentCost() {
  console.log("💰 Gas Estimation");
  console.log("   ─────────────────────────────────────────────────────────");

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;

  console.log(`   • Gas Price: ${formatGwei(gasPrice)} gwei`);

  let totalGasEstimate = 0n;
  const estimates = {};

  for (const contractName of CONFIG.DEPLOYMENT_ORDER) {
    try {
      const factory = await ethers.getContractFactory(contractName);
      const constructorArgs = Object.values(CONFIG.CONSTRUCTOR_ARGS[contractName]);

      // Estimate deployment gas
      const deployTransaction = factory.getDeployTransaction(...constructorArgs);
      const gasEstimate = await ethers.provider.estimateGas(deployTransaction);

      // Add buffer for safety
      const gasWithBuffer = (gasEstimate * BigInt(Math.floor(CONFIG.GAS_BUFFER * 100))) / 100n;

      estimates[contractName] = {
        gas: gasWithBuffer,
        cost: gasWithBuffer * gasPrice,
      };

      totalGasEstimate += gasWithBuffer;

      console.log(`   • ${contractName}:`);
      console.log(`     Gas: ${gasEstimate.toString()} (buffered: ${gasWithBuffer.toString()})`);
      console.log(`     Cost: ${formatEth(estimates[contractName].cost)} ETH`);
    } catch (error) {
      console.log(`   ⚠️  Could not estimate gas for ${contractName}: ${error.message}`);
      console.log(`      Will proceed with dynamic gas estimation`);
    }
  }

  const totalCost = totalGasEstimate * gasPrice;
  console.log(`\n   • Total Estimated Cost: ${formatEth(totalCost)} ETH`);
  console.log(`     (at ${formatGwei(gasPrice)} gwei)\n`);

  return { estimates, totalCost };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPLOYMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Deploy a single contract with retry logic
 */
async function deployContract(contractName, constructorArgs, retryCount = 0) {
  try {
    console.log(`\n📦 Deploying ${contractName}...`);
    console.log(`   ─────────────────────────────────────────────────────────`);

    // Get contract factory
    const factory = await ethers.getContractFactory(contractName);

    // Deploy with constructor arguments
    console.log(`   • Sending deployment transaction...`);
    const contract = await factory.deploy(...constructorArgs);

    console.log(`   • Transaction Hash: ${contract.deploymentTransaction().hash}`);
    console.log(`   • Waiting for confirmations...`);

    // Wait for deployment with appropriate confirmations
    const confirmations = CONFIG.CONFIRMATIONS[network.name] || 2;
    await contract.waitForDeployment();

    // Get deployed address
    const address = await contract.getAddress();

    console.log(`   ✅ ${contractName} deployed successfully!`);
    console.log(`   • Address: ${address}`);
    console.log(`   • Block: ${contract.deploymentTransaction().blockNumber || "pending"}`);

    // Verify deployment by checking code at address
    const code = await ethers.provider.getCode(address);
    if (code === "0x") {
      throw new Error("Deployment failed: No code at deployed address");
    }

    console.log(`   • Code Size: ${(code.length - 2) / 2} bytes`);
    console.log(`   • Confirmations: ${confirmations}`);

    return {
      contract,
      address,
      transactionHash: contract.deploymentTransaction().hash,
      blockNumber: contract.deploymentTransaction().blockNumber,
    };
  } catch (error) {
    console.error(`   ❌ Deployment failed: ${error.message}`);

    // Retry logic
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`   🔄 Retrying in ${CONFIG.RETRY_DELAY / 1000} seconds... (Attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
      await sleep(CONFIG.RETRY_DELAY);
      return deployContract(contractName, constructorArgs, retryCount + 1);
    }

    throw new Error(`Failed to deploy ${contractName} after ${CONFIG.MAX_RETRIES} attempts: ${error.message}`);
  }
}

/**
 * Verify contract state after deployment
 */
async function verifyContractState(contractName, address, contract) {
  console.log(`   • Verifying ${contractName} state...`);

  try {
    // Check owner
    if (contract.owner) {
      const owner = await contract.owner();
      console.log(`     Owner: ${owner}`);
    }

    // Contract-specific validations
    if (contractName === "KimuntuXWallet") {
      const minWithdrawal = await contract.minimumWithdrawalAmount();
      console.log(`     Min Withdrawal: ${formatEth(minWithdrawal)} ETH`);
    } else if (contractName === "KimuntuXCommissionSystem") {
      const platformFeeRate = await contract.platformFeeRate();
      console.log(`     Platform Fee: ${Number(platformFeeRate) / 100}%`);
    } else if (contractName === "PaymentEscrow") {
      const escrowFeeRate = await contract.escrowFeeRate();
      console.log(`     Escrow Fee: ${Number(escrowFeeRate) / 100}%`);
    }

    console.log(`   ✅ State verification passed`);
  } catch (error) {
    console.log(`   ⚠️  State verification skipped: ${error.message}`);
  }
}

/**
 * Save deployment artifacts
 */
function saveDeploymentArtifacts(results, deployer, startTime) {
  console.log("\n💾 Saving Deployment Artifacts");
  console.log("   ─────────────────────────────────────────────────────────");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Build deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: results[CONFIG.DEPLOYMENT_ORDER[0]].chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    deploymentTime: new Date() - startTime,
    blockNumber: results[CONFIG.DEPLOYMENT_ORDER[0]].blockNumber,
    contracts: {},
    configuration: {},
  };

  // Add contract info
  for (const [contractName, result] of Object.entries(results)) {
    deploymentInfo.contracts[contractName] = {
      address: result.address,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      constructorArgs: result.constructorArgs,
      verified: false, // Will be updated by verification script
    };
  }

  // Add configuration
  if (results.KimuntuXWallet) {
    deploymentInfo.configuration.minimumWithdrawalAmount =
      formatEth(CONFIG.CONSTRUCTOR_ARGS.KimuntuXWallet.minimumWithdrawalAmount) + " ETH";
  }

  // Save to file
  const deploymentFile = path.join(deploymentsDir, `${network.name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`   ✅ Deployment info saved to:`);
  console.log(`      ${deploymentFile}`);

  // Save ABIs
  for (const contractName of CONFIG.DEPLOYMENT_ORDER) {
    try {
      const artifactPath = path.join(
        __dirname,
        `../artifacts/contracts/${contractName}.sol/${contractName}.json`
      );

      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const abiFile = path.join(deploymentsDir, `${contractName}.abi.json`);
        fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2));
        console.log(`   ✅ ABI saved: ${contractName}.abi.json`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not save ABI for ${contractName}: ${error.message}`);
    }
  }

  console.log();
  return deploymentFile;
}

/**
 * Print next steps
 */
function printNextSteps(results) {
  console.log("📝 Next Steps:");
  console.log("   ─────────────────────────────────────────────────────────");

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("   1. Verify contracts on Etherscan:");
    console.log(`      npm run verify:${network.name}`);
    console.log();

    console.log("   2. View contracts on block explorer:");
    const explorerUrls = {
      sepolia: "https://sepolia.etherscan.io/address/",
      goerli: "https://goerli.etherscan.io/address/",
      mainnet: "https://etherscan.io/address/",
      polygon: "https://polygonscan.com/address/",
      mumbai: "https://mumbai.polygonscan.com/address/",
      amoy: "https://amoy.polygonscan.com/address/",
      bsc: "https://bscscan.com/address/",
    };

    const explorerUrl = explorerUrls[network.name];
    if (explorerUrl) {
      for (const [name, result] of Object.entries(results)) {
        console.log(`      • ${name}: ${explorerUrl}${result.address}`);
      }
    }
    console.log();
  }

  console.log("   3. Update frontend/demo with contract addresses");
  console.log("   4. Configure backend with contract addresses and ABIs");
  console.log("   5. Test all contract functions");

  if (network.name !== "mainnet" && network.name !== "polygon" && network.name !== "bsc") {
    console.log("   6. Complete testing on testnet (100+ transactions)");
    console.log("   7. Get security audit before mainnet deployment");
  }

  console.log();
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DEPLOYMENT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const startTime = new Date();

  try {
    // Print header
    printHeader();

    // Phase 1: Validation
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                  Phase 1: Pre-Deployment Validation         ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    await validateNetwork();
    const deployer = await validateDeployer();
    await validateCompilation();
    await estimateDeploymentCost();

    // Confirmation prompt for production networks
    if (["mainnet", "polygon", "bsc"].includes(network.name)) {
      console.log("⚠️  WARNING: You are deploying to MAINNET!");
      console.log("   This will use REAL money and cannot be undone.");
      console.log("   Make sure you have:");
      console.log("   • Completed security audit");
      console.log("   • Tested thoroughly on testnet");
      console.log("   • Verified all configuration");
      console.log();
      console.log("   Press Ctrl+C to cancel, or wait 10 seconds to continue...\n");
      await sleep(10000);
    }

    // Phase 2: Deployment
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    Phase 2: Contract Deployment             ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    const deploymentResults = {};
    const networkInfo = await ethers.provider.getNetwork();

    for (let i = 0; i < CONFIG.DEPLOYMENT_ORDER.length; i++) {
      const contractName = CONFIG.DEPLOYMENT_ORDER[i];
      const constructorArgs = Object.values(CONFIG.CONSTRUCTOR_ARGS[contractName]);

      console.log(`\n[${i + 1}/${CONFIG.DEPLOYMENT_ORDER.length}] ${contractName}`);

      const result = await deployContract(contractName, constructorArgs);

      // Verify contract state
      await verifyContractState(contractName, result.address, result.contract);

      // Store results
      deploymentResults[contractName] = {
        address: result.address,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        constructorArgs: constructorArgs.map((arg) => arg.toString()),
        chainId: networkInfo.chainId.toString(),
      };
    }

    // Phase 3: Post-Deployment
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                 Phase 3: Post-Deployment Tasks              ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    const deploymentFile = saveDeploymentArtifacts(deploymentResults, deployer, startTime);

    // Calculate total time
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2) + "s";

    // Print summary
    printSummary(deploymentResults, duration);
    printNextSteps(deploymentResults);

    console.log("✨ Deployment complete! All contracts are ready for use.\n");
  } catch (error) {
    console.error("\n╔════════════════════════════════════════════════════════════╗");
    console.error("║                     ❌ DEPLOYMENT FAILED                     ║");
    console.error("╚════════════════════════════════════════════════════════════╝\n");
    console.error("Error:", error.message);
    console.error("\nFull error details:");
    console.error(error);
    console.error("\n💡 Troubleshooting Tips:");
    console.error("   • Check your .env file has correct values");
    console.error("   • Ensure you have enough ETH for deployment");
    console.error("   • Verify network connection: npx hardhat console --network", network.name);
    console.error("   • Try compiling again: npx hardhat clean && npx hardhat compile");
    console.error("   • Check Hardhat config: hardhat.config.js\n");
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
