/// <reference types="node" />
import { PemFile } from './PemFile';
import { AS2Encryption } from './Interfaces';
export declare class AS2EnvelopedData {
    constructor(data: Buffer, enveloped?: boolean);
    data: ArrayBuffer;
    enveloped: any;
    private _toCertificate;
    private _getEncryptionAlgorithm;
    private _getCryptoInfo;
    private _getDecryptionKey;
    private _extendedDecrypt;
    private _extendedEncrypt;
    encrypt(cert: string | Buffer | PemFile, encryption: AS2Encryption): Promise<Buffer>;
    decrypt(cert: string | Buffer | PemFile, key: string | Buffer | PemFile): Promise<Buffer>;
}
