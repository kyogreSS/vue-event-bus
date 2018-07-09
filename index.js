const SocketPlugin = {}

SocketPlugin.install = function (Vue, {url, options}) {
    Vue.mixin({
        beforeDestroy: function () {
            let _this = this
            if (Vue.prototype.$socket) {
                Vue.prototype.$socket.off({bind: _this})
            }
        }
    })
    Vue.prototype.$socket = Vue.$socket = new SocketHandler({url, options})
}

export default SocketPlugin


import io from 'socket.io-client'
import Vue from 'vue'

class SocketHandler {
    constructor(wsServer) {
        this.io = io(wsServer.url, wsServer.options)
        this.onMap = new Map()
        this.init()
    }

    test() {
    }

    init() {
        this.io.on('connect', function () {
            console.warn('socket顺利连接！')
        })
    }

    /**
     * 打开，重新连接
     */
    open() {
        this.io.open()
    }

    /**
     * 连接，作用和open一样
     */
    connect() {
        this.io.connect()
    }

    /**
     * 触发一个message事件，相当于emit('message')
     * @param params    一堆参数，最后一个参数可以是callback，参数为socket服务端返回的值
     */
    send(...params) {
        this.io.send(...params)
    }

    /**
     * 触发一个自定义事件
     * @param key     字符串，事件名称
     * @param params  一堆参数，最后一个参数可以是callback，参数为socket服务端返回的值
     */
    emit(key, ...params) {
        this.io.emit(key, ...params)
    }

    /**
     * 监听一个（自定义）事件
     * @param key   字符串，事件名称
     * @param callBack  函数，参数是socket服务端返回的值
     */
    on({key, bind, callBack}) {
        if (bind instanceof Vue === false) {
            console.log("参数使用错误，必须有bind参数，且bind为Vue实例，一般为this")
        }
        // 记录绑定的函数
        let keyMap = this.onMap.get(bind)
        !keyMap && this.onMap.set(bind, keyMap = new Map())
        let funcArr = keyMap.get(key)
        !funcArr && keyMap.set(key, funcArr = [])
        funcArr.push(callBack)

        this.io.on(key, callBack)
    }

    /**
     * 取消监听
     * @param key 字符串，事件名称
     * @param callBack  函数
     */
    off({key, bind, callBack}) {
        // 如果没有写bind，则表示取消绑定一个函数
        if (bind instanceof Vue === false) {
            this.io.off(key, callBack)
        }

        // 如果写了bind，则表示把此组件的on取消掉
        if (bind instanceof Vue === true) {
            let keyMap = this.onMap.get(bind)
            // 如果没有绑定，退出即可
            if (!keyMap) return
            keyMap.forEach((value, keys) => {
                if (!value) return
                value.forEach((value) => {
                    this.io.off(keys, value)
                })
            })
            this.onMap.delete(bind)
        }
    }

    /**
     * 只监听一次事件
     * @param key   字符串，事件名称
     * @param callBack    函数，参数是socket服务端返回的值
     */
    once(key, callBack) {
        this.io.once(key, callBack)
    }

    /**
     * 主动关闭socket
     */
    close() {
        this.io.close()
    }

    /**
     * 主动关闭socket，和close一致
     */
    disconnect() {
        this.io.disconnect()
    }

    /**
     * 这里记录一下原生的事件
     * 比如io.on('connect',function(){})
     * 一般来说回调函数会带一个参数，如果有说明参数，则是指回调函数的参数，如果没有不说明
     * connect    连接，重连的时候也会触发此事件，要绑定自定义事件要在connect外面注册，因为重连会触发多次
     * connect_error 连接错误，参数为error对象
     * connect_timeout 超时，返回timeout
     * error 错误，返回error对象
     * disconnect 失去连接，返回一个字符串，写明原因
     * reconnect 重连，返回一个attempt数字，表示重试次数
     * reconnect_attempt 重连，返回一个attempt数字，表示重连次数
     * reconnecting 重新连接中，返回一个attempt数字，表示重连次数
     * reconnect_error 重连失败，返回一个error对象
     * reconnect_failed 重连失败
     * ping  数据包写入服务器时触发
     * pong 从服务器接收到数据包时触发，带一个参数ms，数字，表示从ping开始经过的毫秒数
     */

}
