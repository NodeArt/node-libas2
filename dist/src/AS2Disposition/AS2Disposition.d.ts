import { AS2MimeNode } from '../AS2MimeNode';
import { AS2DispositionOptions, OutgoingDispositionOptions } from './Interfaces';
import { AS2DispositionNotification } from './AS2DispositionNotification';
import { VerificationOptions } from '../AS2Crypto';
/** Class for describing and constructing a Message Disposition Notification. */
export declare class AS2Disposition {
    constructor(mdn?: AS2MimeNode | AS2DispositionOptions);
    messageId: string;
    explanation: string;
    notification: AS2DispositionNotification;
    returned?: AS2MimeNode;
    /**
     * This instance to an AS2MimeNode.
     * @returns {AS2MimeNode} - An MDN as an AS2MimeNode.
     */
    toMimeNode(): AS2MimeNode;
    /** Convenience method to decrypt and/or verify a mime node and construct an outgoing message disposition.
     * @param {OutgoingDispositionOptions} - The options for generating an outgoing MDN.
     * @returns {Promise<object>} - The content node, disposition object, and the generated outgoing MDN as an AS2MimeNode.
     */
    static outgoing(options: OutgoingDispositionOptions): Promise<{
        contentNode: AS2MimeNode;
        dispositionNode: AS2MimeNode;
        disposition: AS2Disposition;
    }>;
    /** Deconstruct a mime node into an incoming message disposition.
     * @param {AS2MimeNode} node - An AS2MimeNode containing an incoming MDN.
     * @param {VerificationOptions} [signed] - Options for verifying the MDN if necessary.
     * @returns {Promise<AS2Disposition>} The incoming message disposition notification.
     */
    static incoming(node: AS2MimeNode, signed?: VerificationOptions): Promise<AS2Disposition>;
}
