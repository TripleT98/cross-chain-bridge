import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
require("./tasks/task_root");
require("./tasks/task");

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
      rinkeby:{
       url:process.env.INFURA_URL as string,
       accounts:[`${process.env.PRIVATE_KEY as string}`]
     }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY as string
  },
};

export default config;
