require('@nomicfoundation/hardhat-toolbox');
require('@nomiclabs/hardhat-solhint');
require('solidity-coverage');
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();

const { WALLET_PRIVATE_KEY } = process.env;
const { POLYGONSCAN_API_KEY } = process.env;
const { INFURA_URL } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.10',
  networks: {
    matic: {
      url: INFURA_URL,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    localhost: {
      url: process.env.LOCALHOST_URL || '',
      accounts:
        process.env.LOCAL_PRIVATE_KEY !== undefined
          ? [process.env.LOCAL_PRIVATE_KEY]
          : [],
    },
  },
  etherscan: {
    apiKey: POLYGONSCAN_API_KEY,
  },
};
