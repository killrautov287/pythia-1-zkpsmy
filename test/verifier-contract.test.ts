import hre from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import { buildPoseidon, Poseidon } from "@sismo-core/crypto";
import { Pythia1Prover, SnarkProof } from "../package/src";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CommitmentSignerTester } from "./pythia-1-helper";
import { Pythia1Verifier__factory } from "../types/factories/Pythia1Verifier__factory";
import { Pythia1Verifier } from "../types/Pythia1Verifier";

describe("Pythia 1 Verifier contract", () => {
  let poseidon: Poseidon;
  let prover: Pythia1Prover;
  let ticketIdentifier: BigNumber;
  let secret: BigNumber;
  let destination: SignerWithAddress;
  let deployer: SignerWithAddress;
  let commitmentSigner: CommitmentSignerTester;
  let commitment: BigNumber;
  let value: BigNumber;
  let claimedValue: BigNumber;
  let chainId: number;
  let commitmentReceipt: [BigNumberish, BigNumberish, BigNumberish];
  let commitmentSignerPubKey: [BigNumberish, BigNumberish];
  let groupId: BigNumber;
  let destinationIdentifier: string;
  let pythia1VerifierContract: Pythia1Verifier;
  let snarkProof: SnarkProof;

  before(async () => {
    poseidon = await buildPoseidon();
    prover = new Pythia1Prover();
    [destination, deployer] = await hre.ethers.getSigners();
    destinationIdentifier = await destination.getAddress();
    ticketIdentifier = BigNumber.from(123);
    secret = BigNumber.from(456);
    commitment = await poseidon([secret]);
    value = BigNumber.from(10);
    claimedValue = BigNumber.from(9);
    groupId = BigNumber.from("0x123");
    chainId = 4;
    commitmentSigner = new CommitmentSignerTester();
    commitmentReceipt = await commitmentSigner.getCommitmentReceipt(
      commitment,
      value,
      groupId
    );
    commitmentSignerPubKey = await commitmentSigner.getPublicKey();

    //Deploy contract

    const deployed = await hre.deployments.deploy("Pythia1Verifier", {
      contract: "Pythia1Verifier",
      from: deployer.address,
      args: [],
      skipIfAlreadyDeployed: false,
    });
    pythia1VerifierContract = Pythia1Verifier__factory.connect(
      deployed.address,
      deployer
    );
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
    const isValidContract = await pythia1VerifierContract.verifyProof(snarkProof.a, snarkProof.b, snarkProof.c, snarkProof.input);
    expect(isValidContract).to.equals(true);
  });
});
