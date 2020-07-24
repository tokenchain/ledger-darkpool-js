import createKeccakHash from "keccak"
import base58Check from "bs58check"
import createHash from "create-hash"

export function sha3(data): Buffer {
    return createKeccakHash('keccak256').update(data).digest()
}

export function sha2(data): Buffer {
    return createHash('sha256').update(data).digest()
}

export function ripemd160(data): Buffer {
    return createHash('ripemd160').update(data).digest()
}

export function base58Encode(data: Buffer): string {
    return base58Check.encode(data)
}

export function did(data: string): string {
    return `did:dxp:${data}`
}
