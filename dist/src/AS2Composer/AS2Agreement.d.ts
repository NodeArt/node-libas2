/// <reference types="node" />
import { AgreementOptions } from './Interfaces';
import { AS2Encryption, AS2Signing, PemFile } from '../AS2Crypto';
/** Class for describing and handling partner agreements.
 * @implements {AgreementOptions}
 * @param {AgreementOptions} agreement - The partner agreement for sending and receiving over AS2.
 */
export declare class AS2Agreement implements AgreementOptions {
    constructor(agreement: AgreementOptions | (AS2Agreement & {
        host: AS2Host & {
            certificate?: string | Buffer | PemFile;
            privateKey?: string | Buffer | PemFile;
            sign: AS2Signing | boolean;
        };
        partner: AS2Partner & {
            certificate?: string | Buffer | PemFile;
            encrypt: AS2Encryption | boolean;
        };
    }));
    host: AS2Host;
    partner: AS2Partner;
}
export declare class AS2Trading {
    constructor(trading: AS2Trading & {
        url: string | URL;
    });
    role: 'host' | 'partner';
    name: string;
    id: string;
    url: URL;
    mdn?: {
        async?: boolean;
        signing: AS2Signing | false;
    };
}
export declare class AS2Host extends AS2Trading {
    constructor(host: AS2Host & {
        certificate?: string | Buffer | PemFile;
        privateKey?: string | Buffer | PemFile;
        sign: AS2Signing | boolean;
    });
    role: 'host';
    certificate?: PemFile;
    privateKey?: PemFile;
    decrypt?: boolean;
    sign?: AS2Signing | false;
}
export declare class AS2Partner extends AS2Trading {
    constructor(partner: AS2Partner & {
        certificate?: string | Buffer | PemFile;
        encrypt: AS2Encryption | boolean;
    });
    role: 'partner';
    file: 'EDIX12' | 'EDIFACT' | 'XML' | string;
    certificate?: PemFile;
    encrypt?: AS2Encryption | false;
    verify?: boolean;
}
