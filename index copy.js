const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


var tracks = [
  {'id':'cathedral', 'class':'diegetic', 'name':'Cathedral Ambience', 'file':'cathedral.mp3', 'column':'columnone', 'position':1 },
  {'id':'farewell', 'class':'diegetic', 'name':'Farewell to a Friend', 'file':'farewelltoafriend.mp3', 'column':'columnone', 'position':2 },
  {'id':'theglory', 'class':'diegetic', 'name':'The Glory', 'file':'theglory.mp3', 'column':'columnone', 'position':3 },
  {'id':'darkcello', 'class':'diegetic', 'name':'Dark Cello One', 'file':'cellofear01.mp3', 'column':'columnone', 'position':4 },
  ];

  
io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
