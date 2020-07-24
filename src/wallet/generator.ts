import {xor, padPrivKey, hex3Buffer} from "./util"
import {sha2, did, base58Encode} from "./hash"
import bip39 from "bip39"
import secp256k1 from "secp256k1"
import {derivePath, getMasterKeyFromSeed, getPublicKey} from "ed25519-hd-key"
import {HDNode} from "hdnode-js"
import Cosmos from "./cosmos"
import Bitcoin from "./bitcoin"
import Ethereum from "./eth"
import Darkpool from "./darkpool"
import {DIDDoc, DidDP, DidSecret, KeyGenerator} from "../types";
import DarkpoolApp from "../index";

const entropySalt = 'xioaio2nxxoiisjfiji93902..3232'

export class GeneratorBuilder {


    static generateMnemonic() {
        let mnemonic = bip39.generateMnemonic()
        let entropyHex = bip39.mnemonicToEntropy(mnemonic)
        let entropyBuf = new Buffer(entropyHex, 'hex')
        // console.log("before", entropyBuf, mnemonic)
        let salt = sha2(entropySalt)
        salt = salt.slice(0, 16)
        // console.log("salt", salt)
        entropyBuf = xor(entropyBuf, new Buffer(salt))
        entropyHex = entropyBuf.toString('hex')
        mnemonic = bip39.entropyToMnemonic(entropyHex)
        // console.log("after", entropyBuf, mnemonic)
        return mnemonic
    }

    static derivePublicKeys(priv) {
        // bitcoin and cosmos use compressed pubkey of 33 bytes.
        // ethereum uses uncompressed 64-byte pubkey without the openssl prefix (0x04).
        let bitcoin = secp256k1.publicKeyCreate(priv.bitcoin, true)
        let cosmos = secp256k1.publicKeyCreate(priv.cosmos, true)
        let ethereum = secp256k1.publicKeyCreate(priv.ethereum, false).slice(-64)
        let darkpool = getPublicKey(priv.darkpool, true)
        return {cosmos, bitcoin, ethereum, darkpool}
    }

    // cosmos and eth are 0x hex, bitcoin is base58check
    static deriveAddresses(pub) {
        let cosmos = Cosmos.getAddress(pub.cosmos)
        let bitcoin = Bitcoin.getAddress(pub.bitcoin)
        let ethereum = Ethereum.getAddress(pub.ethereum)
        let darkpool = Darkpool.getAddress(pub.darkpool)
        return {cosmos, bitcoin, ethereum, darkpool}
    }

    static splitMnemonic(mnemonic: string) {
        let eHex = bip39.mnemonicToEntropy(mnemonic)
        let eBuf = new Buffer(eHex, 'hex')
        let one = bip39.generateMnemonic()
        let oneHex = bip39.mnemonicToEntropy(one)
        let oneBuf = new Buffer(oneHex, 'hex')
        let twoBuf = xor(eBuf, oneBuf)
        let twoHex = twoBuf.toString('hex')
        let two = bip39.entropyToMnemonic(twoHex)
        return {one, two}
    }

    static joinMnemonic(one: string, two: string) {
        let oneHex = bip39.mnemonicToEntropy(one)
        let oneBuf = new Buffer(oneHex, 'hex')
        let twoHex = bip39.mnemonicToEntropy(two)
        let twoBuf = new Buffer(twoHex, 'hex')
        let eBuf = xor(oneBuf, twoBuf)
        let eHex = eBuf.toString('hex')
        let mnemonic = bip39.entropyToMnemonic(eHex)
        return mnemonic
    }

    static deriveWallet(mnemonic: string) {
        let privateKeys = GeneratorBuilder.derivePrivateKeys(mnemonic)
        let publicKeys = GeneratorBuilder.derivePublicKeys(privateKeys)
        let addresses = GeneratorBuilder.deriveAddresses(publicKeys)
        return {privateKeys, publicKeys, addresses}
    }

    static deriveMasterKey(mnemonic: string): HDNode {
        // seed must be 12 or more space-separated words
        var words = mnemonic.trim().split(/\s+/g)
        if (words.length < 12) {
            throw Error('Mnemonic must be at least 12 words')
        }

        // throws if mnemonic is invalid
        bip39.mnemonicToEntropy(mnemonic)
        var seed = bip39.mnemonicToSeed(mnemonic)
        let hex_seed = seed.toString('hex')
        var masterKey = HDNode.fromMasterSeed(hex_seed)
        return masterKey
    }

