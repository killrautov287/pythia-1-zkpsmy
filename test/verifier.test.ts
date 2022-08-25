import hre from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import { Pythia1Verifier } from "../package/src/verifier";
import { expect } from "chai";
import { buildPoseidon, Poseidon } from "@sismo-core/crypto";
import { Pythia1Prover } from "../package/src";
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
  let destinationIdentifier: string;
  let proof: any;
  let input: any;

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
    commitmentSigner = new CommitmentSignerTester();
    commitmentReceipt = await commitmentSigner.getCommitmentReceipt(
      commitment,
      value
    );
    commitmentSignerPubKey = await commitmentSigner.getPublicKey();
  });

  it("Should be able to generate the proof using the prover package", async () => {
    const SnarkProof = await prover.generateSnarkProof({
      secret,
      value,
      destinationIdentifier,
      chainId,
      commitmentReceipt,
      commitmentSignerPubKey,
      ticketIdentifier,
      claimedValue,
      isStrict: false,
    });
    proof = SnarkProof.proof;
    input = SnarkProof.input;
  });

  it("Should be able to verify the proof using the verifier", async () => {
    const isValidOffChain = await Pythia1Verifier.verifyProof(proof, input);
    expect(isValidOffChain).to.equals(true);
  });

  it("Should change a public input and expect the verifier to revert", async () => {
    const invalidInput = input;
    invalidInput[0] = "123";
    const isValidOffChain = await Pythia1Verifier.verifyProof(
      proof,
      invalidInput
    );
    expect(isValidOffChain).to.equals(false);
  });
});
