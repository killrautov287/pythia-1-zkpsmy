#!/bin/bash -e
POWERS_OF_TAU=15 # circuit will support max 2^POWERS_OF_TAU constraints

mkdir -p artifacts/circuits

if [ ! -f artifacts/circuits/ptau$POWERS_OF_TAU ]; then
  echo "Downloading powers of tau file"
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$POWERS_OF_TAU.ptau --create-dirs -o artifacts/circuits/ptau$POWERS_OF_TAU
fi

circom circuits/$1.circom --verbose --r1cs --wasm --sym -o artifacts/circuits 

npx snarkjs plonk setup artifacts/circuits/$1.r1cs artifacts/circuits/ptau$POWERS_OF_TAU artifacts/circuits/$1.zkey
#npx snarkjs zkey verify artifacts/circuits/$1.r1cs artifacts/circuits/ptau$POWERS_OF_TAU artifacts/circuits/$1.zkey

# Export the verifier key for the js verifier
# npx snarkjs zkey export verificationkey artifacts/circuits/$1.zkey packages/$1_verification_key.json
# Export the verifier contract
# npx snarkjs zkey export solidityverifier artifacts/circuits/$1.zkey packages/$1_verifier.sol
