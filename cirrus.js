#!/usr/bin/env node

var aws = require( 'aws-sdk' );
var ArgumentParser = require( 'argparse' ).ArgumentParser;
var helper = require( './modules/helper' );

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

parser.addArgument( ['-b', '--borders'], {
    help: 'show borders when displaying list output',
    action: 'storeTrue'
});

var subParsers = parser.addSubparsers({
    title: 'subCommands',
    dest: 'subCommandName' });

// s3 args
var s3Parser = subParsers.addParser( 's3', { addHelp: true });

var s3Sub = s3Parser.addSubparsers({
    title: 'S3 (Simple Storage Solution) Subcommands',
    dest: 's3SubCommandName' });

s3Sub.addParser( 'ls', {
    addHelp: true,
    help: 'list all buckets' });

s3Sub.addParser( 'du', {
    addHelp: true,
    help: 'disk usage for objects in a specified bucket' })
.addArgument( ['bucket'], { metavar: '<bucket>' });

s3Sub.addParser( 'mkdir', {
    addHelp: true,
    help: 'create bucket' })
.addArgument( ['bucket'], { metavar: '<bucket>' } );

s3Sub.addParser( 'rm', {
    addHelp: true,
    help: 'remove <bucket>, prompts if not empty' })
.addArgument( ['bucket'], { metavar: '<bucket>' });

var s3scp = s3Sub.addParser( 'scp', {
    addHelp: true,
    help: 'copies contents from source into destination bucket' });
s3scp.addArgument( ['source'], { metavar: '<source>' } );
s3scp.addArgument( ['destination'], { metavar: '<bucket>'} );

var s3cp = s3Sub.addParser( 'cp', {
    addHelp: true,
    help: 'copies source bucket into destination bucket' });
s3cp.addArgument( ['source'], { metavar: '<source>' } );
s3cp.addArgument( ['destination'], { metavar: '<bucket>' } );

// ec2 args
var ec2Parser = subParsers.addParser( 'ec2', { addHelp: true } );

var ec2Sub = ec2Parser.addSubparsers({
    title: 'EC2 (Elastic Cloud Compute) Subcommands',
    dest: 'ec2SubCommandName' });

ec2Sub.addParser( 'ls', {
    addHelp: true,
    help: 'list all instances' })
.addArgument( ['-t, --types'], {
    help: 'list available instance types',
    action: 'storeTrue',
    dest: 'types' });

ec2Sub.addParser( 'stop', {
    addHelp: true,
    help: 'stops a specified instance' })
.addArgument( ['instance'], { metavar: '<instance>' });

ec2Sub.addParser( 'start', {
    addHelp: true,
    help: 'starts a specified instance' })
.addArgument( ['instance'], { metavar: '<instance>' });

ec2Sub.addParser( 'terminate', {
    addHelp: true,
    help: 'terminates a specified instance' })
.addArgument( ['instance'], { metavar: '<instance>' });

var ec2SetInstance = ec2Sub.addParser( 'setinstance', {
    addHelp: true,
    help: 'set the instance type for a specified instance' });
ec2SetInstance.addArgument( ['instance'], { metavar: '<instance>' });
ec2SetInstance.addArgument( ['type'], { metavar: '<type>' });

// elastic ip args
var eipParser = subParsers.addParser( 'eip', { addHelp: true } );

var eipSub = eipParser.addSubparsers({
    title: 'EIP (Elastic IP) Subcommands',
    dest: 'eipSubCommandName' });

eipSub.addParser( 'ls', {
    addHelp: true,
    help: 'list all Elastic IP addresses' });

eipSub.addParser( 'allocate', {
    addHelp: true,
    help: 'creates a new Elastic IP address' });

eipSub.addParser( 'release', {
    addHelp: true,
    help: 'release Elastic IP address' })
.addArgument( ['allocationId'], { metavar: '<allocation id>' });

var eipAssociate = eipSub.addParser( 'associate', {
    addHelp: true,
    help: 'associates Elastic IP with instance' });
