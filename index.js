const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Static files
app.use(express.static("public"));




var tracks = [];

  var library = [

    {'id':'farewell', 'file':'farewelltoafriend.mp3', "gain":0.05, "icon":"music" },
    {'id':'swamp', 'file':'swamp.mp3', "gain":0.05, "icon":"water" },
    {'id':'beach', 'file':'beach.mp3', "gain":0.05, "icon":"water" },
    {'id':'seasidemarket', 'file':'seasidemarket.mp3', "gain":0.05, "icon":"water" },
    {'id':'onboard', 'file':'onboard.mp3', "gain":0.05, "icon":"water" },
    {'id':'sailing', 'file':'sailing.mp3', "gain":0.05, "icon":"water" },
    {'id':'drums', 'file':'kododrums.mp3', "gain":0.05, "icon":"shield" },
    {'id':'prophecy', 'file':'aprophecyfulfilled.mp3', "gain":0.05, "icon":"music" },
    {'id':'blizzard', 'file':'blizzardoutside.mp3', "gain":0.05, "icon":"water" },
    {'id':'hearth', 'file':'hearth01.mp3', "gain":0.05, "icon":"water" },
    {'id':'horror', 'file':'horror01.mp3', "gain":0.05, "icon":"music" },
    {'id':'library', 'file':'library.mp3', "gain":0.05, "icon":"water" },
    {'id':'storm', 'file':'rainandthunder.mp3', "gain":0.05, "icon":"water" },
    {'id':'tavern', 'file':'tavern.mp3', "gain":0.05, "icon":"water" },
    {'id':'theglory', 'file':'theglory.mp3', "gain":0.05, "icon":"music" },
    {'id':'stream', 'file':'stream.mp3', "gain":0.05, "icon":"water" },
    {'id':'cello', 'file':'cellofear01.mp3', "gain":0.05, "icon":"music" },
    {'id':'kynespeace', 'file':'kynespeace.mp3', "gain":0.05, "icon":"music" },
    {'id':'aurora', 'file':'aurora.mp3', "gain":0.05, "icon":"music" },
    {'id':'deadmarshes', 'file':'deadmarshesedit.mp3', "gain":0.05, "icon":"music" },
    {'id':'deathinthedarkness', 'file':'deathinthedarkness.mp3', "gain":0.05, "icon":"music" },
    {'id':'drakardrums', 'file':'drakardrums.mp3', "gain":0.05, "icon":"shield" },
    {'id':'forest', 'file':'forest.mp3', "gain":0.05, "icon":"water" },
    {'id':'imperiallegions', 'file':'imperiallegiontheme.mp3', "gain":0.05, "icon":"music" },
    {'id':'journeyend', 'file':'journeyend.mp3', "gain":0.05, "icon":"music" }

    ];

    var background = "https://cdna.artstation.com/p/assets/images/images/024/621/960/large/xh-d-2-2.jpg?1583007045";


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  setInterval(() => io.emit('time', new Date().getTime()), 1000);

  socket.on('gettracks', (data) => { io.emit('sendtracks', tracks); });
  socket.on('getlibrary', (data) => { io.emit('sendlibrary', library); });
  socket.on('getbackground', (data) => { io.emit('feedbackground', background); });

  socket.on("volume", (data) => 
    { 
    var $index = tracks.findIndex(x => x.id === data.name);
    tracks[$index].gain = data.gain;
    io.emit("changevolume", data); 
    });
  socket.on("pan", (data) => { io.emit("changepan", data); });
  socket.on("syncit", (data) => { io.emit("sync", data); });
  // add sound
  socket.on("seedsound", (data) => 
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
