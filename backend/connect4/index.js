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
    this.winner = null;
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
        for(var i = 0; i < players.length; i++) {
            players[i].socket.emit('game_update', {
                map: this.getMap(),
                currentPlayer: this.currentPlayer,
                gameStatus: this.gameStatus,
                winner: this.winner
            });
        }
    };

    this.getMap = function() {
        return map;
    };

    this.move = function(playerId, x) {
        if(x < 0 || x > sizeX || this.gameStatus !== STATUS_PLAYING || this.currentPlayer !== playerId) {
            return false;
        }

        for(var y = this.sizeY - 1;  y >= 0; y--) {
            if(getByCoord(x, y) === 0) {
                setByCoord(x, y, playerId);
                if(checkForVictory(x, y, playerId)) {
                    this.winner = playerId;
                    this.gameStatus = STATUS_VICTORY;
                    this.emitGameUpdate();
                    return true;
                }
                this.nextPlayer();
                return true;
            }
        }
        return false;
    };

    function getByCoord(x, y) {
        var i = x + y * sizeX;
        if(i >= sizeX * sizeY || i < 0)
            return 0;
        return map[i];
    }

    function setByCoord(x, y, playerId) {
        var i = x + y * sizeX;
        map[i] = playerId;
    }

    function checkForVictory(x, y, playerId) {
        var horizontal = 1;
        var vertical = 1;
        var diagonal = 1;
        var diagonal2 = 1;

        for(var i = 1; i <= 3; i++) {
            // horizontal
            if(checkByCoord(x + i, y, playerId)) {
                horizontal = horizontal + 1
            }
            if(checkByCoord(x - i, y, playerId)) {
                horizontal = horizontal + 1
            }

            // vertical
            if(checkByCoord(x, y + i, playerId)) {
                vertical = vertical + 1
            }
            if(checkByCoord(x, y - i, playerId)) {
                vertical = vertical + 1
            }

            // diagonal top left to bottom right
            if(checkByCoord(x + i, y + i, playerId)) {
                diagonal = diagonal + 1
            }
            if(checkByCoord(x - i, y - i, playerId)) {
                diagonal = diagonal + 1
            }

            // diagonal top right to bottom left
            if(checkByCoord(x - i, y + i, playerId)) {
                diagonal2 += 1
            }
            if(checkByCoord(x + i, y - i, playerId)) {
                diagonal2 += 1
            }
        }

        if(horizontal >= 4 || vertical >= 4 || diagonal >= 4 || diagonal2 >= 4)
            return true;


        return false;
    }

    function checkByCoord(x, y, playerId) {
        return playerId === getByCoord(x, y);
    }

    this.nextPlayer = function() {
        var next = false;
        for(var i = 0; i < players.length; i++) {
            if(next) {
                this.currentPlayer = player[i].id;
                return;
            }
            if(this.currentPlayer == player[i].id) {
                next = true
            }
        }
        if(next) {
            this.currentPlayer = players[0].id;
        }
    }

    this.tick = function() {
        if(this.gameStatus === STATUS_PLAYING) {
            this.emitGameUpdate();
        }
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