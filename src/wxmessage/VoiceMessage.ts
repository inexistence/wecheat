import WXMessage from './WXMessage';
import libxmljs = require('libxmljs');

export default class VoiceMessage extends WXMessage {
  static MSG_TYPE = 34;
  msgId: string;
  imgHeight: number;
  imgWidth: number;

  constructor(msg?: any) {
    super(msg);
    if (msg) {
      this.msgId = msg.MsgId;
      this.imgHeight = msg.ImgHeight;
      this.imgWidth = msg.ImgWidth;
    }
  }

  set type(type: number) {
    if (type !== VoiceMessage.MSG_TYPE) {
      throw new Error('Error msg type for voice.');
    }
  }
}
