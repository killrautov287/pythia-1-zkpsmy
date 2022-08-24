#!/bin/bash -e

cd "$(git rev-parse --show-toplevel)"

cp "./artifacts/circuits/pythia-1_js/pythia-1.wasm" "./package/src/prover"
cp "./artifacts/circuits/pythia-1.zkey" "./package/src/prover"