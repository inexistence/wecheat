import rp = require('request-promise')
import { EventEmitter } from 'events'
import * as utils from './utils'
import libxmljs = require('libxmljs')

import { URLConfig, GET_QRCODE_UUID_QUERY, LOGIN_QUERY } from './config'

export default class WeCheat {
  alive: boolean = false
  isLogging: boolean = false
  emitter: EventEmitter = new EventEmitter()
  loginInfo?: LoginInfo

  constructor () {
  }

  /**
   * 开始登录流程
   * @param uuid 可选, 二维码uuid
   */
  async login (this: WeCheat, uuid?: string): Promise<LoginInfo|undefined> {
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
      this.emitter.emit('login', this.loginInfo)
      return this.loginInfo
    } catch (e) {
      console.error(e)
    } finally {
      this.isLogging = false
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
    const headers = {
      'User-Agent' : URLConfig.USER_AGENT
    }
    const result = await rp({
      method: 'POST',
      uri,
      headers,
      body: bodyData,
      json: true,
      jar: true
    })
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
      qs: query
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
      qs: query
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
