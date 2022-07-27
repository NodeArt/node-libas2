/// <reference types="node" />
import { Stream } from 'stream';
import { AS2MimeNode } from '../AS2MimeNode';
/** Options for parsing a MIME document; useful if there is no access to the underlying raw response.
 * @typedef {object} ParseOptions
 * @property {string[]|object} headers - Either an object like Node.js `IncomingMessage.headers` or like `IncomingMessage.rawHeaders`.
 * @property {Buffer|Stream|string} content - The raw body of the MIME document.
 */
/** Class for parsing a MIME document to an AS2MimeNode tree. */
export declare class AS2Parser {
    private static isStream;
    private static streamToBuffer;
    private static transformParsedHeaders;
    private static transformNodeLike;
    /** Parse a raw MIME document into an AS2MimeNode.
     * @param {Buffer|Stream|string|ParseOptions} content - A raw MIME message or ParseOptions object.
     * @returns {Promise<AS2MimeNode>} The MIME document as an AS2MimeNode.
     */
    static parse(content: Buffer | Stream | string | ParseOptions): Promise<AS2MimeNode>;
}
interface ParseOptions {
    headers: string[] | {
        [key: string]: string;
    };
    content: Buffer | Stream | string;
}
export {};
