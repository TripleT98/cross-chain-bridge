let hre = require("hardhat");
let {ethers} = hre;
import web3 from "web3";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

type Params = {
  to: string;
  amount: string;
  from: string;
  from_chain: string;
  to_chain: string;
  token: string;
}

export type ReturnedParams = {
  to: string;
  amount: string;
  from: string;
  nonce: number;
  r: string;
  s: string;
  v: number;
  from_chain: string;
  to_chain: string;
  token: string;
}

type DataBase = {
  nonced:Map<string, number>;
  params:Map<string, Array<ReturnedParams>>;
}

export interface IServer{
  relayer: SignerWithAddress;
  dataBase: DataBase;
  sign(params: Params):Promise<string>;
  getData(to:string, from: string):ReturnedParams[] | undefined;
}



export default class Server implements IServer{
  relayer: SignerWithAddress;
  dataBase: DataBase;

  constructor(_relayer: SignerWithAddress){
    this.relayer = _relayer;
    this.dataBase = {} as DataBase;
    this.dataBase.nonced = new Map();
    this.dataBase.params = new Map();
    this.sign = this.sign.bind(this);
    this.getData = this.getData.bind(this);
  };

  async sign(params: Params):Promise<any>{
    let {token, to, amount, from, from_chain, to_chain} = params;
    try{
    let msg: string = web3.utils.soliditySha3(from, to) as string;
    let current_nonce: number | undefined = this.dataBase.nonced.get(msg);
    let current_swap: ReturnedParams[] = [] as ReturnedParams[];
    if(current_nonce === undefined){
      this.dataBase.nonced.set(msg, 0);
      current_nonce = 0;
      this.dataBase.params.set(msg, current_swap);
    }else{
      this.dataBase.nonced.set(msg, current_nonce + 1);
      current_nonce += 1;
    }
    current_swap = this.dataBase.params.get(msg) as ReturnedParams[];
    msg = web3.utils.soliditySha3(from_chain, token, from, to, amount, current_nonce) as string;
    let signature = await this.relayer.signMessage(ethers.utils.arrayify(msg));
    let sig = await ethers.utils.splitSignature(signature);
    let {r,s,v} = sig;
    let params: ReturnedParams = {
      to,
      amount,
      from,
      nonce: current_nonce,
      r,
      s,
      v,
      from_chain,
      to_chain,
      token
    };
    current_swap.push(params);
  }catch(e:any){
    console.log(e.message);
    return {success: false}
  }
    return {success: true};
  };

  getData(to:string, from:string):ReturnedParams[] | undefined{
    let hash: string = web3.utils.soliditySha3(from, to) as string
    let arr:ReturnedParams[] | undefined = this.dataBase.params.get(hash);
    return arr;
  }

}
