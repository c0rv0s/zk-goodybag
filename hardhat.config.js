require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-abi-exporter");
require("hardhat-gas-reporter");
require("@semaphore-protocol/hardhat");
require("./tasks/deploy"); // Your deploy task.
require("./tasks/deploy_editions"); 

const config = require("./config.json");

const settings = {
  optimizer: {
    enabled: true,
    runs: 200,
    details: {
      yul: true,
    },
  },
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings,
      },
    ],
  },
  networks: {
    mumbai: {
      url: config.ALCHEMY_MUMBAI_URL,
      accounts: [config.PRIVATE_KEY],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "24J65UXD6STS4UE5K9X3EPNFWEX7ZCWD8P" // config.polyscan for polygon/mumbai
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 15,
    enabled: false,
  },
};
