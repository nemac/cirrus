#! /usr/bin/node

var aws = require( 'aws-sdk' ); // npm install aws-sdk
var cli = require( 'commander' ); // npm install commander
var fs = require( 'fs' );

// command-line interface
cli
    .version( '0.0.1' )
    .option( '-c, --credentials <path>', 'path to credentials file relative to app.js; defaults to ./awskeys.json' )
    .parse( process.argv );

// load from command-line arg, failover to awskeys.json; will always look relative to script location
var credentials = require( cli.credentials ? __dirname + '/' + cli.credentials : __dirname + '/awskeys.json' );

/* alternate async file load
fs.readFile( __dirname + pathToCredentials, 'utf8', function ( err, data ) {
    if ( err ) throw err;
    credentials = JSON.parse( data );
});
*/

console.log( credentials.awskeys.region );