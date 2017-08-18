export interface Looper {
  post(cb: () => void, delay: number): void;
  postMessage(handler: Handler, msg: Message, delay: number): void;
  sendMessage(handler: Handler, msg: Message): void;
}

export abstract class Handler {

  constructor(private looper?: Looper) {
  }

  getLooper(): Looper {
    return this.looper || QueueLooper.get();
  }

  sendMessage(this: Handler, msg: Message): void {
    const looper = this.getLooper();
    looper.sendMessage(this, msg);
  }

  post(cb: () => void, delay: number = 0) {
    const looper = this.getLooper();
    looper.post(cb, delay);
  }

  postMessage(this: Handler, msg: Message, delay: number = 0) {
    const looper = this.getLooper();
    looper.postMessage(this, msg, delay);
  }

  abstract handleMessage(msg: Message): any;
}

export class Message {
  [key: string]: any;
}

export class QueueLooper implements Looper {
  private static mainLooper?: QueueLooper;

  static get(): QueueLooper {
    if (!QueueLooper.mainLooper) {
      QueueLooper.mainLooper = new QueueLooper();
    }
    return QueueLooper.mainLooper;
  }

  constructor(public options: any = {}) {
  }

  assertMaximumStack(): never {
    throw Error('Call #postMessage but not #sendMessage in #handleMessage. Or Error "Maximum call stack size exceeded" would happend');
  }

  post(cb: () => void, delay: number): void {
    setTimeout(() => {
      cb();
    }, delay);
  }

  postMessage(this: QueueLooper, handler: Handler, msg: Message, delay: number): void {
    setTimeout(() => {
      this.execute(handler, msg);
    }, delay);
  }

  sendMessage(handler: Handler, msg: Message): void {
    this.execute(handler, msg);
  }

  execute(handler: Handler, msg: Message) {
    try {
      // If use #sendMessage in #handleMessage,
      // Error "Maximum call stack size exceeded" would happend.
      const sendMessage = handler.sendMessage;
      handler.sendMessage = this.assertMaximumStack;
      handler.handleMessage(msg);
      handler.sendMessage = sendMessage;
    } catch (e) {
      console.error(e);
    }
  }
}
