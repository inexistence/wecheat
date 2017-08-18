import rp = require('request-promise');
import fs = require('fs');
import Requestor from './base/Requestor';
import BaseApi from './base/BaseApi';

import Sync from './Sync';
import Login from './Login';

export default class ApiFactory {
  requestor: Requestor;
  apis: {
    [key: string]: any;
  };

  constructor() {
    this.requestor = new Requestor();
    this.apis = {};
  }

  set loginInfo(loginInfo: LoginInfo | undefined) {
    this.requestor.loginInfo = loginInfo;
  }

  get loginInfo(): LoginInfo | undefined {
    return this.requestor.loginInfo;
  }

  set userInfo(userInfo: UserInfo | undefined) {
    this.requestor.userInfo = userInfo;
  }

  get userInfo(): UserInfo | undefined {
    return this.requestor.userInfo;
  }

  get(apiName: string) {
    let api = this.apis[apiName];

    if (!api) {
      const clz = require('./' + apiName).default;
      api = new clz(this.requestor);
      this.apis[apiName] = api;
    }
    return api;
  }

  get sync(): Sync {
    return this.get('Sync') as Sync;
  }

  get login(): Login {
    return this.get('Login') as Login;
  }
}
