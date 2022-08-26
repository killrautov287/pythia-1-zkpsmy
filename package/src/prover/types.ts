export type PrivateInputs = {
  secret: BigInt;
  value: BigInt;
  commitmentReceipt: [BigInt, BigInt, BigInt];
};

export type PublicInputs = {
  destinationIdentifier: BigInt;
  chainId: BigInt;
  commitmentSignerPubKey: [BigInt, BigInt];
  groupId: BigInt;
  ticketIdentifier: BigInt;
  userTicket: BigInt;
  claimedValue: BigInt;
  isStrict: boolean;
};

export type Inputs = {
  privateInputs: PrivateInputs;
  publicInputs: PublicInputs;
};
