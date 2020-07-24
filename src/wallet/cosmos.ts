// Same as a bitcoin address
// Returns 0x prefixed hex address
export function getAddress(pub): string {
    let pubkeyHash = Bitcoin.getAddress160(pub)
    return 'cosmos' + pubkeyHash.toString('hex')
}


