import rp = require('request-promise')
import { EventEmitter } from 'events'
import * as utils from './utils'
import libxmljs = require('libxmljs')
import {Handler, Message} from './Looper'

import { URLConfig, GET_QRCODE_UUID_QUERY, LOGIN_QUERY } from './config'

export default class WeCheat extends Handler {
  alive: boolean = false
  isLogging: boolean = false
  emitter: EventEmitter = new EventEmitter()
  loginInfo?: LoginInfo
  userInfo?: UserInfo
  handler: Handler

  constructor () {
    super()
  }

  /**
   * 开始登录流程
   * @param uuid 可选, 二维码uuid
   */
  async login (this: WeCheat, uuid?: string): Promise<LoginInfo|undefined> {
    console.time('login')
    if (this.isLogging || this.alive) return this.loginInfo

    this.isLogging = true
    try {
      if (!uuid) uuid = (await this.getQRCode()).uuid

      let loginSuccess: boolean = false
      while(!loginSuccess) {
        const {code, info} = await this.checkLogin(uuid)
        switch (code) {
          case 0: // 继续监测
            await utils.wait(500)
            break
          case 200: // 登录成功
            this.loginInfo = info
            loginSuccess = true
            break
          case 201: // 扫描成功
            console.log('You have scanned the QRCode')
            await utils.wait(1000)
            break
          case 408: // 图片过期
            throw new Error('QRCode should be renewed')
          default:
            throw new Error(`Unknow code ${code}`)
        }
      }
      const initInfo = await this.webInit()
      this.userInfo = initInfo.User as UserInfo
      this.showMobileState()

      this.startReceiveMsg(initInfo.SyncKey)

      this.emitter.emit('login', this.loginInfo)
      return this.loginInfo
    } catch (e) {
      console.error(e)
    } finally {
      this.isLogging = false
      console.timeEnd('login')
    }
  }

  async webInit (): Promise<any> {
    if (!this.loginInfo) {
      throw new Error('have not login!')
    }
    const uri = `${this.loginInfo.url}/webwxinit?r=${Math.floor((new Date().getTime())/1000)}`
    const bodyData = {
      'BaseRequest': this.loginInfo.BaseRequest
    }
    const result = await rp({
      method: 'POST',
      uri,
      headers: { 'User-Agent' : URLConfig.USER_AGENT },
      body: bodyData,
      json: true,
      jar: true
    })
    if (result.BaseResponse.Ret !== 0) {
      throw new Error(`web init failed!${result.BaseResponse.ErrMsg}`)
    }
    return result
  }

  /**
   * 向手机发送已经在网页登录的状态
   */
  async showMobileState (): Promise<void> {
    if (!this.loginInfo || !this.userInfo) {
      throw new Error('have not login!')
    }
    const uri = `${this.loginInfo.url}\webwxstatusnotify?pass_ticket=${this.loginInfo.pass_ticket}`
    const data = {
      'BaseRequest': this.loginInfo['BaseRequest'],
      'Code': 3,
      'FromUserName': this.userInfo.UserName,
      'ToUserName': this.userInfo.UserName,
      'ClientMsgId': Math.floor((new Date().getTime())/1000)
    }
    const result = await rp({
      method: 'POST',
      uri,
      headers: { 'User-Agent' : URLConfig.USER_AGENT },
      body: data,
      json: true,
      jar: true
    })
  }

  /**
   * 开始同步消息
   */
  async startReceiveMsg (syncKey: SyncKey) {
    if (this.alive) {
      console.warn('receive message handler is alive now!')
      return
    }
    this.alive = true
    const msg: Message = new Message()
    msg.syncKey = syncKey
    this.postMessage(msg)
  }

  /**
   * 每隔 1000ms 同步一次消息
   * @param msg
   */
  async handleMessage(msg: Message) {
    try {
      const selector = await this.syncCheck(msg.syncKey)
      if (selector !== 0) {
        const getMsgResult = await this.getMsg(msg.syncKey)
        if (getMsgResult.SyncCheckKey) {
          msg.syncKey = getMsgResult.SyncCheckKey
        }
        const addMsgList = getMsgResult.AddMsgList
        const modContactList = getMsgResult.ModContactList
        if (addMsgList && addMsgList.length > 0) {
          // 消息（聊天）列表变化
          // 包括打开新的聊天窗口（即使没发言）
          // 收到新消息
          // 这类导致消息（聊天）列表变化的行为
          this.emitter.emit('AddMsgList', addMsgList)
        }
        if (modContactList && modContactList.length > 0) {
          this.emitter.emit('modContactList', modContactList)
        }
      }
      this.postMessage(msg, 1000)
    } catch (e) {
      console.log(e)
      this.alive = false
    }
  }

  /**
   * 发送同步请求，保持连线
   * 检查手机端是否退出登录
   * @param syncKey 
   */
  async syncCheck (syncKey: SyncKey): Promise<number> {
    if (!this.loginInfo) {
      throw new Error('have not login!')
    }
    const uri = `${this.loginInfo['syncUrl']}/synccheck`
    const params = {
      'r' : new Date().getTime(),
      'skey': this.loginInfo['skey'],
      'sid': this.loginInfo['wxsid'],
      'uin': this.loginInfo['wxuin'],
      'deviceid': this.loginInfo['deviceid'],
      'synckey': this.synckey2Str(syncKey),
      '_': new Date().getTime()
    }
    const syncResult = await rp({
      uri,
      qs: params,
      headers: { 'User-Agent' : URLConfig.USER_AGENT },
      jar: true
    })
    const match = syncResult.match(/window.synccheck={retcode:"(\d+)",selector:"(\d+)"}/)
    if (match[1] == 1101) {
      throw new Error('Mobile logout')
    } else if (match[1] != 0) {
      throw new Error(`Unexpected sync check result: ${syncResult}`)
    }
    return match[2] as number
  }

