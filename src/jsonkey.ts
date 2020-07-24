import {
    CLA,
    ERROR_CODE,
    P1_VALUES,
    INS,
    PAYLOAD_TYPE,
    CHUNK_SIZE,
    ERROR_DESCRIPTION,
} from "./constants";

import {
    AppInfoResponse,
    VersionResponse,
    DeviceInfoResponse,
    PublicKeyResponse,
    SignResponse,
    DIDDoc
} from './types'

function errorCodeToString(statusCode): string {
    if (statusCode in ERROR_DESCRIPTION) {
        return ERROR_DESCRIPTION[statusCode];
    }

    return `Unknown Status Code: ${statusCode}`;
}

function isDict(v): boolean {
    return typeof v === "object" && v !== null && !(v instanceof Array) && !(v instanceof Date);
}

function processErrorResponse(response: any) {
    if (response) {
        if (isDict(response)) {
            if (Object.prototype.hasOwnProperty.call(response, "statusCode")) {
                return {
                    return_code: response.statusCode,
                    error_message: errorCodeToString(response.statusCode),
                };
            }

            if (
                Object.prototype.hasOwnProperty.call(response, "return_code") &&
                Object.prototype.hasOwnProperty.call(response, "error_message")
            ) {
                return response;
            }
        }
        return {
            return_code: 0xffff,
            error_message: response.toString(),
        };
    }

    return {
        return_code: 0xffff,
        error_message: response.toString(),
    };
}

export function publicKey(transport, data): Promise<PublicKeyResponse> {
    return transport
        .send(CLA, INS.GET_ADDR_SECP256K1, 0, 0, data, [ERROR_CODE.NoError])
        .then((response) => {
            const errorCodeData = response.slice(-2);
            const returnCode: number = errorCodeData[0] * 256 + errorCodeData[1];
            const compressedPk = response ? Buffer.from(response.slice(0, 33)) : null;

            return {
                pk: "OBSOLETE PROPERTY",
                compressed_pk: compressedPk ? compressedPk.toJSON() : compressedPk,
                return_code: returnCode,
                error_message: errorCodeToString(returnCode),
            };
        })
        .catch(processErrorResponse);
}

export function publicKey(transport, data): Promise<DidInfoResponse> {
    return transport
        .send(CLA, INS.GET_ADDR_SECP256K1, 0, 0, data, [ERROR_CODE.NoError])
        .then((response) => {
            const errorCodeData = response.slice(-2);
            const returnCode: number = errorCodeData[0] * 256 + errorCodeData[1];
            const compressedPk = response ? Buffer.from(response.slice(0, 33)) : null;

            return {
                pk: "OBSOLETE PROPERTY",
                compressed_pk: compressedPk ? compressedPk.toJSON() : compressedPk,
                return_code: returnCode,
                error_message: errorCodeToString(returnCode),
            };
        })
        .catch(processErrorResponse);
}
