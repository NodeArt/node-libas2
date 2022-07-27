/// <reference types="node" />
import { Readable } from 'stream';
import * as MimeNode from 'nodemailer/lib/mime-node';
import { AS2MimeNodeOptions, DispositionOutOptions } from './Interfaces';
import { SigningOptions, EncryptionOptions, DecryptionOptions, VerificationOptions } from '../AS2Crypto';
import { AS2Disposition } from '../AS2Disposition';
/** Options for constructing an AS2 message.
 * @typedef {object} AS2MimeNodeOptions
 * @property {string} [filename]
 * @property {string|Buffer | Readable} [content]
 * @property {string} [boundary]
 * @property {string} [baseBoundary]
 * @property {false|string} [boundaryPrefix='--LibAs2_']
 * @property {string} [contentType]
 * @property {boolean|'inline'|'attachment'} [contentDisposition]
 * @property {string} [messageId]
 * @property {AS2Headers} [headers]
 * @property {SigningOptions} [sign]
 * @property {EncryptionOptions} [encrypt]
 */
/** Convenience options for generating an outgoing MDN.
 * @typedef {object} DispositionOutOptions
 * @property {AgreementOptions} agreement
 * @property {boolean} [returnNode]
 */
export interface AS2MimeNode {
    keepBcc: boolean;
    _headers: Array<{
        key: string;
        value: string;
    }>;
    filename: string;
    date: Date;
    boundary: string;
    boundaryPrefix: string;
    content: string | Buffer | Readable;
    contentType: string;
    rootNode: AS2MimeNode;
    parentNode?: AS2MimeNode;
    childNodes: AS2MimeNode[];
    nodeCounter: number;
    raw: string;
    normalizeHeaderKey: Function;
    _handleContentType(structured: any): void;
    _encodeWords(value: string): string;
    _encodeHeaderValue(key: string, value: string): string;
}
/** Class for describing and constructing a MIME document.
 * @param {AS2MimeNodeOptions} options - Options for constructing an AS2 message.
 */
export declare class AS2MimeNode extends MimeNode {
    constructor(options: AS2MimeNodeOptions);
    private _sign;
    private _encrypt;
    parsed: boolean;
    smime: boolean;
    signed: boolean;
    encrypted: boolean;
    compressed: boolean;
    smimeType: string;
    /** Set the signing options for this instance.
     * @param {SigningOptions} options - Options for signing this AS2 message.
     */
    setSigning(options: SigningOptions): void;
    /** Set the encryption options for this instance.
     * @param {EncryptionOptions} options - Options for encrypting this AS2 message.
     */
    setEncryption(options: EncryptionOptions): void;
    /** Set one or more headers on this instance.
     * @param {string|any} keyOrHeaders - The key name of the header to set or an array of headers.
     * @param {string} [value] - The value of the header key; required if providing a simple key/value.
     * @returns {AS2MimeNode} This AS2MimeNode instance.
     */
    setHeader(keyOrHeaders: any, value?: any): this;
    /** Sets and/or gets the message ID of the MIME message.
     * @param {boolean} [create=false] - Set the the message ID if one does not exist.
     * @returns {string} The message ID of the MIME.
     */
    messageId(create?: boolean): string;
    /** Convenience method for generating an outgoing MDN for this message.
     * @param {DispositionOutOptions} [options] - Optional options for generating an MDN.
     * @returns {Promise<object>} The content node and the outgoing MDN as an AS2MimeNode.
     */
    dispositionOut(options?: DispositionOutOptions): Promise<{
        contentNode: AS2MimeNode;
        dispositionNode: AS2MimeNode;
        disposition: AS2Disposition;
    }>;
    /** Convenience method for consuming this instance as an incoming MDN.
     * @param {VerificationOptions} [signed] - Pass verification options for a signed MDN.
     * @returns {Promise<AS2Disposition>} This instance as an incoming AS2Disposition.
     */
    dispositionIn(signed?: VerificationOptions): Promise<AS2Disposition>;
    /** Convenience method for signing this instance.
     * @param {SigningOptions} [options] - Options for signing this AS2 message; not required if provided when constructing this instance.
     * @returns {Promise<AS2MimeNode>} This instance as a new signed multipart AS2MimeNode.
     */
    sign(options?: SigningOptions): Promise<AS2MimeNode>;
    /** Convenience method for verifying this instance.
     * @param {VerificationOptions} options - Options for verifying this signed AS2 message.
     * @returns {Promise<AS2MimeNode>} The content part of this signed message as an AS2MimeNode.
     */
    verify(options: VerificationOptions): Promise<AS2MimeNode>;
    /** Convenience method for decrypting this instance.
     * @param {DecryptionOptions} options - Options for decrypting this encrypted AS2 message.
     * @returns {Promise<AS2MimeNode>} The contents of the encrypted message as an AS2MimeNode.
     */
    decrypt(options: DecryptionOptions): Promise<AS2MimeNode>;
    /** Convenience method for encrypting this instance.
     * @param {EncryptionOptions} [options] - Options for encrypting this AS2 message; not required if provided when constructing this instance.
     * @returns {Promise<AS2MimeNode>} This instance as a new encrypted AS2MimeNode.
     */
    encrypt(options?: EncryptionOptions): Promise<AS2MimeNode>;
    /** Constructs a complete S/MIME or MIME buffer from this instance.
     * @returns {Promise<Buffer>} This instance as raw, complete S/MIME or MIME buffer.
     */
    build(): Promise<Buffer>;
    /** Method for getting the headers and body of the MIME message as separate properties.
     * @returns {Promise<object>} An object with headers and body properties.
     */
    buildObject(): Promise<{
        headers: {
            [key: string]: any;
        };
        body: string;
    }>;
    /** Generates a valid, formatted, random message ID.
     * @param {string} [sender='<HOST_NAME>'] - The sender of this ID.
     * @param {string} [uniqueId] - A unique ID may be provided if a real GUID is required.
     * @returns {string} A valid message ID for use with MIME.
     */
    static generateMessageId(sender?: string, uniqueId?: string): string;
}
