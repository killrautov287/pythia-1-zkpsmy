pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";


// This is the circuit for the Pythia1 Proving Scheme
// please read this doc to understand the underlying concepts
// https://pythia-1.docs.sismo.io
template pythia1() {
  // Private inputs
  signal input secret;
  signal input commitmentReceipt[3];
  signal input value;

  // Public inputs
  signal input destinationIdentifier;
  signal input chainId;
  signal input commitmentSignerPubKey[2];
  signal input ticketIdentifier;
  signal input userTicket;
  signal input claimedValue;
  signal input isStrict;

  // Verify that the user has the right commitment secret
  // This is a proof of commitment ownership
  component commitment = Poseidon(1);
  commitment.inputs[0] <== secret;

  // Create the commitment mapping that was signed to create the 
  // commitment receipt 
  component commitmentMapping = Poseidon(2);
  commitmentMapping.inputs[0] <== commitment.out;
  commitmentMapping.inputs[1] <== value;

  // Verify the signed commitment from the commitmentSigner
  // of the given commitmentSignerPubKey
  component eddsa = EdDSAPoseidonVerifier();
  eddsa.enabled <== 1;
  eddsa.Ax <== commitmentSignerPubKey[0];
  eddsa.Ay <== commitmentSignerPubKey[1];
  eddsa.R8x <== commitmentReceipt[0];
  eddsa.R8y <== commitmentReceipt[1];
  eddsa.S <== commitmentReceipt[2];
  eddsa.M <== commitmentMapping.out;

  // Verify claimed value validity
  // Prevent overflow of comparator range
  component valueInRange = Num2Bits(252);
  valueInRange.in <== value;
  component claimedInRange = Num2Bits(252);
  claimedInRange.in <== claimedValue;
  // 0 <= claimedValue <= value
  component leq = LessEqThan(252);
  leq.in[0] <== claimedValue;
  leq.in[1] <== value;
  leq.out === 1;
  // If isStrict == 1 then claimedValue == value
  0 === (isStrict-1)*isStrict;
  value === value+((claimedValue-value)*isStrict);

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

component main {public [destinationIdentifier, chainId, commitmentSignerPubKey, ticketIdentifier, userTicket, claimedValue, isStrict]} = pythia1();
