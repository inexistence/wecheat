import request = require('request-promise');
import { URLConfig } from '../../config';

export default class Requestor {
  loginInfo?: LoginInfo;
  userInfo?: UserInfo;

  async rp(options: any): Promise<any> {
    console.time(`start request ==> ${options.uri}`);
    const result = await request(Object.assign({
      headers: { 'User-Agent' : URLConfig.USER_AGENT },
      jar: true
    }, options));
    console.timeEnd(`start request ==> ${options.uri}`);
    return result;
  }
}
