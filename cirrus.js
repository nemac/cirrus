#!/usr/bin/env node

var aws = require( 'aws-sdk' );
var ArgumentParser = require( 'argparse' ).ArgumentParser;

// command-line interface
var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'Utilities for AWS cloud management'  });

// common
parser.addArgument( ['-c', '--config'], {
    help: 'path to config file relative to app.js; defaults to ./aws.json',
    nargs: 1,
    metavar: '<path>' });

var subParsers = parser.addSubparsers({
    title: 'subCommands',
    dest: 'subCommandName' });

// s3 args
var s3 = subParsers.addParser( 's3', { addHelp: true });

var s3Sub = s3.addSubparsers({
    title: 'S3 Sub Commands',
    dest: 's3SubCommandName' });

s3Sub.addParser( 'ls', {
    addHelp: true,
    help: 'list all buckets' });

s3Sub.addParser( 'du', {
    addHelp: true,
    help: 'disk usage for objects in a specified bucket' })
.addArgument( [ 'bucket' ]);

s3Sub.addParser( 'mkdir', {
    addHelp: true,
    help: 'create bucket' })
.addArgument( [ 'bucket' ]);

s3Sub.addParser( 'rm', {
    addHelp: true,
    help: 'remove <bucket>, prompts if not empty' })
.addArgument( [ 'bucket' ]);

var s3scp = s3Sub.addParser( 'scp', {
    addHelp: true,
    help: 'copies contents from source into destination bucket' });
s3scp.addArgument( [ 'source' ] );
s3scp.addArgument( [ 'destination' ] );

var s3cp = s3Sub.addParser( 'cp', {
    addHelp: true,
    help: 'copies source bucket into destination bucket' });
s3cp.addArgument( [ 'source' ] );
s3cp.addArgument( [ 'destination' ] );

var args = parser.parseArgs();

// load config from command-line arg, failover to config.json; will always look relative to script location
var config = require( args.config ? __dirname + '/' + args.config[0] : __dirname + '/aws.json' );
aws.config.update( config );

// s3 utils
if ( args.subCommandName === 's3' ) {
    var s3Util = require( './modules/s3.js' );
    var s3 = new s3Util( aws );

    switch ( args.s3SubCommandName ) {
        case 'ls':
	    s3.list();
	    break;
        case 'du':
	    s3.du( args.bucket );
	    break;
        case 'mkdir':
	    s3.create( args.bucket );
	    break;
        case 'rm':
	    s3.remove( args.bucket );
	    break;
        case 'scp':
  	    s3.put( args.source, args.destination);
	    break;
        case 'cp':
	    console.log( 'cp' );
    	    break;
    }
} else {
    console.log( parser.printHelp() );
}