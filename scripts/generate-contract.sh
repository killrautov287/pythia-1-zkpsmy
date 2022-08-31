
#!/bin/bash -e

cd "$(git rev-parse --show-toplevel)"

npx snarkjs zkey export solidityverifier artifacts/circuits/$1.zkey package/contracts/Pythia1Verifier.sol
sed -i.bak "s/contract Verifier/contract Pythia1Verifier/g" package/contracts/Pythia1Verifier.sol
sed -i.bak "s/pragma solidity ^0.6.11;/pragma solidity ^0.8.0;/g" package/contracts/Pythia1Verifier.sol
rm -f "./package/contracts/Pythia1Verifier.sol.bak"