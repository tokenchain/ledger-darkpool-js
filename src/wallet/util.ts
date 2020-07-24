let BASE_URL

if (process.env.COSMOS_BASE_URL) {
    BASE_URL = process.env.COSMOS_BASE_URL
} else if (process.browser) {
    BASE_URL = window.location.origin
} else {
    BASE_URL = 'https://fundraiser.cosmos.network' // 'cosmos.interblock.io'
}

export function byte(n): Buffer {
    return new Buffer([n])
}

export function concat(...buffers): Buffer {
    return Buffer.concat(buffers)
}

export function xor(a, b): Buffer {
    if (!Buffer.isBuffer(a)) a = new Buffer(a)
    if (!Buffer.isBuffer(b)) b = new Buffer(b)
    let res = []
    let length = Math.min(a.length, b.length)
    for (let i = 0; i < length; i++) {
        res.push(a[i] ^ b[i])
    }
    return new Buffer(res)
}


export function padPrivKey(privBuffer): Buffer {
    let privHex = privBuffer.toString('hex')
    return new Buffer(('0000000000000000' + privHex).slice(-64), 'hex')
}

export function padPrivKeyByHex(privHex: string): Buffer {
    return new Buffer(('0000000000000000' + privHex).slice(-64), 'hex')
}


export function ed25519PrivateKey(privBuffer): Buffer {
    let privHex = privBuffer.toString('hex')
    return new Buffer(('000000' + privHex).slice(-64), 'hex')
}

export function hex3Buffer(str: string): Buffer {
    return new Buffer(str, 'hex')
}
export const BASE_URL
