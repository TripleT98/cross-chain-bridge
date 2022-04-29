//SPDX-License-Identifier: Unlicens
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./ERC20.sol";

contract Bridge{

  address public relayer;
  uint public chain_id;

  mapping (bytes32 => bool) public isValid;

  constructor(address _relayer, uint _chain_id) {
    relayer = _relayer;
    chain_id = _chain_id;
  }

  event SwapInitialized (address indexed _token, address indexed from, address indexed to, uint amount, uint from_chain, uint to_chain);
  event Redeemed (address indexed _token, address indexed from, address indexed to, uint amount, uint to_chain);

  function swap (address _token, address _to, uint _amount, uint _to_chain) public {
    MyERC20 token = MyERC20(_token);
    require(token.balanceOf(msg.sender) >= _amount, "Error: Not enough tokens to swap!");
    token.burn(msg.sender, _amount);
    emit SwapInitialized(_token, msg.sender, _to, _amount, chain_id, _to_chain);
  }

  function redeem (uint _from_chain, address _token, address _from, address _to, uint _amount, uint _nonce, bytes32 r, bytes32 s, uint8 v) public {
    bytes32 message = keccak256(abi.encodePacked(_from_chain, _token, _from, _to, _amount, _nonce));
    require(isValid[message] == false, "Error: This transaction has been handled before!");
    isValid[message] = true;
    message = _hashMessage(message);
    address relayer_addr = ecrecover(message, v, r, s);
    require(relayer_addr == relayer, "Error: This transaction signed not by relayer!");
    MyERC20 token = MyERC20(_token);
    token.mint(_to, _amount);
    emit Redeemed(_token, _from, _to, _amount, chain_id);
  }

  function _hashMessage (bytes32 _message) pure private returns(bytes32) {
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    return keccak256(abi.encodePacked(prefix, _message));
  }
}
