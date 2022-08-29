import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";
import hre from "hardhat";
import { Poseidon } from "@sismo-core/crypto";
import { buildPoseidon } from "@sismo-core/crypto";
import { Pythia1Prover, UserParams } from "../package/src";
import { CommitmentSignerTester } from "./pythia-1-helper";

describe("Pythia 1 Prover", () => {
  let poseidon: Poseidon;
  let prover: Pythia1Prover;
  let ticketIdentifier: BigNumber;
  let secret: BigNumber;
  let destination: SignerWithAddress;
  let commitmentSigner: CommitmentSignerTester;
  let commitment: BigNumber;
  let value: BigNumber;
  let claimedValue: BigNumber;
  let isStrict: boolean;
  let chainId: number;
  let groupId: BigNumber;
  let commitmentReceipt: [BigNumberish, BigNumberish, BigNumberish];
  let commitmentSignerPubKey: [BigNumberish, BigNumberish];
  let destinationIdentifier: string;
  let correctInputs: UserParams;

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
    groupId = BigNumber.from("0x123");
    isStrict = false;
    chainId = 4;
    commitmentSigner = new CommitmentSignerTester();
    commitmentReceipt = await commitmentSigner.getCommitmentReceipt(
      commitment,
      value,
      groupId
    );
    commitmentSignerPubKey = await commitmentSigner.getPublicKey();
  });

  it("Should generate a snark proof with correct inputs", async () => {
    correctInputs = {
      secret,
      value,
      destinationIdentifier,
      chainId,
      commitmentReceipt,
      commitmentSignerPubKey,
      groupId,
      ticketIdentifier,
      claimedValue,
      isStrict,
    };
    const snarkProof = await prover.generateSnarkProof(correctInputs);

    expect(snarkProof.input).to.deep.equal([
      "673047715095758362594529529292136844079929406274",
      "4",
      "19216562053331156600902255696246737271139353859029593594381038465017562799534",
      "13097183428542854523945410083164577096626657763061760561768888547173748384322",
      "291",
      "123",
      "4927655655099699900486263475166215352995660764281559606704696990727390837743",
      "9",
      "0",
    ]);
  });

  it("Should throw when the ticket identifier overflow the snark field", async () => {
    const ticketIdentifierOverflow =
      "0x48c8947f69c054a5caa934674ce8881d02bb18fb59d5a63eeaddff735b0e9801e87294783281ae49fc8287a0fd86779b27d7972d3e84f0fa0d826d7cb67dfefc";
    try {
      await prover.generateSnarkProof({
        ...correctInputs,
        ticketIdentifier: ticketIdentifierOverflow,
      });
    } catch (e: any) {
      expect(e.message).to.equal(
        "Ticket identifier overflow the snark field, please use ticket identifier inside the snark field"
      );
    }
  });

  it("Should throw when the destination identifier overflow the snark field", async () => {
    const destinationIdentifierOverflow =
      "0x48c8947f69c054a5caa934674ce8881d02bb18fb59d5a63eeaddff735b0e9801e87294783281ae49fc8287a0fd86779b27d7972d3e84f0fa0d826d7cb67dfefc";
    try {
      await prover.generateSnarkProof({
        ...correctInputs,
        destinationIdentifier: destinationIdentifierOverflow,
      });
    } catch (e: any) {
      expect(e.message).to.equal(
        "Destination identifier overflow the snark field, please use destination identifier inside the snark field"
      );
    }
  });

  it("Should throw when the destination identifier overflow the snark field", async () => {
    const secretOverflow =
      "0x48c8947f69c054a5caa934674ce8881d02bb18fb59d5a63eeaddff735b0e9801e87294783281ae49fc8287a0fd86779b27d7972d3e84f0fa0d826d7cb67dfefc";
    try {
      await prover.generateSnarkProof({
        ...correctInputs,
        secret: secretOverflow,
      });
    } catch (e: any) {
      expect(e.message).to.equal(
        "Secret overflow the snark field, please use secret inside the snark field"
      );
    }
  });

  it("Should throw with invalid source secret", async () => {
    const secretInvalid = "123";
    try {
      await prover.generateSnarkProof({
        ...correctInputs,
        secret: secretInvalid,
      });
    } catch (e: any) {
      expect(e.message).to.equal("Invalid signed commitment");
    }
  });

  it("Should throw with invalid signed commitment", async () => {
    const commitmentReceiptInvalid = ["123", "456", "789"] as [
      BigNumberish,
      BigNumberish,
      BigNumberish
    ];
    try {
      await prover.generateSnarkProof({
        ...correctInputs,
        commitmentReceipt: commitmentReceiptInvalid,
      });
    } catch (e: any) {
      expect(e.message).to.equal("Invalid signed commitment");
    }
  });

  it("Should throw with invalid commitment signer pubkey", async () => {
    const commitmentSignerPubKeyInvalid = ["123", "456"] as [
      BigNumberish,
      BigNumberish
    ];
    try {
      await prover.generateSnarkProof({
        ...correctInputs,
        commitmentSignerPubKey: commitmentSignerPubKeyInvalid,
      });
    } catch (e: any) {
      expect(e.message).to.equal("Invalid signed commitment");
    }
  });

  it("Should throw when sending claimedValue > sourceValue", async () => {
    try {
      await prover.generateSnarkProof({
        ...correctInputs,
        isStrict: false,
        claimedValue: value.add(1),
      });
    } catch (e: any) {
      expect(e.message).to.equal(
        `Claimed value ${BigNumber.from(
          11
        ).toHexString()} can't be superior to Source value`
      );
    }
  });

  it("Should throw when sending claimedValue is not equal to sourceValue and isStrict == 1", async () => {
    try {
      await prover.generateSnarkProof({
        ...correctInputs,
        isStrict: true,
        claimedValue: value.sub(1),
      });
    } catch (e: any) {
      expect(e.message).to.equal(
        `Claimed value ${BigNumber.from(
          9
        ).toHexString()} must be equal with Source value when isStrict == 1`
      );
    }
  });
});
