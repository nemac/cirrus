#! /usr/bin/node

var aws = require( 'aws-sdk' ); // npm install aws-sdk
var cli = require( 'commander' ); // npm install commander
var fs = require( 'fs' );

// command-line interface
cli
    .version( '0.0.1' )
    .option( '-c, --config <path>', 'path to config file relative to app.js; defaults to ./config.json' )
    .parse( process.argv );

// load from command-line arg, failover to awskeys.json; will always look relative to script location
var config = require( cli.config ? __dirname + '/' + cli.config : __dirname + '/config.json' );
aws.config.update( config.awsConfig );

// tools
/*
  // cloud
  --cloud-list
  --cloud-compare <path> path to existing compare, will compare with provided config
  --cloud-deploy
  --cloud-snapshot <path> path to store config

  // ec2
  --ec2-list
  --ec2-stop
  --ec2-start
  --ec2-set-instance
  --ec2-attach-ebs
  --ec2-attach-elasticip
  --ec2-set-sg

  // s3
  --s3-list-buckets
  --s3-create-bucket
  --s3-push-to-bucket
  --s3-du-bucket

  // security groups
  --sg-list

  // elasticip
  --elasticip-list
  --elasticip-release
  --elasticip-create


*/

/* alternate async file load
fs.readFile( __dirname + pathToCredentials, 'utf8', function ( err, data ) {
    if ( err ) throw err;
    credentials = JSON.parse( data );
});
*/

console.log( config.awskeys.region );