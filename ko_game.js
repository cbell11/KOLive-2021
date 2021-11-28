var io;
var gameSocket;
var ko_id;
var wordPool = [];
var teamTotal = 0 ;
var team = [];

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('removePlayer', removePlayer);
    gameSocket.on('hostPreGame', hostPreGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('displayTeams', displayTeams);
    gameSocket.on('hostTeamsSet', hostTeamsSet);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    gameSocket.on('hostNextRound', hostNextRound);
    gameSocket.on('addPointsBtn', addPointsBtn);
    gameSocket.on('gameOver', gameOver);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerPreGame', playerPreGame);
    gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('teamDeduct', teamDeduct);
    gameSocket.on('playerRestart', playerRestart);
    gameSocket.on('playerCorrect', playerCorrect);
    gameSocket.on('playerIncorrect', playerIncorrect);



}

/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame() {
    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    // Join the Room and wait for the players
    this.join(thisGameId.toString());

    wordPool = [];
    wordPool.length = 0;

};
function removePlayer(data) {
  //this.emit('beginPreGame', data);
  console.log('Player "'+data.playerName+'" Being Removed...');
  io.sockets.in(data.gameId).emit('removePlayerName',data);
};
function hostPreGame(data) {

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client

    //this.emit('beginPreGame', data);
    io.sockets.in(data.gameId).emit('beginPreGame', data);

};
/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(data) {
    var sock = this;
    console.log(data.time);
    var data = {
        mySocketId : sock.id,
        gameId : data.gameId,
        numPlayersInRoom: data.numPlayersInRoom,
        time : data.time,
        intro: data.intro,
    };
    //console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
};
function displayTeams(data) {

    ko_id = data.ko_id;
    console.log("All Players Present. Preparing Teams...");
    console.log("Team Total: " + data.teamTotal);
    teamTotal = data.teamTotal;
    /*console.log("Team 1 p1: " + data.team1[0]);
    console.log("Team 1 p2: " + data.team1[1]);
    console.log("Team 2 p1: " + data.team2[0]);
    console.log("Team 2 p2: " + data.team2[1]);
    console.log("Team 3 p1: " + data.team3[0]);
    console.log("Team 3 p2: " + data.team3[1]);*/
    io.sockets.in(data.gameId).emit('displayPlayerTeams', data);
    populateQuestionPool(ko_id);

};

function hostTeamsSet(data) {

    console.log("All Players Present. Preparing Teams...");



    ko_id = data.ko_id;
    //io.sockets.in(data.gameId).emit('displayPlayerTeams', data);
    populateQuestionPool(ko_id);

};


/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(data) {
    console.log('Game Started with '+teamTotal+' teams.');


    //io.sockets.in(data.gameId).emit('playerGameStarted',data);

    sendWord(0,data.gameId,teamTotal,0);

    //sendWord(0,data.gameId);
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */

function hostNextRound(data) {
    if(data.round < wordPool.length ){
        // Send a new set of words back to the host and players.
        sendWord(data.round, data.gameId, teamTotal, data.team);
    } else {

        sendWord(0,data.gameId,teamTotal, data.team);
    }
}
function addPointsBtn(data) {
  io.sockets.in(data.gameId).emit('addPointsBtn', data);

}
function gameOver(data) {
        console.log('Game Over...');
        io.sockets.in(data.gameId).emit('gameOver');
};
/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}
/**
@param data
*/
function playerPreGame(data) {

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    //this.emit('beginPreGame', data);
    io.sockets.in(data.gameId).emit('beginPreGame', data);

}
/**
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function playerAnswer(data) {
    // console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
}
function teamDeduct(data) {
    // console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    io.sockets.in(data.gameId).emit('finalTeamDeduct', data);
}
function playerCorrect(data) {

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    //this.emit('beginPreGame', data);
    io.sockets.in(data.gameId).emit('playerAddPoints', data);

}
function playerIncorrect(data) {

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    //this.emit('beginPreGame', data);
    io.sockets.in(data.gameId).emit('playerWrong', data);

}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    // console.log('Player: ' + data.playerName + ' ready for new game.');

    // Emit the player's data back to the clients in the game room.
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */

/**
 * Get a word for the host, and a list of words for the player.
 *
 * @param wordPoolIndex
 * @param gameId The room identifier

 */
