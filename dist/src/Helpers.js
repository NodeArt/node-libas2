"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.getAgreementOptions = exports.getEncryptionOptions = exports.getSigningOptions = exports.canonicalTransform = exports.isSMime = exports.isNullOrUndefined = exports.getProtocol = exports.parseHeaderString = exports.isMdn = exports.getReportNode = void 0;
const http = require("http");
const https = require("https");
const AS2Composer_1 = require("./AS2Composer");
const Constants_1 = require("./Constants");
const AS2Parser_1 = require("./AS2Parser");
const { SIGNING, ENCRYPTION, CRLF } = Constants_1.AS2Constants;
/** Get the multipart/report disposition-notification, if any.
 * @param {AS2MimeNode} node - The multipart MIME containing the report.
 * @returns {AS2MimeNode} The multipart/report disposition-notification.
 */
function getReportNode(node) {
    if (!node)
        return;
    if (node.contentType &&
        node.contentType.includes('multipart/report') &&
        node.contentType.includes('disposition-notification')) {
        return node;
    }
    for (const childNode of node.childNodes || []) {
        return getReportNode(childNode);
    }
}
exports.getReportNode = getReportNode;
/** Answers if the AS2MimeNode is a Message Disposition Notification.
 * @param {AS2MimeNode} node - The multipart MIME which may contain a report.
 * @returns {boolean} True for a Message Disposition Notification.
 */
function isMdn(node) {
    return typeof getReportNode(node) !== 'undefined';
}
exports.isMdn = isMdn;
function parseHeaderString(headers, keyToLowerCase = false, callback) {
    const result = {};
    if (!headers)
        return result;
    if (typeof keyToLowerCase === 'function') {
        callback = keyToLowerCase;
        keyToLowerCase = false;
    }
    if (!callback)
        callback = (key, value) => [key, value];
    // Unfold header lines, split on newline, and trim whitespace from strings.
    const lines = headers
        .trim()
        .replace(/(\r\n|\n\r|\n)( |\t)/gu, ' ')
        .split(/\n/gu)
        .map(line => line.trim());
    // Assign one or more values to each header key.
    for (const line of lines) {
        const index = line.indexOf(':');
        let [key, value] = callback(line.slice(0, index).trim(), line.slice(index + 1).trim());
        if (keyToLowerCase)
            key = key.toLowerCase();
        if (result[key] === undefined) {
            result[key] = value;
        }
        else if (Array.isArray(result[key])) {
            result[key].push(value);
        }
        else {
            result[key] = [result[key], value];
        }
    }
    return result;
}
exports.parseHeaderString = parseHeaderString;
/** Method for retrieving the protocol of a URL, dynamically.
 * @param {string|URL} url - The url to get the protocol.
 * @returns {string} The protocol of the URL.
 * @throws URL is not one of either "string" or instance of "URL".
 */
function getProtocol(url) {
    if (typeof url === 'string' || url instanceof URL) {
        return new URL(url).protocol.replace(':', '');
    }
    throw new Error('URL is not one of either "string" or instance of "URL".');
}
exports.getProtocol = getProtocol;
/** Convenience method for null-checks.
 * @param {any} value - Any value to duck-check.
 * @returns {boolean} True if null or undefined.
 */
function isNullOrUndefined(value) {
    return value === undefined || value === null;
}
exports.isNullOrUndefined = isNullOrUndefined;
/** Determine if a given string is one of PKCS7 MIME types.
 * @param {string} value - Checks if either pkcs7 or x-pkcs7.
 * @returns {boolean} True if a valid pkcs7 value.
 */
function isSMime(value) {
    return value.toLowerCase().startsWith('application/pkcs7') || value.toLowerCase().startsWith('application/x-pkcs7');
}
exports.isSMime = isSMime;
/** Transforms a payload into a canonical text format per RFC 5751 section 3.1.1.
 * @param {AS2MimeNode} node - The AS2MimeNode to canonicalize.
 */
function canonicalTransform(node) {
    const newline = /\r\n|\r|\n/gu;
    if (node.getHeader('content-type').slice(0, 5) === 'text/' && !isNullOrUndefined(node.content)) {
        node.content = node.content.replace(newline, CRLF);
    }
    node.childNodes.forEach(canonicalTransform);
}
exports.canonicalTransform = canonicalTransform;
/** Normalizes certificate signing options.
 * @param {SigningOptions} sign - Options for signing.
 * @returns {SigningOptions} A normalized option object.
 */
function getSigningOptions(sign) {
    return Object.assign({ cert: '', key: '', algorithm: SIGNING.SHA256 }, sign);
}
exports.getSigningOptions = getSigningOptions;
/** Normalizes encryption options.
 * @param {EncryptionOptions} encrypt - Options for encryption.
 * @returns {EncryptionOptions} A normalized option object.
 */
function getEncryptionOptions(encrypt) {
    return Object.assign({ cert: '', encryption: ENCRYPTION.AES256_CBC }, encrypt);
}
exports.getEncryptionOptions = getEncryptionOptions;
/** Normalizes agreement options.
 * @param {AgreementOptions} agreement - Options for partner agreement.
 * @returns {AS2Agreement} A normalized option object.
 */
function getAgreementOptions(agreement) {
    return new AS2Composer_1.AS2Agreement(agreement);
}
exports.getAgreementOptions = getAgreementOptions;
/** Convenience method for making AS2 HTTP/S requests. Makes a POST request by default.
 * @param {RequestOptions} options - Options for making a request; extends Node's RequestOptions interface.
 * @param {Buffer|string|object|Array} options.body - Buffer, string, or JavaScript object.
 * @param {object} options.params - JavaScript object of parameters to append to the url.
 * @returns {IncomingMessage} The incoming message, including Buffer properties rawBody and rawResponse,
 * and convenience methods for mime() and json().
 */
async function request(options) {
    return new Promise((resolve, reject) => {
        try {
            const { body, params, url } = options;
            const internalUrl = new URL(url);
            const internalBody = isNullOrUndefined(body) ? '' : body;
            const protocol = getProtocol(internalUrl) === 'https' ? https : http;
            delete options.body;
            delete options.params;
            delete options.url;
            options.method = options.method || 'POST';
            Object.entries(params || {}).forEach(val => {
                if (!isNullOrUndefined(val[1])) {
                    internalUrl.searchParams.append(...val);
                }
            });
            const responseBufs = [];
            const req = protocol.request(internalUrl, options, (response) => {
                const bodyBufs = [];
                response.on('data', (data) => bodyBufs.push(data));
                response.on('error', error => reject(error));
                response.on('end', () => {
                    const rawResponse = Buffer.concat(responseBufs);
                    const rawBody = Buffer.concat(bodyBufs);
                    response.rawBody = rawBody;
                    response.rawResponse = rawResponse;
                    response.mime = async () => {
                        return await AS2Parser_1.AS2Parser.parse(rawResponse.length > 0
                            ? rawResponse
                            : {
                                headers: response.rawHeaders,
                                content: rawBody
                            });
                    };
                    response.json = function json() {
                        try {
                            return JSON.parse(rawBody.toString('utf8'));
                        }
                        catch (err) {
                            return err;
                        }
                    };
                    resolve(response);
                });
            });
            req.on('error', error => reject(error));
            req.on('socket', (socket) => {
                socket.on('data', (data) => responseBufs.push(data));
            });
            req.write(internalBody);
            req.end();
        }
        catch (error) {
            reject(error);
        }
    });
}
exports.request = request;
