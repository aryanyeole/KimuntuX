// verify-fixes.js - Verify all contract fixes have been applied
const fs = require('fs');
const path = require('path');

console.log("\n🔍 Verifying Contract Fixes...\n");

let allPassed = true;

// Contracts to check
const contracts = [
    'KimuntuXWallet.sol',
    'KimuntuXCommissionSystem.sol',
    'PaymentEscrow.sol'
];

contracts.forEach(contractName => {
    console.log(`📄 Checking ${contractName}...`);

    const filePath = path.join(__dirname, '..', contractName);
    const content = fs.readFileSync(filePath, 'utf8');

    let contractPassed = true;

    // Check 1: Import paths use utils/ not security/
    if (content.includes('security/ReentrancyGuard')) {
        console.log(`   ❌ FAIL: Still uses security/ReentrancyGuard`);
        contractPassed = false;
        allPassed = false;
    } else if (content.includes('utils/ReentrancyGuard')) {
        console.log(`   ✅ PASS: Using utils/ReentrancyGuard`);
    }

    if (content.includes('security/Pausable')) {
        console.log(`   ❌ FAIL: Still uses security/Pausable`);
        contractPassed = false;
        allPassed = false;
    } else if (content.includes('utils/Pausable')) {
        console.log(`   ✅ PASS: Using utils/Pausable`);
    }

    // Check 2: Constructor has Ownable(msg.sender)
    if (content.includes('constructor(') && !content.includes('Ownable(msg.sender)')) {
        console.log(`   ❌ FAIL: Constructor missing Ownable(msg.sender)`);
        contractPassed = false;
        allPassed = false;
    } else if (content.includes('Ownable(msg.sender)')) {
        console.log(`   ✅ PASS: Constructor has Ownable(msg.sender)`);
    }

    // Check 3: Solidity version (specific to each contract)
    if (contractName === 'PaymentEscrow.sol') {
        if (content.includes('pragma solidity ^0.8.19')) {
            console.log(`   ❌ FAIL: Using Solidity 0.8.19 (should be 0.8.20)`);
            contractPassed = false;
            allPassed = false;
        } else if (content.includes('pragma solidity ^0.8.20')) {
            console.log(`   ✅ PASS: Using Solidity 0.8.20`);
        }
    } else {
        if (content.includes('pragma solidity ^0.8.20')) {
            console.log(`   ✅ PASS: Using Solidity 0.8.20`);
        }
    }

    if (contractPassed) {
        console.log(`   ✅ ${contractName} - ALL CHECKS PASSED\n`);
    } else {
        console.log(`   ❌ ${contractName} - SOME CHECKS FAILED\n`);
    }
});

console.log("═══════════════════════════════════════════════════════");
if (allPassed) {
    console.log("✅ ALL CONTRACTS FIXED SUCCESSFULLY!");
    console.log("\nNext steps:");
    console.log("1. npm install");
    console.log("2. npm run compile");
    console.log("3. npm run deploy:sepolia");
    console.log("4. npm run verify:sepolia");
    console.log("\nSee TESTING_GUIDE.md for comprehensive testing instructions.");
} else {
    console.log("❌ SOME FIXES STILL NEEDED!");
    console.log("\nPlease review the failures above and:");
    console.log("1. Fix the issues marked with ❌");
    console.log("2. Run this script again: node scripts/verify-fixes.js");
    console.log("3. See FIXES_REQUIRED.md for detailed fix instructions");
}
console.log("═══════════════════════════════════════════════════════\n");

process.exit(allPassed ? 0 : 1);
