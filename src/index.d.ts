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

declare type UserInfo = {
  [key: string]: any
  HeadImgUrl: string
  Uin: number
  NickName: string
  UserName: string
  Sex: number
  HeadImgFlag: number
  SnsFlag: number
}

declare type SyncKey = {
  Count: number
  List: {
    Key:number
    Val: number
  }[]
}

// just mark
type WXMessage = {
  [key: string]: any
  BaseResponse: {Ret: number, ErrMsg: string}
  AddMsgList: {
    MsgId:string
    FromUserName: string
    ToUserName: string
    MsgType: number // 1:文本消息 51:打开对话框
    Content: string
    Status: number
    ImgStatus: number
    CreateTime: number
    VoiceLength: number
    PlayLength: number
    FileName: string
    FileSize: string
    MediaId: string
    Url: string
    AppMsgType: number
    StatusNotifyCode: number
    StatusNotifyUserName: string
    RecommendInfo: {
      UserName: string
      NickName: string
      QQNum: number
      Province: string
      City: string
      Content: string
      Signature: string
      Alias: string
      Scene: number
      VerifyFlag: number
      AttrStatus: number
      Sex: number
      Ticket: string
      OpCode: number
    }
    ForwardFlag: number
    AppInfo: {
      AppID: string
      Type: number
    }
    HasProductId: number
    Ticket: string
    ImgHeight: number
    ImgWidth: number
    SubMsgType: number
    NewMsgId: number
    OriContent: string
  }[]
}
