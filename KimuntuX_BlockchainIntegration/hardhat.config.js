require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { subtask } = require("hardhat/config");
const {
  TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
  TASK_COMPILE_SOLIDITY_RUN_SOLCJS,
} = require("hardhat/builtin-tasks/task-names");

subtask(TASK_COMPILE_SOLIDITY_COMPILE_SOLC).setAction(
  async (args, hre, runSuper) => {
    try {
      return await runSuper(args);
    } catch (error) {
      if (!String(error?.message || "").includes("HH505")) {
        throw error;
      }

      const solcJsPath = require.resolve("solc/soljson.js");
      console.warn("\nUsing solc-js fallback because the native solc binary could not run.\n");
      const output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLCJS, {
        input: args.input,
        solcJsPath,
      });

      return {
        output,
        solcBuild: {
          version: args.solcVersion,
          longVersion: args.solcVersion,
          compilerPath: solcJsPath,
          isSolcJs: true,
        },
      };
    }
  }
);

const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.PLATFORM_PRIVATE_KEY || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";

module.exports = {
  solidity: {
    version: "0.8.20",
    preferWasm: true,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
        accountsBalance: "10000000000000000000000"
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
