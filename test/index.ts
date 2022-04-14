let { expect } = require("chai");
let hre = require("hardhat");
let {ethers} = hre;
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Signer, Contract, ContractFactory, BigNumber } from "ethers";
import web3 from "web3";
import Server, {IServer, ReturnedParams} from "./server";



describe("Testing cross chain bridge", function () {

  let ETH_Bridge:ContractFactory, BSC_Bridge:ContractFactory, ETH_ERC20: ContractFactory, BSC_ERC20: ContractFactory,
  eth_Bridge:Contract, bsc_Bridge:Contract, eth_ERC20: Contract, bsc_ERC20: Contract,
  owner: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress, relayer: SignerWithAddress,
  mintVal: string = String(2*(10**18)),
  server: IServer;

  async function getBalance(user_address:string, token: Contract):Promise<string>{
    return String(await token.balanceOf(user_address));
  };

  beforeEach(async()=>{
    [owner, user1, user2, user3, relayer] = await ethers.getSigners();

    ETH_ERC20 = await ethers.getContractFactory("MyERC20");
    eth_ERC20 = await ETH_ERC20.connect(owner).deploy();
    await eth_ERC20.deployed();
    //console.log("ETH ERC20:",eth_ERC20.address);

    BSC_ERC20 = await ethers.getContractFactory("MyERC20");
    bsc_ERC20 = await BSC_ERC20.connect(owner).deploy();
    await bsc_ERC20.deployed();
    //console.log("BSC ERC20:",bsc_ERC20.address);

    ETH_Bridge = await ethers.getContractFactory("Bridge");
    eth_Bridge = await ETH_Bridge.connect(owner).deploy(relayer.address, eth_ERC20.address, "Ethereum");
    await eth_Bridge.deployed();
    //console.log("ETH bridge:",eth_Bridge.address);

    BSC_Bridge = await ethers.getContractFactory("Bridge");
    bsc_Bridge = await BSC_Bridge.connect(owner).deploy(relayer.address, bsc_ERC20.address, "BinansSmartChain");
    await bsc_Bridge.deployed();
    //console.log("BSC bridge:",bsc_Bridge.address);

    await eth_ERC20.connect(owner).addAdmin(eth_Bridge.address);
    await bsc_ERC20.connect(owner).addAdmin(bsc_Bridge.address);

    server = new Server(relayer);

  });


  afterEach(async()=>{
  })



  it("Get chain_names and relayer's address", async function () {
    expect(await eth_Bridge.relayer()).to.equal(relayer.address);
    expect(await eth_Bridge.chain_name()).to.equal("Ethereum");
    expect(await bsc_Bridge.relayer()).to.equal(relayer.address);
    expect(await bsc_Bridge.chain_name()).to.equal("BinansSmartChain");
  });

  it("Testing that swap function realy burns tokens", async()=>{
    let filter = eth_Bridge.filters.SwapInitialized();
    let provider = hre.network.provider;
    await eth_ERC20.connect(owner).mint(user1.address, mintVal);
    expect(await getBalance(user1.address, eth_ERC20)).to.equal(mintVal);
    await expect(eth_Bridge.connect(user1).swap(user2.address, mintVal, "BinansSmartChain")).to.emit(eth_Bridge, 'SwapInitialized').withArgs(user1.address, user2.address, mintVal, "Ethereum", "BinansSmartChain");
    expect(await getBalance(user1.address, eth_ERC20)).to.equal("0");
  })

  it("Redeem function should check input parameters and recover relayer's address. And mint tokens to caller if address is valid", async()=>{
    eth_Bridge.on(eth_Bridge.filters.SwapInitialized(/*user1.address, user2.address*/),async (from,to,amount,from_chain,to_chain)=>{
      await server.sign({to, amount: String(amount), from, from_chain, to_chain});
      console.log("Sign");
    });
    let val: string = "1000000";
    await eth_ERC20.connect(owner).mint(owner.address, mintVal);
    await eth_Bridge.connect(owner).swap(user1.address, val, "BinansSmartChain");
    await new Promise((res,rej)=>setTimeout(() => {
      res(1);
    }, 4000));
    console.log("Get data");
    let dataArr: ReturnedParams[] = server.getData(user1.address, owner.address) as ReturnedParams[];
    let {from, to, nonce, amount, r, s, v} = dataArr[0];
    await bsc_Bridge.connect(owner).redeem(from, to, amount, nonce, r, s, v);
    expect(await bsc_ERC20.balanceOf(user1.address)).to.equal(val);
  })

describe("Testin reverts with error", async()=>{

  it("Trying to swap and no tokens on balance", async()=>{
    let err_mess: string = "Error: Not enough tokens to swap!";
    await expect(eth_Bridge.connect(user1).swap(user2.address, mintVal, "BinansSmartChain")).to.be.revertedWith(err_mess);
  })


  it("Trying to call redeem function with wrong parameters configuration", async()=>{
    let err_mess: string = "Error: This transaction signed not by relayer!";
    let val: string = "100000";
    await server.sign({to: user1.address, amount: val, from: owner.address, from_chain: "Ethereum", to_chain: "BinansSmartChain"});
    let dataArr: ReturnedParams[] = server.getData(user1.address, owner.address) as ReturnedParams[];
    let {from, to, nonce, amount, r, s, v} = dataArr[0];
    await expect(bsc_Bridge.connect(owner).redeem(user2.address, user1.address, val, 1, r, s, v)).to.be.revertedWith(err_mess);
  })

  it("Trying to call reedem function twise with the same parameters", async()=>{
    let val: string = "1000000";
    let err_mess: string = "Error: This transaction has been handled before!";
    await eth_ERC20.connect(owner).mint(owner.address, mintVal);
    await eth_Bridge.connect(owner).swap(user1.address, val, "BinansSmartChain");
    await server.sign({to: user1.address, amount: val, from: owner.address, from_chain: "Ethereum", to_chain: "BinansSmartChain"});
    let dataArr: ReturnedParams[] = server.getData(user1.address, owner.address) as ReturnedParams[];
    let {from, to, nonce, amount, r, s, v} = dataArr[0];
    await bsc_Bridge.connect(owner).redeem(from, to, amount, nonce, r, s, v);
    await expect(bsc_Bridge.connect(owner).redeem(from, to, amount, nonce, r, s, v)).to.be.revertedWith(err_mess);
  })


})


});
