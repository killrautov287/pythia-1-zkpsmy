import hre from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import { Pythia1Verifier } from "../package/src/verifier";
import { expect } from "chai";
import { buildPoseidon, Poseidon } from "@sismo-core/crypto";
import { Pythia1Prover, SnarkProof } from "../package/src";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CommitmentSignerTester } from "./pythia-1-helper";

describe("Pythia 1 Verifier", () => {
  let poseidon: Poseidon;
  let prover: Pythia1Prover;
  let ticketIdentifier: BigNumber;
  let secret: BigNumber;
  let destination: SignerWithAddress;
  let commitmentSigner: CommitmentSignerTester;
  let commitment: BigNumber;
  let value: BigNumber;
  let claimedValue: BigNumber;
  let chainId: number;
  let commitmentReceipt: [BigNumberish, BigNumberish, BigNumberish];
  let commitmentSignerPubKey: [BigNumberish, BigNumberish];
  let groupId: BigNumber;
  let destinationIdentifier: string;
  let snarkProof: SnarkProof;

  before(async () => {
    poseidon = await buildPoseidon();
    prover = new Pythia1Prover();
    [destination] = await hre.ethers.getSigners();
    destinationIdentifier = await destination.getAddress();
    ticketIdentifier = BigNumber.from(123);
    secret = BigNumber.from(456);
    commitment = await poseidon([secret]);
    value = BigNumber.from(10);
    claimedValue = BigNumber.from(9);
    chainId = 4;
    groupId = BigNumber.from("0x123");
    commitmentSigner = new CommitmentSignerTester();
    commitmentReceipt = await commitmentSigner.getCommitmentReceipt(
      commitment,
      value,
      groupId
    );
    commitmentSignerPubKey = await commitmentSigner.getPublicKey();
  });

  it("Should be able to generate the proof using the prover package", async () => {
    snarkProof = await prover.generateSnarkProof({
      secret,
      value,
      destinationIdentifier,
      chainId,
      commitmentReceipt,
      commitmentSignerPubKey,
      groupId,
      ticketIdentifier,
      claimedValue,
      isStrict: false,
    });
  });

  it("Should be able to verify the proof using the verifier", async () => {
    const isValidOffChain = await Pythia1Verifier.verifyProof(snarkProof.a, snarkProof.b, snarkProof.c, snarkProof.input);
    expect(isValidOffChain).to.equals(true);
  });

  it("Should change a public input and expect the verifier to revert", async () => {
    const invalidInput = snarkProof.input;
    invalidInput[0] = BigNumber.from(123);
    const isValidOffChain = await Pythia1Verifier.verifyProof(
      snarkProof.a, 
      snarkProof.b, 
      snarkProof.c, 
      invalidInput
    );
    expect(isValidOffChain).to.equals(false);
  });
});
