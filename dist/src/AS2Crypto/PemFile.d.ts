/// <reference types="node" />
/** Types of PEM files.
 * @typedef {'UNKNOWN'|'PRIVATE_KEY'|'PUBLIC_KEY'|'CERTIFICATE'} PemFileType
 */
declare type PemFileType = 'UNKNOWN' | 'PRIVATE_KEY' | 'PUBLIC_KEY' | 'CERTIFICATE';
/** Method for constructing an object from PEM data.
 * @param {string|Buffer|PemFile} data - Data for constructing a PemFile object.
 */
export declare class PemFile {
    constructor(data: string | Buffer | PemFile);
    type: PemFileType;
    data: ArrayBuffer;
    /** Convenience method for creating a PemFile from a DER/BER Buffer.
     * @param {Buffer} data - DER or BER data in a Buffer.
     * @param {PemFileType} [type='UNKNOWN'] - The type of PEM file.
     * @returns {PemFile} The data as a PemFile object.
     */
    static fromDer(data: Buffer, type?: PemFileType): PemFile;
}
/** Constants used in libas2.
 * @namespace PEM_FILETYPE
 */
export declare const PEM_FILETYPE: {
    CERTIFICATE: PemFileType;
    PRIVATE_KEY: PemFileType;
    PUBLIC_KEY: PemFileType;
};
export {};
