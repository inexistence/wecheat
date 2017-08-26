import BaseApi from './base/BaseApi';
import * as utils from '../utils';
import { URLConfig, GET_QRCODE_UUID_QUERY, LOGIN_QUERY } from '../config';
import libxmljs = require('libxmljs');

export default class Login extends BaseApi {
  static readonly DOMAIN_MAP: any = {
    'wx2.qq.com': ['file.wx2.qq.com', 'webpush.wx2.qq.com'],
    'wx8.qq.com': ['file.wx8.qq.com', 'webpush.wx8.qq.com'],
    'qq.com': ['file.wx.qq.com', 'webpush.wx.qq.com'],
    'web2.wechat.com': ['file.web2.wechat.com', 'webpush.web2.wechat.com'],
    'wechat.com': ['file.web.wechat.com', 'webpush.web.wechat.com']
  };

  async webInit(): Promise<any> {
    if (!this.loginInfo) {
      throw new Error('have not login!');
    }
    const uri = `${this.loginInfo.url}/webwxinit?pass_ticket=${this.loginInfo.pass_ticket}&skey=${this.loginInfo.skey}&r=${utils.second()}`;
    const bodyData = {
      BaseRequest: this.loginInfo.BaseRequest
    };
    const result = await this.rp({
      method: 'POST',
      uri,
      body: bodyData,
      json: true
    });
    if (result.BaseResponse.Ret !== 0) {
      throw new Error(`web init failed!${result.BaseResponse.ErrMsg}`);
    }
    return result;
  }

  /**
   * 获取二维码
   */
  async getQRCode(): Promise<{uuid: string, qrcodeUrl: string}> {
    const {uuid} = await this.getQRCodeUUID();
    const qrcodeUrl = URLConfig.QRCODE_IMAGE(uuid);
    return {
      uuid,
      qrcodeUrl
    };
  }

   /**
   * 获取二维码uuid
   */
  async getQRCodeUUID(): Promise<({uuid: string, code: number})> {
    const query: GET_QRCODE_UUID_QUERY = {
      appid: URLConfig.APP_ID,
      fun: 'new',
      lang: 'en_US',
      _: utils.second()
    };
    const body: string = await this.rp({
      uri: URLConfig.GET_QRCODE_UUID,
      qs: query
    });
    const match = body.match(/window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)";/);
    if (match) {
      return {
        code: Number(match[1]),
        uuid: String(match[2])
      };
    } else {
      throw new Error('no match when get QRCode uuid');
    }
  }

  /**
   * 监控用户是否扫描二维码
   * @param uuid qrcode uuid
   * @return code:0什么都没继续监控，200登录成功，201扫描成功，408图片过期，400解析不到可能网页登录被限制了
   */
  async checkLogin(uuid: string): Promise<({code: number, info?: LoginInfo})> {
    const query: LOGIN_QUERY = {
      loginicon: true,
      tip: 1,
      _: utils.second(),
      uuid
    };
    const loginCheckUrl: string = URLConfig.LOGIN;
    const body: string = await this.rp({
      uri: loginCheckUrl,
      qs: query
    });

    const match: RegExpMatchArray | null = body.match(/window.code=(\d+)/);
    if (!match) {
      await utils.wait(500);
      return {code: 0};
    }
    const code = Number(match[1]);
    if (code === 200) {
      const info = await this.processLoginInfo(body);
      return {code, info};
    }
    return {code};
  }


  /**
   * 当二维码扫描成功
   * 获得 syncUrl 和 fileUploadingUrl
   * 生成 deviceid 和 msgid
   * 获得 skey, wxsid, wxuin, pass_ticket
   * @param body
   */
  private async processLoginInfo(body: any): Promise<LoginInfo> {
    return new Promise<LoginInfo>((resolve, reject) => {
      const redirectMatch = body.match(/window.redirect_uri="(\S+)";/);
      const redirect = redirectMatch[1];
      const url = (redirect.match(/(https{0,1}:\/\/\S+)\//))[1];
      const domainMatch = redirect.match(/https{0,1}:\/\/([\w|\.]+)/);
      const domain = domainMatch && domainMatch[1];
      let fileUrl = redirect, syncUrl = redirect;
      if (domain) {
        const domainUrls = Login.DOMAIN_MAP[domain];
        if (domainUrls) {
          fileUrl = `https://${domainUrls[0]}/cgi-bin/mmwebwx-bin`;
          syncUrl = `https://${domainUrls[1]}/cgi-bin/mmwebwx-bin`;
        } else {
          fileUrl = `https://file.${domain}/cgi-bin/mmwebwx-bin`;
          syncUrl = `https://webpush.${domain}/cgi-bin/mmwebwx-bin`;
        }
      }
      this.rp({
        uri: redirect,
        followRedirect: false
      }).then((res: any) => {
        reject(new Error(`301 statusCode wanted. but got ${res}`));
      }).catch((error: any) => {
        if (error.statusCode === 301) {
          const loginInfoXML = error.response.body;
          let skey, wxsid, wxuin, pass_ticket;
          try {
            const xmlDoc: libxmljs.XMLDocument = libxmljs.parseXml(loginInfoXML);
            skey = xmlDoc.get('//skey')!.text();
            wxsid = xmlDoc.get('//wxsid')!.text();
            wxuin = xmlDoc.get('//wxuin')!.text();
            pass_ticket = xmlDoc.get('//pass_ticket')!.text();
          } catch (e) {
            throw new Error(`Your wechat account may be LIMITED to log in WEB wechat: ${loginInfoXML}`);
          }
          const deviceid = 'e' + Math.random().toString().substring(2,17);
          resolve({
            domain,
            url,
            fileUrl,
            syncUrl,
            deviceid,
            skey,
            wxsid,
            wxuin: wxuin,
            pass_ticket,
            BaseRequest: {
              Skey: skey,
              Sid: wxsid,
              Uin: Number(wxuin),
              DeviceID: deviceid
            }
          });
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * 向手机发送已经在网页登录的状态
   */
  async showMobileState(): Promise<void> {
    if (!this.loginInfo || !this.userInfo) {
      throw new Error('have not login!');
    }
    const uri = `${this.loginInfo.url}\webwxstatusnotify?pass_ticket=${this.loginInfo.pass_ticket}`;
    const data = {
      'BaseRequest': this.loginInfo['BaseRequest'],
      'Code': 3,
      'FromUserName': this.userInfo.UserName,
      'ToUserName': this.userInfo.UserName,
      'ClientMsgId': utils.second()
    };
    await this.rp({
      method: 'POST',
      uri,
      body: data,
      json: true
    });
  }
}
