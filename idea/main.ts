import {Handler, QueueLooper, Message} from '../src/Looper/Looper'
import * as utils from '../src/utils'

class HeartbeatHandler extends Handler {

  async handleMessage (msg: Message) {
    msg.time = new Date().getTime()
    console.log('busy in handler', msg)
    await utils.wait(1000)
    // const newMsg = Message.obtain()
    this.postMessage(msg)
  }
}
const handler = new HeartbeatHandler(new QueueLooper())
// const msg = Message.obtain()
const msg = new Message()
msg.what = 1
handler.sendMessage(msg)
// const msg2 = Message.obtain()
const msg2 = new Message()
msg2.what = 2
handler.sendMessage(msg2)

for (let i = 0; i < 1000000000; i ++) {
  if (i % 100000000 === 0)
    console.log('busy outside', Math.floor(i/100000000))
}

