import {
  EddsaAccount,
  EddsaPublicKey,
  EddsaSignature,
  buildPoseidon,
} from "@sismo-core/crypto";
import { BigNumber, BigNumberish } from "ethers";

export const computeUserTicket = async (
  secret: BigNumberish,
  ticketIdentifier: BigNumberish
): Promise<BigNumber> => {
  const poseidon = await buildPoseidon();
  return poseidon([secret, ticketIdentifier]);
};

export class CommitmentSignerTester {
  private seed: BigNumberish;

  constructor(seed: BigNumberish = "0x123321") {
    this.seed = seed;
  }

  async signCommitment(commitment: BigNumberish): Promise<EddsaSignature> {
    return (await this._getEddsaAccount()).sign(commitment);
  }

  async getPublicKey(): Promise<EddsaPublicKey> {
    return (await this._getEddsaAccount()).getPubKey();
  }

  private async _getEddsaAccount(): Promise<EddsaAccount> {
    const eddsaAccount = await EddsaAccount.generateFromSeed(this.seed);
    return eddsaAccount;
  }
}
