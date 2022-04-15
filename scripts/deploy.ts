import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function main() {
  let [relayer]: SignerWithAddress[] = await ethers.getSigners();
  const BSC_Bridge = await ethers.getContractFactory("Bridge");
  const ETH_Bridge = await ethers.getContractFactory("Bridge");
  const BSC_ERC20 = await ethers.getContractFactory("MyERC20");
  const ETH_ERC20 = await ethers.getContractFactory("MyERC20");

  const eth_ERC20 = await ETH_ERC20.deploy();
  const bsc_ERC20 = await BSC_ERC20.deploy();



  await eth_ERC20.deployed();
  await bsc_ERC20.deployed();

  const bsc_Bridge = await BSC_Bridge.deploy(relayer.address, bsc_ERC20.address, "ETH");
  const eth_Bridge = await ETH_Bridge.deploy(relayer.address, eth_ERC20.address, "BSC");

  await bsc_Bridge.deployed();
  await eth_Bridge.deployed();

  console.log("eth_ERC20 deployed to:", eth_ERC20.address);
  console.log("bsc_ERC20 deployed to:", bsc_ERC20.address);
  console.log("bsc_Bridge deployed to:", bsc_Bridge.address);
  console.log("eth_Bridge deployed to:", eth_Bridge.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
