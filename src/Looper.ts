export class Looper {
  private interval?: NodeJS.Timer
  handlers: Handler[] = []
  intervalTime: number = 1000
  id: string
  name: string

  constructor (name?:string, intervalTime?: number) {
    if (intervalTime) this.intervalTime = intervalTime
    this.id = Math.random().toString().substring(2,17)
    this.name = name || this.id
  }

  addHandler (handler: Handler) {
    this.handlers.push(handler)
  }

  removeHandler (handler: Handler) {
    const handlerIndex = this.handlers.findIndex(h => h === handler)
    if (handlerIndex >= 0) {
      this.handlers.splice(handlerIndex, 1)
    }
  }

  loop (this: Looper) {
    if (this.interval) {
      console.warn(`looper (id: ${this.id}; name: ${this.name}) is already running.`)
      return
    }
    this.interval = setInterval(() => {
      for (const handler of this.handlers) {
        handler.handle(this)
      }
    }, this.intervalTime)
  }

  stop (this: Looper) {
    if (this.interval)
      clearInterval(this.interval!)
    this.interval = undefined
  }

  destroy (this: Looper) {
    this.stop()
    this.handlers = []
  }
}

export interface Handler {
  handle (looper: Looper, ...args: any[]): any
}
