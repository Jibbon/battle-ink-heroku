const express = require("express");
const socket = require("socket.io");
const siofu = require("socketio-file-upload");
const fs = require('fs');

// App setup
const PORT = 3000;
const app = express();
const server = app.use(siofu.router).listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Static files
app.use(express.static("public"));

// Socket setup
const io = socket(server);


var tracks = [

  {'id':'farewell', 'file':'farewelltoafriend.mp3', "gain":0.05, "icon":"music" },
  {'id':'swamp', 'file':'swamp.mp3', "gain":0.05, "icon":"water" },
  {'id':'drums', 'file':'kododrums.mp3', "gain":0.05, "icon":"shield" }

  ];


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  socket.on('gettracks', (data) => { io.emit('sendtracks', tracks); });
  socket.on("volume", (data) => 
    { 
    var $index = tracks.findIndex(x => x.id === data.name);
    tracks[$index].gain = data.gain;
    io.emit("changevolume", data); 
    });
  socket.on("pan", (data) => { io.emit("changepan", data); });
  socket.on("syncit", (data) => { io.emit("sync", data); });
  socket.on("seedsound", (data) => 
    { 
    $new = {'id':data.name, 'file':data.file, "gain":0, "icon":"music" };
    tracks.push($new);
    io.emit("newsound"); 
    });

    // UPLOADING STUFF
    
    var uploader = new siofu();
    uploader.dir = "public/audio";
    uploader.listen(socket);

    uploader.on("saved", function(event)
      {
      var filename = event.file.name;
      var extension = filename.split('.').pop();
      var name = filename.replace(/\.[^/.]+$/, "");
      var d = new Date();
      var n = d.getTime();
      
      $newtrack =  {'id':name, 'file':n+'.'+extension, 'gain':0.05, 'icon':'water' };
      tracks.push($newtrack);

      fs.rename(event.file.pathName, 'public/audio/'+n+'.'+extension, function(err) 
        {
        if ( err ) console.log('ERROR: ' + err);
        else io.emit("newsound");
      });
      });


});


