import * as crypto from "crypto";
import * as secp256k1 from "secp256k1/elliptic";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import DarkpoolApp, {PublicKeyResponse, AddressResponse, SignResponse} from "../src";
import {ERROR_CODE} from "../src/constants";
import {GeneratorBuilder} from "../src/wallet/generator";
import {padPrivKey, padPrivKeyByHex, hex3Buffer} from "../src/wallet/util";
import bip39 from "bip39"

test("key generation", async () => {
    jest.setTimeout(60000);
    let list = []
    let N = 200

    for (let i = 0; i < N; i++) {
        let mnemonic = GeneratorBuilder.generateMnemonic()
        let w = GeneratorBuilder.deriveWallet(mnemonic)

        let obj = {
            mnemonic: mnemonic,
            master: padPrivKeyByHex(GeneratorBuilder.deriveMasterKey(mnemonic).privateKey()).toString('hex'),
            seed: bip39.mnemonicToSeed(mnemonic).toString('hex'),
            priv: w.privateKeys.cosmos.toString('hex'),
            pub: w.publicKeys.cosmos.toString('hex'),
            addr: w.addresses.cosmos.toString('hex'),
        }
        list.push(obj)
    }
    console.log(JSON.stringify(list));
})
