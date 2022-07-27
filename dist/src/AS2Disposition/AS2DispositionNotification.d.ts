import { AS2Signing } from '../AS2Crypto';
/** Class for dealing with disposition notification headers.
 * @param {AS2DispositionNotification} [notification] - A raw instance of AS2DispositionNotification.
 * @param {'incoming'|'outgoing'} [notificationType='outgoing'] - The type of notification; default is 'outgoing'.
 */
export declare class AS2DispositionNotification {
    constructor(notification?: AS2DispositionNotification, notificationType?: 'incoming' | 'outgoing');
    reportingUa?: string;
    mdnGateway?: string;
    originalRecipient?: string | {
        value: string;
        type: string;
    };
    originalMessageId?: string;
    receivedContentMic?: {
        mic: string;
        algorithm: AS2Signing;
    };
    headers?: {
        [key: string]: string;
    };
    finalRecipient: string | {
        value: string;
        type: string;
    };
    disposition: {
        type: 'manual-action' | 'automatic-action';
        processed: boolean;
        description?: {
            type: 'error' | 'warning' | 'failure';
            text: string;
        };
    };
    /**
     * Converts this instance to a plain key/value-pair object.
     * @returns {object} This instance as key/value pairs.
     */
    toNotification?(): {
        [key: string]: string;
    };
    /**
     * This instance to a string.
     * @returns {string} a raw string instance.
     */
    toString?(): string;
}
