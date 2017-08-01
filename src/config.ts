export type GET_QRCODE_UUID_QUERY = {
  appid: string
  fun: string
  lang: string
  _: string
}
export type LOGIN_QUERY = {
  loginicon: boolean
  uuid: string
  tip: number
  r?: string
  _: string
}
export class URLConfig {
  static APP_ID: string = 'wx782c26e4c19acffb'
  static LOGIN_BASE_URL: string = 'https://login.weixin.qq.com'
  static GET_QRCODE_UUID: string = `${URLConfig.LOGIN_BASE_URL}/jslogin`
  static LOGIN: string = `${URLConfig.LOGIN_BASE_URL}/cgi-bin/mmwebwx-bin/login`

  static QRCODE_IMAGE: (uuid: string) => string = function (uuid: string): string {
    return `${URLConfig.LOGIN_BASE_URL}/qrcode/${uuid}`
  }
  static USER_AGENT: string = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36'
}

export class WX_LOGIN_CODE {
  static LOGIN_SUCCESS: number = 200
  static SCAN_SUCCESS: number = 201
  static QR_OUT_OF_TIME: number = 408
}