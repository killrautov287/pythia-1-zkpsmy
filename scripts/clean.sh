#!/bin/bash -e
rm -rf artifacts
rm -rf cache
rm -rf node_modules
rm -rf types

rm -rf ./package/node_modules
rm -rf ./package/lib
rm -rf ./package/types
# rm -rf ./package/contracts/Pythia1Verifier.sol
# rm -rf ./package/src/prover/pythia-1.wasm
# rm -rf ./package/src/prover/pythia-1.zkey
# rm -rf ./package/src/verifier/pythia-1_verification_key.json

