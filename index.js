const PORT = process.env.PORT || 3000;
var formidable = require('formidable');
const fs = require('fs');

const express = require("express");

const server = express()
    .use(express.static("public"))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

  const io = require('socket.io')(server);

  setInterval(() => io.emit('time', new Date().toTimeString()), 1000);




var rooms = [];
var allClients = [];
var library = [];
var tracks = [];
var backgrounds = [];

fs.readFile('library.json', (err, data) => {
  if (err) throw err;
  library = JSON.parse(data);
});

fs.readFile('backgrounds.json', (err, data) => {
  if (err) throw err;
  backgrounds = JSON.parse(data);
});

fs.readFile('rooms.json', (err, data) => {
  if (err) throw err;
  rooms = JSON.parse(data);
});


function UpdateRooms(array) {

  console.log("Writing to file...");
  fs.writeFile("rooms.json", JSON.stringify(array, null, 4), (err) => {
    if (err) {  console.error(err);  return; };
});

}

function UpdateBackgrounds() {

  console.log("Writing to file...");
  fs.writeFile("backgrounds.json", JSON.stringify(backgrounds, null, 4), (err) => {
    if (err) {  console.error(err);  return; };
});

}

function MovePlayerIntoRoom(id, name, room) {

  console.log("Moving player "+id+" to room "+room);

  var $array = [];

  $player = {"id":id, "name":name};

  rooms.forEach(function(value, index){
    if ( value.id === room ) 
      {  
      value.players.push($player);
      $array = value.players;
      }
  
  UpdateRooms(rooms);

  console.log(allClients);
  
  io.in(room).emit("updateplayers", $array);

  });

  

}



function RemovePlayerFromRoom(id, room) {

  if ( room != "lobby" )
    {
    console.log("Removing player "+id+" from room "+room);
    var $roomindex = rooms.findIndex(x => x.id === room);
    var $indexofplayer = rooms[$roomindex].players.findIndex(x => x.id === id);

    rooms[$roomindex].players.splice($indexofplayer, 1);

    UpdateRooms(rooms);

    io.in(room).emit('updateplayers', rooms[$roomindex].players);
    
    }

}


function RemovePlayerFromLobby(socketid)
  {
    console.log("Removing client from the lobby");    
    var $socketindex = allClients.findIndex(x => x.id === socketid);
    allClients.splice($socketindex, 1);
    console.log(allClients);

  }



  function GetRoom(socketid)
    {
    var $socketindex = allClients.findIndex(x => x.id === socketid);
    var $theroom = allClients[$socketindex].room;
    return $theroom;
    }







