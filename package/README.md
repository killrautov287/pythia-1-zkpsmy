<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-secondary.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    Pythia 1 Proving scheme
  </h3>

  <p align="center">
    Implementations of Pythia 1 prover (js/ts) and verifiers (js/ts/Solidity)
  </p>

  <p align="center">
    Made by <a href="https://www.sismo.io/" target="_blank">Sismo</a>
  </p>
  
  <p align="center">
    <a href="https://discord.gg/sismo" target="_blank">
        <img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white"/>
    </a>
    <a href="https://twitter.com/sismo_eth" target="_blank">
        <img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white"/>
    </a>
  </p>
</div>

## Installation

```sh
$ yarn add @sismo-core/pythia-1
```

## Prover js (Pythia1Prover) <a name="ProverJs"></a>


``` javascript

const prover = new Pythia1Prover(
    // + Optional override of the circuit path for ES module (see below for more information)
    {
        wasmPath: "https://[Your server].pythia-1.wasm",
        zkeyPath: "https://[Your server].pythia-1.zkey"
    }
); 

```

To generate the proof, we need to provide a .wasm and a .zkey to the witness calculator. For CommonJS modules we add theses files directly in the package and we resolve the path. For ES module we can't do that, that's why we choose to host files on an S3. 

If this solution doesn't suite you or if you want to optimize the download time, you can override S3 paths by adding a third params in the Pythia1Prover constructor and host files wherever you want.

#### ES modules (which can be overridden)

```javascript
export const wasmPath = "https://static.sismo.io/pythia-1-zkps/v1/pythia-1.wasm";
export const zkeyPath = "https://static.sismo.io/pythia-1-zkps/v1/pythia-1.zkey";
```

#### CommonJS

```javascript
export const wasmPath = require.resolve('./pythia-1.wasm');
export const zkeyPath = require.resolve('./pythia-1.zkey');
```

### Generate Snark Proof

``` javascript

const params = {
    secret,
    destinationIdentifier,
    chainId,
    commitmentReceipt,
    commitmentSignerPubKey,
    groupId,
    ticketIdentifier,
    value,
    claimedValue,
    isStrict
}

const snarkProof = await prover.generateSnarkProof(params);

// Generate inputs
// This function is automatically called by generateSnarkProof but you can call it in your tests
const { privateInputs, publicInputs } = await prover.generateInputs(params);

// Throw human readable errors
// This function is automatically called by generateSnarkProof but you can call it in your tests
try {
    await prover.userParamsValidation(params);
} catch (e) {
    console.log(e);
}
``` 

|  Params  | Type      | Description |
| ---------- | -------------- | ------------- |
| secret | BigNumberish | Secret used to generate the commitment send to the commitment signer |
| destinationIdentifier | BigNumberish | Destination account |
| chainId | BigNumberish | Chain id |
| commitmentReceipt | [BigNumberish, BigNumberish, BigNumberish] | Receipt of the commitment signer |
| commitmentSignerPubKey | [BigNumberish, BigNumberish] | Public key of the commitment signer |
| groupId | BigNumberish | GroupId send by the commitment signer |
| ticketIdentifier | BigNumberish | Internal nullifier |
| value | BigNumberish | Value send by the commitment signer |
| claimedValue | BigNumberish | Value selected by the user |
| isStrict | BigNumberish | Define if the value is strict or not  |

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Prefer [Discord](https://discord.gg/sismo) or [Twitter](https://twitter.com/sismo_eth)

<br/>
<img src="https://static.sismo.io/readme/bottom-secondary.png" alt="bottom" width="100%" >