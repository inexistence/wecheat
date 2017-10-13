export default class WXMessage {
  originMsg: any;
  type: number;
  fromUserName: string;
  toUserName: string;
  content: string; 

  constructor(msg?: any) {
    if (msg) {
      this.originMsg = msg;
      this.type = msg.type;
      this.fromUserName = msg.fromUserName;
      this.toUserName = msg.toUserName;
      this.content = msg.content;
    }
  }
}
