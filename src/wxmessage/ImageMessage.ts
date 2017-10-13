import WXMessage from './WXMessage';
import libxmljs = require('libxmljs');
import { URLConfig } from '../config';

export default class ImageMessage extends WXMessage {
  static MSG_TYPE = 3;
  msgId: string;

  constructor(msg?: any) {
    super(msg);
    if (msg) {
      this.msgId = msg.MsgId;
    }
  }

  set type(type: number) {
    if (type !== ImageMessage.MSG_TYPE) {
      throw new Error('Error msg type for image.');
    }
  }
}
