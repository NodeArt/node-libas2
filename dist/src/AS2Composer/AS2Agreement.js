"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AS2Partner = exports.AS2Host = exports.AS2Trading = exports.AS2Agreement = void 0;
const AS2Crypto_1 = require("../AS2Crypto");
const Constants_1 = require("../Constants");
const Helpers_1 = require("../Helpers");
const { ENCRYPTION, ERROR, SIGNING } = Constants_1.AS2Constants;
/** Class for describing and handling partner agreements.
 * @implements {AgreementOptions}
 * @param {AgreementOptions} agreement - The partner agreement for sending and receiving over AS2.
 */
class AS2Agreement {
    constructor(agreement) {
        this.host = new AS2Host(agreement.host);
        this.partner = new AS2Partner(agreement.partner);
    }
}
exports.AS2Agreement = AS2Agreement;
class AS2Trading {
    constructor(trading) {
        this.role = trading.role;
        this.name = trading.name;
        this.id = trading.id;
        this.url = trading.url ? new URL(trading.url) : trading.url;
        if (trading.mdn) {
            this.mdn = {
                async: trading.mdn.async,
                signing: trading.mdn.signing
            };
        }
    }
}
exports.AS2Trading = AS2Trading;
class AS2Host extends AS2Trading {
    constructor(host) {
        super(host);
        this.role = 'host';
        this.sign = typeof host.sign === 'boolean' && host.sign ? SIGNING.SHA256 : host.sign;
        this.decrypt = host.decrypt;
        if ((!Helpers_1.isNullOrUndefined(host.sign) && host.sign) || host.decrypt) {
            if (host.certificate) {
                this.certificate = host.certificate instanceof AS2Crypto_1.PemFile ? host.certificate : new AS2Crypto_1.PemFile(host.certificate);
                if (this.certificate.type !== 'CERTIFICATE') {
                    throw new Error(ERROR.WRONG_PEM_FILE + ' expected CERTIFICATE, but received ' + this.certificate.type);
                }
            }
            else {
                throw new Error(ERROR.MISSING_PARTNER_CERT);
            }
            if (host.privateKey) {
                this.privateKey = host.privateKey instanceof AS2Crypto_1.PemFile ? host.privateKey : new AS2Crypto_1.PemFile(host.privateKey);
                if (this.privateKey.type !== 'PRIVATE_KEY') {
                    throw new Error(ERROR.WRONG_PEM_FILE + ' expected PRIVATE_KEY, but received ' + this.privateKey.type);
                }
            }
            else {
                throw new Error(ERROR.MISSING_PARTNER_KEY);
            }
        }
    }
}
exports.AS2Host = AS2Host;
class AS2Partner extends AS2Trading {
    constructor(partner) {
        super(partner);
        this.role = 'partner';
        this.file = partner.file;
        this.encrypt = typeof partner.encrypt === 'boolean' && partner.encrypt ? ENCRYPTION.AES128_CBC : partner.encrypt;
        this.verify = partner.verify;
        if ((!Helpers_1.isNullOrUndefined(partner.encrypt) && partner.encrypt) || partner.verify) {
            if (partner.certificate) {
                this.certificate =
                    partner.certificate instanceof AS2Crypto_1.PemFile ? partner.certificate : new AS2Crypto_1.PemFile(partner.certificate);
                if (this.certificate.type !== 'CERTIFICATE') {
                    throw new Error(ERROR.WRONG_PEM_FILE + ' expected CERTIFICATE, but received ' + this.certificate.type);
                }
            }
            else {
                throw new Error(ERROR.MISSING_PARTNER_CERT);
            }
        }
    }
}
exports.AS2Partner = AS2Partner;
