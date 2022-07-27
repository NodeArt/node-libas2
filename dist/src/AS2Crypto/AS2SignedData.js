"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AS2SignedData = void 0;
const asn1js = require("asn1js");
const pkijs = require("pkijs/build/index");
const webcrypto_1 = require("@peculiar/webcrypto");
const PemFile_1 = require("./PemFile");
const LibOid_1 = require("./LibOid");
const Helpers_1 = require("../Helpers");
const Constants_1 = require("../Constants");
const { SIGNING } = Constants_1.AS2Constants;
const webcrypto = new webcrypto_1.Crypto();
class AS2SignedData {
    constructor(data, signedData) {
        pkijs.setEngine('newEngine', webcrypto, new pkijs.CryptoEngine({
            name: '@peculiar/webcrypto',
            crypto: webcrypto,
            subtle: webcrypto.subtle
        }));
        this.data = new Uint8Array(data).buffer;
        if (Helpers_1.isNullOrUndefined(signedData)) {
            this.signed = new pkijs.SignedData({
                version: 1,
                encapContentInfo: new pkijs.EncapsulatedContentInfo({
                    eContentType: new LibOid_1.ObjectID({ name: 'data' }).id
                }),
                signerInfos: [],
                certificates: []
            });
        }
        else {
            const bufferBer = new Uint8Array(signedData).buffer;
            const signedDataContentAsn1 = asn1js.fromBER(bufferBer);
            const signedDataContent = new pkijs.ContentInfo({
                schema: signedDataContentAsn1.result
            });
            this.signed = new pkijs.SignedData({ schema: signedDataContent.content });
        }
    }
    _toCertificate(cert) {
        const certPemFile = new PemFile_1.PemFile(cert);
        const certAsn1 = asn1js.fromBER(certPemFile.data);
        return new pkijs.Certificate({ schema: certAsn1.result });
    }
    _addSignerInfo(certificate, messageDigest) {
        this.signed.certificates.push(certificate);
        const position = this.signed.signerInfos.push(new pkijs.SignerInfo({
            sid: new pkijs.IssuerAndSerialNumber({
                issuer: certificate.issuer,
                serialNumber: certificate.serialNumber
            }),
            signedAttrs: new pkijs.SignedAndUnsignedAttributes({
                type: 0,
                attributes: [
                    new pkijs.Attribute({
                        type: new LibOid_1.ObjectID({ name: 'contentType' }).id,
                        values: [
                            new asn1js.ObjectIdentifier({
                                value: new LibOid_1.ObjectID({ name: 'data' }).id
                            })
                        ]
                    }),
                    new pkijs.Attribute({
                        type: new LibOid_1.ObjectID({ name: 'signingTime' }).id,
                        values: [new asn1js.UTCTime({ valueDate: new Date() })]
                    }),
                    new pkijs.Attribute({
                        type: new LibOid_1.ObjectID({ name: 'messageDigest' }).id,
                        values: [
                            new asn1js.OctetString({
                                valueHex: messageDigest
                            })
                        ]
                    })
                ]
            })
        }));
        return position - 1;
    }
    _getCertAlgorithmId(certificate) {
        const rsaPssId = new LibOid_1.ObjectID({ name: 'RSA-PSS' }).id;
        if (certificate.signatureAlgorithm.algorithmId === rsaPssId) {
            return rsaPssId;
        }
        return certificate.subjectPublicKeyInfo.algorithm.algorithmId;
    }
    async _addSigner({ cert, key, algorithm }) {
        if (Helpers_1.isNullOrUndefined(algorithm))
            algorithm = SIGNING.SHA256;
        const crypto = pkijs.getCrypto();
        const certificate = this._toCertificate(cert);
        const messageDigest = await crypto.digest({ name: algorithm }, this.data);
        const privateKeyOptions = crypto.getAlgorithmByOID(this._getCertAlgorithmId(certificate));
        if ('hash' in privateKeyOptions) {
            privateKeyOptions.hash.name = algorithm;
        }
        const keyPemFile = new PemFile_1.PemFile(key);
        const privateKey = await webcrypto.subtle.importKey('pkcs8', keyPemFile.data, privateKeyOptions, true, ['sign']);
        const index = this._addSignerInfo(certificate, messageDigest);
        this.digestInfo = {
            digest: messageDigest,
            algorithm: algorithm
        };
        await this.signed.sign(privateKey, index, algorithm, this.data);
    }
    _findSigner(cert) {
        if (!Helpers_1.isNullOrUndefined(cert)) {
            const certificate = this._toCertificate(cert);
            for (let i = 0; i < this.signed.signerInfos.length; i += 1) {
                const signerInfo = this.signed.signerInfos[i];
                if (certificate.issuer.isEqual(signerInfo.sid.issuer) &&
                    certificate.serialNumber.isEqual(signerInfo.sid.serialNumber)) {
                    return i;
                }
            }
        }
        return -1;
    }
    async _calculateMessageDigest(index) {
        const crypto = pkijs.getCrypto();
        const algorithmId = this.signed.signerInfos[index].digestAlgorithm.algorithmId;
        const hashAlgorithm = crypto.getAlgorithmByOID(algorithmId);
        this.digestInfo = {
            digest: await crypto.digest(hashAlgorithm.name, new Uint8Array(this.data)),
            algorithm: hashAlgorithm.name
        };
    }
    getMessageDigest() {
        if (typeof this.digestInfo !== 'undefined') {
            return {
                digest: Buffer.from(this.digestInfo.digest),
                algorithm: this.digestInfo.algorithm
            };
        }
        throw new Error('Message digest not yet calculated.');
    }
    async sign({ cert, key, algorithm, addSigners }) {
        await this._addSigner({ cert, key, algorithm });
        if (Array.isArray(addSigners)) {
            for (const options of addSigners) {
                await this._addSigner(options);
            }
        }
        const signedDataContent = new pkijs.ContentInfo({
            contentType: new LibOid_1.ObjectID({ name: 'signedData' }).id,
            content: this.signed.toSchema(true)
        });
        const signedDataSchema = signedDataContent.toSchema();
        const signedDataBuffer = signedDataSchema.toBER();
        return Buffer.from(signedDataBuffer);
    }
    async verify(cert, debugMode) {
        const index = this._findSigner(cert);
        if (!Helpers_1.isNullOrUndefined(cert) && index === -1) {
            return false;
        }
        const result = await this.signed.verify({
            signer: index === -1 ? 0 : index,
            data: this.data,
            extendedMode: true
        });
        if (result.signatureVerified) {
            await this._calculateMessageDigest(index);
        }
        return debugMode ? result : result.signatureVerified;
    }
}
exports.AS2SignedData = AS2SignedData;
