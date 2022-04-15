import {
  web3, task, envParams, getSign,
  eth_ERC20,
  bsc_ERC20,
  bsc_Bridge,
  eth_Bridge,
} from "./task";

export async function setAdminETH(){
  task("setadmineth", "Set minter")
  .addParam("to", "Whom")
  .addParam("contract", "ERC20 contract")
  .setAction(async(tA)=>{
    let {to, contract} = tA;
    let data = await eth_ERC20.methods.addAdmin(to).encodeABI();
    let sign = await getSign({privatekey: envParams.PRIVATE_KEY as string, gas: "100000", data, to: contract});
    let transaction = await web3.eth.sendSignedTransaction(sign.rawTransaction);
    console.log(transaction.transactionHash);
  })
}
export async function setAdminBSC(){
  task("setadminbsc", "Set minter")
  .addParam("to", "Whom")
  .addParam("contract", "ERC20 contract")
  .setAction(async(tA)=>{
    let {to, contract} = tA;
    let data = await bsc_ERC20.methods.addAdmin(to).encodeABI();
    let sign = await getSign({privatekey: envParams.PRIVATE_KEY as string, gas: "100000", data, to: contract});
    let transaction = await web3.eth.sendSignedTransaction(sign.rawTransaction);
    console.log(transaction.transactionHash);
  })
}
