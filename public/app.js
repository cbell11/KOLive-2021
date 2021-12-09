jQuery(function($) {
  'use strict';


  /**
   * All the code relevant to Socket.IO is collected in the IO namespace.
   *
   * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
   */
  var IO = {

    /**
     * This is called when the page is displayed. It connects the Socket.IO client
     * to the Socket.IO server
     */
    init: function() {
      IO.socket = io.connect();
      //IO.socket = io.connect('https://kolive.herokuapp.com', {'force new connection': false , 'reconnection': true,'reconnectionDelay': 500,'reconnectionAttempts': 10});

      IO.bindEvents();
    },

    /**
     * While connected, Socket.IO will listen to the following events emitted
     * by the Socket.IO server, then run the appropriate function.
     */
    bindEvents: function() {
      IO.socket.on('connected', IO.onConnected);
      IO.socket.on('newGameCreated', IO.onNewGameCreated);
      IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);
      IO.socket.on('removePlayerName', IO.removePlayerName);
      IO.socket.on('beginPreGame', IO.beginPreGame);
      IO.socket.on('displayPlayerTeams', IO.displayTeams);
      //  IO.socket.on('onTeamsCreated', IO.onTeamsCreated);
      IO.socket.on('beginNewGame', IO.beginNewGame);
      IO.socket.on('playerGameStarted', IO.playerNewGame);
      IO.socket.on('newWordData', IO.onNewWordData);
      IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
      IO.socket.on('finalTeamDeduct', IO.finalTeamDeduct);
      IO.socket.on('playerAddPoints', IO.playerAddPoints);
      IO.socket.on('playerWrong', IO.playerWrong);

      //IO.socket.on('gameOver', IO.addPointsBtn);
      IO.socket.on('gameOver', IO.gameOver);
      IO.socket.on('error', IO.error);
    },

    /**
     * The client is successfully connected!
     @param data
     */
    onConnected: function(data) {
      // Cache a copy of the client's socket.IO session ID on the App
      App.mySocketId = IO.socket.socket.sessionid;

      if (window.location.href.indexOf("GoLive") > -1) {
        App.Host.gameInit(data);
        //Check URL for Questions and Answers
        const queryString = window.location.search;
        var gameString = "test";
        var specificQ = "test";
        var specificA = "test";

        //Take the imploded PHP string and Decode it
        var query1 = decodeURI(queryString);

        //Turn the string into an array
        query1 = query1.split('~');
        query1.shift();

       var setUpData = {
          gameString: query1,
          specificQ: query1[0],
          specificA: query1[1],

        }

        IO.socket.emit('hostCreateNewGame', setUpData);
      } else {
        App.$gameArea.html(App.$templateJoinGame);
      }
      //App.Host.gameInit(data);
      //IO.socket.emit('hostCreateNewGame');


      // console.log(data.message);*/
      function getQueryVariable(variable) {
      var query = window.location.search.substring(1);
      var vars = query.split('&');
      for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split('aParam');
          if (decodeURIComponent(pair[0]) == variable) {
              return decodeURIComponent(pair[1]);
          }
        }
        console.log('Query variable %s not found', variable);
  }
      },

    /**
     * A new game has been created and a random game ID has been generated.
     * @param data {{ gameId: int, mySocketId: * }}
     */
    onNewGameCreated: function(data) {
      App.Host.gameInit(data);
    },

    /**
     * A player has successfully joined the game.
     * @param data {{playerName: string, gameId: int, mySocketId: int}}
     */
    playerJoinedRoom: function(data) {
      // When a player joins a room, do the updateWaitingScreen funciton.
      // There are two versions of this function: one for the 'host' and
      // another for the 'player'.
      //
      // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
      // And on the player's browser, App.Player.updateWaitingScreen is called.
      App[App.myRole].updateWaitingScreen(data);
    },
    removePlayerName: function(data) {
      // When a player joins a room, do the updateWaitingScreen funciton.
      // There are two versions of this function: one for the 'host' and
      // another for the 'player'.
      //
      // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
      // And on the player's browser, App.Player.updateWaitingScreen is called.
      App[App.myRole].removePlayerName(data);
    },
    /**
     * Both players have joined the game.
     * @param data
     */
    beginPreGame: function(data) {
      App[App.myRole].createTeams(data);
      /*if (App.myRole === 'Host') {
        App.Host.createTeams(data);
      } else if (App.myRole === 'Player') {
        App.Player.createTeams(data);
      }*/

    },
    displayTeams: function(data) {
      if (App.myRole === 'Host') {
        App.Host.displayTeams(data);
      } else if (App.myRole === 'Player') {
        App.Player.displayTeams(data);
      }

    },


    /**
     * Both players have joined the game.
     * @param data
     */
    beginNewGame: function(data) {
      if (App.myRole === 'Host') {
        App.Host.gameCountdown(data);
      }
      if (App.myRole === 'Player') {
        App.Player.gameCountdown(data);
      }
    },

    /**
     * A new set of words for the round is returned from the server.
     * @param data
     */
    onNewWordData: function(data) {

      // Update the current round
      App.teamTotal = data.teamTotal;

      if(data.teamID == 0){
        App[App.myRole].startWord(data);
      }
      else{
        // Change the word for the Host and Player
        App[App.myRole].newWord(data);

      }

    },

    /**
     * A player answered. If this is the host, check the answer.
     * @param data
     */
    hostCheckAnswer: function(data) {
      //App.Player.checkAnswer(data);
      if (App.myRole === 'Host') {
        App.Host.checkAnswer(data);
      }


    },
    finalTeamDeduct: function(data) {
      App[App.myRole].teamDeduct(data);
    },

    playerAddPoints: function(data) {
      App[App.myRole].addPoints(data);
    },
    playerWrong: function(data) {
      App.Player.playerWrong(data);
    },

    /**
     * Let everyone know the game has ended.
     * @param data
     */
    gameOver: function() {
      App[App.myRole].endGame();
    },

    /**
     * An error has occurred.
     * @param data
     */
    error: function(data) {
      alert(data.message);
    }

  };

  var App = {

    /**
     * Keep track of the gameId, which is identical to the ID
     * of the Socket.IO Room used for the players and host to communicate
     *
     */
    gameId: 0,

    ko_id: 0,

    /**
     * This is used to differentiate between 'Host' and 'Player' browsers.
     */
    myRole: '', // 'Player' or 'Host'

    /**
     * The Socket.IO socket object identifier. This is unique for
     * each player and host. It is generated when the browser initially
     * connects to the server when the page loads for the first time.
     */
    mySocketId: '',


    /**
     * Identifies the current round. Starts at 0 because it corresponds
     * to the array of word data stored on the server.
     */
    currentRound: 0,

    teamTotal: 0,

    /*Teams*/
    team1: [],
    team2: [],
    team3: [],
    team4: [],
    team5: [],
    team6: [],

    /* *************************************
     *                Setup                *
     * *********************************** */

    /**
     * This runs when the page initially loads.
     */
    init: function() {
      App.cacheElements();
      App.showInitScreen();
      App.bindEvents();

      // Initialize the fastclick library
      FastClick.attach(document.body);
    },

    /**
     * Create references to on-screen elements used throughout the game.
     */
    cacheElements: function() {
      App.$doc = $(document);

      // Templates
      App.$gameArea = $('#gameArea');
      App.$templateIntroScreen = $('#intro-screen-template').html();
      App.$templateNewGame = $('#create-game-template').html();
      //App.$templateNewGame = $('#player1-game-template').html();

      App.$templateHostPreGame = $('#host-pre-game-template').html();
      App.$templatePlayerPreGame = $('#player-pre-game-template').html();
      App.$templateStartGame = $('#start-game-template').html();
      App.$templateJoinGame = $('#join-game-template').html();
      App.$hostGame = $('#host-game-template').html();
      App.$player1Game = $('#player1-game-template').html();
      App.$player2Game = $('#player2-game-template').html();
      App.$player3Game = $('#player3-game-template').html();
      App.$player4Game = $('#player4-game-template').html();
      App.$player5Game = $('#player5-game-template').html();
      App.$player6Game = $('#player6-game-template').html();
      App.$playerWrongTemplate = $('#wrong-answer-template').html();
      App.$playerTeamSelect = $('#player-team-select-template').html();
    },

    /**
     * Create some click handlers for the various buttons that appear on-screen.
     */
    bindEvents: function() {
      // Host
      App.$doc.on('click', '#removePlayer', App.Host.removePlayer);
      App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
      App.$doc.on('click', '#teamsBtn', App.Host.teamsCreateClick);
      App.$doc.on('click', '#shuffleBtn', App.Host.teamsCreateClick);
      App.$doc.on('click', '#btnBeginGame', App.Host.gameStartClick);
      App.$doc.on('click', '#btnHostRestart', App.Host.teamsCreateClick);






      // Player
      App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
      App.$doc.on('click', '#btnStart', App.Player.onPlayerStartClick);
      App.$doc.on('click', '.btnAnswer', App.Player.onPlayerAnswerClick);
      App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
      App.$doc.on('click', '.deductTeamBtn', App.Player.onDeductTeamBtn);

    },

    /* *************************************
     *             Game Logic              *
     * *********************************** */

    /**
     * Show the initial Anagrammatix Title Screen
     * (with Start and Join buttons)
     */
    showInitScreen: function() {
      App.$gameArea.html(App.$templateIntroScreen);
      // Title Size
      //  App.doTextFit('.title');
    },
    isInTeam: function(playerName) {
      if (App.team1.includes(playerName)) {
        return 1;
      } else if (App.team2.includes(playerName)) {
        return 2;
      } else {
        return 'ERROR';
      }
    },


    /* *******************************
     *         HOST CODE           *
     ******************************* */
    Host: {

      /**
       * Contains references to player data
       */
      players: [],

      /**
       * Flag to indicate if a new game is starting.
       * This is used after the first game ends, and players initiate a new game
       * without refreshing the browser windows.
       */
      isNewGame: false,

      /**
       * Keep track of the number of players that have joined the game.
       */
      numPlayersInRoom: 0,

      /**
       * A reference to the correct answer for the current round.
       */
      t1currentCorrectAnswer: '',
      t2currentCorrectAnswer: '',
      t3currentCorrectAnswer: '',
      t4currentCorrectAnswer: '',
      t5currentCorrectAnswer: '',
      t6currentCorrectAnswer: '',




      /**
       * Handler for the "Start" button on the Title Screen.
       */
       removePlayer: function() {
         // console.log('Clicked "Create A Game"');
         var $s = $(this); // the tapped button
         //var playerName = $s.val(); // The tapped word*/
         var playerName = $($s).text();

         // Send the player info and tapped word to the server so
         // the host can check the answer.
         var data = {
           gameId: App.gameId,
           playerId: App.mySocketId,
           playerName: playerName,
         }
         IO.socket.emit('removePlayer',data);
       },
      onCreateClick: function() {
        // console.log('Clicked "Create A Game"');
        IO.socket.emit('hostCreateNewGame');
      },
      teamsCreateClick: function() {
        // console.log('Clicked "Create A Game"');
        //App.$gameArea.html(App.$templateHostPreGame);
        IO.socket.emit('hostPreGame', App.Host.players);
      },
      gameStartClick: function() {
        //WORKING HERE
        //Find out which radio button is checked
        var time = 0;
        if (document.getElementById('switch_3_left').checked) {
          //10 Min radio button is checked
          time = 10;
        } else if (document.getElementById('switch_3_right').checked) {
          time = 3;
        } else {
          time = 5;

        }
        var data = {
          gameId: App.gameId,
          time: time,
          teamTotal: App.teamTotal,
          numPlayersInRoom: App.numPlayersInRoom,
          intro: true,
        }
        IO.socket.emit('hostRoomFull', data);
      },
      onHostRestart: function(data) {
        function getParam(name) {
          name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
          var regexS = "[\\?&]" + name + "=([^&#]*)";
          var regex = new RegExp(regexS);
          var results = regex.exec(window.location.href);
          if (results == null)
            return "";
          else
            return results[1];
        }

        var ko_id = getParam('GoLive');
        var data = {
          gameId: App.gameId,
          playerId: App.mySocketId,
          round: App.currentRound,
          teamTotal: App.teamTotal,
          team1: App.team1,
          team2: App.team2,
          team3: App.team3,
          team4: App.team4,
          team5: App.team5,
          team6: App.team6,
          ko_id: ko_id
        }
        App.currentRound = 0;
        IO.socket.emit('displayPlayerTeams', data);
      },

      /**
       * The Host screen is displayed for the first time.
       * @param data{{ gameId: int, mySocketId: * }}
       */
      gameInit: function(data) {

        App.gameId = data.gameId;
        App.mySocketId = data.mySocketId;
        App.team1 = data.team1;
        App.myRole = 'Host';
        App.Host.numPlayersInRoom = 0;
        App.Host.displayNewGameScreen();
        // console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
      },

      /**
       * Show the Host screen containing the game URL and unique game ID
       */
      displayNewGameScreen: function() {
        // Fill the game screen with the appropriate HTML
        App.$gameArea.html(App.$templateNewGame);

        // Display the URL on screen
        //$('#gameURL').text('kolive.herokuapp.com');
        $('#gameURL').text('bit.do/ko-live');
        //Analyitcs for this can be found at http://bit.do/ko-live-
        // GAME QR CODE - http://chart.apis.google.com/chart?cht=qr&chs=500x500&choe=UTF-8&chld=H%7C0&chl=http://bit.do/ko-live


        // Show the gameId / room id on screen
        $('#spanNewGameCode').text(App.gameId);


      },

      /**
       * Update the Host screen when the first player joins
       * @param data{{playerName: string}}
       */
      updateWaitingScreen: function(data) {
        // If this is a restarted game, show the screen.
        if (App.Host.isNewGame) {
          App.Host.displayNewGameScreen();
        }
        // Store the new player's data on the Host.
        App.Host.players.push(data);

        // Increment the number of players in the room
        App.Host.numPlayersInRoom += 1;

        //Handles the players into columns
        if (App.Host.numPlayersInRoom < 5) {
          $("#playersWaiting1").append('<li id = "remove'+data.playerName+'" data-filtertext="' + data.playerName + '"><span id = "removePlayer" value = "'+ data.playerName +'">' + data.playerName + '</span></li>');
        }
        else if (App.Host.numPlayersInRoom < 10) {
          $("#playersWaiting2").append('<li id = "remove'+data.playerName+'" data-filtertext="' + data.playerName + '"><span id = "removePlayer" value = "'+ data.playerName +'">' + data.playerName + '</span></li>');
        }
        else if (App.Host.numPlayersInRoom < 15) {
          $("#playersWaiting3").append('<li id = "remove'+data.playerName+'" data-filtertext="' + data.playerName + '"><span id = "removePlayer" value = "'+ data.playerName +'">' + data.playerName + '</span></li>');
        }
        else if (App.Host.numPlayersInRoom < 20) {
          $("#playersWaiting4").append('<li id = "remove'+data.playerName+'" data-filtertext="' + data.playerName + '"><span id = "removePlayer" value = "'+ data.playerName +'">' + data.playerName + '</span></li>');
        }
        else if (App.Host.numPlayersInRoom < 25) {
          $("#playersWaiting5").append('<li id = "remove'+data.playerName+'" data-filtertext="' + data.playerName + '"><span id = "removePlayer" value = "'+ data.playerName +'">' + data.playerName + '</span></li>');
        }
        else {
          $("#playersWaiting6").append('<li id = "remove'+data.playerName+'" data-filtertext="' + data.playerName + '"><span id = "removePlayer" value = "'+ data.playerName +'">' + data.playerName + '</span></li>');
        }

        //Creates a minimum for the amount of players required
        if (App.Host.numPlayersInRoom < 4) {
          var playersNeeded = 4 - (App.Host.numPlayersInRoom);
          $("#createGameContainer").html("<button id = 'preTeamsBtn' class = 'btn btn-primary' value = 'createGame' disabled><p style='margin-top: -8px;'>Waiting on +" + playersNeeded + " players</p></button>");
        } else {
          var currentPlayers = App.Host.numPlayersInRoom;
          $("#createGameContainer").append("<button id = 'teamsBtn' class = 'btn btn-primary' value = 'createGame'><p style='margin-top: -8px;'>Start game with " + currentPlayers + " players</p></button>");
        }

      },
      removePlayerName: function(data) {
        $('#remove'+data.playerName+'').remove();
        for (var i = 0; i < App.Host.players.length; i++) {
            var obj = App.Host.players[i];
            if (App.Host.players[i].playerName == data.playerName) {
                App.Host.players.splice(i, 1);
            }
        }

        App.Host.numPlayersInRoom -= 1;
        if (App.Host.numPlayersInRoom < 4) {
          var playersNeeded = 4 - (App.Host.numPlayersInRoom);
          $("#createGameContainer").html("<button id = 'preTeamsBtn' class = 'btn btn-primary' value = 'createGame' disabled><p style='margin-top: -8px;'>Waiting on +" + playersNeeded + " players</p></button>");
        } else {
          var currentPlayers = App.Host.numPlayersInRoom;
          $("#createGameContainer").append("<button id = 'teamsBtn' class = 'btn btn-primary' value = 'createGame'><p style='margin-top: -8px;'>Start game with " + currentPlayers + " players</p></button>");
        }




      },
      createTeams: function(data) {
        // If this is a restarted game, show the screen.
        if (App.Host.isNewGame) {
          App.Host.displayNewGameScreen();
        }
        if (App.myRole === 'Host') {

          // Update host screen
          //$('#playersWaiting')
          //    .append('<li>')
          //    .text(data.playerName);
          //$("#teamsTable").append('<div class="col-sm-4"><h3>Team 1</h3><p>' + data.playerName[0] + '</p></div>');
          //$("#teamsTable").append('<li data-filtertext="'+data.playerName+'"><p>'+data.playerName+'</p></li>');

          //Create Teams
          var n = App.Host.numPlayersInRoom;
          var arrayLength = App.Host.players.length;
          var randomNames = [];

          for (var i = 0; i < arrayLength; i++) {
            randomNames[i] = App.Host.players[i].playerName;
          }
          n = randomNames.length;
          shuffle(randomNames);

          function shuffle(arra1) {
            var ctr = arra1.length,
              temp, index;

            // While there are elements in the array
            while (ctr > 0) {
              // Pick a random index
              index = Math.floor(Math.random() * ctr);
              // Decrease ctr by 1
              ctr--;
              // And swap the last element with it
              temp = arra1[ctr];
              arra1[ctr] = arra1[index];
              arra1[index] = temp;
            }
            return arra1;
          }

          //Team Switch Statement
          switch (n) {
            case (n = 4):
              /*
              TEST TEAMS WITH 4

            */
              App.team1 = randomNames.slice(0, 2);
              App.team2 = randomNames.slice(2, 4);
              App.teamTotal = 2;

              /*
              App.team1 = randomNames.slice(0, 1);
              App.team2 = randomNames.slice(1, 2);
              App.team3 = randomNames.slice(2, 3);
              App.team4 = randomNames.slice(3, 4);
              App.teamTotal = 4;*/
              break;
            case (n = 5):
              /*App.team1 = randomNames.slice(0, 3);
              App.team2 = randomNames.slice(3, 5);
              App.teamTotal = 2;*/
              App.team1 = randomNames.slice(0, 1);
              App.team2 = randomNames.slice(1, 2);
              App.team3 = randomNames.slice(2, 3);
              App.team4 = randomNames.slice(3, 4);
              App.team5 = randomNames.slice(4, 5);
              App.teamTotal = 5;
              break;
            case (n = 6):
              App.team1 = randomNames.slice(0, 2);
              App.team2 = randomNames.slice(2, 4);
              App.team3 = randomNames.slice(4, 7);
              App.teamTotal = 3;
              break;
            case (n = 7):
              App.team1 = randomNames.slice(0, 3);
              App.team2 = randomNames.slice(3, 5);
              App.team3 = randomNames.slice(5, 8);
              App.teamTotal = 3;
              break;
            case (n = 8):
              App.team1 = randomNames.slice(0, 3);
              App.team2 = randomNames.slice(3, 6);
              App.team3 = randomNames.slice(6, 9);
              App.teamTotal = 3;
              break;
            case (n = 9):
              App.team1 = randomNames.slice(0, 3);
              App.team2 = randomNames.slice(3, 6);
              App.team3 = randomNames.slice(6, 10);
              App.teamTotal = 3;
              break;
            case (n = 10):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 7);
              App.team3 = randomNames.slice(7, 11);
              App.teamTotal = 3;
              break;
            case (n = 11):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 11);
              App.teamTotal = 3;
              break;
            case (n = 12):
              App.team1 = randomNames.slice(0, 3);
              App.team2 = randomNames.slice(3, 6);
              App.team3 = randomNames.slice(6, 9);
              App.team4 = randomNames.slice(9, 13);
              App.teamTotal = 4;
              break;
            case (n = 13):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 7);
              App.team3 = randomNames.slice(7, 10);
              App.team4 = randomNames.slice(10, 14);
              App.teamTotal = 4;
              break;
            case (n = 14):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 11);
              App.team4 = randomNames.slice(11, 15);
              App.teamTotal = 4;
              break;
            case (n = 15):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 16);
              App.teamTotal = 4;
              break;
            case (n = 16):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 17);
              App.teamTotal = 4;
              break;
            case (n = 17):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 11);
              App.team4 = randomNames.slice(11, 14);
              App.team5 = randomNames.slice(14, 18);
              App.teamTotal = 5;
              break;
            case (n = 18):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 15);
              App.team5 = randomNames.slice(15, 19);
              App.teamTotal = 5;
              break;
            case (n = 19):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 16);
              App.team5 = randomNames.slice(16, 20);
              App.teamTotal = 5;
              break;
            case (n = 20):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 16);
              App.team5 = randomNames.slice(16, 21);
              App.teamTotal = 5;
              break;
              //ADD App.team 6 and RECONFIG?
            case (n = 21):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 15);
              App.team5 = randomNames.slice(15, 18);
              App.team6 = randomNames.slice(18, 22);
              App.teamTotal = 6;
              break;
            case (n = 22):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 16);
              App.team5 = randomNames.slice(16, 19);
              App.team6 = randomNames.slice(19, 23);
              App.teamTotal = 6;
              break;
            case (n = 23):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 16);
              App.team5 = randomNames.slice(16, 20);
              App.team6 = randomNames.slice(20, 24);
              App.teamTotal = 6;
              break;
            case (n = 24):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 16);
              App.team5 = randomNames.slice(16, 20);
              App.team6 = randomNames.slice(20, 25);
              App.teamTotal = 6;
              break;
            case (n = 25):
              App.team1 = randomNames.slice(0, 4);
              App.team2 = randomNames.slice(4, 8);
              App.team3 = randomNames.slice(8, 12);
              App.team4 = randomNames.slice(12, 16);
              App.team5 = randomNames.slice(16, 20);
              App.team6 = randomNames.slice(20, 26);
              App.teamTotal = 6;
              break;

            default:

          }

          function getParam(name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(window.location.href);
            if (results == null)
              return "";
            else
              return results[1];
          }

          var ko_id = getParam('GoLive');
          var data = {
            gameId: App.gameId,
            playerId: App.mySocketId,
            round: App.currentRound,
            teamTotal: App.teamTotal,
            team1: App.team1,
            team2: App.team2,
            team3: App.team3,
            team4: App.team4,
            team5: App.team5,
            team6: App.team6,
            ko_id: ko_id
          }
          IO.socket.emit('displayTeams', data);
        }
      },
      displayTeams: function(data) {
        App.$gameArea.html(App.$templateHostPreGame);
        if (data.team1.length == 0) {
          $('#teamName1').hide();
        } else {
          $('#teamName1').show();

          for (var i = 0; i < data.team1.length; i++) {
            $('#team1').append("<li>" + data.team1[i] + "</li><br>");
            //App.team1[i] = data.team1[i];

          }
        }
        if (data.team2.length == 0) {
          $('#teamName2').hide();
        } else {
          $('#teamName2').show();
          for (var i = 0; i < data.team2.length; i++) {
            $('#team2').append("<li>" + data.team2[i] + "</li><br>");

          }
        }
        if (data.team3.length == 0) {
          $('#teamName3').hide();
        } else {
          $('#teamName3').show();
          for (var i = 0; i < data.team3.length; i++) {
            $('#team3').append("<li>" + data.team3[i] + "</li><br>");
          }
        }
        if (data.team4.length == 0) {
          $('#teamName4').hide();
        } else {
          $('#teamName4').show();
          for (var i = 0; i < data.team4.length; i++) {
            $('#team4').append("<li>" + data.team4[i] + "</li><br>");
          }
        }
        if (data.team5.length == 0) {
          $('#teamName5').hide();
        } else {
          $('#teamName5').show();
          for (var i = 0; i < data.team5.length; i++) {
            $('#team5').append("<li>" + data.team5[i] + "</li><br>");
          }
        }
        if (data.team6.length == 0) {
          $('#teamName6').hide();
        } else {
          $('#teamName6').show();
          for (var i = 0; i < data.team6.length; i++) {
            $('#team6').append("<li>" + data.team6[i] + "</li><br>");
          }
        }
        IO.socket.emit('hostTeamsSet', data);
      },
      /**
       * @param data
       */

      populateTeams: function(playerName, data) {

        if (App.team1.indexOf(playerName) > -1) {
          return 'Team1';
        } else if (App.team2.indexOf(playerName) > -1) {
          return 'Team2';
        }
        return 'Unknown';

      },
      /**
       * @param data
       */
      gameCountdown: function(data) {
        // Prepare the game screen with new HTML
        App.$gameArea.html(App.$hostGame);
        App.doTextFit('#hostWord');

        // Begin the on-screen countdown timer
        var $secondsLeft = $('#hostWord');
        App.countDown($secondsLeft, 5, function() {
          $('#hostWord').text('')
          App.doTextFit('#hostWord');
          roundCountDown(data);
          IO.socket.emit('hostCountdownFinished', data);

        });
        // Begin the on-screen round countdown timer
        function roundCountDown(data) {
          //$secondsLeft = $('#displayTime');
          var time = (data.time * 60);

          progress(time, time, $('#progressBar'));
          //TIME FIXprogress(30, 30, $('#progressBar'));

          function progress(timeleft, timetotal, $element) {
            var progressBarWidth = timeleft * $element.width() / timetotal;
            //timeleft = $('#displayTime');
            $element.find('div').animate({
              width: progressBarWidth
            }, timeleft == timetotal ? 0 : 1000, 'linear').html();
            if (timeleft > 0) {
              setTimeout(function() {
                progress(timeleft - 1, timetotal, $element);
              }, 1000);
            } else {
              IO.socket.emit('gameOver', App.gameId);
            }
          }
        }

        for (var i = 0; i < App.teamTotal; i++) {
          var teamNum = i + 1;
          if (i < 3) {
            $('#w3-row-1').append("<div id = 'player" + teamNum + "Score'class='w3-col s4 w3-center'><span class='playerName'>Team " + teamNum + "</span><br><span class='score'>100</span><br><div><progress class = 'teamHealthBar' id= 'Team" + teamNum + "health' value='100' max='100'></progress></div></div>")
            /*$('#playerScores').append("<div id='player"+teamNum+"Score' class='playerScore'><span class='score'>100</span><span class='playerName'>Team "+teamNum+"</span> </div>")
            $('#player'+teamNum+'Score')
              .find('.playerName')*/
            //.html(App.Host.players[i].playerName);

            //$('#player'+teamNum+'Score').find('.score').attr('id', App.Host.players[i].mySocketId);
            $('#player' + teamNum + 'Score').find('.score').attr('id', 'team' + teamNum);
          } else {
            $('#w3-row-2').append("<div id = 'player" + teamNum + "Score'class='w3-col s4 w3-center'><span class='playerName'>Team " + teamNum + "</span><br><span class='score'>100</span><br><div><progress class = 'teamHealthBar' id= 'Team" + teamNum + "health' value='100' max='100'></progress></div></div>")
            /*$('#playerScores').append("<div id='player"+teamNum+"Score' class='playerScore'><span class='score'>100</span><span class='playerName'>Team "+teamNum+"</span> </div>")
            $('#player'+teamNum+'Score')
              .find('.playerName')*/
            //.html(App.Host.players[i].playerName);

            //$('#player'+teamNum+'Score').find('.score').attr('id', App.Host.players[i].mySocketId);
            $('#player' + teamNum + 'Score').find('.score').attr('id', 'team' + teamNum);
          }
        }
      },

      /**
       * Show the word for the current round on screen.
       * @param data{{round: *, word: *, answer: *, list: Array}}
       */
       startWord: function(data) {
         // Insert the new word into the DOM
         //$('#hostWord').hide();
         /*
         // Update the data for the current round
         App.Host.currentCorrectAnswer = data.answer;
         App.Host.currentRound = data.round;*/// DEBUG:
         $('#gameCodeDisplay').text(App.gameId);

           App.Host.t1currentCorrectAnswer = data.team[0].answer;
           App.Host.t2currentCorrectAnswer = data.team[1].answer;
           App.Host.t3currentCorrectAnswer = data.team[2].answer;
           App.Host.t4currentCorrectAnswer = data.team[3].answer;
           App.Host.t5currentCorrectAnswer = data.team[4].answer;
           App.Host.t6currentCorrectAnswer = data.team[5].answer;



       },
      newWord: function(data) {
        // Insert the new word into the DOM
        //$('#hostWord').hide();
        /*
        // Update the data for the current round
        App.Host.currentCorrectAnswer = data.answer;
        App.Host.currentRound = data.round;*/// DEBUG:
        $('#gameCodeDisplay').text(App.gameId);
        if(data.teamID == 1){
          App.Host.t1currentCorrectAnswer = data.team[0].answer;
        }
        else if(data.teamID == 2){
          App.Host.t2currentCorrectAnswer = data.team[1].answer;
        }
        else if(data.teamID == 3){
          App.Host.t3currentCorrectAnswer = data.team[2].answer;
        }
        else if(data.teamID == 4){
          App.Host.t4currentCorrectAnswer = data.team[3].answer;
        }
        else if(data.teamID == 5){
          App.Host.t5currentCorrectAnswer = data.team[4].answer;
        }
        else if(data.teamID == 6){
          App.Host.t6currentCorrectAnswer = data.team[5].answer;
        }


      },

      /**
       * Check the answer clicked by a player.
       * @param data{{round: *, playerId: *, answer: *, gameId: *}}
       */
      checkAnswer: function(data) {
        // Verify that the answer clicked is from the current round.
        // This prevents a 'late entry' from a player whos screen has not

          // Get the player's score
          var $pScore1 = $('#team1');
          var $pScore2 = $('#team2');
          var $pScore3 = $('#team3');
          var $pScore4 = $('#team4');
          var $pScore5 = $('#team5');
          var $pScore6 = $('#team6');
          var team1Score = $pScore1.text();
          var team2Score = $pScore2.text();
          var team3Score = $pScore3.text();
          var team4Score = $pScore4.text();
          var team5Score = $pScore5.text();
          var team6Score = $pScore6.text()
          var pTeam = data.team;
          if (pTeam == 1) {
            // Advance player's score if it is correct
            if (App.Host.t1currentCorrectAnswer === data.answer) {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                teamID: pTeam,
                playerName: data.playerName,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              IO.socket.emit('playerCorrect', data);
              // Notify the server to start the next round.
              //IO.socket.emit('hostNextRound', data);
            }
            else {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamID: pTeam,
                teamTotal: data.teamTotal,
                playerName: data.playerName,
                playerTeam: data.team,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              //Need to emit something to the player to inform of incorrect answer
              IO.socket.emit('playerIncorrect', data);
            }
          }
          else if (pTeam == 2) {
            // Advance player's score if it is correct
            if (App.Host.t2currentCorrectAnswer === data.answer) {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                teamID: pTeam,
                playerName: data.playerName,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              IO.socket.emit('playerCorrect', data);
              // Notify the server to start the next round.
              //IO.socket.emit('hostNextRound', data);
            } else {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                playerName: data.playerName,
                teamID: pTeam,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              //Need to emit something to the player to inform of incorrect answer
              IO.socket.emit('playerIncorrect', data);

            }
          }
          else if (pTeam == 3) {
            // Advance player's score if it is correct
            if (App.Host.t3currentCorrectAnswer === data.answer) {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                teamID: pTeam,
                playerName: data.playerName,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              IO.socket.emit('playerCorrect', data);
              // Notify the server to start the next round.
              //IO.socket.emit('hostNextRound', data);
            } else {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                playerName: data.playerName,
                teamID: pTeam,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              //Need to emit something to the player to inform of incorrect answer
              IO.socket.emit('playerIncorrect', data);

            }
          }
          else if (pTeam == 4) {
            // Advance player's score if it is correct
            if (App.Host.t4currentCorrectAnswer === data.answer) {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                teamID: pTeam,
                playerName: data.playerName,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              IO.socket.emit('playerCorrect', data);
              // Notify the server to start the next round.
              //IO.socket.emit('hostNextRound', data);
            } else {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                playerName: data.playerName,
                teamID: pTeam,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              //Need to emit something to the player to inform of incorrect answer
              IO.socket.emit('playerIncorrect', data);

            }
          }
          else if (pTeam == 5) {
            // Advance player's score if it is correct
            if (App.Host.t5currentCorrectAnswer === data.answer) {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                teamID: pTeam,
                playerName: data.playerName,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              IO.socket.emit('playerCorrect', data);
              // Notify the server to start the next round.
              //IO.socket.emit('hostNextRound', data);
            } else {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                playerName: data.playerName,
                teamID: pTeam,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              //Need to emit something to the player to inform of incorrect answer
              IO.socket.emit('playerIncorrect', data);

            }
          }
          else if (pTeam == 6) {
            // Advance player's score if it is correct
            if (App.Host.t6currentCorrectAnswer === data.answer) {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                teamID: pTeam,
                playerName: data.playerName,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              IO.socket.emit('playerCorrect', data);
              // Notify the server to start the next round.
              //IO.socket.emit('hostNextRound', data);
            } else {
              var data = {
                gameId: data.gameId,
                playerId: data.playerId,
                answer: data.answer,
                round: data.round,
                teamTotal: data.teamTotal,
                playerName: data.playerName,
                teamID: pTeam,
                team1Score: team1Score,
                team2Score: team2Score,
                team3Score: team3Score,
                team4Score: team4Score,
                team5Score: team5Score,
                team6Score: team6Score,
              }
              //Need to emit something to the player to inform of incorrect answer
              IO.socket.emit('playerIncorrect', data);

            }
          }





      },
      teamDeduct: function(data) {
        //HOST Team Dudect


        var $pScore1 = $('#team1');
        var $pScore2 = $('#team2');
        var $pScore3 = $('#team3');
        var $pScore4 = $('#team4');
        var $pScore5 = $('#team5');
        var $pScore6 = $('#team6');
        var setDeduct = 10;


        if (data.teamDeduct == 'deductTeam1') {
          $pScore1.text(+$pScore1.text() - setDeduct);
          var health = document.getElementById("Team1health")
          health.value -= setDeduct;

        } else if (data.teamDeduct == 'deductTeam2') {
          $pScore2.text(+$pScore2.text() - setDeduct);
          var health = document.getElementById("Team2health")
          health.value -= setDeduct;

        } else if (data.teamDeduct == 'deductTeam3') {
          $pScore3.text(+$pScore3.text() - setDeduct);
          var health = document.getElementById("Team3health")
          health.value -= setDeduct;
          /*$('#hostWord').text("Ouch Team 3!");
          App.doTextFit('#hostWord');*/
        } else if (data.teamDeduct == 'deductTeam4') {
          $pScore4.text(+$pScore4.text() - setDeduct);
          var health = document.getElementById("Team4health")
          health.value -= setDeduct;
          /*$('#hostWord').text("Ouch Team 4!");
          App.doTextFit('#hostWord');*/
        } else if (data.teamDeduct == 'deductTeam5') {
          $pScore5.text(+$pScore5.text() - setDeduct);
          var health = document.getElementById("Team5health")
          health.value -= setDeduct;
          /*$('#hostWord').text("Ouch Team 5!");
          App.doTextFit('#hostWord');*/
        } else if (data.teamDeduct == 'deductTeam6') {
          $pScore6.text(+$pScore6.text() - setDeduct);
          var health = document.getElementById("Team6health")
          health.value -= setDeduct;
          /*$('#hostWord').text("Ouch Team 6!");
          App.doTextFit('#hostWord');*/
        } else if (data.teamDeduct == 'addPoints') {

          if (data.team == 1) {
            $pScore1.text(+$pScore1.text() + setDeduct);
            var health = document.getElementById("Team1health")
            health.value += setDeduct;
          } else if (data.team == 2) {
            $pScore2.text(+$pScore2.text() + setDeduct);
            var health = document.getElementById("Team2health")
            health.value += setDeduct;
          } else if (data.team == 3) {
            $pScore3.text(+$pScore3.text() + setDeduct);
            var health = document.getElementById("Team3health")
            health.value += setDeduct;
          } else if (data.team == 4) {
            $pScore4.text(+$pScore4.text() + setDeduct);
            var health = document.getElementById("Team4health")
            health.value += setDeduct;
          } else if (data.team == 5) {
            $pScore5.text(+$pScore5.text() + setDeduct);
            var health = document.getElementById("Team5health")
            health.value += setDeduct;
          } else if (data.team == 6) {
            $pScore6.text(+$pScore6.text() + setDeduct);
            var health = document.getElementById("Team6health")
            health.value += setDeduct;
          }
        }

        IO.socket.emit('hostNextRound', data);

        /*WORKING HERE
        Will possibly have to make 6 different HTML Skeletons and update the Add Points feature to each individual skel
        $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button' disabled>Add Points</button></div>");
        IO.socket.emit('addPointsBtn', data);
        }
        else{
        }*/

      },
      addPoints: function() {
        // Advance the round
        App.currentRound += 1;
        // Prepare data to send to the server
        var data = {
          gameId: App.gameId,
          round: App.currentRound,
          teamTotal: App.teamTotal,
        }
      },

      /**
       * All 10 rounds have played out. End the game.
       * @param data
       */
      endGame: function() {
        console.log('Host Game Over...');
        // Get the data for player 1 from the host screen
        var $p1 = $('#player1Score');
        var p1Score = +$p1.find('.score').text();
        var p1Name = $p1.find('.playerName').text();

        // Get the data for player 2 from the host screen
        var $p2 = $('#player2Score');
        var p2Score = +$p2.find('.score').text();
        var p2Name = $p2.find('.playerName').text();

        var $p3 = $('#player3Score');
        var p3Score = +$p3.find('.score').text();
        var p3Name = $p3.find('.playerName').text();

        var $p4 = $('#player4Score');
        var p4Score = +$p4.find('.score').text();
        var p4Name = $p4.find('.playerName').text();

        var $p5 = $('#player5Score');
        var p5Score = +$p5.find('.score').text();
        var p5Name = $p5.find('.playerName').text();

        var $p6 = $('#player6Score');
        var p6Score = +$p6.find('.score').text();
        var p6Name = $p6.find('.playerName').text();

        // Find the winner based on the scores
        //var winner = (p1Score < p2Score) ? p2Name : p1Name;
        var winner;
        var winnerScore;
        var tieCount = 0;
        var tie = false;

        var highestScore = Math.max(p1Score, p2Score, p3Score, p4Score, p5Score, p6Score)
        switch (highestScore) {
          case p6Score:
            winner = 'Team 6';
            winnerScore = p6Score;
            break;
          case p5Score:
            winner = 'Team 5';
            winnerScore = p5Score;
            break;
          case p4Score:
            winner = 'Team 4';
            winnerScore = p4Score;
            break;
          case p3Score:
            winner = 'Team 3';
            winnerScore = p3Score;
            break;
          case p2Score:
            winner = 'Team 2';
            winnerScore = p2Score;
            break;
          case p1Score:
            winner = 'Team 1';
            winnerScore = p6Score;
            break;
        }
        if (winnerScore == p6Score) {
          tieCount++;
        }
        if (winnerScore == p5Score) {
          tieCount++;
        }
        if (winnerScore == p4Score) {
          tieCount++;
        }
        if (winnerScore == p3Score) {
          tieCount++;
        }
        if (winnerScore == p2Score) {
          tieCount++;
        }
        if (winnerScore == p1Score) {
          tieCount++;
        }
        if (tieCount > 1) {
          tie = true;
        }
        //var tie = (p1Score === p2Score);
        // Display the winner (or tie game message)
        if (tie) {
          $('#gameArea')
            .html("<div class='gameOver'>It's a Tie</div>")
            .append(
              // Create a button to start a new game.
              $('<button>Start A New Game</button>')
              .attr('id', 'btnHostRestart')
              .addClass('btn')
              .addClass('btnGameOver')
            );
        } else {
          //
          $('#gameArea')
            .html('<div class="gameOver">' + winner + ' Wins!</div>')
            .append(
              // Create a button to start a new game.
              $('<button>Start A New Game</button>')
              .attr('id', 'btnHostRestart')
              .addClass('btn')
              .addClass('btnGameOver')
            );
        }
        App.doTextFit('#hostWord');

        // Reset game data
        App.Host.numPlayersInRoom = 0;
        App.Host.isNewGame = true;
      },
      onPlayerRestart: function() {
        var data = {
          gameId: App.gameId,
          playerName: App.Player.myName
        }
        IO.socket.emit('playerRestart', data);
        App.currentRound = 0;
        $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
      },

      /**
       * A player hit the 'Start Again' button after the end of a game.
       */
      restartGame: function() {
        App.$gameArea.html(App.$templateNewGame);
        $('#spanNewGameCode').text(App.gameId);
      }
    },


    /* *****************************
     *        PLAYER CODE        *
     ***************************** */

    Player: {

      /**
       * A reference to the socket ID of the Host
       */
      hostSocketId: '',

      /**
       * The player's name entered on the 'Join' screen.
       */
      myName: '',


      team: 0,

      teamTotal: 0,

      currentCorrectAnswer: '',

      teamReset: [],


      /**
       * Click handler for the 'JOIN' button
       */
      onJoinClick: function() {
        // console.log('Clicked "Join A Game"');

        // Display the Join Game HTML on the player's screen.
        App.$gameArea.html(App.$templateJoinGame);
      },

      /**
       * The player entered their name and gameId (hopefully)
       * and clicked Start.
       */
      onPlayerStartClick: function() {
        // console.log('Player clicked "Start"');

        // collect data to send to the server
        var data = {
          gameId: +($('#inputGameId').val()),
          playerName: $('#inputPlayerName').val() || 'anon'
        };

        // Send the gameId and playerName to the server
        IO.socket.emit('playerJoinGame', data);

        // Set the appropriate properties for the current player.
        App.myRole = 'Player';
        App.Player.myName = data.playerName;
      },
      onTeamsCreateClick: function() {
        // console.log('Clicked "Create A Game"');

        IO.socket.emit('playerPreGame', data);
      },
      /**
       *
       * @param data
       *
       */


      /**
       *  Click handler for the Player hitting a word in the word list.
       */
      onPlayerAnswerClick: function() {
        // console.log('Clicked Answer Button');
        var $btn = $(this); // the tapped button
        var answer = $btn.val(); // The tapped word

        // Send the player info and tapped word to the server so
        // the host can check the answer.
        var data = {
          gameId: App.gameId,
          playerId: App.mySocketId,
          answer: answer,
          round: App.currentRound,
          teamTotal: App.teamTotal,
          team: App.Player.team,
          playerName: App.Player.myName,
        }
        IO.socket.emit('playerAnswer', data);
      },
      onDeductTeamBtn: function() {
        // console.log('Clicked Answer Button');
        var $btn = $(this); // the tapped button
        var teamDeduct = $btn.attr('id');

        //var teamDeduct = 'deductTeam1';
        //  var teamDeduct = $btn.attr('id'); // The tapped word

        // Send the player info and tapped word to the server so
        // the host can check the answer.
        var data = {
          gameId: App.gameId,
          playerId: App.mySocketId,
          round: App.currentRound,
          playerName: App.Player.myName,
          teamDeduct: teamDeduct,
          team: App.Player.team,
        }
        if (App.Player.team == 1) {
          App.$gameArea.html(App.$player1Game);
          $('#correctMessage').hide();
          $('#player-1-body').show();
        } else if (App.Player.team == 2) {
          App.$gameArea.html(App.$player2Game);
          $('#correctMessage').hide();
          $('#player-2-body').show();
        } else if (App.Player.team == 3) {
          App.$gameArea.html(App.$player3Game);
          $('#correctMessage').hide();
          $('#player-3-body').show();
        } else if (App.Player.team == 4) {
          App.$gameArea.html(App.$player4Game);
          $('#correctMessage').hide();
          $('#player-4-body').show();
        } else if (App.Player.team == 5) {
          App.$gameArea.html(App.$player5Game);
          $('#correctMessage').hide();
          $('#player-5-body').show();
        } else if (App.Player.team == 6) {
          App.$gameArea.html(App.$player6Game);
          $('#correctMessage').hide();
          $('#player-6-body').show();
        }


        //App.$gameArea.html(App.$player1Game);
        IO.socket.emit('teamDeduct', data);
      },
      teamDeduct: function(data) {
        var prey = 0;
        if (data.teamDeduct == 'deductTeam1') {
          prey = 1;
        }else if (data.teamDeduct == 'deductTeam2') {
          prey = 2;
        }else if (data.teamDeduct == 'deductTeam3') {
          prey = 3;
        }else if (data.teamDeduct == 'deductTeam4') {
          prey = 4;
        }else if (data.teamDeduct == 'deductTeam5') {
          prey = 5;
        }else if (data.teamDeduct == 'deductTeam6') {
          prey = 6;
        }

        if (App.Player.team == prey) {
          $('#negativePoints').html('<div>Ouch! Team '+data.team+' just took away 10 points from you!</div>');
        }
        if (App.Player.team == 1) {
          $('#correctMessage').hide();
          $('#player-1-body').show();
        } else if (App.Player.team == 2) {
          $('#correctMessage').hide();
          $('#player-2-body').show();
        } else if (App.Player.team == 3) {
          $('#correctMessage').hide();
          $('#player-3-body').show();
        } else if (App.Player.team == 4) {
          $('#correctMessage').hide();
          $('#player-4-body').show();
        } else if (App.Player.team == 5) {
          $('#correctMessage').hide();
          $('#player-5-body').show();
        } else if (App.Player.team == 6) {
          $('#correctMessage').hide();
          $('#player-6-body').show();
        }
        IO.socket.emit('hostNextRound', data);
      },

      /**
       *  Click handler for the "Start Again" button that appears
       *  when a game is over.
       */
      onPlayerRestart: function() {
        var data = {
          gameId: App.gameId,
          playerName: App.Player.myName
        }
        IO.socket.emit('playerRestart', data);
        App.currentRound = 0;
        $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
      },

      /**
       * Display the waiting screen for player 1
       * @param data
       */
      updateWaitingScreen: function(data) {
        if (IO.socket.socket.sessionid === data.mySocketId) {
          App.myRole = 'Player';
          App.gameId = data.gameId;

          /*  $('#playerWaitingMessage')
              .append('<p/>')
              .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');*/
          $('#gameArea')
            .html('<div class="gameOver"><h2 id = "waitingFont">Waiting for the game to start...<h2></div>');
        }
      },
      removePlayerName: function(data) {
        if (data.playerName == App.Player.myName) {
          App.$gameArea.html(App.$templateJoinGame);
          socket.disconnect();
        }
      },

      /**
       * Display 'Get Ready' while the countdown timer ticks down.
       * @param data
       */
      createTeams: function(data) {
        //App.$gameArea.html(App.$templatePlayerPreGame);
        //$('#teamMembers').append("<li>My Name: "+ App.Player.myName +"</li><br>");
        /*Check if Player name is in team array and populate to html page*/
      },
      displayTeams: function(data) {
        App.teamTotal = data.teamTotal;
        App.Player.teamTotal = data.teamTotal;
        App.team1 = data.team1;
        App.team2 = data.team2;
        App.team3 = data.team3;
        App.team4 = data.team4;
        App.team5 = data.team5;
        App.team6 = data.team6;


        App.$gameArea.html(App.$templatePlayerPreGame);
        if (arrayContains(App.Player.myName, data.team1)) {
          var team = data.team1;
          App.Player.team = 1;
          $('#teamMembers').append("<li><h2>Teammates</h2><br></li><br>");
          $('#teamContainer').addClass('team1bg')
          for (var i = 0; i < team.length; i++) {
            $('#teamMembers').append(team[i] + "</li><br><br><li>");
          }
        } else if (arrayContains(App.Player.myName, data.team2)) {
          var team = data.team2;
          App.Player.team = 2;
          $('#teamMembers').append("<li><h2>Teammates</h2><br></li><br>");
          for (var i = 0; i < team.length; i++) {
            $('#teamMembers').append(team[i] + "</li><br><br><li>");
          }
        } else if (arrayContains(App.Player.myName, data.team3)) {
          var team = data.team3;
          App.Player.team = 3;
          $('#teamMembers').append("<li><h2>Teammates</h2><br></li><br>");
          for (var i = 0; i < team.length; i++) {
            $('#teamMembers').append(team[i] + "</li><br><br><li>");
          }
        } else if (arrayContains(App.Player.myName, data.team4)) {
          var team = data.team3;
          App.Player.team = 4;
          $('#teamMembers').append("<li><h2>Teammates</h2><br></li><br>");
          for (var i = 0; i < team.length; i++) {
            $('#teamMembers').append(team[i] + "</li><br><br><li>");
          }
        } else if (arrayContains(App.Player.myName, data.team5)) {
          var team = data.team5;
          App.Player.team = 5;
          $('#teamMembers').append("<li><h2>Teammates</h2><br></li><br>");
          for (var i = 0; i < team.length; i++) {
            $('#teamMembers').append(team[i] + "</li><br><br><li>");
          }
        } else if (arrayContains(App.Player.myName, data.team6)) {
          var team = data.team6;
          App.Player.team = 6;
          $('#teamMembers').append("<li><h2>Teammates</h2><br></li><br>");
          for (var i = 0; i < team.length; i++) {
            $('#teamMembers').append(team[i] + "</li><br><br><li>");
          }
        }

        function arrayContains(needle, arrhaystack) {
          return (arrhaystack.indexOf(needle) > -1);
        }


        /*Check if Player name is in team array and populate to html page*/
      },
      /**
       * Display 'Get Ready' while the countdown timer ticks down.
       * @param data
       */
      gameCountdown: function(data) {
        //App.Player.hostSocketId = hostData.mySocketId;
        $('#gameArea')
          .html('<div class="gameOver" style = "font-size: 8em;">Ready to play!</div><br>');

        function playerGameDisplay() {
          if (App.Player.team == 1) {
            App.$gameArea.html(App.$player1Game);
          } else if (App.Player.team == 2) {
            App.$gameArea.html(App.$player2Game);
          }else if (App.Player.team == 3) {
            App.$gameArea.html(App.$player3Game);
          }else if (App.Player.team == 4) {
            App.$gameArea.html(App.$player4Game);
          }else if (App.Player.team == 5) {
            App.$gameArea.html(App.$player5Game);
          }else if (App.Player.team == 6) {
            App.$gameArea.html(App.$player6Game);
          }
          //App.$gameArea.html(App.$player1Game);
        }
        //Timeout Before
        setTimeout(playerGameDisplay, 1000);

        //App.$gameArea.html(App.$playerGame);
      },

      /**
       * Show the list of words for the current round.
       * @param data{{round: *, word: *, answer: *, list: Array}}
       */
       startWord: function(data) {
         var list;
         var question;
         //Gives Time for Questions and Answers to Populate Correctly
         setTimeout(populate, 1000);
         function populate(){

         if (App.Player.team == 1) {
           App.Player.currentCorrectAnswer = data.team[0].answer;
           list = data.team[0].list;
           question = data.team[0].question;
         }
         else if (App.Player.team == 2) {
           App.Player.currentCorrectAnswer = data.team[1].answer;
           list = data.team[1].list;
           question = data.team[1].question;
         }
         else if (App.Player.team == 3) {
           App.Player.currentCorrectAnswer = data.team[2].answer;
           list = data.team[2].list;
           question = data.team[2].question;
         }
         else if (App.Player.team == 4) {
           App.Player.currentCorrectAnswer = data.team[3].answer;
           list = data.team[3].list;
           question = data.team[3].question;
         }
         else if (App.Player.team == 5) {
           App.Player.currentCorrectAnswer = data.team[4].answer;
           list = data.team[4].list;
           question = data.team[4].question;
         }
         else if (App.Player.team == 6) {
           App.Player.currentCorrectAnswer = data.team[5].answer;
           list = data.team[5].list;
           question = data.team[5].question;
         }

         // Create an unordered list element
       //  App.Player.currentCorrectAnswer = data.t1.answer;

         var $list = $('<ul/>').attr('id', 'ulAnswers').attr('id', 'answer_bank');



         // Insert a list item for each word in the word list
         // received from the server.
         $.each(list, function() {
           $list //  <ul> </ul>
             .append($('<li/>').attr('style', 'margin-bottom: 15px;') //  <ul> <li> </li> </ul>
               .append($('<button/>') //  <ul> <li> <button> </button> </li> </ul>
                 .addClass('btnAnswer') //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                 .addClass('btn2') //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                 .val(this) //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                 .html(this) //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
               )
             )
         });

         // Insert the list onto the screen.
         $('.playerName').text(App.Player.myName)
         //$('.playerName').text(data.team1.length)
         $('#playerWord').text(question);
         $('#answerDiv').html($list);
         //$('#gameArea').html($list);
       }
       },
      newWord: function(data) {
        var list;
        var question;
        //Gives Time for Questions and Answers to Populate Correctly
        setTimeout(populate, 1000);
        function populate(){

          if (App.Player.team == 1 && data.teamID == 1) {
            App.Player.currentCorrectAnswer = data.team[0].answer;
            list = data.team[0].list;
            question = data.team[0].question;
          }
          else if (App.Player.team == 2 && data.teamID == 2) {
            App.Player.currentCorrectAnswer = data.team[1].answer;
            list = data.team[1].list;
            question = data.team[1].question;
          }
          else if (App.Player.team == 3 && data.teamID == 3) {
            App.Player.currentCorrectAnswer = data.team[2].answer;
            list = data.team[2].list;
            question = data.team[2].question;
          }
          else if (App.Player.team == 4 && data.teamID == 4) {
            App.Player.currentCorrectAnswer = data.team[3].answer;
            list = data.team[3].list;
            question = data.team[3].question;
          }
          else if (App.Player.team == 5 && data.teamID == 5) {
            App.Player.currentCorrectAnswer = data.team[4].answer;
            list = data.team[4].list;
            question = data.team[4].question;
          }
          else if (App.Player.team == 6 && data.teamID == 6) {
            App.Player.currentCorrectAnswer = data.team[5].answer;
            list = data.team[5].list;
            question = data.team[5].question;
          }

          // Create an unordered list element
        //  App.Player.currentCorrectAnswer = data.t1.answer;

          var $list = $('<ul/>').attr('id', 'ulAnswers').attr('id', 'answer_bank');



          // Insert a list item for each word in the word list
          // received from the server.
          $.each(list, function() {
            $list //  <ul> </ul>
              .append($('<li/>').attr('style', 'margin-bottom: 15px;') //  <ul> <li> </li> </ul>
                .append($('<button/>') //  <ul> <li> <button> </button> </li> </ul>
                  .addClass('btnAnswer') //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                  .addClass('btn2') //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                  .val(this) //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                  .html(this) //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                )
              )
          });

          // Insert the list onto the screen.
          $('.playerName').text(App.Player.myName)
          //$('.playerName').text(data.team1.length)
          $('#playerWord').text(question);
          $('#answerDiv').html($list);
          //$('#gameArea').html($list);
        }
      },
      addPoints: function(data) {
        var $pScore = $('.score');
        // Advance the round
        App.currentRound += 1;
        if (App.mySocketId === data.playerId) {
          App.$gameArea.html(App.$playerTeamSelect);
          var pointMin = 70;

          //Display Deduct Teams Screen
          if (App.Player.teamTotal == 6) {
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-blue btn-simple deductTeamBtn' id = 'deductTeam1' type = 'button'> Team 1</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-red btn-simple' id = 'deductTeam2' type = 'button'>Team 2</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-gray btn-simple' id = 'deductTeam3' type = 'button'>Team 3</button></div>");
            $('#w3-teamDeduct-row-2').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-green btn-simple deductTeamBtn' id = 'deductTeam4' type = 'button'> Team 4</button></div>");
            $('#w3-teamDeduct-row-2').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-pink btn-simple deductTeamBtn' id = 'deductTeam5' type = 'button'> Team 5</button></div>");
            $('#w3-teamDeduct-row-2').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-orange btn-simple deductTeamBtn' id = 'deductTeam6' type = 'button'> Team 6</button></div>");
            //Displays the Add Points button when team score goes below certain score
            if (App.Player.team == 1) {
              $('#deductTeam1').hide();
              if (data.team1Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            } else if (App.Player.team == 2) {
              $('#deductTeam2').hide();
              if (data.team2Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 3) {
              $('#deductTeam3').hide();
              if (data.team3Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 4) {
              $('#deductTeam4').hide();
              if (data.team4Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 5) {
              $('#deductTeam5').hide();
              if (data.team5Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }
            else if (App.Player.team == 6) {
              $('#deductTeam6').hide();
              if (data.team6Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }
          } else if (App.Player.teamTotal == 5) {
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-blue btn-simple deductTeamBtn' id = 'deductTeam1' type = 'button' style = 'padding-top: 20px;' > Team 1</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-red btn-simple' id = 'deductTeam2' type = 'button' style = 'padding-top: 20px;' >Team 2</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-gray btn-simple' id = 'deductTeam3' type = 'button' style = 'padding-top: 20px;' >Team 3</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-green btn-simple deductTeamBtn' id = 'deductTeam4' type = 'button' style = 'padding-top: 20px;'> Team 4</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-pink btn-simple deductTeamBtn' id = 'deductTeam5' type = 'button' style = 'padding-top: 20px;'> Team 5</button></div>");
            if (App.Player.team == 1) {
              $('#deductTeam1').hide();
              if (data.team1Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            } else if (App.Player.team == 2) {
              $('#deductTeam2').hide();
              if (data.team2Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 3) {
              $('#deductTeam3').hide();
              if (data.team3Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 4) {
              $('#deductTeam4').hide();
              if (data.team4Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 5) {
              $('#deductTeam5').hide();
              if (data.team5Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }
          } else if (App.Player.teamTotal == 4) {
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-blue btn-simple deductTeamBtn' id = 'deductTeam1' type = 'button'> Team 1</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-red btn-simple' id = 'deductTeam2' type = 'button'>Team 2</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-gray btn-simple' id = 'deductTeam3' type = 'button'>Team 3</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-green btn-simple deductTeamBtn' id = 'deductTeam4' type = 'button'> Team 4</button></div>");
            if (App.Player.team == 1) {
              $('#deductTeam1').hide();
              if (data.team1Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            } else if (App.Player.team == 2) {
              $('#deductTeam2').hide();
              if (data.team2Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 3) {
              $('#deductTeam3').hide();
              if (data.team3Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 4) {
              $('#deductTeam4').hide();
              if (data.team4Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }
          } else if (App.Player.teamTotal == 3) {
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'ccbtn btn-blue btn-simple deductTeamBtn' id = 'deductTeam1' type = 'button'> Team 1</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-red btn-simple' id = 'deductTeam2' type = 'button'>Team 2</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-gray btn-simple' id = 'deductTeam3' type = 'button'>Team 3</button></div>");
            if (App.Player.team == 1) {
              $('#deductTeam1').hide();
              if (data.team1Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            } else if (App.Player.team == 2) {
              $('#deductTeam2').hide();
              if (data.team2Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }else if (App.Player.team == 3) {
              $('#deductTeam3').hide();
              if (data.team3Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }
          } else {
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center' ><button class = 'ccbtn btn-blue btn-simple deductTeamBtn' id = 'deductTeam1' type = 'button'> Team 1</button></div>");
            $('#w3-teamDeduct-row-1').append("<div class = 'w3-col s4 w3-center'><button class = 'deductTeamBtn ccbtn btn-red btn-simple' id = 'deductTeam2' type = 'button'>Team 2</button></div>");
            if (App.Player.team == 1) {
              $('#deductTeam1').hide();
              if (data.team1Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            } else if (App.Player.team == 2) {
              $('#deductTeam2').hide();
              if (data.team2Score < pointMin) {
                $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
              }
            }
            //$('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button'>Add Points</button></div>");
          }

          var data = {
            gameId: App.gameId,
            round: App.currentRound,

          }

          function arrayContains(needle, arrhaystack) {
            return (arrhaystack.indexOf(needle) > -1);
          }

          //App.$gameArea.html(App.$templateNewGame);

          //IO.socket.emit('hostNextRound', data);

        }
        else if (App.Player.team == data.teamID){

            //Displays Right Answer Notification
            if (App.Player.team == 1) {
              $('#player-1-body').hide();
              $('#correctMessage').show();
            }
            else if (App.Player.team == 2) {
              $('#player-2-body').hide();
              $('#correctMessage').show();
            }
            else if (App.Player.team == 3) {
              $('#player-3-body').hide();
              $('#correctMessage').show();
            }
            else if (App.Player.team == 4) {
              $('#player-4-body').hide();
              $('#correctMessage').show();
            }
            else if (App.Player.team == 5) {
              $('#player-5-body').hide();
              $('#correctMessage').show();
            }
            else if (App.Player.team == 6) {
              $('#player-6-body').hide();
              $('#correctMessage').show();
            }

        }
      },
      playerWrong: function(data) {
        if (App.Player.team == data.teamID) {
          //Displays Wrong Answer Notification
          if (App.Player.team == 1) {
            $('#player-1-body').hide();
            $('#incorrectMessage').show();
            setTimeout(showScreen, 4000);
            function showScreen(){
              $('#incorrectMessage').hide();
              $('#player-1-body').show();
            }
          }
          else if (App.Player.team == 2) {
            $('#player-2-body').hide();
            $('#incorrectMessage').show();
            setTimeout(showScreen, 4000);
            function showScreen(){
              $('#incorrectMessage').hide();
              $('#player-2-body').show();
            }
          }
          else if (App.Player.team == 3) {
            $('#player-3-body').hide();
            $('#incorrectMessage').show();
            setTimeout(showScreen, 4000);
            function showScreen(){
              $('#incorrectMessage').hide();
              $('#player-3-body').show();
            }
          }
          else if (App.Player.team == 4) {
            $('#player-4-body').hide();
            $('#incorrectMessage').show();
            setTimeout(showScreen, 4000);
            function showScreen(){
              $('#incorrectMessage').hide();
              $('#player-4-body').show();
            }
          }
          else if (App.Player.team == 5) {
            $('#player-5-body').hide();
            $('#incorrectMessage').show();
            setTimeout(showScreen, 4000);
            function showScreen(){
              $('#incorrectMessage').hide();
              $('#player-5-body').show();
            }
          }
          else if (App.Player.team == 6) {
            $('#player-6-body').hide();
            $('#incorrectMessage').show();
            setTimeout(showScreen, 4000);
            function showScreen(){
              $('#incorrectMessage').hide();
              $('#player-6-body').show();
            }
          }
        }


      },
      addPointsBtn: function(data) {
        $('#w3-teamDeduct-row-3').append("<div class='w3-col s12 w3-center' id = 'addPointsDiv'><button class='deductTeamBtn ccbtn btn-success btn-simple btn-sq-lg' id='addPoints' type='button' disabled>Add Points</button></div>");
        IO.socket.emit('hostNextRound', data);
      },

      /**
       * Show the "Game Over" screen.
       */
      endGame: function() {
        console.log('Player end Game...');
        $('#gameArea')
          .html('<div class="gameOver">Game Over!</div>')/*
          .append(
            // Create a button to start a new game.
            $('<button>Start Again</button>')
            .attr('id', 'btnPlayerRestart')
            .addClass('btn')
            .addClass('btnGameOver')
          );*/
      }
    },


    /* **************************
              UTILITY CODE
       ************************** */

    /**
     * Display the countdown timer on the Host screen
     *
     * @param $el The container element for the countdown timer
     * @param startTime
     * @param callback The function to call when the timer ends.
     */
    countDown: function($el, startTime, callback) {
      // Display the starting time on the screen.

      App.doTextFit('#hostWord');
      console.log('Starting Countdown...');
      // Start a 1 second timer
      var timer = setInterval(countItDown, 1000);
      // Decrement the displayed timer value on each 'tick'
      function countItDown() {
        startTime -= 1
        $el.text(startTime);
        App.doTextFit('#hostWord');
        if (startTime <= 0) {
          // console.log('Countdown Finished.');
          // Stop the timer and do the callback.
          clearInterval(timer);
          callback();
          return;
        }
      }
    },
    /**
     * Make the text inside the given element as big as possible
     * See: https://github.com/STRML/textFit
     *
     * @param el The parent element of some text
     */
    doTextFit: function(el) {
      textFit(
        $(el)[0], {
          alignHoriz: true,
          alignVert: false,
          widthOnly: true,
          reProcess: true,
          maxFontSize: 300
        }
      );
    }

  };

  IO.init();
  App.init();

}($));
