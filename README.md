# PARACHUTE — Circuit Breaker Control Room

## Development workbench

Simulation with finality, origin, threshold and replay checks; Solidity target contract candidate in contracts/SafetyController.sol.

## Run locally

```sh
node --test
python -m http.server 8000
```

Open http://localhost:8000/. Node 22 recommended. Tests are included; no test or live platform result is asserted without independent verification.

## Integration status

Compile and test Solidity, verify official Reactive callback proxy and identity, implement subscription and callback, deploy only to testnets and obtain real transaction evidence.

Use synthetic inputs only. This is a development release, not a production-security or hackathon-completion claim. No paid infrastructure or mainnet transaction is required for the local lab.
