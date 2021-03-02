const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Static files
app.use(express.static("public"));


var tracks = [
  {'id':'cathedral', 'class':'diegetic', 'name':'Cathedral Ambience', 'file':'aprophecyfulfilled.mp3', 'column':'columnone', 'position':1 },
  {'id':'farewell', 'class':'diegetic', 'name':'Farewell to a Friend', 'file':'farewelltoafriend.mp3', 'column':'columnone', 'position':2 },
  {'id':'theglory', 'class':'diegetic', 'name':'The Glory', 'file':'theglory.mp3', 'column':'columnone', 'position':3 },
  {'id':'darkcello', 'class':'diegetic', 'name':'Dark Cello One', 'file':'cellofear01.mp3', 'column':'columnone', 'position':4 },
  ];


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  socket.on("gettracks", (data) => { socket.emit("catchtracks", tracks); });

  socket.on('play', (data) => { io.emit('fire',data); });
    socket.on('pause', (data) => { io.emit('freeze',data); });
  
    socket.on('turn-loop-on', (data) => { io.emit('loop-on',data); });
    socket.on('turn-loop-off', (data) => { io.emit('loop-off',data); });

    socket.on("syncit", (data) => { io.emit("sync", data); });

    socket.on("volume", (data) => { io.emit("changevolume", data); });

    socket.on("tick", (data) => { socket.emit("tock", data); });
    

});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
