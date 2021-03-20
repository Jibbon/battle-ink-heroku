const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Static files
app.use(express.static("public"));


var tracks = [

  {'id':'farewell', 'file':'farewelltoafriend.mp3', "icon":"music" },
  {'id':'swamp', 'file':'swamp.mp3', "icon":"water" },
  {'id':'drums', 'file':'kododrums.mp3', "icon":"shield" }

  ];


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  socket.on('gettracks', (data) => { io.emit('catchtracks', tracks); });

  socket.on('play', (data) => { io.emit('fire',data); });
  socket.on('pause', (data) => { io.emit('freeze',data); });
  
    socket.on('turn-loop-on', (data) => { io.emit('loop-on',data); });
    socket.on('turn-loop-off', (data) => { io.emit('loop-off',data); });

    socket.on("syncit", (data) => { io.emit("sync", data); });

    socket.on("volume", (data) => { io.emit("changevolume", data); });
    socket.on("pan", (data) => { io.emit("changepan", data); });

    socket.on("tick", (data) => { socket.emit("tock", data); });
    
    socket.on("addsound", (data) => { io.emit("newsound", data); });
    socket.on("feeddot", (data) => { io.emit("build", data); });


});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
