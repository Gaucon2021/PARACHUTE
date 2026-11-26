// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";
contract ParachuteReactive is AbstractReactive {
 uint256 constant SOURCE=11155111;
 uint256 constant TARGET=84532;
 uint256 constant TOPIC=uint256(keccak256("RiskObserved(uint256,uint256)"));
 address public immutable owner=msg.sender;
 address public immutable emitter;
 uint256 public immutable threshold;
 address public recipient;
 mapping(bytes32=>bool) public requested;
 event PauseRequested(bytes32 indexed id,uint256 risk);
 constructor(address emitter_,uint256 threshold_) payable {
  require(block.chainid==5318007,"Lasna only");
  require(emitter_!=address(0)&&threshold_>0&&threshold_<=100,"configuration");
  emitter=emitter_;threshold=threshold_;
 }
 function activate(address target) external {
  require(msg.sender==owner&&recipient==address(0)&&target!=address(0),"activation");
  recipient=target;
  SYSTEM.subscribe(SOURCE,emitter,TOPIC,REACTIVE_IGNORE,REACTIVE_IGNORE,REACTIVE_IGNORE);
 }
 function react(LogRecord memory log_) external onlySystem {
  if(recipient==address(0)||log_.chainId!=SOURCE||log_.contractAddress!=emitter||log_.topic0!=TOPIC||log_.opCode!=2||log_.data.length!=32)return;
  uint256 risk=abi.decode(log_.data,(uint256));
  if(risk<threshold||risk>100)return;
  bytes32 id=keccak256(abi.encode(log_.chainId,log_.contractAddress,log_.txHash,log_.logIndex));
  if(requested[id])return;
  requested[id]=true;
  SYSTEM.requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0({
   chainId:TARGET,recipient:recipient,gasLimit:1000000,
   payload:abi.encodeWithSignature("trigger(address,uint256,address,bytes32,uint256)",address(0),SOURCE,emitter,id,risk)
  }));
  emit PauseRequested(id,risk);
 }
 function coverDebt() external {_coverDebt();}
}