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

  socket.on('gettracks', (data) => { io.emit('sendtracks', tracks); });
  socket.on("volume", (data) => { io.emit("changevolume", data); });
  socket.on("pan", (data) => { io.emit("changepan", data); });
  socket.on("syncit", (data) => { io.emit("sync", data); });
  socket.on("seedsound", (data) => 
    { 
    $new = {'id':data.name, 'file':data.file, "icon":"music" };
    tracks.push($new);
    io.emit("newsound"); 
    });


});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
