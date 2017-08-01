import WeCheat from './WeCheat'
;(async () => {
  const wecheat: WeCheat = new WeCheat()

  const {uuid, qrcodeUrl} = await wecheat.getQRCode()
  console.log('qrcode', qrcodeUrl)
  const loginInfo = await wecheat.login(uuid)

  if (loginInfo) {
    console.log('login success', loginInfo)
  }
  const web = await wecheat.webInit()
  console.log('web init', web)

})().catch(e => console.error(e))
