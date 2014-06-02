#! /usr/bin/node
var aws = require( 'aws-sdk' );
var cli = require( 'commander' );

// command-line interface
cli
    .version( '0.0.1' )
    .option( '-c, --config <path>', 'path to config file relative to app.js; \n \t \t \t \t defaults to ./config.json' )
    // s3 operations
    .option( '--s3-list', 'list all buckets' )
    .option( '--s3-disk-use <bucket>', 'disk usage for objects in a specified bucket <bucket>')
    .option( '--s3-create <bucket>', 'create bucket with name <bucket>')
    .option( '--s3-remove <bucket>', 'remove bucket with name <bucket>, prompts if not empty')
    .parse( process.argv );

// load from command-line arg, failover to config.json; will always look relative to script location
var config = require( cli.config ? __dirname + '/' + cli.config : __dirname + '/config.json' );
aws.config.update( config.awsConfig );

// s3 utils
if ( cli['s3List'] || cli['s3DiskUse'] || cli['s3Create'] || cli['s3Remove'] ) {
    var s3Util = require( './modules/s3.js' );
    var s3 = new s3Util( aws );
    
    if ( cli['s3List'] ) {
        s3.list();
    } else if( cli['s3DiskUse'] ) {
        s3.du( cli['s3DiskUse'] );
    } else if( cli['s3Create'] ) {
        s3.create( cli['s3Create'] );
    } else if ( cli['s3Remove'] ) {
        s3.remove( cli['s3Remove'] );
    }
}
