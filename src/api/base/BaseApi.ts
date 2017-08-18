import Requestor from './Requestor';

export default class BaseApi {
  constructor(public requestor: Requestor) {
  }

  rp(options: any) {
    return this.requestor.rp(options);
  }

  get loginInfo(): LoginInfo | undefined {
    return this.requestor.loginInfo;
  }

  get userInfo(): UserInfo | undefined {
    return this.requestor.userInfo;
  }
}
