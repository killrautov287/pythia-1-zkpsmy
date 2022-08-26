import { buildPoseidon, EddsaAccount } from "@sismo-core/crypto";
import { BigNumberish } from "ethers";

export const verifyCommitment = async (
  secret: BigNumberish,
  value: BigNumberish,
  groupId: BigNumberish,
  commitmentReceipt: [BigNumberish, BigNumberish, BigNumberish],
  commitmentSignerPubKey: [BigNumberish, BigNumberish]
) => {
  const poseidon = await buildPoseidon();
  const commitment = poseidon([secret]);
  const commitmentReceiptComputed = poseidon([commitment, value, groupId]);
  return EddsaAccount.verify(
    commitmentReceiptComputed,
    commitmentReceipt,
    commitmentSignerPubKey
  );
};
