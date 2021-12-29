const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const generateMessage = require('./utils/message')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket)=>{
    //console.log('New websocket connection');
    
    socket.on('join', (options, callback)=>{
        const {error, user} = addUser({id: socket.id, ...options})
        
        if(error){
            return callback(error)
        }
        
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
        //socket.emit, io.emit, socket.broadcast.emit
        //io.to.emit, scoket.broadcast.to.emit
    })

    socket.on('sendMessage', (obj, callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(obj.message)){
            return callback('Profanity is not allowed.')
        }
        io.to(user.room).emit('message', generateMessage(user.username, obj.message))
        callback()
    })

    socket.on('sendLocation', (position, callback)=>{
        const user = getUser(socket.id)
        if(!position){
            return callback('Something went wrong')
        }
        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }        
    })   
})

server.listen(port, ()=>{
    console.log(`The server is running on port ${port}`);
})

module.exports = {
    io
}