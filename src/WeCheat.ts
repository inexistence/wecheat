import rp = require('request-promise');
import { EventEmitter } from 'events';
import * as utils from './utils';
import libxmljs = require('libxmljs');
import {Handler, Message} from './looper/Looper';
import SyncMsgHandler from './looper/SyncMsgHandler';
import ApiFactory from './api';

import { URLConfig, GET_QRCODE_UUID_QUERY, LOGIN_QUERY } from './config';

export default class WeCheat {
  isLogging: boolean = false;
  emitter: EventEmitter = new EventEmitter();
  syncHandler: SyncMsgHandler;
  api: ApiFactory;

  constructor() {
    this.api = new ApiFactory();
    this.syncHandler = new SyncMsgHandler(this.api);

    this.syncHandler.onAddMsgListListener = this.onAddMsgList.bind(this);
    this.syncHandler.onModContactListListener = this.onModContactList.bind(this);
    this.syncHandler.onErrorListener = this.handleError.bind(this);

    this.syncHandler.onDisconnectListener = ((reason: string, retry: boolean) => {
      this.emit('disconnect', reason, retry);
    }).bind(this);
    this.syncHandler.onReconnectListener = (() => {
      this.emit('reconnect');
    }).bind(this);
  }

  /**
   * 开始登录流程
   * @param uuid 可选, 二维码uuid
   */
  async login(this: WeCheat): Promise<UserInfo | undefined> {
    if (this.isLogging || this.syncHandler.isRunning) return this.api.userInfo;

    this.isLogging = true;
    try { 
      const {uuid, qrcodeUrl} = (await this.api.login.getQRCode());

      this.emit('qrcode', qrcodeUrl, uuid);

      let loginSuccess: boolean = false;
      while(!loginSuccess) {
        const {code, info} = await this.api.login.checkLogin(uuid);
        switch (code) {
          case 0: // 继续监测
            await utils.wait(500);
            break;
          case 200: // 登录成功
            this.api.loginInfo = info;
            loginSuccess = true;
            break;
          case 201: // 扫描成功
            console.log('You have scanned the QRCode')
            await utils.wait(1000);
            break;
          case 408: // 图片过期
            throw new Error('QRCode should be renewed');
          default:
            throw new Error(`Unknow code ${code}`);
        }
      };
      console.time('login');
      const initInfo = await this.api.login.webInit();
      const userInfo = initInfo.User as UserInfo;
      this.api.userInfo = userInfo;
      this.api.login.showMobileState();

      this.syncHandler.start(initInfo.SyncKey);

      console.timeEnd('login');
      this.emitter.emit('login', userInfo);
      return userInfo;
    } catch (e) {
      console.error(e);
    } finally {
      this.isLogging = false;
    }
  }

  on(this: WeCheat, event: string|symbol, listener: (...args: any[]) => any): void {
    this.emitter.on(event, listener);
  }

  emit(this: WeCheat, event: string|symbol, ...args: any[]) {
    this.emitter.emit(event, ...args);
  }

  onAddMsgList(this: WeCheat, addMsgList: any[]) {
    this.emit('onAddMsgList', addMsgList);
  }

  onModContactList(this: WeCheat, modContactList: any[]) {
    this.emit('onModContactList', modContactList);
  }

  handleError(error: Error) {
    console.error(error);
  }
}
