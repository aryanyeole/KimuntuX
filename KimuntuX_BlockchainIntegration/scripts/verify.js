// verify.js - Verify deployed contracts on Etherscan
const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🔍 Starting contract verification on Etherscan...\n");

  // Load deployment info
  const deploymentFile = path.join(__dirname, `../deployments/${network.name}-deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found:", deploymentFile);
    console.error("   Please deploy contracts first: npm run deploy:sepolia");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contracts = deployment.contracts;

  console.log("📋 Verifying contracts from deployment:", deployment.timestamp);
  console.log("   Network:", network.name);
  console.log();

  // Verify each contract
  for (const [contractName, contractInfo] of Object.entries(contracts)) {
    try {
      console.log(`🔎 Verifying ${contractName}...`);
      console.log(`   Address: ${contractInfo.address}`);

      await run("verify:verify", {
        address: contractInfo.address,
        constructorArguments: contractInfo.constructorArgs,
      });

      console.log(`   ✅ ${contractName} verified successfully!\n`);

      // Update deployment file
      contractInfo.verified = true;

    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`   ℹ️  ${contractName} is already verified\n`);
        contractInfo.verified = true;
      } else {
        console.error(`   ❌ Error verifying ${contractName}:`, error.message);
        console.error(`   Full error:`, error);
        console.log();
      }
    }
  }

  // Save updated deployment info
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              ✅ VERIFICATION COMPLETE!                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  if (network.name === "sepolia") {
    console.log("🔗 View verified contracts on Etherscan:");
    for (const [contractName, contractInfo] of Object.entries(contracts)) {
      console.log(`   • ${contractName}: https://sepolia.etherscan.io/address/${contractInfo.address}#code`);
    }
  }

  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
