const Koa = require('koa')
const static = require('koa-static')
const app = new Koa()
const server = require('http').Server(app.callback())
const io = require('socket.io')(server)
const signal_utils = require('./lib/signal_utils')

app.use(static('./public'))

const _isIdExist = function (id) {
  return new Promise((resolve, reject) => {
    io.clients((error, clients) => {
      if (error) {
        signal_utils.logError(error)
        return
      }
      resolve(clients.some(client => {
        return client === id
      }))
    })
  })
}

signal_utils.logInfo("signal start working")
io.on('connection', socket => {
  signal_utils.logInfo(`[someone connect]-${socket.id}`)
  io.clients((error, clients) => {
    if (error) {
      signal_utils.logError(error)
      return
    }
    if (clients.length) {
      const clients_filter = clients.filter(v => {
        return v != socket.id
      })
      socket.emit('current clients', clients_filter)
    }
  })
  socket.broadcast.emit('someone connect', socket.id)

  socket.on('disconnect', reason => {
    signal_utils.logInfo(`[someone disconnect]-${socket.id}`)
    socket.broadcast.emit('someone disconnect', socket.id)
  })

  socket.on('call', id => {
    signal_utils.logInfo(`[call]-${socket.id}->${id}`)
    _isIdExist(id).then(isExist => {
      if (isExist) {
        io.to(id).emit('call', socket.id)
      } else {
        socket.emit('client offline')
      }
    })
  })

  socket.on('call answer', (id, answer) => {
    io.to(id).emit('call reply', socket.id, answer)
  })

  socket.on('offer', (id, sdp) => {
    io.to(id).emit('offer', socket.id, sdp)
  })

  socket.on('answer', (id, sdp) => {
    io.to(id).emit('answer', socket.id, sdp)
  })

  socket.on('icecandidate', (id, candidate) => {
    io.to(id).emit('icecandidate', socket.id, candidate)
  })

  socket.on('hang up', id => {
    signal_utils.logInfo(`[hang up]-${socket.id}->${id}`)
    io.to(id).emit('hang up', socket.id)
  })

  socket.on('message', (id, message) => {
    io.to(id).emit('message', socket.id, message)
  })
})

server.listen(3000)