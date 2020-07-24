import DarkpoolApp from "../index";

// Same as a bitcoin address
// Returns 0x prefixed hex address
export function getAddress (pub) {
    return DarkpoolApp.getBech32FromPK("dx0", pub)
}