function sendWord(wordPoolIndex, gameId, teamTotal, teamID) {

    var data = getWordData(wordPoolIndex,teamTotal, teamID);
    console.log("Starting a new round for team "+teamID)

    /*TEST TO SEE QUESTIONS IN CONSOLE LOG

    if (teamTotal >= 3) {
      console.log('t1 q: ' + data.team[0].question);
      console.log('t1 a: ' + data.team[0].answer);

      console.log('t2 q: ' + data.team[1].question);
      console.log('t2 a: ' + data.team[1].answer);

      console.log('t3 q: ' + data.team[2].question);
      console.log('t3 a: ' + data.team[2].answer);
    }
    if (teamTotal >= 4) {
      console.log('t4 q: ' + data.team[3].question);
      console.log('t4 a: ' + data.team[3].answer);
    }
    if (teamTotal >= 5) {
      console.log('t5 q: ' + data.team[4].question);
      console.log('t5 a: ' + data.team[4].answer);
    }
    if (teamTotal >= 6) {
      console.log('t6 q: ' + data.team[5].question);
      console.log('t6 a: ' + data.team[5].answer);
    }*/
    io.sockets.in(data.gameId).emit('newWordData', data);
}

/**
 * This function does all the work of getting a new words from the pile
 * and organizing the data to be sent back to the clients.
 *
 * @param i The index of the wordPool.
 * @returns {{round: *, word: *, answer: *, list: Array}}
 * @param teamID

 */
function getWordData(i, teamTotal, teamID){
    // Randomize the order of the available words.
    // The first element in the randomized array will be displayed on the host screen.
    // The second element will be hidden in a list of decoys as the correct answer

  var wordData = {
        teamTotal : teamTotal,
        team : [],
        teamID: teamID,
    };
    var t1 = {};
    var t2 = {};
    var t3 = {};
    var t4 = {};
    var t5 = {};
    var t6 = {};
    for (var y = 0; y < 6; y++){
    //Shuffles Questions
    shuffle(wordPool);

    var question = wordPool[i].question;
    var cor_answer = wordPool[i].cor_ans;
    // Randomize the order of the decoy words and choose the first 5
    var decoys = wordPool[i].decoys;
    var roughDecoys = [];
    //var decoys = wordPool[i].decoys.slice(0,4);
    while (roughDecoys.length < 3) {
    var x = 0;
    var rnd = (Math.floor(Math.random() * wordPool.length));
        if (rnd == i) {
          rnd = Math.floor(Math.random() * wordPool.length);
          roughDecoys.push(wordPool[rnd].cor_ans[0]);
          x++;
        }
        else {
          rnd = Math.floor(Math.random() * wordPool.length);
          roughDecoys.push(wordPool[rnd].cor_ans[0]);
          x++;
        }
    if (roughDecoys.indexOf(wordPool[i].cor_ans[0]) > -1) {
      roughDecoys.pop();
      x--;
    }
    else {
      roughDecoys = remove_duplicates(roughDecoys);
    }
  }
    // Pick a random spot in the decoy list to put the correct answer
    var rnd = Math.floor(Math.random() * 4);
    roughDecoys.splice(rnd, 0, cor_answer[0]);
    decoys = remove_duplicates(roughDecoys)

    function remove_duplicates(arr) {
    var obj = {};
    var ret_arr = [];
    for (var i = 0; i < arr.length; i++) {
        obj[arr[i]] = true;
    }
    for (var key in obj) {
        ret_arr.push(key);
    }
    return ret_arr;
    }
if (y == 0) {
  t1 = {
    round: i,
    teamTotal: teamTotal,
    question : question[0],   // Displayed Question
    answer : cor_answer[0], // Correct Answer
    list : decoys      // Word list for player (decoys and answer)
  };
  //console.log('Team 1 set: Q:'+question);
}
else if (y == 1) {
  t2 = {
    round: i,
    teamTotal: teamTotal,
    question : question[0],   // Displayed Question
    answer : cor_answer[0], // Correct Answer
    list : decoys      // Word list for player (decoys and answer)
  };
  //console.log('team 2 set updated: Q:'+question);
}
else if (y == 2) {
  t3 = {
    round: i,
    teamTotal: teamTotal,
    question : question[0],   // Displayed Question
    answer : cor_answer[0], // Correct Answer
    list : decoys      // Word list for player (decoys and answer)
  };
  //console.log('team 3 set updated: Q:'+question);
}
else if (y == 3) {
  t4 = {
    round: i,
    teamTotal: teamTotal,
    question : question[0],   // Displayed Question
    answer : cor_answer[0], // Correct Answer
    list : decoys      // Word list for player (decoys and answer)
  };
  //console.log('team 4 set updated');
}
else if (y == 4) {
  t5 = {
    round: i,
    teamTotal: teamTotal,
    question : question[0],   // Displayed Question
    answer : cor_answer[0], // Correct Answer
    list : decoys      // Word list for player (decoys and answer)
  };
  //console.log('team 5 set updated');
}
else if (y == 5) {
  t6 = {
    round: i,
    teamTotal: teamTotal,
    question : question[0],   // Displayed Question
    answer : cor_answer[0], // Correct Answer
    list : decoys      // Word list for player (decoys and answer)
  };
  //console.log('team 6 set updated');
}

}

  /*  // Package the words into a single object.
    var wordData = {
        team : [{
            round: i,
            teamTotal: teamTotal,
            question : question[0],   // Displayed Question
            answer : cor_answer[0], // Correct Answer
            list : decoys      // Word list for player (decoys and answer)
          },
          {
              round: i,
              teamTotal: teamTotal,
              question : question[1],   // Displayed Question
              answer : cor_answer[1], // Correct Answer
              list : decoys      // Word list for player (decoys and answer)
            },
            {
                round: i,
                teamTotal: teamTotal,
                question : question[2],   // Displayed Question
                answer : cor_answer[2], // Correct Answer
                list : decoys      // Word list for player (decoys and answer)
              },
              {
                  round: i,
                  teamTotal: teamTotal,
                  question : question[3],   // Displayed Question
                  answer : cor_answer[3], // Correct Answer
                  list : decoys      // Word list for player (decoys and answer)
                },]
    };*/
    wordData = {
          teamTotal : teamTotal,
          teamID: teamID,
          team : [t1, t2, t3, t4, t5, t6]
      };
  return wordData;
}
/*
 * Javascript implementation of Fisher-Yates shuffle algorithm
 * http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
*/
function shuffle(sourceArray) {
    for (var i = 0; i < sourceArray.length - 1; i++) {

        var j = i + Math.floor(Math.random() * (sourceArray.length - i));

        var temp = sourceArray[j];
        sourceArray[j] = sourceArray[i];
        sourceArray[i] = temp;

    }
    return sourceArray;
}
/**
 * Each element in the array provides data for a single round in the game.
 *
 * In each round, two random "words" are chosen as the host word and the correct answer.
 * Five random "decoys" are chosen to make up the list displayed to the player.
 * The correct answer is randomly inserted into the list of chosen decoys.
 *
 * @type {Array}
 */
 //Import the mysql module


