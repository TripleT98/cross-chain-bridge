import Web3 from "web3";
import * as dotenv from "dotenv";
import {task} from "hardhat/config";
import {provider as Provider} from "web3-core/types/index.d";
dotenv.config();
//import Server from "./../test/server";

let {abi:bridge_abi} = require("./../artifacts/contracts/Bridge.sol/Bridge.json");
let {abi:erc20_abi} = require("./../artifacts/contracts/ERC20.sol/MyERC20.json");

let envParams = process.env;

let provider: Provider = new Web3.providers.HttpProvider(`${envParams.META_MASK_PROVIDER_URL}`)
let web3: Web3 = new Web3(provider);

let eth_ERC20 = new web3.eth.Contract(erc20_abi, `${envParams.eth_ERC20}`);
let bsc_ERC20 = new web3.eth.Contract(erc20_abi, `${envParams.bsc_ERC20}`);
let bsc_Bridge = new web3.eth.Contract(bridge_abi, `${envParams.bsc_Bridge}`);
let eth_Bridge = new web3.eth.Contract(bridge_abi, `${envParams.eth_Bridge}`);


interface SignType {
  gas: string;
  privatekey: string;
  data: string;
  to: string;
}

async function getSign(obj:SignType):Promise<any> {
  //Создаю объект необходимый для подписи транзакций
    return await web3.eth.accounts.signTransaction({
      to:obj.to,//Адрес контракта, к которому нужно обратиться
      //value: web3js.utils.toWei(obj.value || "0", "wei") || null,//Велечина эфира, которую вы хотите отправить на контракт
      gas: Number(obj.gas),//Лимит газа, максимально допустимый газ, который вы допускаете использовать при выполнении транзакции.Чем больше лимит газа, тем более сложные операции можно провести при выполнении транзакции
      data: obj.data//Бинарный код транзакции, которую вы хотите выполнить
    }, obj.privatekey)
}

export {
  web3, task, envParams, getSign,
  eth_ERC20,
  bsc_ERC20,
  bsc_Bridge,
  eth_Bridge,
  //Server
}
