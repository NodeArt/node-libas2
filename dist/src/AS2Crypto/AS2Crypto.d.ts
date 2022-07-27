/// <reference types="node" />
import { AS2MimeNode } from '../AS2MimeNode';
import { EncryptionOptions, SigningOptions, DecryptionOptions, VerificationOptions } from './Interfaces';
/** List of supported signing algorithms.
 * @typedef {'sha-1'|'sha-256'|'sha-384'|'sha-512'} AS2Signing
 */
/** List of supported encryption algorithms.
 * @typedef {'des-EDE3-CBC'|'aes128-CBC'|'aes192-CBC'|'aes256-CBC'|'aes128-GCM'|'aes192-GCM'|'aes256-GCM'} AS2Encryption
 */
/** Options for encrypting payloads.
 * @typedef {object} EncryptionOptions
 * @property {string|Buffer} cert
 * @property {AS2Encryption} encryption
 */
/** Options for decrypting payloads.
 * @typedef {object} DecryptionOptions
 * @property {string|Buffer} cert
 * @property {string|Buffer} key
 */
/** Options for decrypting payloads.
 * @typedef {object} SigningOptions
 * @property {string|Buffer} cert
 * @property {string|Buffer} key
 * @property {AS2Signing} algorithm
 */
/** Options for decrypting payloads.
 * @typedef {object} VerificationOptions
 * @property {string|Buffer} cert
 */
/** Class for cryptography methods supported by AS2. */
export declare class AS2Crypto {
    private static buildNode;
    /** A fix for signing with Nodemailer to produce verifiable SMIME;
     * the library joins multipart boundaries without the part's trailing CRLF,
     * where OpenSSL and other SMIME clients keep each part's last CRLF.
     * @private
     */
    private static removeTrailingCrLf;
    /** Crux to generate UUID-like random strings
     * @returns {string} A UUID-like random string.
     */
    static generateUniqueId(): string;
    /** Method to decrypt an AS2MimeNode from a PKCS7 encrypted AS2MimeNode.
     * @param {AS2MimeNode} node - The AS2MimeNode to decrypt.
     * @param {DecryptionOptions} options - Options to decrypt the MIME message.
     * @returns {Promise<AS2MimeNode>} The decrypted MIME as an AS2MimeNode.
     */
    static decrypt(node: AS2MimeNode, options: DecryptionOptions): Promise<AS2MimeNode>;
    /** Method to envelope an AS2MimeNode in an encrypted AS2MimeNode.
     * @param {AS2MimeNode} node - The AS2MimeNode to encrypt.
     * @param {EncryptionOptions} options - Options to encrypt the MIME message.
     * @returns {Promise<AS2MimeNode>} The encrypted MIME as an AS2MimeNode.
     */
    static encrypt(node: AS2MimeNode, options: EncryptionOptions): Promise<AS2MimeNode>;
    /** Method to verify data has not been modified from a signature.
     * @param {AS2MimeNode} node - The AS2MimeNode to verify.
     * @param {VerificationOptions} options - Options to verify the MIME message.
     * @param {boolean} [getDigest] - Optional argument to return a message digest if verified instead of a boolean.
     * @returns {Promise<boolean|object>} A boolean or digest object indicating if the message was verified.
     */
    static verify(node: AS2MimeNode, options: VerificationOptions): Promise<boolean>;
    static verify(node: AS2MimeNode, options: VerificationOptions, getDigest: true): Promise<{
        digest: Buffer;
        algorithm: string;
    }>;
    /** Method to sign data against a certificate and key pair.
     * @param {AS2MimeNode} node - The AS2MimeNode to sign.
     * @param {EncryptionOptions} options - Options to sign the MIME message.
     * @returns {Promise<AS2MimeNode>} The signed MIME as a multipart AS2MimeNode.
     */
    static sign(node: AS2MimeNode, options: SigningOptions): Promise<AS2MimeNode>;
    /** Not yet implemented; do not use.
     * @throws ERROR.NOT_IMPLEMENTED
     */
    static compress(node: AS2MimeNode, options: any): Promise<AS2MimeNode>;
    /** Not yet implemented; do not use.
     * @throws ERROR.NOT_IMPLEMENTED
     */
    static decompress(node: AS2MimeNode, options: any): Promise<AS2MimeNode>;
}
