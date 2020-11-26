const express = require('express'); // Express frameork 
const path = require('path');
const http = require('http');
const PORT = process.env.PORT || 3000;  
const socketio = require('socket.io'); // Socket io server
const mysql = require('mysql');
const con = mysql.createConnection({
  host: 'eu-cdbr-west-03.cleardb.net',
  user: 'b8dfc62739e617',
  password: 'e4c42126',
  database: 'heroku_489264aee16944a'
});

const connection;

function handleDisconnect() {
    connection = mysql.createConnection(con);
    connection.connect(function(err) {                // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
          console.log('error when connecting to db:', err);
          setTimeout(handleDisconnect, 2000);           // We introduce a delay before attempting to reconnect,
        }                                               // to avoid a hot loop, and to allow our node script to
      });                                               // process asynchronous requests in the meantime.
                                                        // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {   // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                        // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
        });
}


con.connect((err) => {
  if(err) throw err;
  console.log('Connection established');
});

con.query('SELECT * FROM scoreboard', (err,rows) => {
    if(err) throw err;

    console.log('Data received from Db:');
    console.log(rows);
});



const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "client"))); //Serving static folder to the client


server.listen(process.env.PORT || 3000, function(){ // Listening on port 
    console.log(`Server is running on port ${this.address().port}.`);
});
var playerNames = {};
const connections = []; // 5 players in each game 
var playerStatus = {}; //Players score, location
var playerStatus_console = {}



io.on('connection', socket => { //On user connection

    /*  var playerNumber = -1;
    for (var i in numberOfConnections) { //Iterating through the array
        if (numberOfConnections[i] == null) {
            playerNumber = i; //Setting player number to the number of the element of null
            break; //breaking the statement so it isn't repeated over and over again
        }
    }
*/
    socket.on('userName', name => {
        socket.id = name;
        con.query(`INSERT INTO scoreboard (player) VALUES ('${name}')`, function(err,result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
        console.log(`yay!! ${name} just connected!`);
    })

    socket.on('disconnect', data => {
        console.log(`aww ${socket.id} just left`);
        playerStatus = {}
        handleDisconnect();
    })

    socket.on('player-joined', () => {
        connections.push(socket.id);
        socket.emit('player-joined-notification', { playerNumber: connections.indexOf(socket.id) })
    })

    socket.on('playerPosition', data => {
        playerStatus_console[socket.id] = (data.playerPosition);
        playerStatus[socket.id] = (data.playerPosition + "<div id='headerpicture'></div>");
        console.log(playerStatus_console);
        var myJSON = JSON.stringify(playerStatus_console);
        
        myJSON = myJSON.replace(/[{","​​​​​}​​​​​]/g, '');
        // console.log(myJSON);
        socket.emit('scores', myJSON);

    })

    socket.on('playerScore', data => {
        playerStatus[socket.id] = (data.playerScore);
        console.log(playerStatus);
    })


    // TODO: setInterval function 


    //socket.emit('totalscore', playerStatus.score); 
    socket.on('gameover', data => {
        socket.broadcast.emit('gameover2', data);
    })

    setInterval(() => { // Refreshing wvery 2 milliseconds 
        socket.emit('updateScores', playerStatus);
    }, 300)

    /*
    socket.emit('player-number', playerNumber); //Telling the user what player they are
    console.log(`Player ${playerNumber} has joined`);

    connections[playerNumber] = false;

    */

    //Ignoring additional players 

    // if (playerNumber == 6) {
    //     return;
    // }

});