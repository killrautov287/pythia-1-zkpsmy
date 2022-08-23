import { assert, expect } from "chai";
import { WasmTester } from "circom_tester";

export const circuitShouldFail = async (
  circuitTester: WasmTester,
  inputs: any,
  message: string,
  log: boolean = false
) => {
  try {
    const w = await circuitTester.calculateWitness(inputs, true);
    await circuitTester.checkConstraints(w);
    assert(false);
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (log) console.log(e.message);
      expect(e.message).to.have.string(message);
    }
  }
};
