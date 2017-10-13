import WXMessage from '../WXMessage';
import TextMessage from '../TextMessage';
import ImageMessage from '../ImageMessage';
import VideoMessage from '../VideoMessage';

export default class Parser {
  static parse(obj: any): WXMessage {
    switch (obj.MsgType) {
      case TextMessage.MSG_TYPE:
        return new TextMessage(obj);
      case ImageMessage.MSG_TYPE:
        return new ImageMessage(obj);
      case VideoMessage.MSG_TYPE:
        return new VideoMessage(obj);
      default:
        return new WXMessage(obj);
    }
  }
}
