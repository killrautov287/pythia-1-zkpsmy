import * as dotenv from "dotenv";
import { HardhatUserConfig, } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import 'hardhat-deploy';
import { Wallet } from "ethers";


dotenv.config();


const MNEMONIC =
  process.env.MNEMONIC ||
  'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm';

const INFURA_KEY = process.env.INFURA_KEY || '';
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';

const MAINNET_FORK = process.env.MAINNET_FORK === 'true';
const FORKING_BLOCK = parseInt(process.env.FORKING_BLOCK || '')

const mainnetFork =
  MAINNET_FORK && FORKING_BLOCK
    ? {
      blockNumber: FORKING_BLOCK,
      url: ALCHEMY_KEY
        ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`
        : `https://main.infura.io/v3/${INFURA_KEY}`,
    }
    : undefined;


const accounts = Array.from(Array(20), (_, index) => {
  const wallet = Wallet.fromMnemonic(MNEMONIC, `m/44'/60'/0'/0/${index}`);
  return {
    privateKey: wallet.privateKey,
    balance: '1000000000000000000000000'
  }
})

const LOCAL_CHAIN_ID = 31337;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.4',
      },
    ],
  },
  typechain: {
    outDir: 'types',
  },
  etherscan: {
    apiKey: process.env.INFURA_KEY,
  },
  defaultNetwork: 'hardhat',
  paths: {
    sources: "./package/contracts"
  },
  networks: {
    hardhat: {
      live: false,
      hardfork: 'london',
      chainId: LOCAL_CHAIN_ID,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts,
      forking: mainnetFork,
      saveDeployments: false
    },
    ganache: {
      live: false,
      url: 'http://ganache:8545',
      accounts: accounts.map(account => account.privateKey),
    },
    coverage: {
      live: false,
      url: 'http://localhost:8555',
    },
  },
};


export default config;