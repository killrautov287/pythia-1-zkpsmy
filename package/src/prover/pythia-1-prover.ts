import { buildPoseidon, SNARK_FIELD } from "@sismo-core/crypto";
import { BigNumber, BigNumberish } from "ethers";
import { Inputs, PrivateInputs, PublicInputs } from "./types";
import { wasmPath, zkeyPath } from "./files";
import { verifyCommitment } from "./utils/verify-commitment";
import { plonk } from "snarkjs";
import { SnarkProof } from "./snark-proof";

export type CircuitPath = { wasmPath: string; zkeyPath: string } | null;

export type HydraS1Account = {
  identifier: BigNumberish;
  secret: BigNumberish;
  commitmentReceipt: [BigNumberish, BigNumberish, BigNumberish];
};

type UserParams = {
  secret: BigNumberish;
  destinationIdentifier: BigNumberish;
  chainId: BigNumberish;
  signedCommitment: [BigNumberish, BigNumberish, BigNumberish];
  commitmentSignerPubKey: [BigNumberish, BigNumberish];
  ticketIdentifier: BigNumberish;
};

export class Pythia1Prover {
  private esmOverrideCircuitPath: CircuitPath;

  constructor(
    esmOverrideCircuitPath: CircuitPath = null
  ) {
    this.esmOverrideCircuitPath = esmOverrideCircuitPath;
  }

  public async generateInputs({
    secret,
    destinationIdentifier,
    chainId,
    signedCommitment,
    commitmentSignerPubKey,
    ticketIdentifier,
  }: UserParams): Promise<Inputs> {
    secret = BigNumber.from(secret);
    destinationIdentifier = BigNumber.from(destinationIdentifier);
    chainId = BigNumber.from(chainId);
    signedCommitment = signedCommitment.map((el) => BigNumber.from(el)) as [BigNumber, BigNumber, BigNumber];
    commitmentSignerPubKey = commitmentSignerPubKey.map((el) => BigNumber.from(el)) as [BigNumber, BigNumber];
    ticketIdentifier = BigNumber.from(ticketIdentifier);

    const poseidon = await buildPoseidon();

    const privateInputs: PrivateInputs = {
      secret: secret.toBigInt(),
      signedCommitment: signedCommitment.map(el =>  (el as BigNumber).toBigInt()) as unknown as [BigInt, BigInt, BigInt],
    };

    const publicInputs: PublicInputs = {
      destinationIdentifier: destinationIdentifier.toBigInt(),
      chainId: chainId.toBigInt(),
      commitmentSignerPubKey: commitmentSignerPubKey.map(el =>  (el as BigNumber).toBigInt()) as unknown as [BigInt, BigInt],
      ticketIdentifier: ticketIdentifier.toBigInt(),
      userTicket: poseidon([secret, ticketIdentifier]).toBigInt(),
    };

    return {
      privateInputs,
      publicInputs,
    };
  }

  public async userParamsValidation({
    secret,
    destinationIdentifier,
    chainId,
    signedCommitment,
    commitmentSignerPubKey,
    ticketIdentifier,
  }: UserParams) {
    destinationIdentifier = BigNumber.from(destinationIdentifier);
    secret = BigNumber.from(secret);
    ticketIdentifier = BigNumber.from(ticketIdentifier);
    chainId = BigNumber.from(chainId);

    const SnarkField = BigNumber.from(SNARK_FIELD);
    if (ticketIdentifier.gt(SnarkField)) {
      throw new Error(
        "Ticket identifier overflow the snark field, please use ticket identifier inside the snark field"
      );
    }
    if (secret.gt(SnarkField)) {
      throw new Error(
        "Secret overflow the snark field, please use secret inside the snark field"
      );
    }
    if (destinationIdentifier.gt(SnarkField)) {
      throw new Error(
        "Destination identifier overflow the snark field, please use destination identifier inside the snark field"
      );
    }

    const isSourceCommitmentValid = await verifyCommitment(
      secret,
      signedCommitment,
      commitmentSignerPubKey
    );
    if (!isSourceCommitmentValid)
      throw new Error("Invalid signed commitment");

  }

  public async generateSnarkProof({
    secret,
    destinationIdentifier,
    chainId,
    signedCommitment,
    commitmentSignerPubKey,
    ticketIdentifier,
  }: UserParams): Promise<any> {
    await this.userParamsValidation({
      secret,
      destinationIdentifier,
      chainId,
      signedCommitment,
      commitmentSignerPubKey,
      ticketIdentifier,
    });

    const { privateInputs, publicInputs } = await this.generateInputs({
      secret,
      destinationIdentifier,
      chainId,
      signedCommitment,
      commitmentSignerPubKey,
      ticketIdentifier,
    });

    let files;
    if (process.env.MODULE_FORMAT == "esm" && this.esmOverrideCircuitPath) {
      files = this.esmOverrideCircuitPath;
    } else {
      files = {
        zkeyPath,
        wasmPath,
      };
    }

    const { proof, publicSignals } = await plonk.fullProve(
      { ...privateInputs, ...publicInputs },
      files.wasmPath,
      files.zkeyPath
    );

    return new SnarkProof(publicSignals, proof);
  }
}
