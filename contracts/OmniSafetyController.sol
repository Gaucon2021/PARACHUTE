// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";
import {AbstractCallback} from "@reactive/src/base/AbstractCallback.sol";
contract OmniSafetyController is AbstractCallback {
 address public immutable emitter;
 uint256 public immutable threshold;
 bool public paused;
 mapping(bytes32=>bool) public consumed;
 event SafetyTriggered(bytes32 indexed eventId,uint256 risk);
 constructor(IPayable proxy,address reactive,address source,uint256 limit) payable AbstractCallback(proxy,reactive){
  require(block.chainid==84532,"Base Sepolia only");
  require(address(proxy)!=address(0)&&reactive!=address(0)&&source!=address(0)&&limit>0&&limit<=100,"configuration");
  emitter=source;threshold=limit;
 }
 function trigger(address reactive,uint256 chainId,address source,bytes32 eventId,uint256 risk) external onlyServiceProvider onlyCallbackSender(reactive){
  require(chainId==11155111&&source==emitter&&eventId!=bytes32(0)&&risk>=threshold&&risk<=100,"invalid event");
  if(consumed[eventId])return;
  consumed[eventId]=true;paused=true;
  emit SafetyTriggered(eventId,risk);
 }
 function coverDebt() external {_coverDebt();}
}