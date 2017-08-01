export interface Looper {
  execute (handler: Handler, msg: Message): void
}

export abstract class Handler {

  constructor (private looper?: Looper) {
  }

  getLooper (): Looper {
    return this.looper || QueueLooper.get()
  }

  sendMessage (this: Handler, msg: Message): void {
    const looper = this.getLooper()
    looper.execute(this, msg)
  }

  post (cb: () => void, millions: number = 0) {
    setTimeout(() => {
      cb()
    }, millions)
  }

  postMessage (this: Handler, msg: Message) {
    setTimeout(() => {
      const looper = this.getLooper()
      looper.execute(this, msg)
    }, 0)
  }

  abstract handleMessage (msg: Message): any
}

export class Message {
  [key: string]: any
}

export class QueueLooper {
  private static mainLooper?: QueueLooper

  static get (): QueueLooper {
    if (!QueueLooper.mainLooper) {
      QueueLooper.mainLooper = new QueueLooper()
    }
    return QueueLooper.mainLooper
  }

  constructor (public options: any = {}) {
  }

  assertMaximumStack (): never {
    throw Error('Call #postMessage but not #sendMessage in #handleMessage. Or Error "Maximum call stack size exceeded" would happend')
  }

  execute (handler: Handler, msg: Message) {
    try {
      const sendMessage = handler.sendMessage
      handler.sendMessage = this.assertMaximumStack
      handler.handleMessage({...msg})
      handler.sendMessage = sendMessage
    } catch (e) {
      console.error(e)
    }
  }
}
