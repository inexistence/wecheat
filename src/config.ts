export type GET_QRCODE_UUID_QUERY = {
  appid: string;
  fun: string;
  lang: string;
  _: number;
}

export type LOGIN_QUERY = {
  loginicon: boolean;
  uuid: string;
  tip: number;
  r?: string;
  _: number;
}

export class URLConfig {
  static APP_ID: string = 'wx782c26e4c19acffb';
  static LOGIN_BASE_URL: string = 'https://login.weixin.qq.com';
  static GET_QRCODE_UUID: string = `${URLConfig.LOGIN_BASE_URL}/jslogin`;
  static LOGIN: string = `${URLConfig.LOGIN_BASE_URL}/cgi-bin/mmwebwx-bin/login`;

  
  /** 下载图片消息 */
  static GET_MSG_IMAGE(baseUrl: string, msgId: string, skey: string): string {
    return `${baseUrl}/webwxgetmsgimg?MsgId=${msgId}&skey=${skey}`;
  }

  /** 下载语音消息 */
  static GET_MSG_VOICE(baseUrl: string, msgId: string, skey: string): string {
    return `${baseUrl}/webwxgetvoice?MsgId=${msgId}&skey=${skey}`;
  }

  /** 下载视频消息 */
  static GET_MSG_VIDEO(headers: any, baseUrl: string, msgId: string, skey: string): string {
    headers.Range = 'bytes=0-';
    return `${baseUrl}/webwxgetvideo?MsgId=${msgId}&skey=${skey}`;
  }

  /** 下载文件 */
  static GET_MSG_MEDIA(headers: any, baseUrl: string, msgId: string, skey: string, fromUserName: string, mediaid: string, filename: string): string {
    headers.Range = 'bytes=0-';
    return `${baseUrl}/webwxgetmedia?MsgId=${msgId}&skey=${skey}&sender=${fromUserName}&mediaid=${mediaid}&filename=${filename}`;
  }

  static QRCODE_IMAGE(uuid: string): string {
    return `${URLConfig.LOGIN_BASE_URL}/qrcode/${uuid}`;
  }

  static USER_AGENT: string = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36';
}

export class WX_LOGIN_CODE {
  static LOGIN_SUCCESS: number = 200;
  static SCAN_SUCCESS: number = 201;
  static QR_OUT_OF_TIME: number = 408;
}
