const express = require("express")
const app = express()
const https = require("https")
const http = require('http')
const fs = require("fs")
const path = require("path")
const {Server} = require("socket.io")

const { networkInterfaces } = require('os');
const nets = networkInterfaces();

const PORT = process.env.PORT || 8080
console.log(nets)

var privateKey  = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.cert', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var httpsServer = https.createServer(credentials, app);
app.use(express.static(__dirname + '/public'))
app.use('/static',express.static(__dirname + "/node_modules"))



// const server = app.listen(PORT, () => {
//     console.log(`servidor arriba en puerto ${PORT}`)
// })


app.use(express.static(__dirname + '/public'))
app.use('/traq/static',express.static(__dirname + "/node_modules"))

//http
if(process.env.PORT){
  const server = http.createServer(app)
  server.listen(PORT, () => {
    console.log('servidor arriba en puerto', PORT)
  })

  const io = new Server(server)
  io.on("connection", (socket) =>{
    console.log('nuevo cliente!')
    socket.on("gaze", (g) =>{
      socket.broadcast.emit("o_gaze", g)
    })
  })
}else{
  //https
  const sserver = https.createServer(credentials,app)
  sserver.listen(PORT, () => {
    console.log(`servidor seguro arriba en ${PORT}`)
  })
  const io = new Server(sserver)
  io.on("connection", (socket) =>{
    console.log('nuevo cliente!')
    socket.on("gaze", (g) =>{
      socket.broadcast.emit("o_gaze", g)
    })
  })
}

