#! /usr/bin/env node
var aws = require( 'aws-sdk' );
var ArgumentParser = require( 'argparse' ).ArgumentParser;

// command-line interface
var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'Utilities for AWS cloud management' 
});

// common
parser.addArgument( ['-c', '--config'], {
    help: 'path to config file relative to app.js; \n \t \t \t \t defaults to ./config.json',
    nargs: 1,
    metavar: '<path>'
});

// s3 args
parser.addArgument( ['--s3-list'], {
    help: 'list all buckets',
    action: 'storeTrue'
});

parser.addArgument( ['--s3-disk-use'], {
    help: 'disk usage for objects in a specified <bucket>',
    nargs: 1,
    metavar: '<bucket>'
});

parser.addArgument( ['--s3-create'], {
    help: 'create <bucket>',
    nargs: 1,
    metavar: '<bucket>'
});

parser.addArgument( ['--s3-remove'], {
    help: 'remove <bucket>, prompts if not empty',
    nargs: 1,
    metavar: '<bucket>'
});

parser.addArgument( ['--s3-put'], {
    help: 'put into destination  <bucket> items in <path> recursively',
    nargs: 2,
    metavar: [ '<bucket>', '<path>' ]
});

var args = parser.parseArgs();

// load config from command-line arg, failover to config.json; will always look relative to script location
var config = require( args.config ? __dirname + '/' + args.config : __dirname + '/config.json' );
aws.config.update( config.awsConfig );

// s3 utils
if ( args['s3_list'] || args['s3_disk_use'] || args['s3_create'] 
        || args['s3_remove'] || args['s3_put'] ) {
    var s3Util = require( './modules/s3.js' );
    var s3 = new s3Util( aws );
    
    if ( args['s3_list'] ) {
        s3.list();
    } else if( args['s3_disk_use'] ) {
        s3.du( args['s3_disk_use'][0] );
    } else if( args['s3_create'] ) {
        s3.create( args['s3_create'][0] );
    } else if ( args['s3_remove'] ) {
        s3.remove( args['s3_remove'][0] );
    } else if ( args['s3_put'] ) {
        s3.put( args['s3_put'][0], args['s3_put'][1] );
    }
} else {
    console.log( parser.printHelp() );
}