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
  r:string;
  s:string;
  v:string;
  nonce:string;
  from:string;
}

//address _from, address _to, uint _amount, uint _nonce, bytes32 r, bytes32 s, uint8 v

export default function redeemTask(){
  task("redeem", "Redeem tokens")
  .addParam("gas", "Gas usage limit for this transation")
  .addParam("privatekey", "You private key")
  .addParam("to", "Address of contract you wanna interact")
  .addParam("from", "Tokens owner on another chain")
  .addParam("nonce", "Nonce")
  .addParam("amount", "Tokens amount")
  .addParam("r", "r param of signature")
  .addParam("s", "s param of signature")
  .addParam("v", "v param of signature")
  .addParam("fromchain", "From chain")
  .addParam("tochain", "From chain")
  .setAction(async(taskArgs: TaskArgsType, hre)=>{
    try{
      let {gas, privatekey, to, receiver, amount, fromchain, tochain, nonce, r, s, v, from} = taskArgs;
      let current_bridge;
      if(fromchain === "BSC"){
        current_bridge = bsc_Bridge;
      }else if(fromchain === "ETH"){
        current_bridge = eth_Bridge;
      }else{
        throw new Error(`This bridge doesn't service ${fromchain}`);
      }
      let data = await current_bridge.methods.redeem(from, to, amount, nonce, r, s, v).encodeABI();
      let sign = await getSign({gas,privatekey,data,to});
      let transaction = await web3.eth.sendSignedTransaction(sign.rawTransaction);
      console.log(transaction.transactionHash);
    }catch(e:any){
      console.log(e.message)
    }
  })
}
