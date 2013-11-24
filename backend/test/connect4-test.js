var Connect4 = require("../connect4");
var expect = require("expect.js");

describe('Connect4', function () {

    var c4;
    beforeEach(function () {
        c4 = Connect4;
    });

    it('should be able to create a game', function () {
        var gameId = c4.createGame();
        expect(gameId).to.equal(0);
    });

    it('should be able to get a game', function () {
        var gameId = c4.createGame();
        var game = c4.getGame(gameId);
        expect(gameId).to.equal(game.id);
    });

    it('should return false when the game doesnt exist', function () {
        expect(c4.getGame(1337)).to.not.be.ok();
    });

    describe('Game', function() {
        it('should have a map with 64 slots', function () {
            var gameId = c4.createGame();
            var game = c4.getGame(gameId);
            var map = game.getMap();

            expect(map).to.be.an('array');
            expect(map.length).to.equal(64);
        });

        it('should have a nmae', function () {
            var gameName = 'awesome game';
            var gameId = c4.createGame(gameName);
            var game = c4.getGame(gameId);

            expect(game.name).to.equal(gameName);
        });
    });
});