import {web3, task, envParams, getSign,
eth_ERC20,
bsc_ERC20,
} from "./task";

export default async function mint(token: string, minter_private_key: string, to: string, amount: string, chain: string, gas: string): Promise<void | never> {
  try{
  if(chain === "BSC"){
      let data: string = await bsc_ERC20.methods.mint(to, amount).encodeABI();
      let sign = await getSign({gas, to: token, privatekey:minter_private_key, data});
      let transation = await web3.eth.sendSignedTransaction(sign.rawTransaction);
  }else if(chain === "ETH"){
      let data: string = await eth_ERC20.methods.mint(to, amount).encodeABI();
      let sign = await getSign({gas, to: envParams.eth_ERC20 as string, privatekey:minter_private_key, data});
      let transation = await web3.eth.sendSignedTransaction(sign.rawTransaction);
      console.log(await eth_ERC20.methods.balanceOf(to).call());
  }
}catch(e: any){
  console.log(e.message);
}

}
