import { AS2Encryption, AS2Signing } from './AS2Crypto';
export declare const getPackageJson: (filename?: string, index?: number) => any;
/** Constants used in libas2.
 * @namespace AS2Constants
 */
export declare const AS2Constants: {
    /** Constants used for signing.
     * @namespace AS2Constants.ENCRYPTION
     */
    ENCRYPTION: {
        AES128_CBC: AS2Encryption;
        AES192_CBC: AS2Encryption;
        AES256_CBC: AS2Encryption;
        AES128_GCM: AS2Encryption;
        AES192_GCM: AS2Encryption;
        AES256_GCM: AS2Encryption;
    };
    /** Constants used for signing.
     * @namespace AS2Constants.ERROR
     */
    ERROR: {
        /**
         * @constant
         * @type {string}
         * @default
         */
        MISSING_PARTNER_CERT: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        MISSING_PARTNER_KEY: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        WRONG_PEM_FILE: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        FINAL_RECIPIENT_MISSING: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        CONTENT_VERIFY: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        CERT_DECRYPT: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        DISPOSITION_NODE: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        NOT_IMPLEMENTED: string;
    };
    /** Constants used for signing.
     * @namespace AS2Constants.EXPLANATION
     */
    EXPLANATION: {
        /**
         * @constant
         * @type {string}
         * @default
         */
        SUCCESS: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        FAILED_DECRYPTION: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        FAILED_VERIFICATION: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        FAILED_GENERALLY: string;
    };
    /** Constants used for signing.
     * @namespace AS2Constants.SIGNING
     */
    SIGNING: {
        SHA1: AS2Signing;
        SHA256: AS2Signing;
        SHA384: AS2Signing;
        SHA512: AS2Signing;
    };
    /** Constants used for signing.
     * @namespace AS2Constants.STANDARD_HEADER
     */
    STANDARD_HEADER: {
        /**
         * @constant
         * @type {string}
         * @default
         */
        VERSION: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        TO: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        FROM: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        MDN_TO: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        MDN_OPTIONS: string;
        /**
         * @constant
         * @type {string}
         * @default
         */
        MDN_URL: string;
    };
    /**
     * @constant
     * @type {string}
     * @default
     */
    CRLF: string;
    /**
     * @constant
     * @type {string}
     * @default
     */
    MIME_VERSION: string;
    /**
     * @constant
     * @type {string}
     * @default
     */
    AS2_VERSION: string;
    /**
     * @constant
     * @type {string}
     * @default
     */
    SMIME_DESC: string;
    /**
     * @constant
     * @type {string}
     * @default
     */
    SIGNATURE_FILENAME: string;
    /**
     * @constant
     * @type {string}
     * @default
     */
    ENCRYPTION_FILENAME: string;
    /**
     * @constant
     * @type {string}
     * @default
     */
    LIBRARY_NAME: any;
    /**
     * @constant
     * @type {string}
     * @default
     */
    LIBRARY_VERSION: any;
    /**
     * @constant
     * @type {string}
     * @default
     */
    LIBRAY_NAME_VERSION: string;
};
