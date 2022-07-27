"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AS2Crypto = void 0;
const Constants_1 = require("../Constants");
const AS2MimeNode_1 = require("../AS2MimeNode");
const Helpers_1 = require("../Helpers");
const MimeNode = require("nodemailer/lib/mime-node");
const AS2Parser_1 = require("../AS2Parser");
const crypto_1 = require("crypto");
const AS2SignedData_1 = require("./AS2SignedData");
const AS2EnvelopedData_1 = require("./AS2EnvelopedData");
const { CRLF, ENCRYPTION_FILENAME, SIGNATURE_FILENAME, ERROR } = Constants_1.AS2Constants;
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
class AS2Crypto {
    static async buildNode(node) {
        return node.parsed ? await node.build() : await MimeNode.prototype.build.bind(node)();
    }
    /** A fix for signing with Nodemailer to produce verifiable SMIME;
     * the library joins multipart boundaries without the part's trailing CRLF,
     * where OpenSSL and other SMIME clients keep each part's last CRLF.
     * @private
     */
    static removeTrailingCrLf(buffer) {
        const trailingBytes = buffer.slice(buffer.length - 2, buffer.length);
        return trailingBytes.toString('utf8') === CRLF ? buffer.slice(0, buffer.length - 2) : buffer;
    }
    /** Crux to generate UUID-like random strings
     * @returns {string} A UUID-like random string.
     */
    static generateUniqueId() {
        const byteLengths = [4, 2, 2, 2, 6];
        return byteLengths.map(byteLength => crypto_1.randomBytes(byteLength).toString('hex')).join('-');
    }
    /** Method to decrypt an AS2MimeNode from a PKCS7 encrypted AS2MimeNode.
     * @param {AS2MimeNode} node - The AS2MimeNode to decrypt.
     * @param {DecryptionOptions} options - Options to decrypt the MIME message.
     * @returns {Promise<AS2MimeNode>} The decrypted MIME as an AS2MimeNode.
     */
    static async decrypt(node, options) {
        const data = Buffer.isBuffer(node.content) ? node.content : Buffer.from(node.content, 'base64');
        const envelopedData = new AS2EnvelopedData_1.AS2EnvelopedData(data, true);
        const buffer = await envelopedData.decrypt(options.cert, options.key);
        const revivedNode = await AS2Parser_1.AS2Parser.parse(buffer);
        return revivedNode;
    }
    /** Method to envelope an AS2MimeNode in an encrypted AS2MimeNode.
     * @param {AS2MimeNode} node - The AS2MimeNode to encrypt.
     * @param {EncryptionOptions} options - Options to encrypt the MIME message.
     * @returns {Promise<AS2MimeNode>} The encrypted MIME as an AS2MimeNode.
     */
    static async encrypt(node, options) {
        options = Helpers_1.getEncryptionOptions(options);
        const rootNode = new AS2MimeNode_1.AS2MimeNode({
            filename: ENCRYPTION_FILENAME,
            contentType: 'application/pkcs7-mime; smime-type=enveloped-data'
        });
        Helpers_1.canonicalTransform(node);
        const buffer = await AS2Crypto.buildNode(node);
        const envelopedData = new AS2EnvelopedData_1.AS2EnvelopedData(buffer);
        const derBuffer = await envelopedData.encrypt(options.cert, options.encryption);
        rootNode.setContent(derBuffer);
        return rootNode;
    }
    static async verify(node, options, getDigest) {
        const contentPart = await AS2Crypto.buildNode(node.childNodes[0]);
        const contentPartNoCrLf = AS2Crypto.removeTrailingCrLf(contentPart);
        const signaturePart = Buffer.isBuffer(node.childNodes[1].content)
            ? node.childNodes[1].content
            : Buffer.from(node.childNodes[1].content, 'base64');
        const signedData = new AS2SignedData_1.AS2SignedData(contentPart, signaturePart);
        // Deal with Nodemailer trailing CRLF bug by trying with and without CRLF
        if (await signedData.verify(options.cert)) {
            return getDigest ? signedData.getMessageDigest() : true;
        }
        const signedDataNoCrLf = new AS2SignedData_1.AS2SignedData(contentPartNoCrLf, signaturePart);
        const result = await signedDataNoCrLf.verify(options.cert);
        return getDigest && result ? signedDataNoCrLf.getMessageDigest() : result;
    }
    /** Method to sign data against a certificate and key pair.
     * @param {AS2MimeNode} node - The AS2MimeNode to sign.
     * @param {EncryptionOptions} options - Options to sign the MIME message.
     * @returns {Promise<AS2MimeNode>} The signed MIME as a multipart AS2MimeNode.
     */
    static async sign(node, options) {
        const rootNode = new AS2MimeNode_1.AS2MimeNode({
            contentType: `multipart/signed; protocol="application/pkcs7-signature"; micalg=${options.algorithm};`,
            encrypt: node._encrypt
        });
        const contentNode = rootNode.appendChild(node);
        const contentHeaders = contentNode._headers;
        for (let i = 0, len = contentHeaders.length; i < len; i++) {
            const header = contentHeaders[i];
            if (header.key.toLowerCase() === 'content-type')
                continue;
            rootNode.setHeader(header.key, header.value);
            contentHeaders.splice(i, 1);
            i--;
            len--;
        }
        Helpers_1.canonicalTransform(contentNode);
        const canonical = AS2Crypto.removeTrailingCrLf(await AS2Crypto.buildNode(contentNode));
        const signedData = new AS2SignedData_1.AS2SignedData(canonical);
        const derBuffer = await signedData.sign({
            cert: options.cert,
            key: options.key,
            algorithm: options.algorithm
        });
        rootNode.appendChild(new AS2MimeNode_1.AS2MimeNode({
            filename: SIGNATURE_FILENAME,
            contentType: 'application/pkcs7-signature',
            content: derBuffer
        }));
        return rootNode;
    }
    /** Not yet implemented; do not use.
     * @throws ERROR.NOT_IMPLEMENTED
     */
    static async compress(node, options) {
        throw new Error(ERROR.NOT_IMPLEMENTED);
    }
    /** Not yet implemented; do not use.
     * @throws ERROR.NOT_IMPLEMENTED
     */
    static async decompress(node, options) {
        throw new Error(ERROR.NOT_IMPLEMENTED);
    }
}
exports.AS2Crypto = AS2Crypto;
