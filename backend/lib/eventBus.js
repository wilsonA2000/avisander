const { EventEmitter } = require('events')

const bus = new EventEmitter()
bus.setMaxListeners(50)

function emit(type, payload = {}) {
  bus.emit('event', { type, payload, ts: new Date().toISOString() })
}

function subscribe(handler) {
  bus.on('event', handler)
  return () => bus.off('event', handler)
}

module.exports = { emit, subscribe }