function populateQuestionPool(ko_id){
  var mysql = require('mysql');
  var express = require('express');
    /*
DB4free
    var con = mysql.createConnection({
     host: "db4free.net",
     port: "3306",
     user: "chandlerbell",
     password: "test123",
     database: "kotest",
   })
Local Host Setup
  var con = mysql.createConnection({
     host: "localhost",
     port: "3306",
     user: "root",
     password: "",
     database: "loginsystem",
   });*/
     /*Online Setup
     var con = mysql.createConnection({
      host: "127.0.0.1",
      port: "3306",
      user: "knockoy5_cbell11",
      password: "Chandler0522!",
      database: "knockoy5_WPZEL",
    })
   con.connect(function(err) {
      if (err) throw err;
      console.log("Connected to mysql!");
    });
     var sql = mysql.format("SELECT * FROM qna WHERE ko_id='"+ko_id+"'");

     con.query(sql, function (err, rows, field) {
       if (err) throw err;
       console.log(rows);
       for(var i = 0; i < rows.length; i++){
       console.log('Q'+(i+1)+': '+rows[i].qna_q+'');
       console.log('Q'+(i+1)+': '+rows[i].qna_a+'');
       wordPool.push( {
           'question': [rows[i].qna_q],
           'cor_ans': [rows[i].qna_a],
           'decoys': [],
       });
       }


     });
     con.end();
     console.log("Removed database connection...");
     */
     wordPool = [];
     wordPool.push( {
         'question': ['1+1'],
         'cor_ans': ['2'],
         'decoys': [],
     })
     wordPool.push( {
         'question': ['2+1'],
         'cor_ans': ['3'],
         'decoys': [],
     })
     wordPool.push( {
         'question': ['2+2'],
         'cor_ans': ['4'],
         'decoys': [],
     })
     wordPool.push( {
         'question': ['2+3'],
         'cor_ans': ['5'],
         'decoys': [],
     })
     wordPool.push( {
         'question': ['3+3'],
         'cor_ans': ['6'],
         'decoys': [],
     })
     wordPool.push( {
         'question': ['Capital of USA'],
         'cor_ans': ['Washington DC'],
         'decoys': [],
     })
     console.log(wordPool)

}
