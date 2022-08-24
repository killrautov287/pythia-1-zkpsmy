export type PrivateInputs = {
  secret: BigInt,
  signedCommitment: [BigInt, BigInt, BigInt],
};

export type PublicInputs = {
  destinationIdentifier: BigInt,
  chainId: BigInt,
  commitmentSignerPubKey: [BigInt, BigInt],
  ticketIdentifier: BigInt,
  userTicket: BigInt,
};

export type Inputs = {
  privateInputs: PrivateInputs;
  publicInputs: PublicInputs;
};