eipAssociate.addArgument( ['allocationId'], { metavar: '<allocation id>' } );
eipAssociate.addArgument( ['instance'], { metavar: '<instance>' } );

eipSub.addParser( 'disassociate', {
    addHelp: true,
    help: 'disassocates Elastic IP address from an instance' })
.addArgument( ['associationId'], { metavar: '<association id>' });

// ebs args
var ebsParser = subParsers.addParser( 'ebs', { addHelp: true } );

var ebsSub = ebsParser.addSubparsers({
    title: 'EBS (Elastic Block Store) Subcommands',
    dest: 'ebsSubCommandName' });

ebsSub.addParser( 'ls', {
    addHelp: true,
    help: 'list all instances' });

// sg args
var sgParser = subParsers.addParser( 'sg', { addHelp: true } );

var sgSub = sgParser.addSubparsers({
    title: 'SG (Security Groups) Subcommands',
    dest: 'sgSubCommandName' });

sgSub.addParser( 'ls', {
    addHelp: true,
    help: 'list all security groups' });

var args = parser.parseArgs();

// load config from command-line arg, failover to config.json; will always look relative to script location
var config = require( args.config ? __dirname + '/' + args.config[0] : __dirname + '/aws.json' );
aws.config.update( config );

var showBorders = args.borders;

switch ( args.subCommandName ) {

    case 's3':
        var S3 = require( './modules/s3' );
        var s3 = new S3( aws );

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
        break;

    case 'ec2':
        var EC2 = require( './modules/ec2' );
        var ec2 = new EC2( aws );
    
        switch ( args.ec2SubCommandName ) {
            case 'ls':
                if ( args.types ) {
                    var instanceTable = helper.table( 
		        ['Family', 'Types'], 
		        showBorders );
                
                    instanceTable.push(
			['General purpose', 'm1.small, m1.medium, m1.large, m1.xlarge, m3.medium, \nm3.large, m3.xlarge, m3.2xlarge'],
			['Compute optimized', 'c1.medium, c1.xlarge, c3.large, c3.xlarge, c3.2xlarge, \nc3.4xlarge, c3.8xlarge, cc2.8xlarge'],
			['Memory optimized', 'm2.xlarge, m2.2xlarge, m2.4xlarge, r3.large, r3.xlarge, \nr3.2xlarge, r3.4xlarge, r3.8xlarge, cr1.8xlarge'],
			['Storage optimized', 'hi1.4xlarge, hs1.8xlarge, i2.xlarge, i2.2xlarge, \ni2.4xlarge, i2.8xlarge'],
			['Micro instances', 't1.micro'],
			['GPU instances', 'cg1.4xlarge, g2.2xlarge']);
                    console.log( instanceTable.toString());
		} else {
                    ec2.list( showBorders);
		}
                break;
            case 'stop':
                ec2.stop( args.instance );
                break;
            case 'start':
                ec2.start( args.instance );
                break;
            case 'terminate':
                ec2.terminate( args.instance);
                break;
            case 'setinstance':
                ec2.setInstance( args.instance, args.type );
                break;
        }
        break;

    case 'eip':
        var EIP = require( './modules/eip' );
        var eip = new EIP( aws );
    
        switch ( args.eipSubCommandName ) {
            case 'ls':
                eip.list( showBorders );
                break;
            case 'allocate':
                eip.allocate();
                break;
            case 'release':
                eip.release( args.allocationId );
                break;
            case 'associate':
                eip.associate( args.allocationId, args.instance );
                break;
            case 'disassociate':
                eip.disassociate( args.associationId );
        }
        break;

    case 'ebs':
        var EBS = require( './modules/ebs' );
        var ebs = new EBS( aws );
    
        switch ( args.ebsSubCommandName ) {
            case 'ls':
                ebs.list( showBorders );
                break;
        }
        break;

    case 'sg':
        var SG = require( './modules/sg' );
        var sg = new SG( aws );
    
        switch ( args.sgSubCommandName ) {
            case 'ls':
                sg.list( showBorders );
                break;
        }
        break;

    default:
        console.log( parser.printHelp() );
}