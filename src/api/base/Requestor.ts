import request = require('request-promise');
import { URLConfig } from '../../config';

export default class Requestor {
  loginInfo?: LoginInfo;
  userInfo?: UserInfo;

  rp(options: any): request.RequestPromise {
    return request(Object.assign({
      headers: { 'User-Agent' : URLConfig.USER_AGENT },
      jar: true
    }, options));
  }
}
