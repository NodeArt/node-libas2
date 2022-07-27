"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AS2MimeNode = void 0;
const MimeNode = require("nodemailer/lib/mime-node");
const Helpers_1 = require("../Helpers");
const AS2Crypto_1 = require("../AS2Crypto");
const AS2Disposition_1 = require("../AS2Disposition");
const os_1 = require("os");
/** Class for describing and constructing a MIME document.
 * @param {AS2MimeNodeOptions} options - Options for constructing an AS2 message.
 */
class AS2MimeNode extends MimeNode {
    constructor(options) {
        const { filename, content, boundary, baseBoundary, boundaryPrefix, contentType, contentDisposition, messageId, headers, sign, encrypt } = options;
        super(contentType, {
            filename,
            baseBoundary: !Helpers_1.isNullOrUndefined(boundaryPrefix) && Helpers_1.isNullOrUndefined(boundary) ? baseBoundary : undefined
        });
        this.contentType = contentType;
        this.boundaryPrefix =
            Helpers_1.isNullOrUndefined(boundaryPrefix) && Helpers_1.isNullOrUndefined(boundary)
                ? '--LibAs2'
                : boundaryPrefix === false || !Helpers_1.isNullOrUndefined(boundary)
                    ? ''
                    : boundaryPrefix;
        this.boundary = boundary;
        if (!Helpers_1.isNullOrUndefined(content))
            this.setContent(content);
        if (!Helpers_1.isNullOrUndefined(headers))
            this.setHeader(headers);
        if (!Helpers_1.isNullOrUndefined(sign))
            this.setSigning(sign);
        if (!Helpers_1.isNullOrUndefined(encrypt))
            this.setEncryption(encrypt);
        if (!Helpers_1.isNullOrUndefined(messageId))
            this.setHeader('Message-ID', messageId);
        if (!Helpers_1.isNullOrUndefined(contentDisposition) && contentDisposition !== false) {
            this.setHeader('Content-Disposition', contentDisposition === true ? 'attachment' : contentDisposition);
        }
        if (this.contentType) {
            this.signed = contentType.toLowerCase().startsWith('multipart/signed');
            this.encrypted = contentType.toLowerCase().startsWith('multipart/encrypted');
            this.smime = Helpers_1.isSMime(contentType);
            this.compressed = false;
            if (this.smime) {
                let applicationType;
                // Check for actual smime-type
                for (let part of contentType.split(/;/gu)) {
                    let [key, value] = part.trim().split(/=/gu);
                    key = key.trim().toLowerCase();
                    if (key === 'smime-type') {
                        this.smimeType = value.trim().toLowerCase();
                    }
                    if (key.startsWith('application/')) {
                        applicationType = key;
                    }
                }
                // Infer smime-type
                if (this.smimeType === undefined || this.smimeType === '') {
                    if (applicationType.endsWith('signature')) {
                        this.smimeType = 'signed-data';
                    }
                    else {
                        this.smimeType = 'not-available';
                    }
                }
                if (this.smimeType === 'signed-data')
                    this.signed = true;
                if (this.smimeType === 'enveloped-data')
                    this.encrypted = true;
                if (this.smimeType === 'compressed-data')
                    this.compressed = true;
            }
        }
        this.parsed = false;
    }
    /** Set the signing options for this instance.
     * @param {SigningOptions} options - Options for signing this AS2 message.
     */
    setSigning(options) {
        this._sign = Helpers_1.getSigningOptions(options);
    }
    /** Set the encryption options for this instance.
     * @param {EncryptionOptions} options - Options for encrypting this AS2 message.
     */
    setEncryption(options) {
        this._encrypt = Helpers_1.getEncryptionOptions(options);
    }
    /** Set one or more headers on this instance.
     * @param {string|any} keyOrHeaders - The key name of the header to set or an array of headers.
     * @param {string} [value] - The value of the header key; required if providing a simple key/value.
     * @returns {AS2MimeNode} This AS2MimeNode instance.
     */
    setHeader(keyOrHeaders, value) {
        super.setHeader(keyOrHeaders, value);
        return this;
    }
    /** Sets and/or gets the message ID of the MIME message.
     * @param {boolean} [create=false] - Set the the message ID if one does not exist.
     * @returns {string} The message ID of the MIME.
     */
    messageId(create = false) {
        let messageId = this.getHeader('Message-ID');
        // You really should define your own Message-Id field!
        if (!messageId && create) {
            messageId = AS2MimeNode.generateMessageId();
            this.setHeader('Message-ID', messageId);
        }
        return messageId;
    }
    /** Convenience method for generating an outgoing MDN for this message.
     * @param {DispositionOutOptions} [options] - Optional options for generating an MDN.
     * @returns {Promise<object>} The content node and the outgoing MDN as an AS2MimeNode.
     */
    async dispositionOut(options) {
        options = Helpers_1.isNullOrUndefined(options) ? {} : options;
        return await AS2Disposition_1.AS2Disposition.outgoing(Object.assign(Object.assign({}, options), { node: this }));
    }
    /** Convenience method for consuming this instance as an incoming MDN.
     * @param {VerificationOptions} [signed] - Pass verification options for a signed MDN.
     * @returns {Promise<AS2Disposition>} This instance as an incoming AS2Disposition.
     */
    async dispositionIn(signed) {
        return await AS2Disposition_1.AS2Disposition.incoming(this, signed);
    }
    /** Convenience method for signing this instance.
     * @param {SigningOptions} [options] - Options for signing this AS2 message; not required if provided when constructing this instance.
     * @returns {Promise<AS2MimeNode>} This instance as a new signed multipart AS2MimeNode.
     */
    async sign(options) {
        options = Helpers_1.isNullOrUndefined(options) ? this._sign : options;
        return AS2Crypto_1.AS2Crypto.sign(this, options);
    }
    /** Convenience method for verifying this instance.
     * @param {VerificationOptions} options - Options for verifying this signed AS2 message.
     * @returns {Promise<AS2MimeNode>} The content part of this signed message as an AS2MimeNode.
     */
    async verify(options) {
        return (await AS2Crypto_1.AS2Crypto.verify(this, options)) ? this.childNodes[0] : undefined;
    }
    /** Convenience method for decrypting this instance.
     * @param {DecryptionOptions} options - Options for decrypting this encrypted AS2 message.
     * @returns {Promise<AS2MimeNode>} The contents of the encrypted message as an AS2MimeNode.
     */
    async decrypt(options) {
        return AS2Crypto_1.AS2Crypto.decrypt(this, options);
    }
    /** Convenience method for encrypting this instance.
     * @param {EncryptionOptions} [options] - Options for encrypting this AS2 message; not required if provided when constructing this instance.
     * @returns {Promise<AS2MimeNode>} This instance as a new encrypted AS2MimeNode.
     */
    async encrypt(options) {
        options = Helpers_1.isNullOrUndefined(options) ? this._encrypt : options;
        return AS2Crypto_1.AS2Crypto.encrypt(this, options);
    }
    /** Constructs a complete S/MIME or MIME buffer from this instance.
     * @returns {Promise<Buffer>} This instance as raw, complete S/MIME or MIME buffer.
     */
    async build() {
        if (this.parsed && this.raw !== undefined)
            return Buffer.from(this.raw);
        if (!Helpers_1.isNullOrUndefined(this._sign) && !Helpers_1.isNullOrUndefined(this._encrypt)) {
            const signed = await this.sign(this._sign);
            const encrypted = await signed.encrypt(this._encrypt);
            return await encrypted.build();
        }
        if (!Helpers_1.isNullOrUndefined(this._sign)) {
            const signed = await this.sign(this._sign);
            return await signed.build();
        }
        if (!Helpers_1.isNullOrUndefined(this._encrypt)) {
            const encrypted = await this.encrypt(this._encrypt);
            return await encrypted.build();
        }
        return await super.build();
    }
    /** Method for getting the headers and body of the MIME message as separate properties.
     * @returns {Promise<object>} An object with headers and body properties.
     */
    async buildObject() {
        const buffer = await this.build();
        const [headers, ...body] = buffer.toString('utf8').split(/(\r\n|\n\r|\n)(\r\n|\n\r|\n)/gu);
        return {
            headers: Helpers_1.parseHeaderString(headers),
            body: body.join('').trimLeft()
        };
    }
    /** Generates a valid, formatted, random message ID.
     * @param {string} [sender='<HOST_NAME>'] - The sender of this ID.
     * @param {string} [uniqueId] - A unique ID may be provided if a real GUID is required.
     * @returns {string} A valid message ID for use with MIME.
     */
    static generateMessageId(sender, uniqueId) {
        uniqueId = Helpers_1.isNullOrUndefined(uniqueId) ? AS2Crypto_1.AS2Crypto.generateUniqueId() : uniqueId;
        sender = Helpers_1.isNullOrUndefined(sender) ? os_1.hostname() || 'localhost' : sender;
        return '<' + uniqueId + '@' + sender + '>';
    }
}
exports.AS2MimeNode = AS2MimeNode;
