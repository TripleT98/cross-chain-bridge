import {web3, task, envParams, getSign,
eth_ERC20,
bsc_ERC20,
bsc_Bridge,
eth_Bridge,
} from "./task";
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
  token: string;
}


export default function swapTask(){
  task("swap", "Tokens swap between two chains")
  .addParam("token", "Token address")
  .addParam("gas", "Gas usage limit for this transation")
  .addParam("privatekey", "You private key")
  .addParam("to", "Address of token contract you wanna interact")
  .addParam("receiver", "Tokens receiver")
  .addParam("amount", "Amount of tokens you wanna swap")
  .addParam("fromchain", "From chain")
  .addParam("tochain", "From chain")
  .setAction(async(taskArgs: TaskArgsType, hre)=>{
    try{
      let {ethers} = hre;
      let {gas, privatekey, to, receiver, amount, fromchain, tochain, token} = taskArgs;
      await mint(token, envParams.PRIVATE_KEY as string, envParams.PUBLIC_KEY as string, amount, fromchain, gas);
      let current_bridge;
      let address;
      if(fromchain === "BSC"){
        current_bridge = bsc_Bridge;
        address = envParams.bsc_Bridge as string;
      }else if(fromchain === "ETH"){
        current_bridge = eth_Bridge;
        address = envParams.eth_Bridge as string;
      }else{
        throw new Error(`This bridge doesn't service ${fromchain}`);
      }
      let data = await current_bridge.methods.swap(token, receiver, amount, tochain).encodeABI();
      let sign = await getSign({gas,privatekey,data,to:address});
      let transaction = await web3.eth.sendSignedTransaction(sign.rawTransaction);

      let msg:string = web3.utils.soliditySha3(fromchain, token, envParams.PUBLIC_KEY as string, receiver, amount, envParams.nonce as string) as string;
      let signature = await web3.eth.accounts.sign(msg, envParams.PRIVATE_KEY as string);
      let v = signature.v == "0x1c"?28:27;
      let r = signature.r;
      let s = signature.s;

      console.log("Use this parameters to redeem tokens in", fromchain, "\n",
                   `r:${r} \n s:${s} \n v:${v} \n from:${envParams.PUBLIC_KEY}, to:${receiver}, amount:${amount}, nonce:${envParams.nonce}`);
    }catch(e:any){
      console.log(e.message)
    }
  })
}