    static derivePrivateKeys(mnemonic: string) {
        let masterKey = GeneratorBuilder.deriveMasterKey(mnemonic)
        // bip32 derived wallet: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
        // single quote == hardened derivation
        // derivation path: m/purpose/cointype/account/...
        // purpose: the BIP which sets the spec: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
        //  see motivation: https://github.com/bitcoin/bips/blob/master/bip-0043.mediawiki
        //  cointype: not clear where source of truth is but
        //   btc = 0
        //   eth = 60
        //   dfn = 223
        //   atom = 118 (?)
        //   dap = 777 (?)
        let hdPathAtom = "m/44'/118'/0'/0/0" // key controlling ATOM allocation
        let hdPathETHIntermediate = "m/44'/60'/0'/0/0" // ETH key for emergency return address
        let hdPathBTCIntermediate = "m/44'/0'/0'/0/0" // BTC key forwarding donation for hdPathAtom key
        let hdPathDAP = "m/44'/777'/0'/0/0" // DAP key forwarding donation for hdPathAtom key
        let cosmosHD = masterKey.derivePath(hdPathAtom)
        let darkpoolHD = masterKey.derivePath(hdPathDAP)
        let ethereumHD = masterKey.derivePath(hdPathETHIntermediate)
        let bitcoinHD = masterKey.derivePath(hdPathBTCIntermediate)
        // NOTE: we want to make sure private keys are always 32 bytes
        // else we may have trouble. See the bitcore fiasco for more:
        // https://github.com/bitpay/bitcore-lib/issues/47
        // https://github.com/bitpay/bitcore-lib/pull/97
        let cosmos = padPrivKey(hex3Buffer(cosmosHD.privateKey()))
        let bitcoin = padPrivKey(hex3Buffer(bitcoinHD.privateKey()))
        let ethereum = padPrivKey(hex3Buffer(ethereumHD.privateKey()))
        let darkpool = hex3Buffer(darkpoolHD.privateKey())
        return {cosmos, bitcoin, ethereum, darkpool}
    }

    /*
    // test
    let list = []
    let N = 200
    for (let i = 0; i < N; i++){
      let mnemonic = generateMnemonic()
      let w = deriveWallet(mnemonic)
      let obj = {
        mnemonic: mnemonic,
        master: padPrivKey(deriveMasterKey(mnemonic).keyPair.d.toBuffer()).toString('hex'),
        seed: bip39.mnemonicToSeed(mnemonic).toString('hex'),
        priv: w.privateKeys.cosmos.toString('hex'),
        pub: w.publicKeys.cosmos.toString('hex'),
        addr: w.addresses.cosmos.toString('hex'),
      }
      list.push(obj)
    }
    console.log(JSON.stringify(list));
    */

    /*
    let seed = generateSeed()
    let w = deriveWallet(seed)
    let obj = {
      seed: seed,
      privateKeys: {
        cosmos: w.privateKeys.cosmos.toString('hex'),
        bitcoin: w.privateKeys.bitcoin.toString('hex'),
        ethereum: w.privateKeys.ethereum.toString('hex')
      },
      publicKeys: {
        cosmos: w.publicKeys.cosmos.toString('hex'),
        bitcoin: w.publicKeys.bitcoin.toString('hex'),
        ethereum: w.publicKeys.ethereum.toString('hex')
      },
      addresses: {
        cosmos: w.addresses.cosmos,
        bitcoin: w.addresses.bitcoin,
        ethereum: w.addresses.ethereum
      }
    }
    console.log(obj)
    */
    private memory: KeyGenerator

    constructor() {
        this.memory = {}
    }

    get MnemonicString(): string {
        return this.memory.mem
    }

    get SeedString(): string {
        return this.memory.seed.slice(0, 32).toString("hex")
    }

    generateDidKey() {

    }

    build(): DidDP {
        if (this.memory.mem == "") {

        }
        return null
    }

    withName(nameHash: string): GeneratorBuilder {
        this.memory.name = nameHash
        return this
    }

    withPubKey(pk: Buffer): GeneratorBuilder {
        this.memory.pubkey = pk
        return this
    }

    withPrivKey(pk: Buffer): GeneratorBuilder {
        this.memory.privkey = pk
        return this
    }

    withMem(mnm: string): GeneratorBuilder {
        this.memory.mem = mnm
        return this
    }

    withSeed(seed32: Buffer): GeneratorBuilder {
        this.memory.seed = seed32
        return this
    }

    buildWithCustomSeed(seed32: Buffer): DidDP {
        return null
    }

    recover(m: string): DidDP {

        const {publicKeyBytes, privateKeyBytes} = GeneratorBuilder.derivePrivateKeys(this.memory.mem)
        const {keyPairPublicKey, keyPairPrivateKey} = GeneratorBuilder.derivePrivateKeys(this.memory.mem)

        let secret_doc: DidSecret = {
            seed: this.memory.seed.slice(0, 32).toString("hex"),
            signKey: base58Encode(privateKeyBytes.slice(0, 32)),
            encryptionPrivateKey: base58Encode(keyPairPublicKey)
        }

        let doc_dp: DidDP = {
            address: Darkpool.getAddress(pub),
            pubkey: base58Encode(privateKeyBytes.slice(0, 32)),
            name: this.memory.name,
            algo: "ed25519"
        }

        let info: DIDDoc = {
            did: did(base58Encode(publicKeyBytes.slice(0, 16))),
            verifyKey: base58Encode(publicKeyBytes),
            encryptionPublicKey: base58Encode(keyPairPublicKey),
            secret: secret_doc,
            dp: doc_dp
        }


        return info
    }
}
