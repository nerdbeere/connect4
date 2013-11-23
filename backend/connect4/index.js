/**
 *
 * @param id
 * @param {int} [sizeX] sizeX
 * @param {int} [sizeY] sizeY
 * @constructor
 */
var GameModel = function(id, sizeX, sizeY) {
    this.id = id;
    this.maxPlayers = 2;
    this.joinedPlayers = 0;
    this.sizeX = sizeX || 8;
    this.sizeY = sizeY || 8;

    var players = [];
    var map = Array.apply(null, new Array(this.sizeX * this.sizeY)).map(Number.prototype.valueOf, 0);

    this.join = function(playerId) {
        this.joinedPlayers++;
        players.push(playerId);

        // emit player joined
        // check if maxPlayers reached and start the game
    };

    this.getMap = function() {
        return map;
    }
};

var LobbyModel = function() {
    var games = [];
    this.register = function(game) {
        games.push(game);
    };
    this.list = function() {
        return games.filter(function(game) {
            return game.joinedPlayers === game.maxPlayers;
        })
    }
};

var Connect4 = function() {
    var lobby = new LobbyModel();
    var games = [];

    this.createGame = function() {
        var newId = games.length;
        var game = new GameModel(newId);

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

    };
};

module.exports = Connect4;