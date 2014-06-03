#! /usr/bin/env node
var aws = require( 'aws-sdk' );
var ArgumentParser = require( 'argparse' ).ArgumentParser;

var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'Utilities for AWS cloud management' 
});

// command-line interface
parser.addArgument( ['-c', '--config'], {
    help: 'path to config file relative to app.js; \n \t \t \t \t defaults to ./config.json',
    nargs: 1,
    metavar: '<path>'
});

parser.addArgument( ['--s3-list'], {
    help: 'list all buckets',
    action: 'storeTrue'
});

parser.addArgument( ['--s3-disk-use'], {
    help: 'disk usage for objects in a specified bucket <bucket>',
    nargs: 1,
    metavar: '<bucket>'
});

parser.addArgument( ['--s3-create'], {
    help: 'create bucket with name <bucket>',
    nargs: 1,
    metavar: '<bucket>'
});

parser.addArgument( ['--s3-remove'], {
    help: 'remove bucket with name <bucket>, prompts if not empty',
    nargs: 1,
    metavar: '<bucket>'
});

var args = parser.parseArgs();

// load from command-line arg, failover to config.json; will always look relative to script location
var config = require( args.config ? __dirname + '/' + args.config : __dirname + '/config.json' );
aws.config.update( config.awsConfig );

// s3 utils
if ( args['s3_list'] || args['s3_diskUse'] || args['s3_create'] || args['s3_remove'] ) {
    var s3Util = require( './modules/s3.js' );
    var s3 = new s3Util( aws );
    
    if ( args['s3_list'] ) {
        s3.list();
    } else if( args['s3_disk_use'] ) {
        s3.du( args['s3_disk_use'] );
    } else if( args['s3_create'] ) {
        s3.create( args['s3_create'] );
    } else if ( args['s3_remove'] ) {
        s3.remove( args['s3_remove'] );
    }
} else {
    console.log( parser.printHelp() );
}
