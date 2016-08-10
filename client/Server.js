'use strict';

var express = require( 'express' );

module.exports = class Server {

    constructor( opt ) {
        this.setApp();
        this.setStaticFolder();
        this.setRoute();
        this.app.listen( opt.port );
        console.log( 'Server started on http://localhost:' + opt.port );
    }

    setApp() {
        this.app = express();
    }

    setStaticFolder() {
        this.app.use( express.static( __dirname + '/www/' ) );
    }

    setRoute() {
        this.app.get( '/api/example', function( req, res ) {
            res.end( JSON.stringify( {
                example: "Hello from API!!"
            } ) );
        } ).get( '/*', function( req, res ) {
            res.sendFile( __dirname + '/www/index.html' );
        } );
    }

};
