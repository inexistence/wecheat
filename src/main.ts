import WeCheat from './WeCheat'
;(async () => {
  const wecheat: WeCheat = new WeCheat()

  const {uuid, qrcodeUrl} = await wecheat.getQRCode()
  console.log('qrcode', qrcodeUrl)
  await wecheat.login(uuid)

})().catch(e => console.error(e))
