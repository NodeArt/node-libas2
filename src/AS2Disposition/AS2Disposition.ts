import { AS2MimeNode } from '../AS2MimeNode'
import { AS2DispositionOptions, OutgoingDispositionOptions } from './Interfaces'
import { parseHeaderString, getReportNode, isNullOrUndefined } from '../Helpers'
import { AS2DispositionNotification } from './AS2DispositionNotification'
import { EXPLANATION, ERROR } from '../Constants'
import { VerificationOptions } from '../AS2Crypto'

/** Options for composing a message disposition notification (MDN).
 * @typedef {object} AS2DispositionOptions
 * @property {string} explanation
 * @property {AS2DispositionNotification} notification
 * @property {AS2MimeNode|boolean} [returned]
*/

/** Options for generating an outgoing MDN.
 * @typedef {object} OutgoingDispositionOptions
 * @property {AS2MimeNode} node
 * @property {boolean} [returnNode]
 * @property {SigningOptions} [signDisposition]
 * @property {VerificationOptions} [signed]
 * @property {DecryptionOptions} [encrypted]
*/

const toNotification = function toNotification (
  key: string,
  value: string
): [string, any] {
  let result: any = {}
  const parts = value.split(/;/gu).map(part => part.trim())
  const newKey = (str: string) =>
    str
      .toLowerCase()
      .split('-')
      .map((chars, index) =>
        index === 0
          ? chars.toLowerCase()
          : chars.charAt(0).toUpperCase() + chars.toLowerCase().substring(1)
      )
      .join('')

  switch (key.toLowerCase()) {
    case 'reporting-ua':
    case 'mdn-gateway':
    case 'original-message-id':
      result = value
      key = newKey(key)
      break
    case 'original-recipient':
    case 'final-recipient':
      result.value = parts.slice(1).join('; ')
      result.type = parts[0]
      key = newKey(key)
      break
    case 'disposition':
      const [type, action] = parts[0].split('/')

      result.value = action
      result.type = type

      for (const part of parts.slice(1)) {
        let index = part.indexOf('=')
        if (index === -1) index = part.length
        let key = part
          .slice(0, index)
          .trim()
          .toLowerCase()
        let value: any = part.slice(index + 1).trim()

        if (key.startsWith('processed') || key.startsWith('failed')) {
          let [attrKey, attrProp] = key.split('/')
          result.processed = attrKey === 'processed'

          if (attrProp !== undefined) {
            result.description = {
              type: attrProp.toLowerCase(),
              text: value
            }
          }

          continue
        }

        if (result.attributes === undefined) result.attributes = {}

        if (result.attributes[key] === undefined) {
          result.attributes[key] = value || true
        }
      }
      key = newKey(key)
      break
    case 'received-content-mic':
      const [micValue, micalg] = value.split(',').map(val => val.trim())
      result.mic = micValue
      result.algorithm = micalg.toLowerCase()
      key = newKey(key)
      break
    default:
      result[key] = value
      key = 'headers'
      break
  }

  return [key, result]
}

/** Class for describing and constructing a Message Disposition Notification. */
export class AS2Disposition {
  constructor (mdn?: AS2MimeNode | AS2DispositionOptions) {
    if (mdn instanceof AS2MimeNode) {
      // Always get the Message ID of the root node; enveloped MDNs may not have this value on child nodes.
      const messageId = mdn.messageId()

      // Travel mime node tree for content type multipart/report.
      mdn = getReportNode(mdn)

      // https://tools.ietf.org/html/rfc3462
      if (mdn) {
        this.messageId = messageId
        // Get the human-readable message, the first part of the report.
        this.explanation = mdn.childNodes[0].content.toString('utf8').trim()
        // Get the message/disposition-notification and parse, which is the second part.
        this.notification = new AS2DispositionNotification(
          parseHeaderString(
            mdn.childNodes[1].content.toString('utf8'),
            toNotification
          ) as any,
          'incoming'
        )
        // Get the optional thid part, if present; it is the returned message content.
        this.returned = mdn.childNodes[2]
      }
    } else if (mdn.explanation && mdn.notification) {
      this.explanation = mdn.explanation
      this.notification =
        mdn.notification instanceof AS2DispositionNotification
          ? mdn.notification
          : new AS2DispositionNotification(mdn.notification)
      this.returned =
        typeof mdn.returned === 'boolean' ? undefined : mdn.returned
      this.messageId = AS2MimeNode.generateMessageId()
    } else {
      throw new Error(
        'Argument must be either options to construct a disposition report, or a disposition report as an AS2MimeNode'
      )
    }
  }

