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

function handleDisconnect() {
    const connection = mysql.createConnection(con);
    connection.connect(function(err) { // The server is either down
        if (err) { // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect(); // lost due to either server restart, or a
        } else { // connnection idle timeout (the wait_timeout
            throw err; // server variable configures this)
        }
    });
}


con.connect((err) => {
    if (err) throw err;
    console.log('Connection established');
});

// uncomment the below query whenever you wanna see al the users
// who played the game
/* con.query('SELECT * FROM scoreboard', (err,rows) => {
    if(err) throw err;

    console.log('Data received from Db:');
    console.log(rows);

}); */



const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "client"))); //Serving static folder to the client


server.listen(process.env.PORT || 3000, function() { // Listening on port 
    console.log(`Server is running on port ${this.address().port}.`);
});
var playerNames = {};
const connections = []; // 5 players in each game 
var playerStatus = {}; //Players score, location
var playerStatus_console = {}
var emptyValue = 0;



io.on('connection', socket => { // On user connection
    socket.on('userName', name => {
        socket.id = name;
        con.query(`INSERT INTO scoreboard (player) VALUES ('${name}')`, function(err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
        console.log(`yay!! ${name} just connected!`);
    })

    socket.on('disconnect', data => {
        handleDisconnect();
        console.log(`aww ${socket.id} just left`);
        playerStatus = {};
    })

    socket.on('player-joined', () => {
        connections.push(socket.id);
        socket.emit('player-joined-notification', { playerNumber: connections.indexOf(socket.id) })
    })

    socket.on('playerPosition', data => {
        playerStatus_console[socket.id] = (data.playerPosition);
        playerStatus[socket.id] = (data.playerPosition + "<div id='nextline'> <br>  </div>");
        console.log(playerStatus_console);
        var playerStatusString = JSON.stringify(playerStatus);

        playerStatusString = playerStatusString.replace(/[{","​​​​​}​​​​​]/g, '');
        socket.emit('scores', playerStatusString);

    })

    socket.on('playerScore', data => {
        playerStatus[socket.id] = (data.playerScore);
        console.log(playerStatus);
    })

    socket.on('gameover', data => {
        socket.broadcast.emit('gameover2', data);
    })

    socket.on('inactivity', data => {
        emptyValue = data
    })


    setInterval(() => { // Refreshing every 2 m.s.
        emptyValue++
        socket.emit('updateScores', playerStatus);
    }, 300)

});