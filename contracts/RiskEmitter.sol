// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;
contract RiskEmitter {
 address public immutable owner = msg.sender;
 uint256 public sequence;
 event RiskObserved(uint256 indexed sequence, uint256 risk);
 constructor(){require(block.chainid==11155111,"Sepolia only");}
 function report(uint256 risk) external {require(msg.sender==owner,"owner");require(risk<=100,"risk");emit RiskObserved(++sequence,risk);}
}