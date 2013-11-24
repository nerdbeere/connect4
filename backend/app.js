var express = require('express')
    , http = require('http')
    , path = require('path');

var app = express();
GLOBAL.Connect4 = require('./connect4');

Connect4.io = require('socket.io').listen(3001);
Connect4.init();

/**
 * This is the game loop.
 * In our case we don't exactly need it,
 * because we could do everything with events.
 * But it's a demonstration..
 */
(function tick() {
    setTimeout(tick, 1000);
    Connect4.tick();
})();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));
    app.use(express.static(path.join(__dirname, '../frontend')));

    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.cookieParser());

    app.use(app.router)
})

app.configure('development', function () {
    app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("Connect4 server listening on port " + app.get('port'));
});