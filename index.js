const express = require('express');
const app = express();

const socket = require('socket.io');

const server = app.listen(3000, () => {
    console.log('listening on port 3000');
})

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

const userRoute = require('./routes/userRoute');

app.use('/', userRoute);

// socket io working here
const io = socket(server);

io.on('connection', (socket) => {
    console.log('A user connected ' + socket.id);

    socket.on('join', (roomName) => {
        var rooms = io.sockets.adapter.rooms;
        var room = rooms.get(roomName)

        if (room == undefined) {
            socket.join(roomName);
            socket.emit("created");
        }
        else if (room.size == 1) {
            socket.join(roomName);
            socket.emit("joinedRoom");
        }
        else {
            socket.emit("fullRoom");
        }
    })

    socket.on("ready", (roomName) => {
        console.log("Ready");
        socket.broadcast.to(roomName).emit("ready");
    })

    socket.on("candidate", (candidate, roomName) => {
        console.log("Candidate");
        socket.broadcast.to(roomName).emit("candidate", candidate);
    })

    socket.on("offer", (offer, roomName) => {
        console.log("Offer");
        console.log(offer);
        socket.broadcast.to(roomName).emit("offer", offer);
    })

    socket.on("answer", (answer, roomName) => {
        console.log("Answer");
        socket.broadcast.to(roomName).emit("answer", answer);
    })

    socket.on('disconnect', () => {
        console.log('A user disconnected ' + socket.id);
    })
})