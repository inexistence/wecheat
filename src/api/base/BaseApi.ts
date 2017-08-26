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

  set loginInfo(logininfo: LoginInfo | undefined) {
    this.requestor.loginInfo = logininfo;
  }

  get userInfo(): UserInfo | undefined {
    return this.requestor.userInfo;
  }

  set userInfo(userinfo: UserInfo | undefined) {
    this.requestor.userInfo = userinfo;
  }
}
