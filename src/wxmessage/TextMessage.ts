import WXMessage from './WXMessage';

export default class TextMessage extends WXMessage {
  static MSG_TYPE = 1;

  constructor(msg?: any) {
    super(msg);
  }

  set type(type: number) {
    if (type !== TextMessage.MSG_TYPE) {
      throw new Error('Error msg type for text.');
    }
  }
}
