// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
/// @notice Testnet-only target contract candidate. Not deployed or audited.
/// @dev callbackProxy and expectedReactive must be confirmed using official network addresses.
contract SafetyController {
 address public immutable callbackProxy;
 address public immutable expectedReactive;
 uint256 public immutable sourceChain;
 address public immutable sourceEmitter;
 uint256 public immutable threshold;
 bool public paused;
 mapping(bytes32 => bool) public consumed;
 event SafetyTriggered(bytes32 indexed eventId, uint256 risk);
 error Unauthorized();
 error Replay();
 error InvalidSource();
 constructor(address proxy, address reactive, uint256 chainId, address emitter, uint256 limit) {
  require(proxy != address(0) && reactive != address(0) && emitter != address(0) && chainId != 0);
  callbackProxy = proxy; expectedReactive = reactive; sourceChain = chainId; sourceEmitter = emitter; threshold = limit;
 }
 function trigger(address reactive, uint256 chainId, address emitter, bytes32 eventId, uint256 risk) external {
  if (msg.sender != callbackProxy || reactive != expectedReactive) revert Unauthorized();
  if (chainId != sourceChain || emitter != sourceEmitter || eventId == bytes32(0) || risk < threshold) revert InvalidSource();
  if (consumed[eventId]) revert Replay();
  consumed[eventId] = true;
  paused = true;
  emit SafetyTriggered(eventId,risk);
 }
}
