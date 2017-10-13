/**
 * 同步相关 API
 */
import BaseApi from './base/BaseApi';
import * as utils from '../utils';
import { URLConfig } from '../config';

export default class Sync extends BaseApi {

  /**
   * 发送同步请求，保持连线
   * 检查手机端是否退出登录
   * @param syncKey 
   */
  async syncCheck(syncKey: SyncKey): Promise<number> {
    if (!this.loginInfo) {
      throw new Error('have not login!');
    }
    const uri = `${this.loginInfo['syncUrl']}/synccheck`;
    const params = {
      r: utils.second(),
      skey: this.loginInfo.skey,
      sid: this.loginInfo.wxsid,
      uin: this.loginInfo.wxuin,
      deviceid: this.loginInfo.deviceid,
      synckey: utils.synckey2Str(syncKey),
      _: utils.second()
    };
    const syncResult = await this.rp({
      uri,
      qs: params
    });
    const match = syncResult.match(/window.synccheck={retcode:"(\d+)",selector:"(\d+)"}/);
    if (match[1] == 1101) {
      throw new Error('Mobile logout');
    } else if (match[1] != 0) {
      throw new Error(`Unexpected sync check result: ${syncResult}`);
    }
    return match[2] as number;// 0:正常; 2:新消息; 7:进入/离开聊天界面
  }

  /**
   * 检查是否有新消息
   * 更新 SyncKey
   * @param syncKey 
   */
  async getMsg(syncKey: SyncKey): Promise<{SyncKey?: SyncKey, SyncCheckKey?: SyncKey, AddMsgList?: any[], ModContactList?: any[]}> {
    if (!this.loginInfo) {
      throw new Error('have not login!');
    }
    const uri = `${this.loginInfo.url}/webwxsync?sid=${this.loginInfo.wxsid}&skey=${this.loginInfo.skey}&pass_ticket=${this.loginInfo.pass_ticket}`;
    const data = {
      BaseRequest: this.loginInfo.BaseRequest,
      SyncKey: syncKey,
      rr: ~utils.second()
    };
    const result = await this.rp({
      method: 'POST',
      uri,
      body: data,
      json: true
    });
    if (result['BaseResponse']['Ret'] != 0) {
      return {
        SyncKey: undefined,
        SyncCheckKey: undefined,
        AddMsgList: undefined,
        ModContactList: undefined
      };
    }
    return result;
  }
}
