// ═══════════════════════════════════════════════════════════════════════════
// KIMUNTUX BLOCKCHAIN - CONTRACT VERIFICATION SCRIPT
// ═══════════════════════════════════════════════════════════════════════════
//
// This script verifies deployed contracts on Etherscan with:
//   - Automatic deployment artifact loading
//   - Intelligent retry logic for rate limits
//   - Constructor argument handling
//   - "Already verified" detection
//   - Multi-chain support
//   - Detailed progress tracking
//
// USAGE:
//   npm run verify:sepolia
//   npx hardhat run scripts/verify.js --network sepolia
//   npx hardhat run scripts/verify.js --network polygon
//
// PREREQUISITES:
//   - Contracts must be deployed first (run deploy-all.js)
//   - ETHERSCAN_API_KEY must be set in .env
//   - Deployment artifacts must exist in deployments/ folder
//
// ═══════════════════════════════════════════════════════════════════════════

const { run, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Maximum retry attempts for verification
  MAX_RETRIES: 5,

  // Delay between retry attempts (in milliseconds)
  RETRY_DELAYS: [
    5000,   // 5 seconds
    10000,  // 10 seconds
    30000,  // 30 seconds
    60000,  // 1 minute
    120000, // 2 minutes
  ],

  // Delay between verifying different contracts (rate limit prevention)
  VERIFICATION_DELAY: 3000, // 3 seconds

  // Explorer URLs for different networks
  EXPLORER_URLS: {
    mainnet: "https://etherscan.io/address/",
    sepolia: "https://sepolia.etherscan.io/address/",
    goerli: "https://goerli.etherscan.io/address/",
    polygon: "https://polygonscan.com/address/",
    mumbai: "https://mumbai.polygonscan.com/address/",
    amoy: "https://amoy.polygonscan.com/address/",
    bsc: "https://bscscan.com/address/",
    bscTestnet: "https://testnet.bscscan.com/address/",
  },

  // Contract verification priority (verify in this order)
  VERIFICATION_ORDER: [
    "KimuntuXWallet",
    "KimuntuXCommissionSystem",
    "PaymentEscrow",
  ],
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
 * Format verification error for better readability
 */
function formatVerificationError(error) {
  const message = error.message || error.toString();

  // Check for common error patterns
  if (message.includes("Already Verified")) {
    return { type: "already_verified", message: "Contract is already verified" };
  }

  if (message.includes("rate limit") || message.includes("Max rate limit reached")) {
    return { type: "rate_limit", message: "API rate limit reached" };
  }

  if (message.includes("Invalid API Key")) {
    return {
      type: "invalid_api_key",
      message: "Invalid Etherscan API key. Check your .env file.",
    };
  }

  if (message.includes("NOTOK")) {
    return {
      type: "etherscan_error",
      message: "Etherscan API error. The contract may not be deployed or network might be incorrect.",
    };
  }

  if (message.includes("Fail - Unable to verify")) {
    return {
      type: "verification_failed",
      message: "Verification failed. Check constructor arguments and compiler settings.",
    };
  }

  if (message.includes("timeout")) {
    return { type: "timeout", message: "Verification request timed out" };
  }

  // Unknown error
  return { type: "unknown", message: message };
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load deployment artifacts from file
 */
function loadDeploymentArtifacts() {
  console.log("📂 Loading Deployment Artifacts");
  console.log("   ─────────────────────────────────────────────────────────");

  const deploymentFile = path.join(
    __dirname,
    `../deployments/${network.name}-deployment.json`
  );

  console.log(`   • Network: ${network.name}`);
  console.log(`   • Looking for: ${deploymentFile}`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(
      `Deployment file not found: ${deploymentFile}\n` +
        `   Please deploy contracts first:\n` +
        `   npm run deploy:${network.name}`
    );
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log(`   • Deployment Date: ${deployment.timestamp}`);
  console.log(`   • Deployer: ${deployment.deployer}`);
  console.log(`   • Chain ID: ${deployment.chainId}`);
  console.log(`   • Contracts Found: ${Object.keys(deployment.contracts).length}`);
  console.log();

  return { deployment, deploymentFile };
}

/**
 * Validate API key is configured
 */
function validateApiKey() {
  console.log("🔑 Validating API Key");
  console.log("   ─────────────────────────────────────────────────────────");

  const apiKeyEnvVars = {
    mainnet: "ETHERSCAN_API_KEY",
    sepolia: "ETHERSCAN_API_KEY",
    goerli: "ETHERSCAN_API_KEY",
    polygon: "POLYGONSCAN_API_KEY",
    mumbai: "POLYGONSCAN_API_KEY",
    amoy: "POLYGONSCAN_API_KEY",
    bsc: "BSCSCAN_API_KEY",
    bscTestnet: "BSCSCAN_API_KEY",
  };

  const requiredVar = apiKeyEnvVars[network.name];

  if (!requiredVar) {
    console.log(`   ⚠️  Network ${network.name} verification not configured`);
    console.log();
    return false;
  }

  const apiKey = process.env[requiredVar];

  if (!apiKey || apiKey.includes("your_") || apiKey.includes("YOUR_")) {
    throw new Error(
      `${requiredVar} not configured in .env file.\n` +
        `   Get API key from:\n` +
        `   • Etherscan: https://etherscan.io/myapikey\n` +
        `   • PolygonScan: https://polygonscan.com/myapikey\n` +
        `   • BSCScan: https://bscscan.com/myapikey`
    );
  }

  console.log(`   • API Key Variable: ${requiredVar}`);
  console.log(`   • API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`   ✅ API key configured\n`);

  return true;
}

/**
 * Get contracts to verify in correct order
 */
function getVerificationQueue(contracts) {
  console.log("📋 Building Verification Queue");
  console.log("   ─────────────────────────────────────────────────────────");

  const queue = [];

  // Add contracts in priority order
  for (const contractName of CONFIG.VERIFICATION_ORDER) {
    if (contracts[contractName]) {
      const contract = contracts[contractName];

      // Skip if already verified
      if (contract.verified === true) {
        console.log(`   • ${contractName}: Already verified (skipping)`);
        continue;
      }

      queue.push({
        name: contractName,
        address: contract.address,
        constructorArgs: contract.constructorArgs || [],
      });

      console.log(`   • ${contractName}: Queued`);
      console.log(`     Address: ${contract.address}`);
      console.log(`     Constructor Args: ${contract.constructorArgs?.length || 0}`);
    }
  }

  // Add any remaining contracts not in priority order
  for (const [contractName, contract] of Object.entries(contracts)) {
    if (!CONFIG.VERIFICATION_ORDER.includes(contractName) && !contract.verified) {
      queue.push({
        name: contractName,
        address: contract.address,
        constructorArgs: contract.constructorArgs || [],
      });
      console.log(`   • ${contractName}: Queued (additional)`);
    }
  }

  console.log(`\n   Total contracts to verify: ${queue.length}\n`);

  return queue;
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify a single contract with retry logic
 */
async function verifyContract(contractInfo, retryCount = 0) {
  const { name, address, constructorArgs } = contractInfo;

  console.log(`\n🔎 Verifying ${name}...`);
  console.log(`   ─────────────────────────────────────────────────────────`);
  console.log(`   • Address: ${address}`);
  console.log(`   • Constructor Args: ${constructorArgs.length > 0 ? JSON.stringify(constructorArgs) : "None"}`);

  if (retryCount > 0) {
    console.log(`   • Retry Attempt: ${retryCount}/${CONFIG.MAX_RETRIES}`);
  }

  try {
    // Call Hardhat's verify task
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });

    console.log(`   ✅ ${name} verified successfully!`);
    return { success: true, verified: true };
  } catch (error) {
    const errorInfo = formatVerificationError(error);

    // Handle "already verified" as success
    if (errorInfo.type === "already_verified") {
      console.log(`   ℹ️  ${name} is already verified`);
      return { success: true, verified: true, alreadyVerified: true };
    }

    // Handle rate limit with retry
    if (errorInfo.type === "rate_limit") {
      console.log(`   ⚠️  Rate limit reached`);

      if (retryCount < CONFIG.MAX_RETRIES) {
        const delay = CONFIG.RETRY_DELAYS[retryCount] || CONFIG.RETRY_DELAYS[CONFIG.RETRY_DELAYS.length - 1];
        console.log(`   🔄 Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
        return verifyContract(contractInfo, retryCount + 1);
      }

      console.log(`   ❌ Failed after ${CONFIG.MAX_RETRIES} retry attempts`);
      return {
        success: false,
        verified: false,
        error: errorInfo.message,
        errorType: errorInfo.type,
      };
    }

    // Handle timeout with retry
    if (errorInfo.type === "timeout") {
      console.log(`   ⚠️  Verification timed out`);

      if (retryCount < CONFIG.MAX_RETRIES) {
        const delay = CONFIG.RETRY_DELAYS[retryCount] || CONFIG.RETRY_DELAYS[CONFIG.RETRY_DELAYS.length - 1];
        console.log(`   🔄 Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
        return verifyContract(contractInfo, retryCount + 1);
      }
    }

    // Handle invalid API key (no retry)
    if (errorInfo.type === "invalid_api_key") {
      console.log(`   ❌ ${errorInfo.message}`);
      throw new Error(`Invalid API key. Please check your .env file.`);
    }

    // Log error and return failure
    console.log(`   ❌ Verification failed: ${errorInfo.message}`);
    console.log(`   Error type: ${errorInfo.type}`);

    if (errorInfo.type === "verification_failed") {
      console.log(`\n   💡 Troubleshooting:`);
      console.log(`      • Check constructor arguments match deployment`);
      console.log(`      • Verify compiler version in hardhat.config.js`);
      console.log(`      • Ensure contract is fully deployed (wait for confirmations)`);
      console.log(`      • Try manual verification on Etherscan`);
    }

    return {
      success: false,
      verified: false,
      error: errorInfo.message,
      errorType: errorInfo.type,
    };
  }
}

/**
 * Verify all contracts in queue
 */
async function verifyAllContracts(queue, deployment, deploymentFile) {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                    Contract Verification                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results = {
    total: queue.length,
    verified: 0,
    alreadyVerified: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < queue.length; i++) {
    const contractInfo = queue[i];

    console.log(`\n[${i + 1}/${queue.length}] ${contractInfo.name}`);

    // Verify contract
    const result = await verifyContract(contractInfo);

    // Update results
    if (result.success) {
      if (result.alreadyVerified) {
        results.alreadyVerified++;
      } else {
        results.verified++;
      }

      // Update deployment file
      deployment.contracts[contractInfo.name].verified = true;
      deployment.contracts[contractInfo.name].verifiedAt = new Date().toISOString();
    } else {
      results.failed++;
      results.errors.push({
        contract: contractInfo.name,
        error: result.error,
        errorType: result.errorType,
      });
    }

    // Rate limit prevention: wait between verifications
    if (i < queue.length - 1) {
      console.log(`   ⏳ Waiting ${CONFIG.VERIFICATION_DELAY / 1000}s before next contract...`);
      await sleep(CONFIG.VERIFICATION_DELAY);
    }
  }

  // Save updated deployment file
  try {
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    console.log(`\n💾 Updated deployment file with verification status`);
  } catch (error) {
    console.log(`\n⚠️  Could not update deployment file: ${error.message}`);
  }

  return results;
}

/**
 * Print verification summary
 */
function printSummary(results, deployment) {
  console.log("\n");
  printBox(results.failed === 0 ? "✅ VERIFICATION COMPLETE!" : "⚠️ VERIFICATION COMPLETED WITH ERRORS");
  console.log("\n");

  console.log("📊 Verification Summary:");
  console.log("   ─────────────────────────────────────────────────────────");
  console.log(`   • Total Contracts: ${results.total}`);
  console.log(`   • Newly Verified: ${results.verified}`);
  console.log(`   • Already Verified: ${results.alreadyVerified}`);
  console.log(`   • Failed: ${results.failed}`);
  console.log();

  // Show failed contracts
  if (results.errors.length > 0) {
    console.log("❌ Failed Verifications:");
    console.log("   ─────────────────────────────────────────────────────────");
    for (const error of results.errors) {
      console.log(`   • ${error.contract}:`);
      console.log(`     Error: ${error.error}`);
      console.log(`     Type: ${error.errorType}`);
    }
    console.log();

    console.log("💡 Retry failed verifications:");
    console.log(`   npm run verify:${network.name}`);
    console.log();
  }

  // Show explorer links
  const explorerUrl = CONFIG.EXPLORER_URLS[network.name];
  if (explorerUrl) {
    console.log("🔗 View Verified Contracts:");
    console.log("   ─────────────────────────────────────────────────────────");
    for (const [name, info] of Object.entries(deployment.contracts)) {
      if (info.verified) {
        console.log(`   • ${name}:`);
        console.log(`     ${explorerUrl}${info.address}#code`);
      }
    }
    console.log();
  }

  // Next steps
  if (results.failed === 0) {
    console.log("📝 Next Steps:");
    console.log("   ─────────────────────────────────────────────────────────");
    console.log("   1. View source code on block explorer");
    console.log("   2. Interact with contracts via explorer UI");
    console.log("   3. Share verified addresses with users");
    console.log("   4. Update frontend with contract addresses");
    console.log("   5. Begin integration testing");
    console.log();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VERIFICATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    console.log("\n");
    printBox("KimuntuX Contract Verification");
    console.log("\n");

    // Phase 1: Validation
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    Phase 1: Validation                      ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const { deployment, deploymentFile } = loadDeploymentArtifacts();
    validateApiKey();

    const queue = getVerificationQueue(deployment.contracts);

    // Check if anything to verify
    if (queue.length === 0) {
      console.log("✅ All contracts are already verified!\n");
      console.log("🔗 View contracts on block explorer:");
      const explorerUrl = CONFIG.EXPLORER_URLS[network.name];
      if (explorerUrl) {
        for (const [name, info] of Object.entries(deployment.contracts)) {
          console.log(`   • ${name}: ${explorerUrl}${info.address}#code`);
        }
      }
      console.log();
      return;
    }

    // Phase 2: Verification
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                   Phase 2: Verification                     ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    const results = await verifyAllContracts(queue, deployment, deploymentFile);

    // Phase 3: Summary
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                      Phase 3: Summary                       ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    printSummary(results, deployment);

    // Exit with appropriate code
    if (results.failed > 0) {
      console.log("⚠️  Some contracts failed verification. See errors above.\n");
      process.exit(1);
    }

    console.log("✨ All contracts verified successfully!\n");
  } catch (error) {
    console.error("\n╔════════════════════════════════════════════════════════════╗");
    console.error("║                   ❌ VERIFICATION FAILED                     ║");
    console.error("╚════════════════════════════════════════════════════════════╝\n");
    console.error("Error:", error.message);
    console.error("\n💡 Troubleshooting:");
    console.error("   • Ensure contracts are deployed: npm run deploy:sepolia");
    console.error("   • Check API key in .env file");
    console.error("   • Verify network matches deployment: --network", network.name);
    console.error("   • Check deployment file exists: deployments/" + network.name + "-deployment.json");
    console.error("   • Try again in a few minutes (rate limits)\n");
    console.error("\nFull error:");
    console.error(error);
    console.error();
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
