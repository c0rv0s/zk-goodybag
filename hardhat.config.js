require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-abi-exporter");
require("hardhat-gas-reporter");
require("@semaphore-protocol/hardhat");
require("./tasks/deploy"); // Your deploy task.

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
};
