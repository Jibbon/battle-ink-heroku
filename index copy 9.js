const express = require("express");
const app = express();
const fs = require('fs');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Static files
app.use(express.static("public"));

var library;

var tracks = [];

var presets = [];


fs.readFile('library.json', (err, data) => {
  if (err) throw err;
  library = JSON.parse(data);
});


fs.readFile('presets.json', (err, data) => {
  if (err) throw err;
  presets = JSON.parse(data);
});
    var background = "https://cdna.artstation.com/p/assets/images/images/020/186/524/large/miloe-cute-258-final-8-mb-pngg.jpg?1566760419";


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  setInterval(() => io.emit('time', new Date().getTime()), 1000);

  socket.on('gettracks', (data) => { io.emit('sendtracks', tracks); });
  socket.on('getlibrary', (data) => { io.emit('sendlibrary', library); });
  socket.on('getpresets', (data) => { io.emit('sendpresets', presets); });
  socket.on('getbackground', (data) => { io.emit('feedbackground', background); });
  // clock function
  socket.on("tick", (data) => { io.emit("tock"); });
  socket.on("volume", (data) => 
    { 
    var $index = tracks.findIndex(x => x.id === data.name);
    tracks[$index].gain = data.gain;
    io.emit("changevolume", data); 
    });
  // pan function
  socket.on("pan", (data) => 
    { 
    var $index = tracks.findIndex(x => x.id === data.name);
    tracks[$index].pan = data.pan;
    io.emit("changepan", data); 
    });
  // loop function
  socket.on("seedloop", (data) => 
    { 
    var $index = tracks.findIndex(x => x.id === data.name);
    tracks[$index].loop = data.loop;
    io.emit("feedloop", data); 
    });  
  // sync function
  socket.on("syncit", (data) => { io.emit("sync", data); });
  // add sound
  socket.on("seedsound", (data) => 
    { 
    $new = {'id':data.name, 'file':data.file, "gain":data.gain, 'pan':data.pan, 'loop':data.loop, "icon":data.icon };
    tracks.push($new);
    io.emit("newsound"); 
    });
    // add preset sound
    socket.on("seedpreset", (data) => 
    { 
    $new = {'id':data.name, 'file':data.file, "gain":0, "icon":data.icon };
    tracks.push($new);
    io.emit("newsound"); 
    });
    // remove sound
    socket.on("removesound", (name) => 
    { 
    var $index = tracks.findIndex(x => x.id === name);
    tracks.splice($index, 1);
    io.emit("soundscrubbed", name); 
    });
    // change background
    socket.on("seedbackground", (url) => 
      { 
      background = url;
      io.emit("feedbackground", url); 
      });




});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
