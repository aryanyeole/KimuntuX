// deploy-all.js - Complete deployment script for all KimuntuX contracts
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   KimuntuX Blockchain Integration - Complete Deployment    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📋 Deployment Configuration:");
  console.log("   • Deployer Address:", deployer.address);
  console.log("   • Account Balance:", ethers.formatEther(balance), "ETH");
  console.log("   • Network:", network.name);
  console.log("   • Chain ID:", (await ethers.provider.getNetwork()).chainId.toString());
  console.log();

  // Check if we have enough balance
  const estimatedCost = ethers.parseEther("0.05"); // Estimate ~0.05 ETH for all deployments
  if (balance < estimatedCost) {
    console.error("❌ Insufficient balance! Need at least 0.05 ETH for deployment.");
    console.error("   Get Sepolia testnet ETH from: https://sepoliafaucet.com");
    process.exit(1);
  }

  // Configuration
  const MINIMUM_WITHDRAWAL_AMOUNT = ethers.parseEther("0.01"); // 0.01 ETH
  const deploymentResults = {};

  try {
    // ==========================================
    // 1. Deploy KimuntuXWallet
    // ==========================================
    console.log("📦 [1/3] Deploying KimuntuXWallet...");
    const KimuntuXWallet = await ethers.getContractFactory("KimuntuXWallet");
    const walletContract = await KimuntuXWallet.deploy(MINIMUM_WITHDRAWAL_AMOUNT);
    await walletContract.waitForDeployment();
    const walletAddress = await walletContract.getAddress();

    console.log("   ✅ KimuntuXWallet deployed to:", walletAddress);
    deploymentResults.wallet = {
      name: "KimuntuXWallet",
      address: walletAddress,
      constructorArgs: [MINIMUM_WITHDRAWAL_AMOUNT.toString()]
    };

    // ==========================================
    // 2. Deploy KimuntuXCommissionSystem
    // ==========================================
    console.log("\n📦 [2/3] Deploying KimuntuXCommissionSystem...");
    const KimuntuXCommissionSystem = await ethers.getContractFactory("KimuntuXCommissionSystem");
    const commissionContract = await KimuntuXCommissionSystem.deploy();
    await commissionContract.waitForDeployment();
    const commissionAddress = await commissionContract.getAddress();

    console.log("   ✅ KimuntuXCommissionSystem deployed to:", commissionAddress);
    deploymentResults.commission = {
      name: "KimuntuXCommissionSystem",
      address: commissionAddress,
      constructorArgs: []
    };

    // ==========================================
    // 3. Deploy PaymentEscrow
    // ==========================================
    console.log("\n📦 [3/3] Deploying PaymentEscrow...");
    const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
    const escrowContract = await PaymentEscrow.deploy();
    await escrowContract.waitForDeployment();
    const escrowAddress = await escrowContract.getAddress();

    console.log("   ✅ PaymentEscrow deployed to:", escrowAddress);
    deploymentResults.escrow = {
      name: "PaymentEscrow",
      address: escrowAddress,
      constructorArgs: []
    };

    // ==========================================
    // Verify Deployments
    // ==========================================
    console.log("\n🔍 Verifying deployments...");

    const walletOwner = await walletContract.owner();
    const commissionOwner = await commissionContract.owner();
    const escrowOwner = await escrowContract.owner();

    console.log("   • KimuntuXWallet owner:", walletOwner);
    console.log("   • CommissionSystem owner:", commissionOwner);
    console.log("   • PaymentEscrow owner:", escrowOwner);

    // Check initial configuration
    const minWithdrawal = await walletContract.minimumWithdrawalAmount();
    const platformFeeRate = await commissionContract.platformFeeRate();
    const escrowFeeRate = await escrowContract.escrowFeeRate();

    console.log("\n⚙️  Initial Configuration:");
    console.log("   • Wallet Min Withdrawal:", ethers.formatEther(minWithdrawal), "ETH");
    console.log("   • Commission Platform Fee:", (platformFeeRate.toString() / 100).toFixed(2) + "%");
    console.log("   • Escrow Fee Rate:", (escrowFeeRate.toString() / 100).toFixed(2) + "%");

    // ==========================================
    // Save Deployment Information
    // ==========================================
    console.log("\n💾 Saving deployment information...");

    const deploymentInfo = {
      network: network.name,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      contracts: {
        KimuntuXWallet: {
          address: walletAddress,
          constructorArgs: [MINIMUM_WITHDRAWAL_AMOUNT.toString()],
          verified: false
        },
        KimuntuXCommissionSystem: {
          address: commissionAddress,
          constructorArgs: [],
          verified: false
        },
        PaymentEscrow: {
          address: escrowAddress,
          constructorArgs: [],
          verified: false
        }
      },
      configuration: {
        minimumWithdrawalAmount: ethers.formatEther(minWithdrawal) + " ETH",
        platformFeeRate: (platformFeeRate.toString() / 100).toFixed(2) + "%",
        escrowFeeRate: (escrowFeeRate.toString() / 100).toFixed(2) + "%"
      }
    };

    // Save to JSON file
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${network.name}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("   ✅ Deployment info saved to:", deploymentFile);

    // ==========================================
    // Summary
    // ==========================================
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                  🎉 DEPLOYMENT SUCCESSFUL!                  ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    console.log("📍 Contract Addresses:");
    console.log("   • KimuntuXWallet:", walletAddress);
    console.log("   • KimuntuXCommissionSystem:", commissionAddress);
    console.log("   • PaymentEscrow:", escrowAddress);

    if (network.name === "sepolia") {
      console.log("\n🔗 Etherscan Links:");
      console.log("   • Wallet: https://sepolia.etherscan.io/address/" + walletAddress);
      console.log("   • Commission: https://sepolia.etherscan.io/address/" + commissionAddress);
      console.log("   • Escrow: https://sepolia.etherscan.io/address/" + escrowAddress);
    }

    console.log("\n📝 Next Steps:");
    console.log("   1. Verify contracts on Etherscan:");
    console.log("      npm run verify:sepolia");
    console.log("   2. Update demo.html with contract addresses");
    console.log("   3. Configure backend with contract addresses and ABIs");
    console.log("   4. Test all contract functions on testnet");
    console.log("   5. Get security audit before mainnet deployment");

    console.log("\n✨ Deployment complete! All contracts are ready for testing.\n");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
