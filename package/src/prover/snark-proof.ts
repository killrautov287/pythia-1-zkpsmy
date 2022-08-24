import { BigNumber } from "ethers";
import { plonk } from "snarkjs";

export class SnarkProof {
  public input: BigNumber[];
  public proof: any;

  constructor(input: BigNumber[], proof: any) {
    this.input = input;
    this.proof = proof;
  }

  public async toProofBytes() {       
    let allSolCallData: string = await plonk.exportSolidityCallData(this.proof, this.input);
    return allSolCallData.split(',')[0];
  }
}
