const express = require("express");
const app = express();
const fs = require('fs');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Static files
app.use(express.static("public"));


fs.readFile('test.json', (err, data) => {
  if (err) throw err;
  let student = JSON.parse(data);
  console.log(student);
});

var tracks = [];

  var library = [

    {'id':'farewell', 'file':'farewelltoafriend.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'swamp', 'file':'swamp.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'firebolt', 'file':'firebolt.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'beach', 'file':'beach.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'seasidemarket', 'file':'seasidemarket.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'onboard', 'file':'onboard.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'sailing', 'file':'sailing.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'rainforest', 'file':'rainforest.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'ocean', 'file':'ocean.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'drums', 'file':'kododrums.mp3', "gain":0.05, "pan":0, "icon":"shield", "loop":false },
    {'id':'prophecy', 'file':'aprophecyfulfilled.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'blizzard', 'file':'blizzardoutside.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'hearth', 'file':'hearth01.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'horror', 'file':'horror01.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'library', 'file':'library.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'storm', 'file':'rainandthunder.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'tavern', 'file':'tavern.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'theglory', 'file':'theglory.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'stream', 'file':'stream.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'cello', 'file':'cellofear01.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'kynespeace', 'file':'kynespeace.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'aurora', 'file':'aurora.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'deadmarshes', 'file':'deadmarshesedit.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'deathinthedarkness', 'file':'deathinthedarkness.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'drakardrums', 'file':'drakardrums.mp3', "gain":0.05, "pan":0, "icon":"shield", "loop":false },
    {'id':'forest', 'file':'forest.mp3', "gain":0.05, "pan":0, "icon":"water", "loop":false },
    {'id':'imperiallegions', 'file':'imperiallegiontheme.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'journeyend', 'file':'journeyend.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false },
    {'id':'dawn', 'file':'dawn.mp3', "gain":0.05, "pan":0, "icon":"music", "loop":false }

    ];


   

    var background = "https://cdna.artstation.com/p/assets/images/images/020/186/524/large/miloe-cute-258-final-8-mb-pngg.jpg?1566760419";


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  setInterval(() => io.emit('time', new Date().getTime()), 1000);

  socket.on('gettracks', (data) => { io.emit('sendtracks', tracks); });
  socket.on('getlibrary', (data) => { io.emit('sendlibrary', library); });
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
