import WeCheat from './WeCheat'
const qrcodeTerminal = require('qrcode-terminal')

;(async () => {
  const wecheat: WeCheat = new WeCheat()

  wecheat.on('qrcode', (qrcode, uuid) => {
    const loginUrl = qrcode.replace(/\/qrcode\//, '/l/')
    console.log('qrcode', qrcode)
    qrcodeTerminal.generate(loginUrl)
  })

  wecheat.on('login', (userInfo: UserInfo) => {
    console.log('login success', userInfo)
  })

  wecheat.on('onAddMsgList', (addMsgList) => {
    console.log('addMsgList', addMsgList)
  })

  wecheat.on('onModContactList', (modContactList) => {
    console.log('modContactList', modContactList)
  })
  await wecheat.login()

})().catch(e => console.error(e))
