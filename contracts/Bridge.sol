//SPDX-License-Identifier: Unlicens
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./ERC20.sol";

contract Bridge{

  MyERC20 public token;
  address public relayer;
  string public chain_name;

  mapping (bytes32 => bool) public isValid;

  constructor(address _relayer, address _token, string memory _chain_name) {
    token = MyERC20(_token);
    relayer = _relayer;
    chain_name = _chain_name;
  }

  event SwapInitialized(address indexed from, address indexed to, uint amount, string from_chain, string to_chain);

  function swap(address _to, uint _amount, string calldata _to_chain) public {
    require(token.balanceOf(msg.sender) >= _amount, "Error: Not enough tokens to swap!");
    token.burn(msg.sender, _amount);
    emit SwapInitialized(msg.sender, _to, _amount, chain_name, _to_chain);
  }

  function redeem(address _from, address _to, uint _amount, uint _nonce, bytes32 r, bytes32 s, uint8 v) public {
    bytes32 message = keccak256(abi.encodePacked(_from, _to, _amount, _nonce));
    require(isValid[message] == false, "Error: This transaction has been handled before!");
    isValid[message] = true;
    message = _hashMessage(message);
    address relayer_addr = ecrecover(message, v, r, s);
    require(relayer_addr == relayer, "Error: This transaction signed not by relayer!");
    token.mint(_to, _amount);
  }

  function _hashMessage(bytes32 _message) pure private returns(bytes32) {
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    return keccak256(abi.encodePacked(prefix, _message));
  }
}
