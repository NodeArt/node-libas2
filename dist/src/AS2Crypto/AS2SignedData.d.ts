/// <reference types="node" />
import { PemFile } from './PemFile';
export declare class AS2SignedData {
    constructor(data: Buffer, signedData?: Buffer);
    data: ArrayBuffer;
    digestInfo?: {
        digest: ArrayBuffer;
        algorithm: string;
    };
    signed: {
        version: number;
        encapContentInfo: any;
        signerInfos: any[];
        certificates: any[];
        sign: (...args: any) => Promise<void>;
        verify: (...args: any) => Promise<boolean | {
            signatureVerified: boolean;
        }>;
        toSchema: (...args: any) => any;
    };
    private _toCertificate;
    private _addSignerInfo;
    private _getCertAlgorithmId;
    private _addSigner;
    private _findSigner;
    private _calculateMessageDigest;
    getMessageDigest(): {
        digest: Buffer;
        algorithm: string;
    };
    sign({ cert, key, algorithm, addSigners }: SignMethodOptions): Promise<Buffer>;
    verify(cert?: string | Buffer | PemFile, debugMode?: boolean): Promise<boolean>;
}
export interface SignMethodOptions {
    cert: string | Buffer | PemFile;
    key: string | Buffer | PemFile;
    algorithm: string;
    addSigners?: Array<{
        cert: string | Buffer | PemFile;
        key: string | Buffer | PemFile;
        algorithm: string;
    }>;
}
