import { BigNumber } from "ethers";
import hre from "hardhat";
import path from "path";
import { circuitShouldFail } from "./utils/circuit-should-fail";
import { wasm } from "circom_tester";
import { buildPoseidon } from "@sismo-core/crypto";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CommitmentSignerTester, computeUserTicket } from "./pythia-1-helper";

describe("Pythia 1 Circuits", async () => {
  let poseidon: (inputs: BigNumber[]) => BigNumber;
  let circuitTester: wasm.CircuitTester;
  let ticketIdentifier: BigNumber;
  let inputs: any;
  let destinationAccount: SignerWithAddress;
  let commitmentSigner: CommitmentSignerTester;
  let commitmentSigner2: CommitmentSignerTester;

  before(async () => {
    poseidon = await buildPoseidon();
    [destinationAccount] = await hre.ethers.getSigners();

    commitmentSigner = new CommitmentSignerTester();
    // create an other commitment signer with a different seed
    commitmentSigner2 = new CommitmentSignerTester("0x123");

    circuitTester = await wasm(
      path.join(__dirname, "../circuits", "pythia-1.circom")
    );
    ticketIdentifier = BigNumber.from(123);
  });

  describe("Verifying source address constraints are good", async () => {
    it("Verify it can generate a snark proof", async () => {
      const secret = BigNumber.from("0x1234567890abcdef");
      const commitment = await poseidon([secret]);

      const privateInputs = {
        secret,
        signedCommitment: await commitmentSigner.signCommitment(commitment),
      };

      const publicInputs = {
        destinationIdentifier: BigNumber.from(destinationAccount.address), // arbitrary, no constraint
        chainId: 4, // arbitrary, no constraint
        commitmentSignerPubKey: await commitmentSigner.getPublicKey(),
        ticketIdentifier,
        userTicket: await computeUserTicket(secret, ticketIdentifier),
      };

      inputs = { ...privateInputs, ...publicInputs };

      const w = await circuitTester.calculateWitness(inputs, true);
      await circuitTester.checkConstraints(w);
    });
  });

  describe("Verifying commitmentSigner constraint", async () => {
    it("Verify the commitment constraint", async () => {
      await circuitShouldFail(
        circuitTester,
        {
          ...inputs,
          ...{
            // change the secret
            secret: BigNumber.from("0x1"),
          },
        },
        "Error: Assert Failed. Error in template ForceEqualIfEnabled"
      );
    });

    it("Verify the commitment signer publickey constraint", async () => {
      await circuitShouldFail(
        circuitTester,
        {
          ...inputs,
          ...{
            // change the public key
            commitmentSignerPubKey: await commitmentSigner2.getPublicKey(),
          },
        },
        "Error: Assert Failed. Error in template ForceEqualIfEnabled"
      );
    });

    it("Verify the commitment signer signature constraint", async () => {
      await circuitShouldFail(
        circuitTester,
        {
          ...inputs,
          ...{
            // change the signature
            signedCommitment: await commitmentSigner.signCommitment(
              BigNumber.from("0x12")
            ),
          },
        },
        "Error: Assert Failed. Error in template ForceEqualIfEnabled"
      );
    });
  });

  describe("Verify userTicket validity", async () => {
    it("Should throw when the ticketIdentifier does not corresponds to the userTicket ", async () => {
      await circuitShouldFail(
        circuitTester,
        {
          ...inputs,
          // change the ticketIdentifier, good one is 123
          ...{ ticketIdentifier: BigNumber.from(456) },
        },
        "Error: Assert Failed. Error in template pythia1"
      );
    });

    it("Should throw when the userTicket is invalid", async () => {
      await circuitShouldFail(
        circuitTester,
        {
          ...inputs,
          // change the ticketIdentifier, good one is hash(secret, ticketIdentifier)
          ...{ userTicket: BigNumber.from(789) },
        },
        "Error: Assert Failed. Error in template pythia1"
      );
    });
  });
});
