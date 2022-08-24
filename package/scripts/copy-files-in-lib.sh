!/bin/bash -e

cd "$(git rev-parse --show-toplevel)"

mkdir -p package/lib
cp "./package/src/prover/pythia-1.zkey" "./package/lib/cjs"
cp "./package/src/prover/pythia-1.wasm" "./package/lib/cjs"
cp "./package/src/verifier/pythia-1-verification-key.json" "./package/lib/cjs"
cp "./package/src/verifier/pythia-1-verification-key.json" "./package/lib/esm"