io.on('connection', (socket) => {
  
  console.log(socket.id+ " is now connected.");
  $newplayer = {"id":socket.id, "room":"lobby"};
  allClients.push($newplayer);
  console.log("Online we have:");
  console.log(allClients);

  // DISCONNECT SEQUENCE

  socket.on('disconnect', function() {
    console.log(socket.id + ' has hung up.');
    
    var $room = GetRoom(socket.id);
    console.log($room);
    RemovePlayerFromRoom(socket.id, $room);
    RemovePlayerFromLobby(socket.id);


    });


  // GM CHECK ROOM FOR LOGIN
  socket.on("checkroom", (data) => 
      { 
      rooms.forEach(myFunction);
        
        function myFunction(value, index, array) {
              if ( value.id == data ) 
                {  
                $data = {'room':value.id, 'index':index};
                io.to(socket.id).emit("unlockroom", $data);
                }
            }
         
      });

      // REGISTER WITH ROOM
      socket.on('register', (room) => 
      {
      console.log("Registering "+socket.id);
      socket.join(room);

      allClients.forEach(function(item, index){
        if ( item.id === socket.id ) 
          { 
          item.room = room; 
          MovePlayerIntoRoom(item.id, "GM", item.room);  
          }
      });

      io.to(socket.id).emit('welcome');
      var $roomindex = rooms.findIndex(x => x.id === room);

      setTimeout(function(){
        io.in(room).emit('updateplayers',rooms[$roomindex].players); 
      }, 3000);

      


      });


       // PLAYER REGISTER WITH ROOM
       socket.on('playerregister', (data) => 
       {
       console.log("Registering "+socket.id);
       socket.join(data.room);
 
       allClients.forEach(function(item, index){
         if ( item.id === socket.id ) 
           { 
           item.room = data.room; 
           item.name = data.name;
           MovePlayerIntoRoom(item.id, item.name, item.room);  
           }
       });
 
       io.to(socket.id).emit('welcome');
       var $roomindex = rooms.findIndex(x => x.id === data.room);
 
       setTimeout(function(){
         io.in(data.room).emit('updateplayers',rooms[$roomindex].players); 
       }, 3000);
 
       
 
 
       });




  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  setInterval(() => socket.emit('time', new Date().getTime()), 1000);

  socket.on('gettracks', (room) => { io.in(room).emit('sendtracks', tracks); });
  socket.on('getlibrary', (room) => 
    { 
    console.log("Request received for library for room "+room);
    io.in(room).emit('sendlibrary', library); 
    });
  
    // GET BACKGROUND IMAGES

    socket.on('getbackgrounds', (room) => 
    { 
    //var $index = rooms.findIndex(x => x.id === room);
    //var $backgrounds = rooms[$index].backgrounds;
    io.in(room).emit('feedbackgrounds', backgrounds); 
    });

    // GET PRESETS
  
    socket.on('getpresets', (room) => 
      { 
      var $index = rooms.findIndex(x => x.id === room);
      var $presets = rooms[$index].presets;
      io.in(room).emit('sendpresets', $presets); 
      });
  
    // CHANGE PRESET
  
    socket.on('changepreset', (data) => 
      { 
      console.log("changing preset");
      console.log(data);
      var $index = rooms.findIndex(x => x.id === data.room);
      var $currentpreset = rooms[$index].currentpreset;
      
      rooms[$index].currentpreset = data.preset;
      
      UpdateRooms(rooms);
      io.in(data.room).emit('feedpreset'); 
      });
  socket.on('getcurrentpreset', (room) => 
    { 
    var $index = rooms.findIndex(x => x.id === room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;
    console.log($currentpreset);
    var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);

    var library = $presets[$indexofcurrentpreset].library;
    var title = $presets[$indexofcurrentpreset].title;
    var $data = {"preset":$currentpreset, "title":title, "library":library};
    io.to(socket.id).emit('feedcurrentpreset', $data); 
    });

    socket.on('getcurrentpresetstart', (room) => 
    { 
    var $index = rooms.findIndex(x => x.id === room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;
    console.log($currentpreset);
    var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);

    var library = $presets[$indexofcurrentpreset].library;
    var title = $presets[$indexofcurrentpreset].title;
    var $data = {"preset":$currentpreset, "title":title, "library":library};
    io.to(socket.id).emit('feedcurrentpresetstart', $data); 
    });

  // change background
  socket.on("seedbackground", (data) => 
  { 
  var $index = rooms.findIndex(x => x.id === data.room);
  var $presets = rooms[$index].presets;
  var $currentpreset = rooms[$index].currentpreset;
  var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);

  $presets[$indexofcurrentpreset].background = data.url;
  
  UpdateRooms(rooms);

  io.in(data.room).emit("feedbackground", data.url); 

  });
  // create/upload/download background
  socket.on("downloadbackground", (data) => 
  { 
  
    r = new Date().getTime();
    var $new = { "id": r, "filename": data.url };
    backgrounds.push($new);

    UpdateBackgrounds();

    io.in(data.room).emit('feedbackgrounds', backgrounds); 


    var $index = rooms.findIndex(x => x.id === data.room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;
    var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);

    $presets[$indexofcurrentpreset].background = data.url;
  
    UpdateRooms(rooms);

    io.in(data.room).emit("feedbackground", data.url); 

  });
  // request background
  socket.on('getbackground', (room) => 
    { 
    var $index = rooms.findIndex(x => x.id === room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;
    var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);
    
    var background = $presets[$indexofcurrentpreset].background;
    io.in(room).emit('feedbackground', background); 
    });
  socket.on("volume", (data) => 
    { 
    var $index = rooms.findIndex(x => x.id === data.room);
    var $presets = rooms[$index].presets;
    var $indexofpreset = $presets.findIndex(x => x.id === data.preset);
    var $indexofitem = $presets[$indexofpreset].library.findIndex(x => x.id === data.id);

    $presets[$indexofpreset].library[$indexofitem].gain = data.gain;

    UpdateRooms(rooms);
    io.in(data.room).emit("changevolume", data);
    });
    // change preset title
  socket.on("changetitle", (data) => 
    {  
    var $index = rooms.findIndex(x => x.id === data.room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;
    var $targetindex = $presets.findIndex(x => x.id === $currentpreset);
    
    $presets[$targetindex].title = data.title;

    UpdateRooms(rooms);
    io.in(data.room).emit('sendpresets', $presets);
    });
  // add track to preset
  socket.on("updatepreset", (data) => 
    {  
    var $index = rooms.findIndex(x => x.id === data.room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;
    var $indexofpreset = $presets.findIndex(x => x.id === data.preset);
      
    $presets[$indexofpreset].library.push(data.track);
    UpdateRooms(rooms);
    });
  // ADD NEW PRESET
  socket.on("addpreset", (room) => 
    {
    r = new Date().getTime();
    $newpreset = {"id":""+r+"", "title":"untitled", "background":"https://jooinn.com/images/blank-canvas-texture-2.jpg", "library":[]};
    
    var $index = rooms.findIndex(x => x.id === room);
    var $presets = rooms[$index].presets;
    
    $presets.push($newpreset);
    rooms[$index].currentpreset = ""+r+"";
    
    UpdateRooms(rooms);
    io.in(room).emit('feedpreset');   
    });
  // DELETE PRESET
  socket.on("deletepreset", function(room){

    var $index = rooms.findIndex(x => x.id === room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;

    var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);

    var number = $presets.length;
    if ( number > 1 ) 
      {
        
      $presets.splice($indexofcurrentpreset, 1);
      rooms[$index].currentpreset = $presets[0].id;
      UpdateRooms(rooms);

      io.in(room).emit('feedpreset');  
      }
    else 
      {
      io.in(room).emit("lastpreset");
      }
    
  });  
  
  // pan function
  socket.on("pan", (data) => 
    { 
    var $index = rooms.findIndex(x => x.id === data.room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;

    var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);

    var $indexofitem = $presets[$indexofcurrentpreset].library.findIndex(x => x.id === data.id);
    
    $presets[$indexofcurrentpreset].library[$indexofitem].pan = data.pan;

    UpdateRooms(rooms);
    io.in(data.room).emit("changepan", data); 
    });
  // loop function
  socket.on("seedloop", (data) => 
    { 
    var $index = rooms.findIndex(x => x.id === data.room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;
    var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);
    var $indexofitem = $presets[$indexofcurrentpreset].library.findIndex(x => x.id === data.id);
    
    $presets[$indexofcurrentpreset].library[$indexofitem].loop = data.loop;

    UpdateRooms(rooms);
    io.in(data.room).emit("feedloop", data); 
    });  
  // sync function
  socket.on("syncit", (data) => { io.in(data.room).emit("sync", data); });
  // add sound
  socket.on("seedsound", (data) => 
    { 
    $new = {'id':data.id, 'name':data.name, 'file':data.file, "gain":data.gain, 'pan':data.pan, 'loop':data.loop };
    io.in(data.room).emit("newsound", data); 
    });
    // add preset sound
    socket.on("seedpreset", (data) => 
    { 
    $new = {'id':data.id, 'name':data.name, 'file':data.file, "gain":data.gain, 'pan':data.pan, 'loop':data.loop, "icon":data.icon };
    tracks.push($new);
    
    });
    //unpause function
    socket.on("unpausesound", (data) => { io.in(data.room).emit("feedunpause", data); });
    //pause function
    socket.on("pausesound", (data) => { io.in(data.room).emit("feedpause", data); });

    // wipe track list
    socket.on("wipetracklist", (room) => 
      { 
      tracks = []; 
      io.in(room).emit("wipetracks");
      });
    // remove sound
    socket.on("removesound", (data) => 
    { 
    //var $index = tracks.findIndex(x => x.id === name);
    //tracks.splice($index, 1);

    var $index = rooms.findIndex(x => x.id === data.room);
    var $presets = rooms[$index].presets;
    var $currentpreset = rooms[$index].currentpreset;
    var $indexofcurrentpreset = $presets.findIndex(x => x.id === $currentpreset);
    var $indexofitem = $presets[$indexofcurrentpreset].library.findIndex(x => x.id === data.id);

    $presets[$indexofcurrentpreset].library.splice($indexofitem, 1);

    UpdateRooms(rooms);
    io.in(data.room).emit("soundscrubbed", data.id); 
    });
    




});

