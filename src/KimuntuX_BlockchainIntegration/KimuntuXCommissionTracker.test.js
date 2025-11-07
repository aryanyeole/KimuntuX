// test/KimuntuXCommissionTracker.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("KimuntuXCommissionTracker", function () {
  // Fixture for deploying the contract
  async function deployCommissionTrackerFixture() {
    const [owner, affiliate1, affiliate2, platform, unauthorized] = await ethers.getSigners();
    
    const minimumThreshold = ethers.utils.parseEther("0.01"); // 0.01 ETH
    
    const KimuntuXCommissionTracker = await ethers.getContractFactory("KimuntuXCommissionTracker");
    const commissionTracker = await KimuntuXCommissionTracker.deploy(minimumThreshold);
    await commissionTracker.deployed();
    
    // Fund contract for testing payouts
    await owner.sendTransaction({
      to: commissionTracker.address,
      value: ethers.utils.parseEther("1.0")
    });
    
    return { commissionTracker, owner, affiliate1, affiliate2, platform, unauthorized, minimumThreshold };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { commissionTracker, owner } = await loadFixture(deployCommissionTrackerFixture);
      expect(await commissionTracker.owner()).to.equal(owner.address);
    });

    it("Should set the correct minimum payout threshold", async function () {
      const { commissionTracker, minimumThreshold } = await loadFixture(deployCommissionTrackerFixture);
      expect(await commissionTracker.minimumPayoutThreshold()).to.equal(minimumThreshold);
    });

    it("Should authorize deployer as platform", async function () {
      const { commissionTracker, owner } = await loadFixture(deployCommissionTrackerFixture);
      expect(await commissionTracker.authorizedPlatforms(owner.address)).to.be.true;
    });
  });

  describe("Platform Authorization", function () {
    it("Should allow owner to authorize platforms", async function () {
      const { commissionTracker, platform } = await loadFixture(deployCommissionTrackerFixture);
      
      await commissionTracker.authorizePlatform(platform.address);
      expect(await commissionTracker.authorizedPlatforms(platform.address)).to.be.true;
    });

    it("Should emit PlatformAuthorized event", async function () {
      const { commissionTracker, platform } = await loadFixture(deployCommissionTrackerFixture);
      
      await expect(commissionTracker.authorizePlatform(platform.address))
        .to.emit(commissionTracker, "PlatformAuthorized")
        .withArgs(platform.address);
    });

    it("Should allow owner to revoke platform authorization", async function () {
      const { commissionTracker, platform } = await loadFixture(deployCommissionTrackerFixture);
      
      await commissionTracker.authorizePlatform(platform.address);
      await commissionTracker.revokePlatform(platform.address);
      
      expect(await commissionTracker.authorizedPlatforms(platform.address)).to.be.false;
    });

    it("Should prevent non-owner from authorizing platforms", async function () {
      const { commissionTracker, platform, unauthorized } = await loadFixture(deployCommissionTrackerFixture);
      
      await expect(
        commissionTracker.connect(unauthorized).authorizePlatform(platform.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Commission Recording", function () {
    it("Should record a commission successfully", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const amount = ethers.utils.parseEther("0.05");
      const transactionId = "TX-001";
      const offerId = "OFFER-123";
      const metadata = JSON.stringify({ source: "facebook", campaign: "summer-sale" });
      
      await expect(
        commissionTracker.recordCommission(affiliate1.address, amount, transactionId, offerId, metadata)
      ).to.emit(commissionTracker, "CommissionRecorded")
        .withArgs(affiliate1.address, amount, transactionId, offerId, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
    });

    it("Should update total commissions tracked", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const amount = ethers.utils.parseEther("0.05");
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        amount, 
        "TX-001", 
        "OFFER-123", 
        "{}"
      );
      
      expect(await commissionTracker.totalCommissionsTracked()).to.equal(amount);
    });

    it("Should prevent unauthorized platforms from recording commissions", async function () {
      const { commissionTracker, affiliate1, unauthorized } = await loadFixture(deployCommissionTrackerFixture);
      
      await expect(
        commissionTracker.connect(unauthorized).recordCommission(
          affiliate1.address,
          ethers.utils.parseEther("0.05"),
          "TX-001",
          "OFFER-123",
          "{}"
        )
      ).to.be.revertedWith("Not authorized platform");
    });

    it("Should prevent recording duplicate transaction IDs", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const amount = ethers.utils.parseEther("0.05");
      const transactionId = "TX-001";
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        amount, 
        transactionId, 
        "OFFER-123", 
        "{}"
      );
      
      await expect(
        commissionTracker.recordCommission(
          affiliate1.address, 
          amount, 
          transactionId, 
          "OFFER-123", 
          "{}"
        )
      ).to.be.revertedWith("Transaction already recorded");
    });

    it("Should prevent recording zero amount", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      await expect(
        commissionTracker.recordCommission(
          affiliate1.address, 
          0, 
          "TX-001", 
          "OFFER-123", 
          "{}"
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Commission Approval", function () {
    it("Should approve pending commission and update balance", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const amount = ethers.utils.parseEther("0.05");
      const transactionId = "TX-001";
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        amount, 
        transactionId, 
        "OFFER-123", 
        "{}"
      );
      
      await expect(commissionTracker.approveCommission(transactionId))
        .to.emit(commissionTracker, "CommissionApproved")
        .withArgs(transactionId, affiliate1.address, amount);
      
      expect(await commissionTracker.affiliateBalances(affiliate1.address)).to.equal(amount);
      expect(await commissionTracker.totalEarned(affiliate1.address)).to.equal(amount);
    });

    it("Should prevent approving non-existent commission", async function () {
      const { commissionTracker } = await loadFixture(deployCommissionTrackerFixture);
      
      await expect(
        commissionTracker.approveCommission("NON-EXISTENT")
      ).to.be.revertedWith("Commission not found");
    });
  });

  describe("Payouts", function () {
    it("Should process payout successfully when above threshold", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const amount = ethers.utils.parseEther("0.05");
      const transactionId = "TX-001";
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        amount, 
        transactionId, 
        "OFFER-123", 
        "{}"
      );
      
      await commissionTracker.approveCommission(transactionId);
      
      const balanceBefore = await ethers.provider.getBalance(affiliate1.address);
      
      await expect(commissionTracker.processPayout(affiliate1.address))
        .to.emit(commissionTracker, "CommissionPaid");
      
      const balanceAfter = await ethers.provider.getBalance(affiliate1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
      
      expect(await commissionTracker.affiliateBalances(affiliate1.address)).to.equal(0);
    });

    it("Should prevent payout below minimum threshold", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const amount = ethers.utils.parseEther("0.005"); // Below 0.01 threshold
      const transactionId = "TX-001";
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        amount, 
        transactionId, 
        "OFFER-123", 
        "{}"
      );
      
      await commissionTracker.approveCommission(transactionId);
      
      await expect(
        commissionTracker.processPayout(affiliate1.address)
      ).to.be.revertedWith("Below minimum threshold");
    });

    it("Should check if affiliate can request payout", async function () {
      const { commissionTracker, affiliate1, minimumThreshold } = await loadFixture(deployCommissionTrackerFixture);
      
      expect(await commissionTracker.canRequestPayout(affiliate1.address)).to.be.false;
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        minimumThreshold, 
        "TX-001", 
        "OFFER-123", 
        "{}"
      );
      
      await commissionTracker.approveCommission("TX-001");
      
      expect(await commissionTracker.canRequestPayout(affiliate1.address)).to.be.true;
    });
  });

  describe("Commission Disputes", function () {
    it("Should allow affiliate to dispute their commission", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const transactionId = "TX-001";
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        ethers.utils.parseEther("0.05"), 
        transactionId, 
        "OFFER-123", 
        "{}"
      );
      
      await expect(
        commissionTracker.connect(affiliate1).disputeCommission(transactionId, "Payment not received")
      ).to.emit(commissionTracker, "CommissionDisputed")
        .withArgs(transactionId, affiliate1.address, "Payment not received");
    });

    it("Should allow owner to dispute any commission", async function () {
      const { commissionTracker, owner, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const transactionId = "TX-001";
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        ethers.utils.parseEther("0.05"), 
        transactionId, 
        "OFFER-123", 
        "{}"
      );
      
      await expect(
        commissionTracker.connect(owner).disputeCommission(transactionId, "Fraud detected")
      ).to.emit(commissionTracker, "CommissionDisputed");
    });
  });

  describe("View Functions", function () {
    it("Should return correct commission count", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        ethers.utils.parseEther("0.05"), 
        "TX-001", 
        "OFFER-123", 
        "{}"
      );
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        ethers.utils.parseEther("0.03"), 
        "TX-002", 
        "OFFER-456", 
        "{}"
      );
      
      expect(await commissionTracker.getCommissionCount(affiliate1.address)).to.equal(2);
    });

    it("Should return correct contract statistics", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      const amount = ethers.utils.parseEther("0.05");
      
      await commissionTracker.recordCommission(
        affiliate1.address, 
        amount, 
        "TX-001", 
        "OFFER-123", 
        "{}"
      );
      
      const [totalTracked, totalPaid, contractBalance] = await commissionTracker.getContractStats();
      
      expect(totalTracked).to.equal(amount);
      expect(totalPaid).to.equal(0);
      expect(contractBalance).to.equal(ethers.utils.parseEther("1.0"));
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update payout threshold", async function () {
      const { commissionTracker } = await loadFixture(deployCommissionTrackerFixture);
      
      const newThreshold = ethers.utils.parseEther("0.02");
      
      await expect(commissionTracker.updatePayoutThreshold(newThreshold))
        .to.emit(commissionTracker, "PayoutThresholdUpdated")
        .withArgs(newThreshold);
      
      expect(await commissionTracker.minimumPayoutThreshold()).to.equal(newThreshold);
    });

    it("Should allow owner to pause and unpause contract", async function () {
      const { commissionTracker, affiliate1 } = await loadFixture(deployCommissionTrackerFixture);
      
      await commissionTracker.pause();
      
      await expect(
        commissionTracker.recordCommission(
          affiliate1.address, 
          ethers.utils.parseEther("0.05"), 
          "TX-001", 
          "OFFER-123", 
          "{}"
        )
      ).to.be.revertedWith("Pausable: paused");
      
      await commissionTracker.unpause();
      
      await expect(
        commissionTracker.recordCommission(
          affiliate1.address, 
          ethers.utils.parseEther("0.05"), 
          "TX-001", 
          "OFFER-123", 
          "{}"
        )
      ).to.not.be.reverted;
    });

    it("Should allow owner to fund contract", async function () {
      const { commissionTracker } = await loadFixture(deployCommissionTrackerFixture);
      
      const fundAmount = ethers.utils.parseEther("0.5");
      
      await expect(
        commissionTracker.fundContract({ value: fundAmount })
      ).to.changeEtherBalance(commissionTracker, fundAmount);
    });

    it("Should allow owner to emergency withdraw", async function () {
      const { commissionTracker, owner } = await loadFixture(deployCommissionTrackerFixture);
      
      const withdrawAmount = ethers.utils.parseEther("0.5");
      
      await expect(
        commissionTracker.emergencyWithdraw(withdrawAmount)
      ).to.changeEtherBalance(owner, withdrawAmount);
    });
  });
});
