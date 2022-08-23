pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";


// This is the circuit for the Pythia1 Proving Scheme
// please read this doc to understand the underlying concepts
// https://pythia-1.docs.sismo.io
template pythia1() {
  // Private inputs
  signal input secret;
  signal input signedCommitment[3];

  // Public inputs
  signal input destinationIdentifier;
  signal input chainId;
  signal input commitmentSignerPubKey[2];
  signal input ticketIdentifier;
  signal input userTicket;

  // Verify that the user has the right commitment secret
  // This is a proof of commitment ownership
  component commitment = Poseidon(1);
  commitment.inputs[0] <== secret;

  // Verify the signed commitment from the commitmentSigner
  // of the given commitmentSignerPubKey
  component eddsa = EdDSAPoseidonVerifier();
  eddsa.enabled <== 1;
  eddsa.Ax <== commitmentSignerPubKey[0];
  eddsa.Ay <== commitmentSignerPubKey[1];
  eddsa.R8x <== signedCommitment[0];
  eddsa.R8y <== signedCommitment[1];
  eddsa.S <== signedCommitment[2];
  eddsa.M <== commitment.out;

  // Verify the userTicket is valid
  // compute the userTicket using the hash of the secret and the ticketIdentifier
  component secretHasher = Poseidon(2);
  secretHasher.inputs[0] <== secret;
  secretHasher.inputs[1] <== ticketIdentifier;  
  // hard constraint
  userTicket === secretHasher.out;

  // Square serve to avoid removing by the compilator optimizer
  signal chainIdSquare;
  chainIdSquare <== chainId * chainId;
  signal destinationIdentifierSquare;
  destinationIdentifierSquare <== destinationIdentifier * destinationIdentifier;
}

component main {public [destinationIdentifier, chainId, commitmentSignerPubKey, ticketIdentifier, userTicket]} = pythia1();
