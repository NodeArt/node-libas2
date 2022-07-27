"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AS2DispositionNotification = void 0;
const Constants_1 = require("../Constants");
const os_1 = require("os");
const Helpers_1 = require("../Helpers");
const { LIBRAY_NAME_VERSION, CRLF } = Constants_1.AS2Constants;
/** Class for dealing with disposition notification headers.
 * @param {AS2DispositionNotification} [notification] - A raw instance of AS2DispositionNotification.
 * @param {'incoming'|'outgoing'} [notificationType='outgoing'] - The type of notification; default is 'outgoing'.
 */
class AS2DispositionNotification {
    constructor(notification, notificationType = 'outgoing') {
        Object.assign(this, notification, {
            headers: Array.isArray(notification.headers) ? Object.assign({}, ...notification.headers) : notification.headers
        });
        if (Helpers_1.isNullOrUndefined(notificationType)) {
            notificationType = 'outgoing';
        }
        if (!this.reportingUa && notificationType === 'outgoing') {
            this.reportingUa = os_1.hostname() + '; ' + LIBRAY_NAME_VERSION;
        }
        if (!this.originalRecipient) {
            this.originalRecipient = this.finalRecipient;
        }
    }
    /**
     * Converts this instance to a plain key/value-pair object.
     * @returns {object} This instance as key/value pairs.
     */
    toNotification() {
        const result = {};
        for (const [key, value] of Object.entries(this.headers || {})) {
            result[key] = value;
        }
        result['Reporting-UA'] = this.reportingUa;
        if (this.mdnGateway)
            result['MDN-Gateway'] = this.mdnGateway;
        result['Original-Recipient'] =
            typeof this.originalRecipient === 'string'
                ? 'rfc822; ' + this.originalRecipient
                : this.originalRecipient.type + '; ' + this.originalRecipient.value;
        result['Final-Recipient'] =
            typeof this.finalRecipient === 'string'
                ? 'rfc822; ' + this.finalRecipient
                : this.finalRecipient.type + '; ' + this.finalRecipient.value;
        if (this.originalMessageId)
            result['Original-Message-ID'] = this.originalMessageId;
        result['Disposition'] =
            this.disposition.type +
                '/' +
                (this.disposition.type === 'automatic-action' ? 'MDN-sent-automatically' : 'MDN-sent-manually') +
                '; ' +
                (this.disposition.processed ? 'processed' : 'failed') +
                (this.disposition.description
                    ? '/' + this.disposition.description.type + '=' + this.disposition.description.text
                    : '');
        if (this.receivedContentMic) {
            result['Received-Content-MIC'] = this.receivedContentMic.mic + ', ' + this.receivedContentMic.algorithm;
        }
        return result;
    }
    /**
     * This instance to a string.
     * @returns {string} a raw string instance.
     */
    toString() {
        const notification = this.toNotification();
        const result = [];
        for (const [key, value] of Object.entries(notification)) {
            result.push(key + ': ' + value);
        }
        return result.join(CRLF) + CRLF;
    }
}
exports.AS2DispositionNotification = AS2DispositionNotification;
