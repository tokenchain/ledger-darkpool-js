import base58check from "bs58check"
import createHash from "create-hash"

function ripemd160(buffer): Promise<ArrayBuffer> {
    return createHash('rmd160').update(buffer).digest()
}

function sha256(buffer): Promise<ArrayBuffer> {
    return createHash('sha256').update(buffer).digest()
}

function hash160(buffer): Promise<ArrayBuffer> {
    return ripemd160(sha256(buffer))
}

function toBase58Check(hash, version) {
    const payload = Buffer.allocUnsafe(21)
    payload.writeUInt8(version, 0)
    hash.copy(payload, 1)

    return base58check.encode(payload)
}


function DEFAULT_ADDRESS_FUNCTION(node, network) {
    return toBase58Check(hash160(node.publicKey), network.pubKeyHash)
}
/*

export class Chain {
    constructor(parent, k, addressFunction) {
        k = k || 0
        this.__parent = parent

        this.addresses = []
        this.addressFunction = addressFunction || DEFAULT_ADDRESS_FUNCTION
        this.k = k
        this.map = {}
    }

    __initialize() {
        const address = this.addressFunction(this.__parent.derive(this.k), this.__parent.network)
        this.map[address] = this.k
        this.addresses.push(address)
    }

    clone() {
        const chain = new Chain(this.__parent, this.k, this.addressFunction)

        chain.addresses = this.addresses.concat()
        for (const s in this.map) chain.map[s] = this.map[s]

        return chain
    }

    derive(address, parent) {
        const k = this.map[address]
        if (k === undefined) return

        parent = parent || this.__parent
        return parent.derive(k)
    }

    find(address) {
        return this.map[address]
    }

    get() {
        if (this.addresses.length === 0) this.__initialize()

        return this.addresses[this.addresses.length - 1]
    }

    getAll() {
        if (this.addresses.length === 0) this.__initialize()

        return this.addresses
    }

    getParent() {
        return this.__parent
    }

    next() {
        if (this.addresses.length === 0) this.__initialize()
        const address = this.addressFunction(this.__parent.derive(this.k + 1), this.__parent.network)

        this.k += 1
        this.map[address] = this.k
        this.addresses.push(address)

        return address
    }

    pop() {
        const address = this.addresses.pop()
        delete this.map[address]
        this.k -= 1

        return address
    }


}
*/
