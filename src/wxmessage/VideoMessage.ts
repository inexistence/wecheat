import WXMessage from './WXMessage';
import libxmljs = require('libxmljs');

export default class VideoMessage extends WXMessage {
  static MSG_TYPE = 62;
  msgId: string; // 用于获取小视频

  constructor(msg?: any) {
    super(msg);
    if (msg) {
      this.msgId = msg.MsgId;
    }
  }

  set type(type: number) {
    if (type !== VideoMessage.MSG_TYPE) {
      throw new Error('Error msg type for video.');
    }
  }
}
