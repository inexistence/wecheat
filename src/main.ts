import WeCheat from './WeCheat'
;(async () => {
  const wecheat: WeCheat = new WeCheat()

  wecheat.on('scan', (qrcode, uuid) => {
    console.log('scan', qrcode)
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
