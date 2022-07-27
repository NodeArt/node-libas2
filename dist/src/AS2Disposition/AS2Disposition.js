"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AS2Disposition = void 0;
const AS2MimeNode_1 = require("../AS2MimeNode");
const Helpers_1 = require("../Helpers");
const AS2DispositionNotification_1 = require("./AS2DispositionNotification");
const Constants_1 = require("../Constants");
const AS2Crypto_1 = require("../AS2Crypto");
const { AS2_VERSION, EXPLANATION, ERROR, STANDARD_HEADER } = Constants_1.AS2Constants;
/** Options for composing a message disposition notification (MDN).
 * @typedef {object} AS2DispositionOptions
 * @property {string} explanation
 * @property {AS2DispositionNotification} notification
 * @property {AS2MimeNode|boolean} [returned]
 */
/** Options for generating an outgoing MDN.
 * @typedef {object} OutgoingDispositionOptions
 * @property {AS2MimeNode} node - The mime node to verify and/or decrypt; used construct the outgoing disposition.
 * @property {AgreementOptions} agreement - The partner agreement to use when sending the outgoing disposition.
 * @property {boolean} [returnNode] - Whether to attach the mime node to the disposition as the returned payload.
 */
const toNotification = function toNotification(key, value) {
    let result = {};
    const parts = value.split(/;/gu).map(part => part.trim());
    const newKey = (str) => str
        .toLowerCase()
        .split('-')
        .map((chars, index) => index === 0 ? chars.toLowerCase() : chars.charAt(0).toUpperCase() + chars.toLowerCase().substring(1))
        .join('');
    switch (key.toLowerCase()) {
        case 'reporting-ua':
        case 'mdn-gateway':
        case 'original-message-id':
            result = value;
            key = newKey(key);
            break;
        case 'original-recipient':
        case 'final-recipient':
            result.value = parts.slice(1).join('; ');
            result.type = parts[0];
            key = newKey(key);
            break;
        case 'disposition':
            const [type, action] = parts[0].split('/');
            result.value = action;
            result.type = type;
            for (const part of parts.slice(1)) {
                let index = part.indexOf('=');
                if (index === -1)
                    index = part.length;
                let partKey = part
                    .slice(0, index)
                    .trim()
                    .toLowerCase();
                let partValue = part.slice(index + 1).trim();
                if (partKey.startsWith('processed') || partKey.startsWith('failed')) {
                    let [attrKey, attrProp] = partKey.split('/');
                    result.processed = attrKey === 'processed';
                    if (attrProp !== undefined) {
                        result.description = {
                            type: attrProp.toLowerCase(),
                            text: partValue
                        };
                    }
                    continue;
                }
                if (result.attributes === undefined)
                    result.attributes = {};
                if (result.attributes[partKey] === undefined) {
                    result.attributes[partKey] = partValue || true;
                }
            }
            key = newKey(key);
            break;
        case 'received-content-mic':
            const [micValue, micalg] = value.split(',').map(val => val.trim());
            result.mic = micValue;
            result.algorithm = micalg.toLowerCase();
            key = newKey(key);
            break;
        default:
            result[key] = value;
            key = 'headers';
            break;
    }
    return [key, result];
};
/** Class for describing and constructing a Message Disposition Notification. */
class AS2Disposition {
    constructor(mdn) {
        if (mdn instanceof AS2MimeNode_1.AS2MimeNode) {
            // Always get the Message ID of the root node; enveloped MDNs may not have this value on child nodes.
            const messageId = mdn.messageId();
            // Travel mime node tree for content type multipart/report.
            mdn = Helpers_1.getReportNode(mdn);
            // https://tools.ietf.org/html/rfc3462
            if (mdn) {
                this.messageId = messageId;
                // Get the human-readable message, the first part of the report.
                this.explanation = mdn.childNodes[0].content.toString('utf8').trim();
                // Get the message/disposition-notification and parse, which is the second part.
                this.notification = new AS2DispositionNotification_1.AS2DispositionNotification(Helpers_1.parseHeaderString(mdn.childNodes[1].content.toString('utf8'), toNotification), 'incoming');
                // Get the optional thid part, if present; it is the returned message content.
                this.returned = mdn.childNodes[2];
            }
        }
        else if (mdn.explanation && mdn.notification) {
            this.explanation = mdn.explanation;
            this.notification =
                mdn.notification instanceof AS2DispositionNotification_1.AS2DispositionNotification
                    ? mdn.notification
                    : new AS2DispositionNotification_1.AS2DispositionNotification(mdn.notification);
            this.returned = typeof mdn.returned === 'boolean' ? undefined : mdn.returned;
            this.messageId = AS2MimeNode_1.AS2MimeNode.generateMessageId();
        }
        else {
            throw new Error('Argument must be either options to construct a disposition report, or a disposition report as an AS2MimeNode');
        }
    }
    /**
     * This instance to an AS2MimeNode.
     * @returns {AS2MimeNode} - An MDN as an AS2MimeNode.
     */
    toMimeNode() {
        const rootNode = new AS2MimeNode_1.AS2MimeNode({
            contentType: 'multipart/report; report-type=disposition-notification',
            messageId: this.messageId
        });
        rootNode.appendChild(new AS2MimeNode_1.AS2MimeNode({
            contentType: 'text/plain',
            content: this.explanation
        }));
        rootNode.appendChild(new AS2MimeNode_1.AS2MimeNode({
            contentType: 'message/disposition-notification',
            content: this.notification.toString()
        }));
        if (this.returned) {
            rootNode.appendChild(this.returned);
        }
        return rootNode;
    }
    // TODO: Needs to output both the content node and the disposition node.
    /** Convenience method to decrypt and/or verify a mime node and construct an outgoing message disposition.
     * @param {OutgoingDispositionOptions} - The options for generating an outgoing MDN.
     * @returns {Promise<object>} - The content node, disposition object, and the generated outgoing MDN as an AS2MimeNode.
     */
    static async outgoing(options) {
        if (Helpers_1.isNullOrUndefined(options.node)) {
            throw new Error(ERROR.DISPOSITION_NODE);
        }
        const notification = {
            originalMessageId: options.node.messageId(),
            finalRecipient: options.node.getHeader('As2-To'),
            disposition: {
                processed: true,
                type: 'automatic-action'
            }
        };
        let explanation = EXPLANATION.SUCCESS;
        let rootNode = options.node;
        let errored = false;
        if (Helpers_1.isNullOrUndefined(notification.finalRecipient)) {
            throw new Error(ERROR.FINAL_RECIPIENT_MISSING);
        }
        if (options.agreement.host.decrypt) {
            try {
                rootNode = await rootNode.decrypt({
                    cert: options.agreement.host.certificate,
                    key: options.agreement.host.privateKey
                });
            }
            catch (error) {
                errored = true;
                notification.disposition.processed = false;
                notification.disposition.description = {
                    type: 'failure',
                    text: error.message
                };
                explanation = EXPLANATION.FAILED_DECRYPTION;
            }
        }
        if (options.agreement.partner.verify && !errored) {
            try {
                const cert = options.agreement.partner.certificate;
                const verified = await AS2Crypto_1.AS2Crypto.verify(rootNode, { cert }, true);
                if (verified) {
                    rootNode = rootNode.childNodes[0];
                    notification.receivedContentMic = {
                        mic: verified.digest.toString('base64'),
                        algorithm: verified.algorithm
                    };
                }
                else {
                    rootNode = undefined;
                }
            }
            catch (error) {
                errored = true;
                notification.disposition.processed = false;
                notification.disposition.description = {
                    type: 'failure',
                    text: error.message
                };
                explanation = EXPLANATION.FAILED_GENERALLY;
            }
            if (Helpers_1.isNullOrUndefined(rootNode) && !errored) {
                notification.disposition.processed = false;
                notification.disposition.description = {
                    type: 'failure',
                    text: 'Could not verify signature'
                };
                explanation = EXPLANATION.FAILED_VERIFICATION;
            }
        }
        const mdn = new AS2Disposition({
            explanation,
            notification,
            returned: options.returnNode ? options.node : undefined
        });
        let mdnMime = mdn.toMimeNode();
        if (options.agreement.partner.mdn && options.agreement.partner.mdn.signing) {
            mdnMime = await mdnMime.sign({
                cert: options.agreement.host.certificate,
                key: options.agreement.host.privateKey,
                algorithm: options.agreement.partner.mdn.signing
            });
        }
        // Set AS2 headers.
        mdnMime.setHeader([
            { key: STANDARD_HEADER.FROM, value: options.agreement.host.id },
            { key: STANDARD_HEADER.TO, value: options.agreement.partner.id },
            { key: STANDARD_HEADER.VERSION, value: AS2_VERSION }
        ]);
        mdnMime.messageId(true);
        return {
            contentNode: rootNode,
            dispositionNode: mdnMime,
            disposition: mdn
        };
    }
    /** Deconstruct a mime node into an incoming message disposition.
     * @param {AS2MimeNode} node - An AS2MimeNode containing an incoming MDN.
     * @param {VerificationOptions} [signed] - Options for verifying the MDN if necessary.
     * @returns {Promise<AS2Disposition>} The incoming message disposition notification.
     */
    static async incoming(node, signed) {
        let rootNode = node;
        if (Helpers_1.isNullOrUndefined(node)) {
            throw new Error(ERROR.DISPOSITION_NODE);
        }
        if (typeof signed !== 'undefined') {
            rootNode = await node.verify(signed);
            if (Helpers_1.isNullOrUndefined(rootNode)) {
                throw new Error(ERROR.CONTENT_VERIFY);
            }
        }
        return new AS2Disposition(rootNode);
    }
}
exports.AS2Disposition = AS2Disposition;
