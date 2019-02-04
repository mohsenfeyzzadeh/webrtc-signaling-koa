const Koa = require('koa')
const static = require('koa-static')
const app = new Koa()
const server = require('http').Server(app.callback())
const io = require('socket.io')(server)

app.use(static('./public'))

io.on('connection', socket => {
  // 加入房间
  socket.on('join', async data => {
    if (!data.name) {
      socket.emit('custom error', '请输入房间名')
    } else {
      await socket.join(data.name)
      socket.emit('join success')
      io.sockets.to(data.name).clients((error, clients) => {
        if (error) throw error
        if (clients.length > 1) {
          io.sockets.to(data.name).emit('another')
        }
      })
    }
  })
  // offer
  socket.on('offer', sdp => {
    socket.broadcast.emit('offer', sdp)
  })
  // answer
  socket.on('answer', sdp => {
    socket.broadcast.emit('answer', sdp)
  })
  // icecandidate
  socket.on('icecandidate', candidate => {
    socket.broadcast.emit('icecandidate', candidate)
  })
})

server.listen(3000, () => {
  console.log('app run at: http://127.0.0.1:3000')
})

