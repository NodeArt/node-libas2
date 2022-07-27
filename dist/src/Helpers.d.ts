import { AgreementOptions, AS2Agreement } from './AS2Composer';
import { AS2MimeNode } from './AS2MimeNode';
import { SigningOptions, EncryptionOptions } from './AS2Crypto';
import { RequestOptions, IncomingMessage } from './Interfaces';
/** Get the multipart/report disposition-notification, if any.
 * @param {AS2MimeNode} node - The multipart MIME containing the report.
 * @returns {AS2MimeNode} The multipart/report disposition-notification.
 */
export declare function getReportNode(node: AS2MimeNode): AS2MimeNode;
/** Answers if the AS2MimeNode is a Message Disposition Notification.
 * @param {AS2MimeNode} node - The multipart MIME which may contain a report.
 * @returns {boolean} True for a Message Disposition Notification.
 */
export declare function isMdn(node: AS2MimeNode): boolean;
/** Method for converting a string of headers into key:value pairs.
 * @param {string} headers - A string of headers.
 * @param {boolean|Function} [keyToLowerCase] - Set all header keys to lower-case; or provide a function to manipulate values.
 * @param {Function} [callback] - A callback to manipulate values as they are parsed; only use if second argument is a boolean.
 * @returns {object} The headers as an object of key/value pairs.
 */
export declare function parseHeaderString(headers: string): {
    [key: string]: string | string[];
};
export declare function parseHeaderString(headers: string, keyToLowerCase: boolean): {
    [key: string]: string | string[];
};
export declare function parseHeaderString(headers: string, callback: (key: string, value: string) => [string, any]): {
    [key: string]: any;
};
export declare function parseHeaderString(headers: string, keyToLowerCase: boolean, callback: (key: string, value: string) => [string, any]): {
    [key: string]: any;
};
/** Method for retrieving the protocol of a URL, dynamically.
 * @param {string|URL} url - The url to get the protocol.
 * @returns {string} The protocol of the URL.
 * @throws URL is not one of either "string" or instance of "URL".
 */
export declare function getProtocol(url: string | URL): string;
/** Convenience method for null-checks.
 * @param {any} value - Any value to duck-check.
 * @returns {boolean} True if null or undefined.
 */
export declare function isNullOrUndefined(value: any): boolean;
/** Determine if a given string is one of PKCS7 MIME types.
 * @param {string} value - Checks if either pkcs7 or x-pkcs7.
 * @returns {boolean} True if a valid pkcs7 value.
 */
export declare function isSMime(value: string): boolean;
/** Transforms a payload into a canonical text format per RFC 5751 section 3.1.1.
 * @param {AS2MimeNode} node - The AS2MimeNode to canonicalize.
 */
export declare function canonicalTransform(node: AS2MimeNode): void;
/** Normalizes certificate signing options.
 * @param {SigningOptions} sign - Options for signing.
 * @returns {SigningOptions} A normalized option object.
 */
export declare function getSigningOptions(sign: SigningOptions): SigningOptions;
/** Normalizes encryption options.
 * @param {EncryptionOptions} encrypt - Options for encryption.
 * @returns {EncryptionOptions} A normalized option object.
 */
export declare function getEncryptionOptions(encrypt: EncryptionOptions): EncryptionOptions;
/** Normalizes agreement options.
 * @param {AgreementOptions} agreement - Options for partner agreement.
 * @returns {AS2Agreement} A normalized option object.
 */
export declare function getAgreementOptions(agreement: AgreementOptions): AS2Agreement;
/** Convenience method for making AS2 HTTP/S requests. Makes a POST request by default.
 * @param {RequestOptions} options - Options for making a request; extends Node's RequestOptions interface.
 * @param {Buffer|string|object|Array} options.body - Buffer, string, or JavaScript object.
 * @param {object} options.params - JavaScript object of parameters to append to the url.
 * @returns {IncomingMessage} The incoming message, including Buffer properties rawBody and rawResponse,
 * and convenience methods for mime() and json().
 */
export declare function request(options: RequestOptions): Promise<IncomingMessage>;
