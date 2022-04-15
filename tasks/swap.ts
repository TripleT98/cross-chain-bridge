import {web3, task, envParams, getSign,
eth_ERC20,
bsc_ERC20,
bsc_Bridge,
eth_Bridge,
/*Server*/} from "./task";
import mint from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

type TaskArgsType = {
  gas: string;
  privatekey: string;
  to: string;
  receiver: string;
  amount: string;
  fromchain: string;
  tochain: string;
}


export default function swapTask(){
  task("swap", "Tokens swap between two chains")
  .addParam("gas", "Gas usage limit for this transation")
  .addParam("privatekey", "You private key")
  .addParam("to", "Address of contract you wanna interact")
  .addParam("receiver", "Tokens receiver")
  .addParam("amount", "Amount of tokens you wanna swap")
  .addParam("fromchain", "From chain")
  .addParam("tochain", "From chain")
  .setAction(async(taskArgs: TaskArgsType, hre)=>{
    try{
      ///let [relayer]:SignerWithAddress[] = await hre.ethers.getSigners();
      //let server = new Server(relayer);
      let {gas, privatekey, to, receiver, amount, fromchain, tochain} = taskArgs;
      await mint(envParams.PRIVATE_KEY as string, to, amount, fromchain, gas);
      let current_bridge;
      if(fromchain === "BSC"){
        current_bridge = bsc_Bridge;
      }else if(fromchain === "ETH"){
        current_bridge = eth_Bridge;
      }else{
        throw new Error(`This bridge doesn't service ${fromchain}`);
      }
      let data = await current_bridge.methods.swap(receiver, amount, tochain).encodeABI();
      let sign = await getSign({gas,privatekey,data,to});
      let transaction = await web3.eth.sendSignedTransaction(sign.rawTransaction);
      console.log(transaction.transactionHash);
    }catch(e:any){
      console.log(e.message)
    }
  })
}
