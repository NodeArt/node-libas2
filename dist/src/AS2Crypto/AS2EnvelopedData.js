"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AS2EnvelopedData = void 0;
const asn1js = require("asn1js");
const pkijs = require("pkijs/build/index");
const webcrypto_1 = require("@peculiar/webcrypto");
const PemFile_1 = require("./PemFile");
const LibOid_1 = require("./LibOid");
const crypto_1 = require("crypto");
const webcrypto = new webcrypto_1.Crypto();
const CRYPTO_MODE = {
    PKIJS_SUPPORTED: 'PKIJS_SUPPORTED',
    SUBTLE_CRYPTO: 'SUBTLE_CRYPTO',
    PKCS1_V1_5: 'PKCS1_V1_5'
};
const { RSA_PKCS1_PADDING } = crypto_1.constants;
class AS2EnvelopedData {
    constructor(data, enveloped = false) {
        pkijs.setEngine('newEngine', webcrypto, new pkijs.CryptoEngine({
            name: '@peculiar/webcrypto',
            crypto: webcrypto,
            subtle: webcrypto.subtle
        }));
        if (enveloped) {
            const bufferBer = new Uint8Array(data).buffer;
            const envelopedDataContentAsn1 = asn1js.fromBER(bufferBer);
            const envelopedDataContent = new pkijs.ContentInfo({
                schema: envelopedDataContentAsn1.result
            });
            this.enveloped = new pkijs.EnvelopedData({
                schema: envelopedDataContent.content
            });
        }
        else {
            this.data = new Uint8Array(data).buffer;
            this.enveloped = new pkijs.EnvelopedData();
        }
    }
    _toCertificate(cert) {
        const certPemFile = new PemFile_1.PemFile(cert);
        const certAsn1 = asn1js.fromBER(certPemFile.data);
        return new pkijs.Certificate({ schema: certAsn1.result });
    }
    _getEncryptionAlgorithm(encryption) {
        const CBC = 'AES-CBC';
        const GCM = 'AES-GCM';
        switch (encryption) {
            case 'aes128-CBC':
                return {
                    name: CBC,
                    length: 128
                };
            case 'aes192-CBC':
                return {
                    name: CBC,
                    length: 192
                };
            case 'aes256-CBC':
                return {
                    name: CBC,
                    length: 256
                };
            case 'aes128-GCM':
                return {
                    name: GCM,
                    length: 128
                };
            case 'aes192-GCM':
                return {
                    name: GCM,
                    length: 192
                };
            case 'aes256-GCM':
                return {
                    name: GCM,
                    length: 256
                };
            case 'des-EDE3-CBC':
                return {
                    name: 'des-EDE3-CBC',
                    length: 192
                };
            default:
                throw new Error('Unsupported algorithm: ' + encryption);
        }
    }
    _getCryptoInfo(index = 0) {
        const crypto = pkijs.getCrypto();
        const algorithmId = this.enveloped.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId;
        const encryptionId = this.enveloped.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId;
        const encryptionIdParams = crypto.getAlgorithmByOID(encryptionId);
        let mode = CRYPTO_MODE.PKIJS_SUPPORTED;
        let algorithm = encryptionIdParams.name;
        if (algorithmId === '1.2.840.113549.1.1.1') {
            mode = CRYPTO_MODE.PKCS1_V1_5;
            if ('name' in encryptionIdParams === false) {
                algorithm = new LibOid_1.ObjectID({ id: encryptionId }).name;
            }
        }
        else {
            if ('name' in encryptionIdParams === false) {
                mode = CRYPTO_MODE.SUBTLE_CRYPTO;
                algorithm = new LibOid_1.ObjectID({ id: encryptionId }).name;
            }
        }
        return { mode, algorithm };
    }
    async _getDecryptionKey(index, options) {
        const crypto = pkijs.getCrypto();
        const schema = this.enveloped.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmParams;
        let encryptedKey;
        if (options.rsaOaep) {
            const rsaOAEPParams = new pkijs.RSAESOAEPParams({ schema });
            const hashAlgorithm = crypto.getAlgorithmByOID(rsaOAEPParams.hashAlgorithm.algorithmId);
            const privateKey = await crypto.importKey('pkcs8', options.recipientPrivateKey, {
                name: 'RSA-OAEP',
                hash: {
                    name: hashAlgorithm.name
                }
            }, true, ['decrypt']);
            encryptedKey = await crypto.decrypt(privateKey.algorithm, privateKey, this.enveloped.recipientInfos[index].value.encryptedKey.valueBlock.valueHex);
        }
        else {
            const decryptedPayload = crypto_1.privateDecrypt({
                key: crypto_1.createPrivateKey({
                    key: Buffer.from(options.recipientPrivateKey),
                    format: 'der',
                    type: 'pkcs8'
                }),
                padding: RSA_PKCS1_PADDING
            }, Buffer.from(this.enveloped.recipientInfos[index].value.encryptedKey.valueBlock.valueHex));
            encryptedKey = new Uint8Array(decryptedPayload).buffer;
        }
        return await crypto.importKey('raw', encryptedKey, options.algorithm, true, ['decrypt']);
    }
    async _extendedDecrypt(decryptionKey, algorithm) {
        const crypto = pkijs.getCrypto();
        const ivBuffer = this.enveloped.encryptedContentInfo.contentEncryptionAlgorithm.algorithmParams.valueBlock.valueHex;
        const ivView = new Uint8Array(ivBuffer);
        let dataBuffer = new ArrayBuffer(0);
        if (this.enveloped.encryptedContentInfo.encryptedContent.idBlock.isConstructed === false) {
            dataBuffer = this.enveloped.encryptedContentInfo.encryptedContent.valueBlock.valueHex;
        }
        else {
            let _iteratorNormalCompletion = true;
            let _didIteratorError = false;
            let _iteratorError = undefined;
            let _iterator;
            let _step;
            try {
                for (_iterator = this.enveloped.encryptedContentInfo.encryptedContent.valueBlock.value[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    const content = _step.value;
                    let outputLength = 0;
                    let prevLength = 0;
                    for (const buffer of [dataBuffer, content.valueBlock.valueHex]) {
                        outputLength += buffer.byteLength;
                    }
                    const retBuf = new ArrayBuffer(outputLength);
                    const retView = new Uint8Array(retBuf);
                    for (const buffer of [dataBuffer, content.valueBlock.valueHex]) {
                        retView.set(new Uint8Array(buffer), prevLength);
                        prevLength += buffer.byteLength;
                    }
                    dataBuffer = retBuf;
                }
            }
            catch (error) {
                _didIteratorError = true;
                _iteratorError = error;
            }
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            }
            catch (error) {
                _didIteratorError = true;
                _iteratorError = error;
            }
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
        return await crypto.decrypt({
            name: algorithm,
            iv: ivView
        }, decryptionKey, dataBuffer);
    }
    async _extendedEncrypt(content, algorithm) {
        const crypto = pkijs.getCrypto();
        const ivLength = 8;
        const ivBuffer = new ArrayBuffer(ivLength);
        const ivView = new Uint8Array(ivBuffer);
        const contentView = new Uint8Array(content);
        const sessionKey = await crypto.generateKey(algorithm, true, ['encrypt']);
        const exportedSessionKey = await crypto.exportKey('raw', sessionKey);
        const contentEncryptionOID = new LibOid_1.ObjectID(algorithm).id;
        pkijs.getRandomValues(ivView);
        const encryptedContent = await crypto.encrypt({ name: algorithm.name, iv: ivView }, sessionKey, contentView);
        this.enveloped.version = 2;
        this.enveloped.encryptedContentInfo = new pkijs.EncryptedContentInfo({
            contentType: new LibOid_1.ObjectID({ name: 'data' }).id,
            contentEncryptionAlgorithm: new pkijs.AlgorithmIdentifier({
                algorithmId: contentEncryptionOID,
                algorithmParams: new asn1js.OctetString({
                    valueHex: ivBuffer
                })
            }),
            encryptedContent: new asn1js.OctetString({
                valueHex: encryptedContent
            })
        });
        const oaepOID = crypto.getOIDByAlgorithm({ name: 'RSA-OAEP' });
        for (let index = 0; index < this.enveloped.recipientInfos.length; index += 1) {
            if (this.enveloped.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId !== oaepOID) {
                throw new Error('Not supported encryption scheme, only RSA-OAEP is supported for key transport encryption scheme');
            }
            const schema = this.enveloped.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmParams;
            const rsaOAEPParams = new pkijs.RSAESOAEPParams({ schema });
            const hashAlgorithm = crypto.getAlgorithmByOID(rsaOAEPParams.hashAlgorithm.algorithmId);
            if ('name' in hashAlgorithm === false) {
                throw new Error(`Incorrect or unsupported OID for hash algorithm: ${rsaOAEPParams.hashAlgorithm.algorithmId}`);
            }
            const publicKey = await this.enveloped.recipientInfos[index].value.recipientCertificate.getPublicKey({
                algorithm: {
                    algorithm: {
                        name: 'RSA-OAEP',
                        hash: {
                            name: hashAlgorithm.name
                        }
                    },
                    usages: ['encrypt', 'wrapKey']
                }
            });
            const encryptedKey = await crypto.encrypt(publicKey.algorithm, publicKey, exportedSessionKey);
            this.enveloped.recipientInfos[index].value.encryptedKey = new asn1js.OctetString({
                valueHex: encryptedKey
            });
        }
    }
    async encrypt(cert, encryption) {
        const certificate = this._toCertificate(cert);
        const encryptionAlgorithm = this._getEncryptionAlgorithm(encryption);
        this.enveloped.addRecipientByCertificate(certificate);
        if (encryption === 'des-EDE3-CBC') {
            await this._extendedEncrypt(this.data, encryptionAlgorithm);
        }
        else {
            await this.enveloped.encrypt(encryptionAlgorithm, this.data);
        }
        const envelopedDataContent = new pkijs.ContentInfo({
            contentType: new LibOid_1.ObjectID({ name: 'envelopedData' }).id,
            content: this.enveloped.toSchema()
        });
        const envelopedDataSchema = envelopedDataContent.toSchema();
        const envelopedDataBuffer = envelopedDataSchema.toBER();
        return Buffer.from(envelopedDataBuffer);
    }
    async decrypt(cert, key) {
        const certificate = this._toCertificate(cert);
        const privateKey = new PemFile_1.PemFile(key).data;
        const cryptoInfo = this._getCryptoInfo();
        if (cryptoInfo.mode === CRYPTO_MODE.PKIJS_SUPPORTED) {
            this.data = await this.enveloped.decrypt(0, {
                recipientCertificate: certificate,
                recipientPrivateKey: privateKey
            });
        }
        else {
            let decryptionKey;
            if (cryptoInfo.mode === CRYPTO_MODE.SUBTLE_CRYPTO) {
                decryptionKey = await this._getDecryptionKey(0, {
                    recipientPrivateKey: privateKey,
                    algorithm: cryptoInfo.algorithm,
                    rsaOaep: true
                });
            }
            else {
                decryptionKey = await this._getDecryptionKey(0, {
                    recipientPrivateKey: privateKey,
                    algorithm: cryptoInfo.algorithm
                });
            }
            this.data = await this._extendedDecrypt(decryptionKey, cryptoInfo.algorithm);
        }
        return Buffer.from(this.data || '');
    }
}
exports.AS2EnvelopedData = AS2EnvelopedData;