  async synckey2Str(syncKey: SyncKey) {
    return syncKey.List.reduce((last: string, item: {Key: number, Val: number}): string => {
      return `${last}${last ? '|': ''}${item.Key}_${item.Val}`
    }, '')
  }

  /**
   * 检查是否有新消息
   * 更新 SyncKey
   * @param syncKey 
   */
  async getMsg (syncKey: SyncKey): Promise<any> {
    if (!this.loginInfo) {
      throw new Error('have not login!')
    }
    const uri = `${this.loginInfo.url}/webwxsync?sid=${this.loginInfo.wxsid}&skey=${this.loginInfo.skey}&pass_ticket=${this.loginInfo.pass_ticket}`
    const data = {
      'BaseRequest': this.loginInfo['BaseRequest'],
      'SyncKey': syncKey,
      'rr': ~(Math.floor((new Date().getTime())/1000))
    }
    const result = await rp({
      method: 'POST',
      uri,
      headers: { 'User-Agent' : URLConfig.USER_AGENT },
      body: data,
      json: true,
      jar: true
    })
    if (result['BaseResponse']['Ret'] != 0) {
      return {}
    }
    return result
  }

  /**
   * 监控用户是否扫描二维码
   * @param uuid qrcode uuid
   * @return code:0什么都没继续监控，200登录成功，201扫描成功，408图片过期，400解析不到可能网页登录被限制了
   */
  private async checkLogin (uuid: string): Promise<({code: number, info?: LoginInfo})> {
    const query: LOGIN_QUERY = {
      loginicon: true,
      tip: 1,
      _: (new Date()).getTime().toString(),
      uuid
    }
    const loginCheckUrl: string = URLConfig.LOGIN
    const body: string = await rp({
      uri: loginCheckUrl,
      qs: query,
      jar: true
    })

    const match: RegExpMatchArray | null = body.match(/window.code=(\d+)/)
    if (!match) {
      await utils.wait(500)
      return {code: 0}
    }
    const code = Number(match[1])
    if (code === 200) {
      const info = await this.processLoginInfo(body)
      return {code, info}
    }
    return {code}
  }

  /**
   * 当二维码扫描成功
   * 获得 syncUrl 和 fileUploadingUrl
   * 生成 deviceid 和 msgid
   * 获得 skey, wxsid, wxuin, pass_ticket
   * @param body
   */
  private async processLoginInfo (body: any): Promise<LoginInfo> {
    return new Promise<LoginInfo>((resolve, reject) => {
      const redirectMatch = body.match(/window.redirect_uri="(\S+)";/)
      const redirect = redirectMatch[1]
      const url = (redirect.match(/(https{0,1}:\/\/\S+)\//))[1]
      const domainMatch = redirect.match(/https{0,1}:\/\/([\w|\.]+)/)
      const domain = domainMatch && domainMatch[1]
      let fileUrl = redirect, syncUrl = redirect
      if (domain) {
        fileUrl = `https://file.${domain}/cgi-bin/mmwebwx-bin`
        syncUrl = `https://webpush.${domain}/cgi-bin/mmwebwx-bin`
      }
      rp({
        uri: redirect,
        headers: { 'User-Agent' : URLConfig.USER_AGENT },
        followRedirect: false,
        jar: true
      }).then((res: any) => {
        reject(new Error(`301 statusCode wanted. but got ${res}`))
      }).catch((error: any) => {
        if (error.statusCode === 301) {
          const loginInfoXML = error.response.body
          let skey, wxsid, wxuin, pass_ticket
          try {
            const xmlDoc: libxmljs.XMLDocument = libxmljs.parseXml(loginInfoXML)
            skey = xmlDoc.get('//skey')!.text()
            wxsid = xmlDoc.get('//wxsid')!.text()
            wxuin = xmlDoc.get('//wxuin')!.text()
            pass_ticket = xmlDoc.get('//pass_ticket')!.text()
          } catch (e) {
            throw new Error(`Your wechat account may be LIMITED to log in WEB wechat: ${loginInfoXML}`)
          }
          const deviceid = 'e' + Math.random().toString().substring(2,17)
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
              Uin: wxuin,
              DeviceID: deviceid
            }
          })
        } else {
          reject(error)
        }
      })
    })
  }

  on (event: string|symbol, listener: (...args: any[]) => any): void {
    this.emitter.on(event, listener)
  }

  /**
   * 获取二维码
   */
  async getQRCode (): Promise<{uuid: string, qrcodeUrl: string}> {
    const {uuid} = await this.getQRCodeUUID()
    const qrcodeUrl = URLConfig.QRCODE_IMAGE(uuid)
    this.emitter.emit('scan', qrcodeUrl, uuid)
    return {
      uuid,
      qrcodeUrl
    }
  }

  /**
   * 获取二维码uuid
   */
  async getQRCodeUUID (): Promise<({uuid: string, code: number})> {
    const query: GET_QRCODE_UUID_QUERY = {
      appid: URLConfig.APP_ID,
      fun: 'new',
      lang: 'en_US',
      _: (new Date()).getTime().toString()
    }
    const body: string = await rp({
      uri: URLConfig.GET_QRCODE_UUID,
      headers: { 'User-Agent' : URLConfig.USER_AGENT },
      qs: query,
      jar: true
    })
    const match = body.match(/window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)";/)
    if (match) {
      return {
        code: Number(match[1]),
        uuid: String(match[2])
      }
    } else {
      throw new Error('no match when get QRCode uuid')
    }
  }
}
