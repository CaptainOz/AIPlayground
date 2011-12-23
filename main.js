
var server = null;
(function(){
    "use strict";
    var connect = require( 'connect' );

    server = connect.createServer(
        connect.favicon(),
        connect.logger(),
        connect.static( __dirname + '/static' )
    ).listen( process.env.C9_PORT, '0.0.0.0' );
})();
