import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import packageJson from "./package.json";
import dts from "rollup-plugin-dts";
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({ tsconfig: "./tsconfig.json" }),
    ],
    external: ['@sismo-core/crypto', 'snarkjs', 'ethers']
  },
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      replace({
        values: {
          'process.env.MODULE_FORMAT': '"esm"'
        }
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
    ],
    external: ['@sismo-core/crypto', 'snarkjs', 'ethers']
  },
  {
    input: "lib/esm/index.d.ts",
    output: [
      { 
        file: "lib/index.d.ts", 
        format: "esm" 
      }
    ],
    plugins: [dts()],
  }
];