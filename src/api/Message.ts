/**
 * TODO 消息相关
 */
import BaseApi from './base/BaseApi';
import { URLConfig } from '../config';

export default class Message extends BaseApi {

  getImageUrl(msgId: string): string {
    return URLConfig.GET_MSG_IMAGE(this.loginInfo!.url, msgId, this.loginInfo!.skey)
  }
}
