import { BigNumber } from "ethers";
import { plonk } from "snarkjs";
import vKey from "./pythia-1-verification-key.json";

export class Pythia1Verifier {
  public static async verifyProof(
    proof,
    input: BigNumber[]
  ): Promise<boolean> {
    return await plonk.verify(vKey, input, proof);
  }
}
