declare type LoginInfo = {
  [key: string]: any
  url: string
  fileUrl: string
  syncUrl: string
  deviceid: string
  skey: string
  wxsid: string
  wxuin: string
  pass_ticket: string
  BaseRequest: {
    Skey: string
    Sid: string
    Uin: string
    DeviceID: string
  }
}
