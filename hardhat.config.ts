import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import('@openzeppelin/hardhat-upgrades');
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import * as dotenv from "dotenv";

dotenv.config();

const BSC_API_KEY = process.env.BSC_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${[INFURA_API_KEY]}`,
      }
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
      // ensAddress: "0x0000000000000000000000000000000000000000",
    },
    bscMainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
      // ensAddress: "0x0000000000000000000000000000000000000000",
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${[INFURA_API_KEY]}`,
      chainId: 5,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${[INFURA_API_KEY]}`,
      chainId: 1,
      gasPrice: 200000000000,
      accounts: [PRIVATE_KEY]
    }
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: BSC_API_KEY,
  },
};

export default config;
