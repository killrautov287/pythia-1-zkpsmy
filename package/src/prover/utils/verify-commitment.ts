import { buildPoseidon, EddsaAccount } from "@sismo-core/crypto";
import { BigNumberish } from "ethers";

export const verifyCommitment = async (
    secret: BigNumberish, 
    signedCommitment: [BigNumberish, BigNumberish, BigNumberish],
    commitmentSignerPubKey: [BigNumberish, BigNumberish]
) => {
    const poseidon = await buildPoseidon();
    const commitment = poseidon([secret])
    return EddsaAccount.verify(commitment, signedCommitment, commitmentSignerPubKey);
}