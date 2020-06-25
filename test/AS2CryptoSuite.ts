import 'mocha'
import { AS2Crypto, AS2MimeNode, AS2Parser } from '../core'
import {
  LIBAS2_CERT,
  LIBAS2_KEY,
  LIBAS2_EDI,
  ENCRYPTED_CONTENT,
  SIGNED_CONTENT,
  openssl
} from './Helpers'
import * as assert from 'assert'
import { writeFileSync, readFileSync } from 'fs'
import { AS2SignedData } from '../src/AS2Crypto/AS2SignedData'

describe('AS2Crypto', async () => {
  it('should decrypt contents of parsed mime message', async () => {
    const result = await AS2Parser.parse(ENCRYPTED_CONTENT)
    const decrypted = await result.decrypt({
      cert: LIBAS2_CERT,
      key: LIBAS2_KEY
    })
    const decryptedContent = decrypted.content.toString('utf8')

    assert.strictEqual(decryptedContent, LIBAS2_EDI)
  })

  it('should verify signed contents of parsed mime message', async () => {
    const result = await AS2Parser.parse(SIGNED_CONTENT)
    const verified = await AS2Crypto.verify(result, { cert: LIBAS2_CERT })

    assert.strictEqual(verified, true, 'Mime section could not be verified.')
  })

  it('should verify cms message produced by openssl', async () => {
    writeFileSync('test/temp-data/payload', 'Something to Sign\n')
    await openssl({
      command: 'req',
      arguments: {
        new: true,
        x509: true,
        nodes: true,
        keyout: 'test/temp-data/x509.key',
        out: 'test/temp-data/x509.pub',
        subj: '/CN=CoronaPub'
      }
    })
    await openssl({
      command: 'cms',
      arguments: {
        sign: true,
        signer: 'test/temp-data/x509.pub',
        inkey: 'test/temp-data/x509.key',
        outform: 'DER',
        out: 'test/temp-data/signature-cms.bin',
        in: 'test/temp-data/payload'
      }
    })

    const osslVerified = await openssl({
      command: 'cms',
      arguments: {
        verify: true,
        CAfile: 'test/temp-data/x509.pub',
        inkey: 'test/temp-data/x509.pub',
        inform: 'DER',
        in: 'test/temp-data/signature-cms.bin',
        content: 'test/temp-data/payload'
      }
    })

    assert.strictEqual(osslVerified, true, 'OpenSSL verification')

    const certAsPem = readFileSync('test/temp-data/x509.pub')
    const payloadAsBin = readFileSync('test/temp-data/payload')
    const sig_as_der = readFileSync('test/temp-data/signature-cms.bin')
    const signedData = new AS2SignedData(payloadAsBin, sig_as_der)
    const pkijsVerified = await signedData.verify(certAsPem)

    assert.strictEqual(pkijsVerified, true, 'PKIjs verification')
  })

  it('should throw error on compression methods', () => {
    assert.rejects(AS2Crypto.compress(new AS2MimeNode({}), {}))
    assert.rejects(AS2Crypto.decompress(new AS2MimeNode({}), {}))
  })
})
