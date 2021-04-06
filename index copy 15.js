const express = require("express");
const app = express();
const fs = require('fs');
const { title } = require("process");
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Static files
app.use(express.static("public"));

var library;

var tracks = [];

var presets = [];

var currentpreset = "1345768567";

fs.readFile('library.json', (err, data) => {
  if (err) throw err;
  library = JSON.parse(data);
});


fs.readFile('presets.json', (err, data) => {
  if (err) throw err;
  presets = JSON.parse(data);
});


function UpdatePreset(library) {

  fs.writeFile("presets.json", JSON.stringify(library, null, 4), (err) => {
    if (err) {  console.error(err);  return; };
    console.log("File has been created");
});

}



io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  setInterval(() => io.emit('time', new Date().getTime()), 1000);

  socket.on('gettracks', (data) => { io.emit('sendtracks', tracks); });
  socket.on('getlibrary', (data) => { io.emit('sendlibrary', library); });
  socket.on('getpresets', (data) => { io.emit('sendpresets', presets); });
  socket.on('changepreset', (preset) => 
    { 
    currentpreset = preset;
    io.emit('feedpreset'); 
    });
  socket.on('getcurrentpreset', (data) => 
    { 
    var $index = presets.findIndex(x => x.id === currentpreset);
    var library = presets[$index].library;
    var title = presets[$index].title;
    var $data = {"preset":currentpreset, "title":title, "library":library};
    io.emit('feedcurrentpreset', $data); 
    });
  // change background
  socket.on("seedbackground", (url) => 
  { 
  var $index = presets.findIndex(x => x.id === currentpreset);
  presets[$index].background = url;
  UpdatePreset(presets);
  io.emit("feedbackground", url); 
  });
  // request background
  socket.on('getbackground', (data) => 
    { 
    var $index = presets.findIndex(x => x.id === currentpreset);
    var background = presets[$index].background;
    io.emit('feedbackground', background); 
    });
  // clock function
  socket.on("tick", (data) => { io.emit("tock"); });
  socket.on("volume", (data) => 
    { 
    var $index = presets.findIndex(x => x.id === data.preset);
    var $indexofitem = presets[$index].library.findIndex(x => x.id === data.name);
    presets[$index].library[$indexofitem].gain = data.gain;
    UpdatePreset(presets);
    io.emit("changevolume", data);
    });
    // change preset title
  socket.on("changetitle", (data) => 
    {  
    var $index = presets.findIndex(x => x.id === currentpreset);
    presets[$index].title = data;
    UpdatePreset(presets);
    io.emit('sendpresets', presets);
    });
  // add track to preset
  socket.on("updatepreset", (data) => 
    {  
    var $index = presets.findIndex(x => x.id === data.preset);
    presets[$index].library.push(data.track);
    UpdatePreset(presets);
    });
  // ADD NEW PRESET
  socket.on("addpreset", (data) => 
    {
    r = new Date().getTime();
    $newpreset = {"id":""+r+"", "title":"untitled", "background":"https://cdnb.artstation.com/p/assets/images/images/010/961/837/large/niclas-nettelbladt-typewriter-front.jpg?1527149102", "library":[]};
    presets.push($newpreset);
    currentpreset = ""+r+"";
    UpdatePreset(presets);
    io.emit('feedpreset');   
    });
  // DELETE PRESET
  socket.on("deletepreset", function(){
    var $index = presets.findIndex(x => x.id === currentpreset);

    var number = presets.length;
    console.log(number);
    if ( number > 1 ) 
      {
      presets.splice($index, 1);
      UpdatePreset(presets);
      currentpreset = presets[0].id;
      io.emit('feedpreset');  
      }
    else 
      {
      io.emit("lastpreset");
      }
    
  });  
  
  // pan function
  socket.on("pan", (data) => 
    { 
    console.log(data);
    var $index = presets.findIndex(x => x.id === data.preset);
    var $indexofitem = presets[$index].library.findIndex(x => x.id === data.name);
    presets[$index].library[$indexofitem].pan = data.pan;
    UpdatePreset(presets);
    io.emit("changepan", data); 
    });
  // loop function
  socket.on("seedloop", (data) => 
    { 
    var $index = presets.findIndex(x => x.id === currentpreset);
    var $indexofitem = presets[$index].library.findIndex(x => x.id === data.name);
    presets[$index].library[$indexofitem].loop = data.loop;
    console.log(presets[$index].library);
    UpdatePreset(presets);
    io.emit("feedloop", data); 
    });  
  // sync function
  socket.on("syncit", (data) => { io.emit("sync", data); });
  // add sound
  socket.on("seedsound", (data) => 
    { 
    $new = {'id':data.name, 'file':data.file, "gain":data.gain, 'pan':data.pan, 'loop':data.loop, "icon":data.icon };
    //tracks.push($new);
    var $index = presets.findIndex(x => x.id === currentpreset);
    presets[$index].library.push($new);
    UpdatePreset(presets);
    io.emit("newsound"); 
    });
    // add preset sound
    socket.on("seedpreset", (data) => 
    { 
    $new = {'id':data.name, 'file':data.file, "gain":data.gain, 'pan':data.pan, 'loop':data.loop, "icon":data.icon };
    tracks.push($new);
    console.log(tracks.length);
    
    });
    // wipe track list
    socket.on("wipetracklist", (data) => 
      { 
      console.log(tracks); 
      tracks = []; 
      console.log(tracks); 
      socket.emit("wipetracks");
      });
    // remove sound
    socket.on("removesound", (name) => 
    { 
    //var $index = tracks.findIndex(x => x.id === name);
    //tracks.splice($index, 1);
    var $index = presets.findIndex(x => x.id === currentpreset);
    var $indexofitem = presets[$index].library.findIndex(x => x.id === name);
    presets[$index].library.splice($indexofitem, 1);
    UpdatePreset(presets);
    io.emit("soundscrubbed", name); 
    });
    




});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
