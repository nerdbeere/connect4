var PlayerModel = function(id, socket) {
    this.id = id;
    this.socket = socket;
    this.name = 'player_' + id;

    this.setName = function(name) {
        this.name = name;
    };

    socket.emit('player_data', {
        id: this.id,
        name: this.name
    });
};

/**
 *
 * @param id
 * @param {int} [sizeX] sizeX
 * @param {int} [sizeY] sizeY
 * @constructor
 */
var GameModel = function(id, sizeX, sizeY) {

    var STATUS_WAITING_FOR_PLAYERS = 0;
    var STATUS_PLAYING = 1;
    var STATUS_VICTORY = 2;

    this.id = id;
    this.maxPlayers = 2;
    this.joinedPlayers = 0;
    this.sizeX = sizeX || 8;
    this.sizeY = sizeY || 8;
    this.currentPlayer = null;
    this.gameStatus = STATUS_WAITING_FOR_PLAYERS;

    var players = [];
    var map = Array.apply(null, new Array(this.sizeX * this.sizeY)).map(Number.prototype.valueOf, 0);

    this.join = function(player) {
        if(this.joinedPlayers === this.maxPlayers) {
            return false;
        }
        this.joinedPlayers++;
        players.push(player);

        /**
         * If this is the first player
         * this player will make the first move
         */
        if(!this.currentPlayer) {
            this.currentPlayer = player.id;
        }

        if(this.joinedPlayers === this.maxPlayers) {
            this.gameStatus = STATUS_PLAYING;
        }

        this.emitPlayers();
    };

    this.emitPlayers = function() {
        for(var i = 0; i < players.length; i++) {
            players[i].socket.emit('game_players', players.map(function(player) {
                return {
                    id: player.id,
                    name: player.name
                }
            }));
        }
    };

    this.emitGameUpdate = function() {
        if(this.gameStatus !== STATUS_PLAYING) {
            return false;
        }
        for(var i = 0; i < players.length; i++) {
            players[i].socket.emit('game_update', {
                map: this.getMap()
            });
        }
    };

    this.getMap = function() {
        return map;
    };

    this.move = function(playerId, x) {
        if(this.currentPlayer !== playerId) {
            return false;
        }
        // do the move..

        // then its the next players turn
    };

    this.tick = function() {
        this.emitGameUpdate();
    };
};

var LobbyModel = function() {
    var games = [];
    this.register = function(game) {
        games.push(game);
    };
    this.list = function() {
        return games.filter(function(game) {
            return game.joinedPlayers < game.maxPlayers;
        })
    }
};

var Connect4 = new (function() {
    var lobby = new LobbyModel();
    var games = [];
    var players = [];
    var that = this;

    this.createGame = function(name) {
        var newId = games.length;
        var game = new GameModel(newId);

        game.name = name;

        lobby.register(game);
        games.push(game);


        return newId;
    };

    this.getGame = function(gameId) {
        if(typeof games[gameId] === 'undefined' || !games[gameId]) {
            return false;
        }
        return games[gameId];
    };

    this.joinGame = function(playerId, gameId) {
        return games[gameId].join(players[playerId]);
    };

    this.createPlayer = function(socket) {
        var player = new PlayerModel(players.length, socket);
        players.push(player);

        /**
         * API
         */
        socket.on('lobby_list', function() {
            socket.emit('lobby_list', lobby.list());
        });
        socket.on('game_create', function(data) {
            socket.emit('game_create', that.createGame(data.name));
        });
        socket.on('game_join', function(data) {
            socket.emit('game_join', that.joinGame(player.id, data.gameId));
        });
        socket.on('game_move', function() {});
    };

    this.tick = function() {
        for(var i = 0; i < games.length; i++) {
            games[i].tick();
        }
    };

    this.init = function() {
        this.io.on('connection', this.createPlayer);
    };
})();

module.exports = Connect4;