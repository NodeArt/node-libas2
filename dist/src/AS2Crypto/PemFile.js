"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PEM_FILETYPE = exports.PemFile = void 0;
const Helpers_1 = require("../Helpers");
/** Method for constructing an object from PEM data.
 * @param {string|Buffer|PemFile} data - Data for constructing a PemFile object.
 */
class PemFile {
    constructor(data) {
        if (Helpers_1.isNullOrUndefined(data) || data === '')
            return;
        if (data instanceof PemFile)
            return data;
        this.type = 'UNKNOWN';
        if (Buffer.isBuffer(data)) {
            data = data.toString('utf8');
        }
        const lines = data.split('\n');
        let contents = '';
        if (lines[0].toLowerCase().includes('private key')) {
            this.type = 'PRIVATE_KEY';
        }
        if (lines[0].toLowerCase().includes('public key')) {
            this.type = 'PUBLIC_KEY';
        }
        if (lines[0].toLowerCase().includes('certificate')) {
            this.type = 'CERTIFICATE';
        }
        for (let line of lines) {
            line = line.trim();
            if (line.length > 0 && !line.toLowerCase().includes('-begin') && !line.toLowerCase().includes('-end')) {
                contents += line + '\r\n';
            }
        }
        this.data = new Uint8Array(Buffer.from(contents, 'base64')).buffer;
    }
    /** Convenience method for creating a PemFile from a DER/BER Buffer.
     * @param {Buffer} data - DER or BER data in a Buffer.
     * @param {PemFileType} [type='UNKNOWN'] - The type of PEM file.
     * @returns {PemFile} The data as a PemFile object.
     */
    static fromDer(data, type = 'UNKNOWN') {
        const pemFile = new PemFile('');
        pemFile.data = new Uint8Array(data).buffer;
        if (exports.PEM_FILETYPE[type]) {
            pemFile.type = type;
        }
        return pemFile;
    }
}
exports.PemFile = PemFile;
/** Constants used in libas2.
 * @namespace PEM_FILETYPE
 */
exports.PEM_FILETYPE = {
    /**
     * @constant
     * @type {PemFileType}
     * @default
     */
    CERTIFICATE: 'CERTIFICATE',
    /**
     * @constant
     * @type {PemFileType}
     * @default
     */
    PRIVATE_KEY: 'PRIVATE_KEY',
    /**
     * @constant
     * @type {PemFileType}
     * @default
     */
    PUBLIC_KEY: 'PUBLIC_KEY'
};