  messageId: string
  explanation: string
  notification: AS2DispositionNotification
  returned?: AS2MimeNode

  /**
   * This instance to an AS2MimeNode.
   * @returns {AS2MimeNode} - An MDN as an AS2MimeNode.
   */
  toMimeNode (): AS2MimeNode {
    const rootNode = new AS2MimeNode({
      contentType: 'multipart/report; report-type=disposition-notification',
      messageId: this.messageId
    })

    rootNode.appendChild(
      new AS2MimeNode({
        contentType: 'text/plain',
        content: this.explanation
      })
    )
    rootNode.appendChild(
      new AS2MimeNode({
        contentType: 'message/disposition-notification',
        content: this.notification.toString()
      })
    )
    if (this.returned) {
      rootNode.appendChild(this.returned)
    }

    return rootNode
  }

  /** Convenience method to decrypt and/or verify a mime node and construct an outgoing message disposition.
   * @param {OutgoingDispositionOptions} - The options for generating an outgoing MDN.
   * @returns {Promise<AS2MimeNode>} - The generated outgoing MDN as an AS2MimeNode.
  */
  static async outgoing (
    options: OutgoingDispositionOptions
  ): Promise<AS2MimeNode> {
    if (isNullOrUndefined(options.node)) {
      throw new Error(ERROR.DISPOSITION_NODE)
    }

    const notification: AS2DispositionNotification = {
      finalRecipient: options.node.getHeader('As2-To'),
      disposition: {
        processed: true,
        type: 'automatic-action'
      }
    }
    let explanation = EXPLANATION.SUCCESS
    let rootNode: AS2MimeNode = options.node
    let errored = false

    if (isNullOrUndefined(notification.finalRecipient)) {
      throw new Error(ERROR.FINAL_RECIPIENT_MISSING)
    }

    if (typeof options.encrypted !== 'undefined') {
      try {
        rootNode = await rootNode.decrypt(options.encrypted)
      } catch (error) {
        errored = true
        notification.disposition.processed = false
        notification.disposition.description = {
          type: 'failure',
          text: (error as Error).message
        }
        explanation = EXPLANATION.FAILED_DECRYPTION
      }
    }

    if (typeof options.signed !== 'undefined' && !errored) {
      try {
        rootNode = await rootNode.verify(options.signed)
      } catch (error) {
        errored = true
        notification.disposition.processed = false
        notification.disposition.description = {
          type: 'failure',
          text: (error as Error).message
        }
        explanation = EXPLANATION.FAILED_GENERALLY
      }

      if (isNullOrUndefined(rootNode) && !errored) {
        errored = true
        notification.disposition.processed = false
        notification.disposition.description = {
          type: 'failure',
          text: 'Could not verify signature'
        }
        explanation = EXPLANATION.FAILED_VERIFICATION
      }
    }

    const mdn = new AS2Disposition({
      explanation,
      notification,
      returned: options.returnNode ? options.node : undefined
    })

    if (typeof options.signDisposition !== 'undefined') {
      return await mdn.toMimeNode().sign(options.signDisposition)
    }

    return mdn.toMimeNode()
  }

  /** Deconstruct a mime node into an incoming message disposition.
   * @param {AS2MimeNode} node - An AS2MimeNode containing an incoming MDN.
   * @param {VerificationOptions} [signed] - Options for verifying the MDN if necessary.
   * @returns {Promise<AS2Disposition>} The incoming message disposition notification.
  */
  static async incoming (
    node: AS2MimeNode,
    signed?: VerificationOptions
  ): Promise<AS2Disposition> {
    let rootNode: AS2MimeNode = node

    if (isNullOrUndefined(node)) {
      throw new Error(ERROR.DISPOSITION_NODE)
    }

    if (typeof signed !== 'undefined') {
      rootNode = await node.verify(signed)

      if (isNullOrUndefined(rootNode)) {
        throw new Error(ERROR.CONTENT_VERIFY)
      }
    }

    return new AS2Disposition(rootNode)
  }
}
