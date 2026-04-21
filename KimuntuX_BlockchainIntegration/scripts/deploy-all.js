const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const Wallet = await hre.ethers.getContractFactory("KimuXWallet");
  const wallet = await Wallet.deploy(hre.ethers.parseEther("0.001"));
  await wallet.waitForDeployment();
  console.log("KimuXWallet:", await wallet.getAddress());

  const Commission = await hre.ethers.getContractFactory("KimuXCommissionSystem");
  const commission = await Commission.deploy();
  await commission.waitForDeployment();
  console.log("KimuXCommissionSystem:", await commission.getAddress());

  const Escrow = await hre.ethers.getContractFactory("PaymentEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log("PaymentEscrow:", await escrow.getAddress());

  const deployment = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    contracts: {
      wallet: await wallet.getAddress(),
      commission: await commission.getAddress(),
      escrow: await escrow.getAddress(),
    },
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "..", "deployment-info.local.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2));
  console.log("Deployment info written to:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
