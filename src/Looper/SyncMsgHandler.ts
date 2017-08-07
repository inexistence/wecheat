import {Handler, Message} from './Looper'
import {EventEmitter} from 'events'
import ApiFactory from '../Api'

export default class extends Handler {

  isRunning: boolean = false
  onAddMsgListListener?: (addMsgList: any[]) => void
  onModContactListListener?: (modContactList: any[]) => void
  onErrorListener?: (error: Error) => void
  onDisconnectListener?: (reason: string, retry: boolean) => void
  onReconnectListener?: () => void
  disconnect?: boolean = false

  constructor (protected api: ApiFactory) {
    super()
  }

  start (syncKey: SyncKey) {
    if (this.isRunning) {
      console.warn('sync handler is running.')
      return
    }
    this.isRunning = true
    const msg = new Message()
    msg.syncKey = syncKey
    this.postMessage(msg)
  }

  stop () {
    this.isRunning = false
  }

  async handleMessage(msg: Message) {
    if (!this.isRunning) return
    console.log('sync checking...')
    try {
      const selector = await this.api.sync.syncCheck(msg.syncKey)
      if (selector !== 0) {
        const getMsgResult = await this.api.sync.getMsg(msg.syncKey)
        if (getMsgResult.SyncCheckKey) {
          msg.syncKey = getMsgResult.SyncCheckKey
        }
        const addMsgList = getMsgResult.AddMsgList
        const modContactList = getMsgResult.ModContactList
        if (addMsgList && addMsgList.length > 0) {
          // 消息（聊天）列表变化
          // 包括打开新的聊天窗口（即使没发言）
          // 收到新消息
          // 这类导致消息（聊天）列表变化的行为
          this.onAddMsgList(addMsgList)
        }
        if (modContactList && modContactList.length > 0) {
          this.onModContactList(modContactList)
        }
      }
      if (this.disconnect) {
        this.onReconnect()
        this.disconnect = false
      }
      this.postMessage(msg)
    } catch (e) {
      if (e.message.includes('TIMEDOUT') ||
        e.message == 'Error: socket hang up') {
        if (!this.disconnect) {
          this.onDisconnect(e.message, true)
          this.disconnect = true
        }
        // try again if timeout
        console.warn(e.message, 'when sync. Try check again.')
        this.postMessage(msg, 1000)
      } else {
        if (!this.disconnect) {
          this.onDisconnect(e.message, false)
          this.disconnect = true
        }
        this.handleError(e)
        this.isRunning = false
      }
    }
  }

  onAddMsgList (addMsgList: any[]) {
    if (this.onAddMsgListListener) this.onAddMsgListListener(addMsgList)
  }

  onModContactList (modContactList: any[]) {
    if (this.onModContactListListener) this.onModContactListListener(modContactList)
  }

  onDisconnect (reason: string, retry: boolean) {
    if (this.onDisconnectListener) this.onDisconnectListener(reason, retry)
  }

  onReconnect () {
    if (this.onReconnectListener) this.onReconnectListener()
  }

  handleError (e: Error) {
    if (this.onErrorListener) this.onErrorListener(e)
  }
}
