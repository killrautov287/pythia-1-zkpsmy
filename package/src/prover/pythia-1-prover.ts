import { buildPoseidon, SNARK_FIELD } from "@sismo-core/crypto";
import { BigNumber, BigNumberish } from "ethers";
import { Inputs, PrivateInputs, PublicInputs } from "./types";
import { wasmPath, zkeyPath } from "./files";
import { verifyCommitment } from "./utils/verify-commitment";
import { plonk } from "snarkjs";
import { SnarkProof } from "./snark-proof";

export type CircuitPath = { wasmPath: string; zkeyPath: string } | null;

export type UserParams = {
  secret: BigNumberish;
  value: BigNumberish;
  destinationIdentifier: BigNumberish;
  chainId: BigNumberish;
  commitmentReceipt: [BigNumberish, BigNumberish, BigNumberish];
  commitmentSignerPubKey: [BigNumberish, BigNumberish];
  groupId: BigNumberish;
  ticketIdentifier: BigNumberish;
  claimedValue: BigNumberish;
  isStrict: boolean;
};

export class Pythia1Prover {
  private esmOverrideCircuitPath: CircuitPath;

  constructor(esmOverrideCircuitPath: CircuitPath = null) {
    this.esmOverrideCircuitPath = esmOverrideCircuitPath;
  }

  public async generateInputs({
    secret,
    value,
    destinationIdentifier,
    chainId,
    commitmentReceipt,
    groupId,
    commitmentSignerPubKey,
    ticketIdentifier,
    claimedValue,
    isStrict,
  }: UserParams): Promise<Inputs> {
    secret = BigNumber.from(secret);
    destinationIdentifier = BigNumber.from(destinationIdentifier);
    chainId = BigNumber.from(chainId);
    value = BigNumber.from(value);
    commitmentReceipt = commitmentReceipt.map((el) => BigNumber.from(el)) as [
      BigNumber,
      BigNumber,
      BigNumber
    ];
    commitmentSignerPubKey = commitmentSignerPubKey.map((el) =>
      BigNumber.from(el)
    ) as [BigNumber, BigNumber];
    groupId = BigNumber.from(groupId);
    ticketIdentifier = BigNumber.from(ticketIdentifier);
    claimedValue = BigNumber.from(claimedValue);

    const poseidon = await buildPoseidon();

    const privateInputs: PrivateInputs = {
      secret: secret.toBigInt(),
      commitmentReceipt: commitmentReceipt.map((el) =>
        (el as BigNumber).toBigInt()
      ) as unknown as [BigInt, BigInt, BigInt],
      value: value.toBigInt(),
    };

    const publicInputs: PublicInputs = {
      destinationIdentifier: destinationIdentifier.toBigInt(),
      chainId: chainId.toBigInt(),
      commitmentSignerPubKey: commitmentSignerPubKey.map((el) =>
        (el as BigNumber).toBigInt()
      ) as unknown as [BigInt, BigInt],
      groupId: groupId.toBigInt(),
      ticketIdentifier: ticketIdentifier.toBigInt(),
      userTicket: poseidon([secret, ticketIdentifier]).toBigInt(),
      claimedValue: claimedValue.toBigInt(),
      isStrict,
    };

    return {
      privateInputs,
      publicInputs,
    };
  }

  public async userParamsValidation({
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
  }: UserParams) {
    destinationIdentifier = BigNumber.from(destinationIdentifier);
    secret = BigNumber.from(secret);
    ticketIdentifier = BigNumber.from(ticketIdentifier);
    chainId = BigNumber.from(chainId);
    value = BigNumber.from(value);
    claimedValue = BigNumber.from(claimedValue);
    groupId = BigNumber.from(groupId);

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
      value,
      groupId,
      commitmentReceipt,
      commitmentSignerPubKey
    );
    if (!isSourceCommitmentValid) throw new Error("Invalid signed commitment");

    if (claimedValue.gt(value)) {
      throw new Error(
        `Claimed value ${claimedValue.toHexString()} can't be superior to Source value`
      );
    }

    if (isStrict && !claimedValue.eq(value)) {
      throw new Error(
        `Claimed value ${claimedValue.toHexString()} must be equal with Source value when isStrict == 1`
      );
    }

    if (claimedValue.lt(0)) {
      throw new Error(
        `Claimed value ${claimedValue.toHexString()} can't be negative`
      );
    }
  }

  public async generateSnarkProof({
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
  }: UserParams): Promise<any> {
    await this.userParamsValidation({
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
    });

    const { privateInputs, publicInputs } = await this.generateInputs({
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
