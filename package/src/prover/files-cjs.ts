export const wasmPath =
  process.env.MODULE_FORMAT != "esm" ? require.resolve("./pythia-1.wasm") : null;
export const zkeyPath =
  process.env.MODULE_FORMAT != "esm" ? require.resolve("./pythia-1.zkey") : null;
