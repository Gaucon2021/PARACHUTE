# Testnet-only Omni release gate

Candidate contracts, not compiled or deployed yet. Use the current Omni library, not legacy ReactVM. Verify and pin the official reactive-lib-omni dependency before building with Solidity 0.8.29; map @reactive/ to that package root.

1. Deploy RiskEmitter on Ethereum Sepolia (11155111).
2. Deploy ParachuteReactive on Lasna (5318007), with emitter and threshold.
3. Confirm the official Base Sepolia callback proxy address and deploy OmniSafetyController (84532) with proxy, reactive contract address, emitter and identical threshold.
4. Fund both contracts using faucet test tokens only, then activate the one-time recipient on Lasna.
5. Report a value below threshold and then one at/above threshold. Independently inspect source transaction, Reactscan reaction, posted callback, target receipt and paused() readback.
6. No private keys in this repository, no mainnet, no real-money gas. Stop if faucets are insufficient.

The source code follows https://dev.reactive.network/reactive-contracts and https://dev.reactive.network/callback-contracts. A callback request is not proof of successful execution. Do not claim finality until independently verified. The older SafetyController.sol is a standalone prototype; OmniSafetyController is the intended integration candidate.

## Reproducible compile gate
Solidity 0.8.29, optimizer 200, EVM Paris. Official Reactive-Network/reactive-lib-omni tag v0.1.0, commit 3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8. CI fetches the upstream library; no vendored library or private key. Compiler success is not a security audit or Testnet deployment.
